import { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Badge, Button, Form, Spinner, Image } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaUserPlus, FaComment, FaPaperclip } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { getTicketById, getComments, addComment, assignTicket, reopenTicket } from '../../services/ticketService';
import ConfirmModal from '../admin/ConfirmModal';
import api from '../../services/api';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const role = user?.role; // 'admin', 'employee', 'technician'

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    
    // Modals
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    
    // Assign Modal State
    const [technicians, setTechnicians] = useState([]);
    const [selectedTech, setSelectedTech] = useState('');
    const [reopenReason, setReopenReason] = useState('');

    // Fetch Ticket & Comments
    const fetchData = async () => {
        if (!id || id === ':id') {
            setTicket(null);
            setComments([]);
            setLoading(false);
            return;
        }

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

    // Open Assign Modal & Fetch Techs
    const openAssignModal = async () => {
        try {
            const res = await api.get('/auth/users/', { params: { role: 'technician' } });
            setTechnicians(res.data.results || res.data);
            setSelectedTech(ticket.assigned_technician?.id || '');
            setShowAssignModal(true);
        } catch (err) { alert("Failed to load technicians"); }
    };

    const handleAssign = async () => {
        if (!selectedTech) return alert("Please select a technician");
        setModalLoading(true);
        try {
            await assignTicket(id, { technician_id: parseInt(selectedTech) });
            setShowAssignModal(false);
            fetchData(); // Refresh data
        } catch (err) { alert(err.response?.data?.error || "Assignment failed"); }
        finally { setModalLoading(false); }
    };

    const handleReopen = async () => {
        if (!reopenReason.trim()) return alert("Reason is required");
        setModalLoading(true);
        try {
            await reopenTicket(id, { reason: reopenReason });
            setShowReopenModal(false);
            fetchData();
        } catch (err) { alert(err.response?.data?.error || "Failed to reopen"); }
        finally { setModalLoading(false); }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            await addComment(id, { comment: commentText });
            setCommentText('');
            const commentRes = await getComments(id);
            setComments(commentRes.data.results || commentRes.data);
        } catch (err) { alert("Failed to add comment"); }
        finally { setSubmittingComment(false); }
    };

    // Status & Priority Badges
    const getStatusBadge = (status) => <Badge className={`badge-status-${status.replace(' ', '_').toLowerCase()} text-capitalize`}>{status.replace('_', ' ')}</Badge>;
    const getPriorityBadge = (priority) => <Badge className={`badge-priority-${priority.toLowerCase()}`}>{priority}</Badge>;
    const getSlaBadge = (sla) => {
        if (sla === 'Breached') return <Badge bg="danger">{sla}</Badge>;
        if (sla === 'Met') return <Badge bg="success">{sla}</Badge>;
        return <Badge bg="warning" text="dark">{sla || 'Pending'}</Badge>;
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
                {/* Left Column - Details */}
                <Col lg={8}>
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

                    {/* Comments Section */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3"><FaComment className="me-2" />Comments ({comments.length})</h6>
                            
                            {comments.length === 0 && <p className="text-muted small">No comments yet.</p>}
                            
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

                {/* Right Column - Meta & Timeline */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3">Ticket Information</h6>
                            <table className="w-100 small">
                                <tbody>
                                    <tr><td className="text-muted py-1">Category:</td><td className="fw-medium ps-2">{ticket.category_name || '-'}</td></tr>
                                    <tr><td className="text-muted py-1">Department:</td><td className="fw-medium ps-2">{ticket.department_name || '-'}</td></tr>
                                    <tr><td className="text-muted py-1">Assigned To:</td><td className="fw-medium ps-2">{ticket.technician_name || 'Unassigned'}</td></tr>
                                    <tr><td className="text-muted py-1">Created:</td><td className="fw-medium ps-2">{new Date(ticket.created_at).toLocaleString()}</td></tr>
                                    <tr><td className="text-muted py-1">Updated:</td><td className="fw-medium ps-2">{new Date(ticket.updated_at).toLocaleString()}</td></tr>
                                </tbody>
                            </table>
                            
                            {/* Conditional Actions */}
                            {role === 'admin' && (ticket.status === 'open' || ticket.status === 'reopened') && (
                                <Button variant="primary w-100 mt-3" onClick={openAssignModal}>
                                    <FaUserPlus className="me-2" /> Assign Technician
                                </Button>
                            )}

                            {(role === 'employee' || role === 'admin') && ticket.status === 'resolved' && (
                                <Button variant="warning w-100 mt-3" onClick={() => setShowReopenModal(true)}>
                                    <FaRedo className="me-2" /> Reopen Ticket
                                </Button>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Simple Timeline */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3">Timeline</h6>
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex"><span className="badge bg-primary rounded-pill me-2 px-3" style={{width:'8px'}}></span> Created</div>
                                {ticket.assigned_at && <div className="d-flex"><span className="badge bg-info rounded-pill me-2 px-3" style={{width:'8px'}}></span> Assigned</div>}
                                {ticket.status === 'in_progress' && <div className="d-flex"><span className="badge bg-warning text-dark rounded-pill me-2 px-3" style={{width:'8px'}}></span> In Progress</div>}
                                {ticket.status === 'resolved' && <div className="d-flex"><span className="badge bg-success rounded-pill me-2 px-3" style={{width:'8px'}}></span> Resolved</div>}
                                {ticket.status === 'reopened' && <div className="d-flex"><span className="badge bg-danger rounded-pill me-2 px-3" style={{width:'8px'}}></span> Reopened</div>}
                                {ticket.status === 'closed' && <div className="d-flex"><span className="badge bg-secondary rounded-pill me-2 px-3" style={{width:'8px'}}></span> Closed</div>}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modals */}
            <ConfirmModal show={showAssignModal} onHide={() => setShowAssignModal(false)} onConfirm={handleAssign} title="Assign Technician" loading={modalLoading}
                message={
                    <Form.Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="mt-2">
                        <option value="">Select a technician...</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} (@{t.username})</option>)}
                    </Form.Select>
                } 
            />

            <ConfirmModal show={showReopenModal} onHide={() => setShowReopenModal(false)} onConfirm={handleReopen} title="Reopen Ticket" loading={modalLoading}
                message={<Form.Control as="textarea" rows={3} placeholder="Why are you reopening this ticket?" value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />}
            />
        </div>
    );
};

export default TicketDetails;