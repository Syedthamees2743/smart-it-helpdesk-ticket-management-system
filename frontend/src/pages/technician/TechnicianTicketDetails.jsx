import { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Form, Spinner, Image, Alert, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaPlay, FaCheckCircle, FaComment, FaPaperclip, FaMagic, FaRobot,
    FaTimes, FaExclamationTriangle, FaLightbulb, FaClipboardList, FaSearch,
    FaExpand, FaDownload, FaRedo, FaTags, FaBuilding, FaUserCircle, FaCalendarAlt,
    FaSyncAlt, FaClock, FaWrench, FaHourglassHalf
} from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';
import { getTicketById, getComments, addComment, changeTicketStatus } from '../../services/ticketService';
import aiService from '../../services/aiService';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../services/api';

const TechnicianTicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Modal States
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [nextStatus, setNextStatus] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    // AI States
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState('');

    // Image states
    const [imageBlobUrl, setImageBlobUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // Build proxy URL
    const getMediaProxyUrl = (path) => {
        if (!path) return null;
        const baseUrl = 'http://127.0.0.1:8000';
        let mediaPath = path;

        if (path.startsWith('http://') || path.startsWith('https://')) {
            const match = path.match(/\/media\/(.+)$/);
            if (match) {
                mediaPath = match[1];
            } else {
                return path;
            }
        } else if (path.startsWith('/media/')) {
            mediaPath = path.replace(/^\/media\//, '');
        }

        return `${baseUrl}/api/tickets/media/${mediaPath}`;
    };

    // Fetch image with auth
    const fetchImageWithAuth = async (screenshotPath) => {
        if (!screenshotPath) return;

        const proxyUrl = getMediaProxyUrl(screenshotPath);
        if (!proxyUrl) return;

        setImageLoading(true);
        setImageError(false);

        if (imageBlobUrl) {
            URL.revokeObjectURL(imageBlobUrl);
            setImageBlobUrl(null);
        }

        try {
            const response = await api.get(proxyUrl, { responseType: 'blob' });
            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'image/jpeg'
            });
            const blobUrl = URL.createObjectURL(blob);
            setImageBlobUrl(blobUrl);
        } catch (err) {
            console.error("Failed to fetch image:", err);
            setImageError(true);
        } finally {
            setImageLoading(false);
        }
    };

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const ticketRes = await getTicketById(id);
            setTicket(ticketRes.data);
            const commentRes = await getComments(id);
            setComments(commentRes.data.results || commentRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    // Fetch image when ticket loads
    useEffect(() => {
        if (ticket?.screenshot) {
            fetchImageWithAuth(ticket.screenshot);
        }
        return () => {
            if (imageBlobUrl) {
                URL.revokeObjectURL(imageBlobUrl);
            }
        };
    }, [ticket?.screenshot]);

    // Handle AI Troubleshoot
    const handleAiTroubleshoot = async () => {
        setAiLoading(true);
        setAiError('');
        setAiResult(null);
        try {
            const res = await aiService.troubleshootTicket({ ticket_id: parseInt(id) });
            if (res.success && res.data) {
                setAiResult(res.data);
            } else {
                setAiError(res.error || 'AI analysis failed.');
            }
        } catch (err) {
            if (err.response?.status === 403) {
                setAiError('You can only analyze tickets assigned to you.');
            } else if (err.response?.status === 404) {
                setAiError('Ticket not found.');
            } else if (err.response?.data?.error) {
                const e = err.response.data.error;
                setAiError(typeof e === 'string' ? e : 'AI analysis failed.');
            } else if (!err.response) {
                setAiError('Network error. Please check your connection.');
            } else {
                setAiError('AI assistance is currently unavailable. You can continue troubleshooting manually.');
            }
        } finally {
            setAiLoading(false);
        }
    };

    // Status change handlers
    const openStatusModal = (status) => {
        setNextStatus(status);
        setShowStatusModal(true);
    };

    const handleStatusChange = async () => {
        setModalLoading(true);
        try {
            await changeTicketStatus(id, { status: nextStatus });
            setShowStatusModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update status.");
        } finally {
            setModalLoading(false);
        }
    };

    // Add Comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return alert("Comment cannot be empty.");

        setSubmittingComment(true);
        try {
            await addComment(id, { comment: commentText });
            setCommentText('');
            const commentRes = await getComments(id);
            setComments(commentRes.data.results || commentRes.data);
        } catch (err) {
            alert("Failed to add comment.");
        } finally {
            setSubmittingComment(false);
        }
    };

    // UI Helpers
    const getStatusBadge = (status) => {
        const s = status.replace("_", " ");
        let bg = "secondary";
        if (status === "open") bg = "info";
        else if (status === "assigned") bg = "primary";
        else if (status === "in_progress") bg = "warning";
        else if (status === "resolved") bg = "success";
        else if (status === "reopened") bg = "danger";
        else if (status === "closed") bg = "dark";
        return <Badge bg={bg} pill className="text-capitalize px-3 py-2">{s}</Badge>;
    };

    const getPriorityBadge = (p) => {
        let bg = "secondary";
        if (p === "low") bg = "info";
        else if (p === "medium") bg = "primary";
        else if (p === "high") bg = "warning";
        else if (p === "critical") bg = "danger";
        return <Badge bg={bg} pill className="text-capitalize px-3 py-2">{p}</Badge>;
    };

    const getSlaBadge = (sla) => {
        if (sla === 'Breached') return <Badge bg="danger" pill className="px-3 py-2">Breached</Badge>;
        if (sla === 'Met') return <Badge bg="success" pill className="px-3 py-2">Met</Badge>;
        return <Badge bg="warning" text="dark" pill className="px-3 py-2">Pending</Badge>;
    };

    // Dynamic Workflow Buttons
    const renderActions = () => {
        if (!ticket) return null;

        if (ticket.status === 'assigned' || ticket.status === 'reopened') {
            return (
                <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ borderLeft: '5px solid #3b82f6' }}>
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div
                                className="rounded-4 d-flex align-items-center justify-content-center"
                                style={{ width: '36px', height: '36px', backgroundColor: '#dbeafe' }}
                            >
                                <FaWrench style={{ fontSize: '0.9rem', color: '#3b82f6' }} />
                            </div>
                            <div>
                                <div className="fw-bold text-dark">Action Required</div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                    This ticket is waiting for you to start working
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-2">
                            <Button
                                variant="primary"
                                className="rounded-pill py-2 d-flex align-items-center justify-content-center"
                                onClick={() => openStatusModal('in_progress')}
                            >
                                <FaPlay className="me-2" /> Start Working
                            </Button>
                            <Button
                                variant="light"
                                className="border rounded-pill py-2 d-flex align-items-center justify-content-center"
                                onClick={handleAiTroubleshoot}
                                disabled={aiLoading}
                            >
                                {aiLoading ? (
                                    <><Spinner size="sm" className="me-2" /> Analyzing Ticket...</>
                                ) : (
                                    <><FaMagic className="me-2 text-primary" /> Analyze with AI</>
                                )}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        if (ticket.status === 'in_progress') {
            return (
                <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ borderLeft: '5px solid #f59e0b' }}>
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div
                                className="rounded-4 d-flex align-items-center justify-content-center"
                                style={{ width: '36px', height: '36px', backgroundColor: '#fef3c7' }}
                            >
                                <FaHourglassHalf style={{ fontSize: '0.9rem', color: '#f59e0b' }} />
                            </div>
                            <div>
                                <div className="fw-bold text-dark">Work In Progress</div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                    Resolve the ticket when you're done
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-2">
                            <Button
                                variant="success"
                                className="rounded-pill py-2 d-flex align-items-center justify-content-center"
                                onClick={() => openStatusModal('resolved')}
                            >
                                <FaCheckCircle className="me-2" /> Mark as Resolved
                            </Button>
                            <Button
                                variant="light"
                                className="border rounded-pill py-2 d-flex align-items-center justify-content-center"
                                onClick={handleAiTroubleshoot}
                                disabled={aiLoading}
                            >
                                {aiLoading ? (
                                    <><Spinner size="sm" className="me-2" /> Analyzing Ticket...</>
                                ) : (
                                    <><FaMagic className="me-2 text-primary" /> Analyze with AI</>
                                )}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        if (ticket.status === 'resolved') {
            return (
                <div className="d-flex align-items-center gap-3 p-4 rounded-4 border mb-4" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                    <div style={{ backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaHourglassHalf />
                    </div>
                    <div>
                        <div className="fw-bold" style={{ color: '#1e40af' }}>Waiting for Employee Confirmation</div>
                        <div className="text-muted small">This ticket is marked as resolved. The employee will review and either close it or reopen it.</div>
                    </div>
                </div>
            );
        }

        if (ticket.status === 'closed') {
            return (
                <div className="d-flex align-items-center gap-3 p-4 rounded-4 border mb-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div style={{ backgroundColor: '#22c55e', color: 'white', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaCheckCircle />
                    </div>
                    <div>
                        <div className="fw-bold" style={{ color: '#166534' }}>Ticket Closed</div>
                        <div className="text-muted small">This workflow has been completed successfully.</div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const getStatusText = () => {
        if (nextStatus === 'in_progress') return "Start Working?\n\nThis ticket will move to 'In Progress'.";
        if (nextStatus === 'resolved') return "Resolve Ticket?\n\nThis will mark the ticket as resolved. The employee will be notified to confirm or reopen.";
        return "";
    };

    if (loading) return (
        <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted mb-0">Loading ticket details...</p>
        </div>
    );
    if (!ticket) return <div className="text-center py-5 text-danger">Ticket not found.</div>;

    // Timeline step status helper
    const stepDone = (step) => {
        const order = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
        const currentIdx = order.indexOf(ticket.status);
        const stepIdx = order.indexOf(step);
        return stepIdx <= currentIdx;
    };

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            {/* ===================================================
                HEADER
            =================================================== */}
            <div className="d-flex align-items-center mb-4 flex-wrap gap-3">
                <Button
                    variant="light"
                    className="border d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: "40px", height: "40px", borderRadius: "10px" }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft />
                </Button>
                <div>
                    <h4 className="mb-0 fw-bold text-dark">{ticket.ticket_number}</h4>
                    <h6 className="text-muted mb-0">{ticket.title}</h6>
                </div>
                <div className="ms-auto d-flex gap-2 align-items-center flex-wrap">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                    {getSlaBadge(ticket.sla_status)}
                </div>
            </div>

            <Row className="g-4">
                {/* ================= LEFT COLUMN ================= */}
                <Col lg={8}>
                    {/* Action Buttons */}
                    {renderActions()}

                    {/* ── AI Error ── */}
                    {aiError && (
                        <Alert variant="warning" className="d-flex align-items-start rounded-4 border-0 py-3 mb-4" dismissible onClose={() => setAiError('')}>
                            <FaRobot className="me-2 mt-1 flex-shrink-0" />
                            <div>
                                <div className="fw-semibold small">AI Analysis Unavailable</div>
                                <div className="small mb-0">{aiError}</div>
                            </div>
                        </Alert>
                    )}

                    {/* ── AI Result Card ── */}
                    {aiResult && (
                        <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            {/* AI Header Banner */}
                            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ backgroundColor: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="rounded-4 d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '36px', backgroundColor: '#8b5cf6' }}
                                    >
                                        <FaMagic style={{ fontSize: '0.85rem', color: 'white' }} />
                                    </div>
                                    <div>
                                        <span className="fw-bold text-dark d-block" style={{ fontSize: '0.95rem' }}>AI Troubleshooting Assistant</span>
                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>Smart analysis for this ticket</span>
                                    </div>
                                </div>
                                <Button
                                    variant="light"
                                    className="border rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '30px', height: '30px' }}
                                    onClick={() => setAiResult(null)}
                                >
                                    <FaTimes size={12} />
                                </Button>
                            </div>

                            <Card.Body className="p-4">
                                {/* Possible Issue */}
                                <div className="mb-4 p-3 rounded-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <FaExclamationTriangle className="text-warning" style={{ fontSize: '0.85rem' }} />
                                        <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Possible Issue</span>
                                    </div>
                                    <div className="fw-medium ps-4" style={{ fontSize: '0.9rem', color: '#92400e' }}>
                                        {aiResult.possible_issue}
                                    </div>
                                </div>

                                {/* Possible Causes */}
                                {aiResult.possible_causes && aiResult.possible_causes.length > 0 && (
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaSearch className="text-info" style={{ fontSize: '0.85rem' }} />
                                            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Possible Causes</span>
                                        </div>
                                        <div className="ps-4 d-flex flex-column gap-2">
                                            {aiResult.possible_causes.map((cause, idx) => (
                                                <div key={idx} className="d-flex align-items-start p-2 rounded-3" style={{ backgroundColor: '#f8fafc' }}>
                                                    <span className="rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0" style={{ width: 20, height: 20, backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '0.65rem', fontWeight: 700 }}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: '0.88rem' }}>{cause}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Troubleshooting Steps */}
                                {aiResult.troubleshooting_steps && aiResult.troubleshooting_steps.length > 0 && (
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaClipboardList className="text-primary" style={{ fontSize: '0.85rem' }} />
                                            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Suggested Troubleshooting</span>
                                        </div>
                                        <div className="ps-4">
                                            {aiResult.troubleshooting_steps.map((step, idx) => (
                                                <div key={idx} className="d-flex align-items-start mb-2">
                                                    <span
                                                        className="rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0 text-white fw-bold"
                                                        style={{ width: 22, height: 22, backgroundColor: '#3b82f6', fontSize: '0.7rem' }}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-dark" style={{ fontSize: '0.88rem' }}>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Resolution */}
                                {aiResult.suggested_resolution && (
                                    <div className="p-3 rounded-4" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <FaLightbulb className="text-success" style={{ fontSize: '0.85rem' }} />
                                            <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Suggested Resolution</span>
                                        </div>
                                        <div className="text-dark ps-4" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                                            {aiResult.suggested_resolution}
                                        </div>
                                    </div>
                                )}

                                {/* AI Disclaimer */}
                                <div className="mt-4 pt-3 border-top d-flex align-items-center gap-2">
                                    <FaRobot style={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        AI-generated assistance — verify before applying.
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Description Card */}
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold border-bottom pb-3 mb-3 text-dark">Description</h6>
                            <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{ticket.description}</p>

                            {/* Image Section */}
                            {ticket.screenshot && (
                                <div className="mt-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <FaPaperclip className="me-2 text-primary" />
                                        <strong className="text-dark">Attachment</strong>
                                    </div>

                                    {imageLoading && (
                                        <div className="text-center p-5 bg-light rounded-4 border">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Loading image...
                                        </div>
                                    )}

                                    {imageError && !imageLoading && (
                                        <div className="p-4 border rounded-4 bg-light text-center">
                                            <p className="text-danger mb-3">
                                                <FaPaperclip className="me-1" /> Failed to load image
                                            </p>
                                            <Button size="sm" variant="outline-primary" className="rounded-pill px-4" onClick={() => fetchImageWithAuth(ticket.screenshot)}>
                                                <FaRedo className="me-1" /> Retry
                                            </Button>
                                        </div>
                                    )}

                                    {imageBlobUrl && !imageLoading && !imageError && (
                                        <div className="text-center bg-light p-3 rounded-4 border">
                                            <Image
                                                src={imageBlobUrl}
                                                fluid
                                                rounded
                                                style={{ maxHeight: '350px', objectFit: 'contain', cursor: 'pointer' }}
                                                onClick={() => setShowImageModal(true)}
                                            />
                                            <div className="d-flex gap-2 mt-3 justify-content-center">
                                                <Button size="sm" variant="light" className="border d-flex align-items-center" onClick={() => setShowImageModal(true)}>
                                                    <FaExpand className="me-1" /> View Full
                                                </Button>
                                                <Button size="sm" variant="light" className="border d-flex align-items-center" href={imageBlobUrl} download="attachment.jpg">
                                                    <FaDownload className="me-1" /> Download
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Comments Card */}
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold border-bottom pb-3 mb-3 text-dark">
                                <FaComment className="me-2 text-primary" /> Conversation ({comments.length})
                            </h6>

                            {comments.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <FiMessageSquare style={{ fontSize: "2rem", color: "#dee2e6" }} />
                                    <p className="mt-2 mb-0">No comments yet. Start the conversation!</p>
                                </div>
                            ) : (
                                <div className="mb-4" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                                    {comments.map(c => (
                                        <div key={c.id} className="mb-3 p-3 bg-light rounded-4 border">
                                            <div className="d-flex justify-content-between mb-2">
                                                <strong style={{ fontSize: '0.9rem' }} className="text-dark">{c.user_name || c.user?.username}</strong>
                                                <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
                                            </div>
                                            <p className="mb-0 text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{c.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Form onSubmit={handleAddComment}>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="mb-2 shadow-none"
                                    style={{ borderRadius: '12px', resize: 'none' }}
                                />
                                <div className="d-flex justify-content-end">
                                    <Button type="submit" size="sm" variant="primary" className="px-4 rounded-pill" disabled={submittingComment}>
                                        {submittingComment ? <Spinner size="sm" /> : <><FaComment className="me-1" /> Post Comment</>}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ================= RIGHT COLUMN ================= */}
                <Col lg={4}>
                    {/* Information Card */}
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold border-bottom pb-3 mb-3 text-dark">Information</h6>

                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small d-flex align-items-center">
                                        <FaTags className="me-2" /> Category
                                    </span>
                                    <span className="fw-medium text-dark text-end">{ticket.category_name || '-'}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small d-flex align-items-center">
                                        <FaUserCircle className="me-2" /> Employee
                                    </span>
                                    <span className="fw-medium text-dark text-end">{ticket.employee_name || '-'}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small d-flex align-items-center">
                                        <FaBuilding className="me-2" /> Department
                                    </span>
                                    <span className="fw-medium text-dark text-end">{ticket.department_name || '-'}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small d-flex align-items-center">
                                        <FaCalendarAlt className="me-2" /> Created
                                    </span>
                                    <span className="fw-medium text-dark text-end">{new Date(ticket.created_at).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small d-flex align-items-center">
                                        <FaSyncAlt className="me-2" /> Updated
                                    </span>
                                    <span className="fw-medium text-dark text-end">{new Date(ticket.updated_at).toLocaleString()}</span>
                                </div>
                                {ticket.sla_deadline && (
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small d-flex align-items-center">
                                            <FaClock className="me-2" /> SLA Deadline
                                        </span>
                                        <span className="fw-medium text-dark text-end">{new Date(ticket.sla_deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Status Timeline */}
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold border-bottom pb-3 mb-4 text-dark">Status Timeline</h6>

                            <div className="d-flex flex-column">
                                {/* Step 1: Created */}
                                <div className="d-flex align-items-center mb-4">
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        backgroundColor: stepDone('open') ? '#0d6efd' : '#e2e8f0',
                                        color: stepDone('open') ? 'white' : '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', flexShrink: 0
                                    }}>✓</div>
                                    <div className="ms-3">
                                        <div className={`fw-bold small ${stepDone('open') ? 'text-dark' : 'text-muted'}`}>Ticket Created</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            {new Date(ticket.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Assigned */}
                                <div className="d-flex align-items-center mb-4">
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        backgroundColor: stepDone('assigned') ? (ticket.status === 'reopened' ? '#dc3545' : '#0dcaf0') : '#e2e8f0',
                                        color: stepDone('assigned') ? 'white' : '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', flexShrink: 0
                                    }}>➤</div>
                                    <div className="ms-3">
                                        <div className={`fw-bold small ${stepDone('assigned') ? 'text-dark' : 'text-muted'}`}>
                                            {ticket.status === 'reopened' ? 'Reopened' : 'Assigned to You'}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            {ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'Pending assignment'}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: In Progress / Current */}
                                {(ticket.status === 'in_progress' || stepDone('resolved')) && (
                                    <div className="d-flex align-items-center mb-4">
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            backgroundColor: ticket.status === 'in_progress' ? '#ffc107' : '#22c55e',
                                            color: ticket.status === 'in_progress' ? 'white' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', flexShrink: 0
                                        }}>⚙</div>
                                        <div className="ms-3">
                                            <div className={`fw-bold small ${ticket.status === 'in_progress' ? 'text-dark' : 'text-muted'}`}>
                                                In Progress
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {ticket.status === 'in_progress' ? 'You are working on it' : 'Work completed'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Resolved */}
                                <div className={`d-flex align-items-center ${ticket.status !== 'closed' ? 'mb-4' : ''}`}>
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        backgroundColor: stepDone('resolved') ? '#198754' : '#e2e8f0',
                                        color: stepDone('resolved') ? 'white' : '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', flexShrink: 0
                                    }}>✓</div>
                                    <div className="ms-3">
                                        <div className={`fw-bold small ${stepDone('resolved') ? 'text-dark' : 'text-muted'}`}>Issue Resolved</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            {stepDone('resolved')
                                                ? (ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'Marked as resolved')
                                                : 'Waiting for resolution'}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 5: Closed */}
                                {ticket.status === 'closed' && (
                                    <div className="d-flex align-items-center mt-4">
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', flexShrink: 0
                                        }}>✕</div>
                                        <div className="ms-3">
                                            <div className="fw-bold small text-dark">Ticket Closed</div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Successfully completed</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Status Change Modal */}
            <ConfirmModal
                show={showStatusModal}
                onHide={() => setShowStatusModal(false)}
                onConfirm={handleStatusChange}
                title={nextStatus === 'in_progress' ? 'Start Working?' : 'Resolve Ticket?'}
                loading={modalLoading}
                message={getStatusText()}
            />

            {/* Full Image Preview Modal */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="xl" centered>
                <Modal.Header closeButton className="border-bottom">
                    <Modal.Title className="fw-bold">Attachment Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-3 bg-dark">
                    {imageBlobUrl && (
                        <Image src={imageBlobUrl} fluid rounded style={{ maxHeight: "75vh", objectFit: "contain" }} />
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top">
                    <Button variant="light" className="border" onClick={() => setShowImageModal(false)}>Close</Button>
                    {imageBlobUrl && (
                        <Button variant="primary" href={imageBlobUrl} download="attachment.jpg">
                            <FaDownload className="me-1" /> Download
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TechnicianTicketDetails;