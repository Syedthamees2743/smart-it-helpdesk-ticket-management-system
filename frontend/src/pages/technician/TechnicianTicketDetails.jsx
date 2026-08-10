import { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Form, Spinner, Image } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaCheckCircle, FaComment, FaPaperclip } from 'react-icons/fa';
import { getTicketById, getComments, addComment, changeTicketStatus } from '../../services/ticketService';
import ConfirmModal from '../../components/admin/ConfirmModal';

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

    // Handle "Start Working" or "Mark as Resolved" click
    const openStatusModal = (status) => {
        setNextStatus(status);
        setShowStatusModal(true);
    };

    const handleStatusChange = async () => {
        setModalLoading(true);
        try {
            await changeTicketStatus(id, { status: nextStatus });
            setShowStatusModal(false);
            fetchData(); // Refresh to get new status and timestamps
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update status.");
        } finally {
            setModalLoading(false);
        }
    };

    // Handle Add Comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return alert("Comment cannot be empty.");
        
        setSubmittingComment(true);
        try {
            await addComment(id, { comment: commentText });
            setCommentText(''); // Clear input
            
            // Refresh comments
            const commentRes = await getComments(id);
            setComments(commentRes.data.results || commentRes.data);
        } catch (err) {
            alert("Failed to add comment.");
        } finally {
            setSubmittingComment(false);
        }
    };

    // UI Helpers
    const getStatusBadge = (status) => <Badge className={`badge-status-${status.replace(' ', '_').toLowerCase()} text-capitalize`}>{status.replace('_', ' ')}</Badge>;
    const getPriorityBadge = (priority) => <Badge className={`badge-priority-${priority.toLowerCase()}`}>{priority}</Badge>;
    const getSlaBadge = (sla) => {
        if (sla === 'Breached') return <Badge bg="danger">Breached</Badge>;
        if (sla === 'Met') return <Badge bg="success">Ok</Badge>;
        return <Badge bg="warning" text="dark">Pending</Badge>;
    };

    // Dynamic Workflow Buttons based on current status
    const renderActions = () => {
        if (!ticket) return null;

        if (ticket.status === 'assigned' || ticket.status === 'reopened') {
            return (
                <Button variant="primary w-100 mb-3" onClick={() => openStatusModal('in_progress')}>
                    <FaPlay className="me-2" /> Start Working
                </Button>
            );
        }

        if (ticket.status === 'in_progress') {
            return (
                <Button variant="success w-100 mb-3" onClick={() => openStatusModal('resolved')}>
                    <FaCheckCircle className="me-2" /> Mark as Resolved
                </Button>
            );
        }

        if (ticket.status === 'resolved') {
            return (
                <div className="alert alert-info mt-3 mb-0">
                    <strong>Waiting for Employee Confirmation</strong><br />
                    This ticket is marked as resolved. The employee will review and either close it or reopen it.
                </div>
            );
        }

        if (ticket.status === 'closed') {
            return (
                <div className="alert alert-success mt-3 mb-0">
                    <strong>Ticket Closed.</strong><br />
                    This workflow has been completed.
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

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
    if (!ticket) return <div className="text-center py-5 text-danger">Ticket not found.</div>;

    return (
        <div>
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
                <Button variant="link" className="text-dark me-3 text-decoration-none" onClick={() => navigate(-1)}><FaArrowLeft size={24} /></Button>
                <div>
                    <h4 className="mb-0">{ticket.ticket_number}</h4>
                    <h6 className="text-muted mb-0">{ticket.title}</h6>
                </div>
                <div className="ms-auto d-flex gap-2 align-items-center">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                    {getSlaBadge(ticket.sla_status)}
                </div>
            </div>

            <Row>
                {/* Left Column */}
                <Col lg={8}>
                    {/* Action Buttons */}
                    {renderActions()}

                    {/* Details Card */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3">Description</h6>
                            <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                            
                            {ticket.screenshot && (
                                <div className="mt-3">
                                    <FaPaperclip className="me-2" /><strong>Attachment:</strong>
                                    <div className="mt-2"><Image src={ticket.screenshot} fluid rounded thumbnail style={{maxHeight: '300px'}} /></div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Comments Card */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3"><FaComment className="me-2" />Conversation</h6>
                            
                            {comments.length === 0 && <p className="text-muted small">No comments yet. Start the conversation.</p>}
                            
                            <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {comments.map(c => (
                                    <div key={c.id} className="mb-3 p-2 bg-light rounded">
                                        <div className="d-flex justify-content-between mb-1">
                                            <strong style={{fontSize: '0.9rem'}}>{c.user_name || c.user?.username}</strong>
                                            <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
                                        </div>
                                        <p className="mb-0" style={{fontSize: '0.9rem'}}>{c.comment}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Add Comment Form */}
                            <Form onSubmit={handleAddComment}>
                                <Form.Control 
                                    as="textarea" 
                                    rows={2} 
                                    placeholder="Write a comment..." 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="mb-2"
                                />
                                <div className="d-flex justify-content-end">
                                    <Button type="submit" size="sm" disabled={submittingComment}>
                                        {submittingComment ? <Spinner size="sm"/> : 'Post Comment'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column - Meta */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3">Information</h6>
                            <table className="w-100 small">
                                <tr><td className="text-muted py-1">Category:</td><td className="fw-medium ps-2">{ticket.category_name || '-'}</td></tr>
                                <tr><td className="text-muted py-1">Employee:</td><td className="fw-medium ps-2">{ticket.employee_name || '-'}</td></tr>
                                <tr><td className="text-muted py-1">Department:</td><td className="fw-medium ps-2">{ticket.department_name || '-'}</td></tr>
                                <tr><td className="text-muted py-1">Created:</td><td className="fw-medium ps-2">{new Date(ticket.created_at).toLocaleString()}</td></tr>
                                <tr><td className="text-muted py-1">Updated:</td><td className="fw-medium ps-2">{new Date(ticket.updated_at).toLocaleString()}</td></tr>
                                {ticket.sla_deadline && (
                                    <tr><td className="text-muted py-1">SLA Deadline:</td><td className="fw-medium ps-2">{new Date(ticket.sla_deadline).toLocaleDateString()}</td></tr>
                                )}
                            </table>
                        </Card.Body>
                    </Card>

                    {/* Simple Status Timeline */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3">Status Timeline</h6>
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center">
                                    <span className={`badge ${ticket.status === 'open' ? 'bg-primary' : 'bg-secondary'} rounded-pill me-2 px-3`}>1</span>
                                    <span className={ticket.status === 'open' ? 'fw-bold' : 'text-muted'}>Open</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className={`badge ${ticket.status === 'assigned' || ticket.status === 'in_progress' || ticket.status === 'reopened' ? 'bg-info' : 'bg-secondary'} rounded-pill me-2 px-3`}>2</span>
                                    <span className={ticket.status === 'assigned' || ticket.status === 'in_progress' || ticket.status === 'reopened' ? 'fw-bold' : 'text-muted'}>Assigned / In Progress / Reopened</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className={`badge ${ticket.status === 'resolved' ? 'bg-success' : 'bg-secondary'} rounded-pill me-2 px-3`}>3</span>
                                    <span className={ticket.status === 'resolved' ? 'fw-bold' : 'text-muted'}>Resolved</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className={`badge ${ticket.status === 'closed' ? 'bg-dark' : 'bg-secondary'} rounded-pill me-2 px-3`}>4</span>
                                    <span className={ticket.status === 'closed' ? 'fw-bold' : 'text-muted'}>Closed</span>
                                </div>
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
        </div>
    );
};

export default TechnicianTicketDetails;