import { useState, useEffect, useContext } from "react";
import { Card, Row, Col, Badge, Button, Form, Spinner, Image, Modal } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaRedo, FaUserPlus, FaComment, FaPaperclip, FaCheckCircle, FaDownload, FaExpand,
  FaTags, FaBuilding, FaUserCircle, FaCalendarAlt, FaSyncAlt
} from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";
import FeedbackModal from "./FeedbackModal";
import { AuthContext } from "../../context/AuthContext";
import { getTicketById, getComments, addComment, assignTicket, reopenTicket, changeTicketStatus } from "../../services/ticketService";
import api from "../../services/api";

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = user?.role;

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const [imageBlobUrl, setImageBlobUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [reopenReason, setReopenReason] = useState("");

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
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/jpeg' });
      const blobUrl = URL.createObjectURL(blob);
      setImageBlobUrl(blobUrl);
    } catch (err) {
      console.error("Failed to fetch image:", err);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

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

  useEffect(() => { 
    fetchData(); 
  }, [id]);

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

  const openAssignModal = async () => {
    try {
      const res = await api.get("/auth/users/", { params: { role: "technician" } });
      setTechnicians(res.data.results || res.data);
      setSelectedTech(ticket.assigned_technician?.id || "");
      setShowAssignModal(true);
    } catch (err) { 
      alert("Failed to load technicians"); 
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) return alert("Please select a technician");
    setModalLoading(true);
    try { 
      await assignTicket(id, { technician_id: parseInt(selectedTech) }); 
      setShowAssignModal(false); 
      fetchData(); 
    } catch (err) { 
      alert(err.response?.data?.error || "Assignment failed"); 
    } finally { 
      setModalLoading(false); 
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return alert("Reason is required");
    setModalLoading(true);
    try { 
      await reopenTicket(id, { reason: reopenReason }); 
      setShowReopenModal(false); 
      fetchData(); 
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to reopen"); 
    } finally { 
      setModalLoading(false); 
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm("Are you sure the issue is resolved? This will close the ticket.")) return;
    try { 
      await changeTicketStatus(id, { status: "closed" }); 
      fetchData(); 
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to close ticket."); 
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addComment(id, { comment: commentText });
      setCommentText("");
      const commentRes = await getComments(id);
      setComments(commentRes.data.results || commentRes.data);
    } catch (err) { 
      alert("Failed to add comment"); 
    } finally { 
      setSubmittingComment(false); 
    }
  };

  const getStatusBadge = (status) => {
    const s = status.replace("_", " ");
    let bg = "secondary";
    if (status === "open") bg = "info";
    else if (status === "assigned") bg = "primary";
    else if (status === "in_progress") bg = "warning";
    else if (status === "resolved") bg = "success";
    else if (status === "reopened") bg = "danger";
    else if (status === "closed") bg = "dark";
    return <Badge bg={bg} className="text-capitalize" pill>{s}</Badge>;
  };

  const getPriorityBadge = (p) => {
    let bg = "secondary";
    if (p === "low") bg = "info";
    else if (p === "medium") bg = "warning";
    else if (p === "high") bg = "danger";
    else if (p === "critical") bg = "danger";
    return <Badge bg={bg} className="text-capitalize" pill>{p}</Badge>;
  };

  const getSlaBadge = (sla) => {
    if (sla === "Breached") return <Badge bg="danger" pill>Breached</Badge>;
    if (sla === "Met") return <Badge bg="success" pill>Met</Badge>;
    return <Badge bg="warning" text="dark" pill>{sla || "Pending"}</Badge>;
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  if (!ticket) return <div className="text-center py-5 text-danger">Ticket not found.</div>;

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex align-items-center mb-4 flex-wrap gap-3">
        <Button variant="light" className="border d-flex align-items-center justify-content-center shadow-sm" style={{ width: "40px", height: "40px", borderRadius: "10px" }} onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </Button>
        <div>
          <h4 className="mb-0 fw-bold text-dark">{ticket.ticket_number}</h4>
          <h6 className="text-muted mb-0">{ticket.title}</h6>
        </div>
        <div className="ms-auto d-flex gap-2 align-items-center">
          {getPriorityBadge(ticket.priority)}
          {getStatusBadge(ticket.status)}
          {getSlaBadge(ticket.sla_status)}
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column: Description & Comments */}
        <Col lg={8}>
          {/* Description Card */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold border-bottom pb-3 mb-3 text-dark">Description</h6>
              <p className="text-muted" style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>{ticket.description}</p>
              
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
                        style={{ maxHeight: "350px", objectFit: "contain", cursor: "pointer" }} 
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
                <FaComment className="me-2 text-primary" /> Comments ({comments.length})
              </h6>
              
              {comments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <FiMessageSquare style={{ fontSize: "2rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No comments yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="mb-4" style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "10px" }}>
                  {comments.map(c => (
                    <div key={c.id} className="mb-3 p-3 bg-light rounded-4 border">
                      <div className="d-flex justify-content-between mb-2">
                        <strong style={{ fontSize: "0.9rem" }} className="text-dark">{c.user_name || c.user?.username}</strong>
                        <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
                      </div>
                      <p className="mb-0 text-muted" style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>{c.comment}</p>
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
                  style={{ borderRadius: "12px" }}
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

        {/* Right Column: Sidebar */}
        <Col lg={4}>
          {/* Ticket Info Card */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold border-bottom pb-3 mb-3 text-dark">Ticket Information</h6>
              
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between">
                  <span className="text-muted small d-flex align-items-center">
                    <FaTags className="me-2" /> Category
                  </span>
                  <span className="fw-medium text-dark text-end">{ticket.category_name || "-"}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small d-flex align-items-center">
                    <FaBuilding className="me-2" /> Department
                  </span>
                  <span className="fw-medium text-dark text-end">{ticket.department_name || "-"}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small d-flex align-items-center">
                    <FaUserCircle className="me-2" /> Assigned To
                  </span>
                  <span className="fw-medium text-dark text-end">{ticket.technician_name || "Unassigned"}</span>
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
              </div>
              
              <div className="mt-4 d-flex flex-column gap-2">
                {role === "admin" && (ticket.status === "open" || ticket.status === "reopened") && (
                  <Button variant="primary w-100 d-flex align-items-center justify-content-center" className="py-2 rounded-pill" onClick={openAssignModal}>
                    <FaUserPlus className="me-2" /> Assign Technician
                  </Button>
                )}
                {(role === "employee" || role === "admin") && ticket.status === "resolved" && (
                  <Button variant="warning w-100 d-flex align-items-center justify-content-center" className="py-2 rounded-pill text-dark" onClick={() => setShowReopenModal(true)}>
                    <FaRedo className="me-2" /> Reopen Ticket
                  </Button>
                )}
                {role === "employee" && ticket.status === "resolved" && (
                  <Button variant="success w-100 d-flex align-items-center justify-content-center" className="py-2 rounded-pill" onClick={handleCloseTicket}>
                    <FaCheckCircle className="me-2" /> Confirm & Close Ticket
                  </Button>
                )}
                {role === "employee" && ticket.status === "closed" && (
                  <div
                    className="d-flex align-items-center gap-3 p-3 rounded-4 border"
                    style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb', cursor: 'pointer', transition: '0.2s' }}
                    onClick={() => setShowFeedbackModal(true)}
                  >
                    <div style={{ backgroundColor: '#f59e0b', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiMessageSquare />
                    </div>
                    <div>
                      <div className="fw-bold" style={{ color: '#92400e' }}>Share Your Feedback</div>
                      <div className="text-muted small">Rate the support you received</div>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Timeline Card */}
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold border-bottom pb-3 mb-4 text-dark">Timeline</h6>
              
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center mb-4">
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#0d6efd", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>✓</div>
                  <div className="ms-3">
                    <div className="fw-bold text-dark small">Ticket Created</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>{new Date(ticket.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {ticket.assigned_at && (
                  <div className="d-flex align-items-center mb-4">
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#0dcaf0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>➤</div>
                    <div className="ms-3">
                      <div className="fw-bold text-dark small">Assigned to Technician</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>{new Date(ticket.assigned_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {ticket.status === "in_progress" && (
                  <div className="d-flex align-items-center mb-4">
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#ffc107", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>⚙</div>
                    <div className="ms-3">
                      <div className="fw-bold text-dark small">In Progress</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Technician is working on it</div>
                    </div>
                  </div>
                )}

                {ticket.status === "resolved" && (
                  <div className="d-flex align-items-center mb-4">
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#198754", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>✓</div>
                    <div className="ms-3">
                      <div className="fw-bold text-dark small">Issue Resolved</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Awaiting confirmation</div>
                    </div>
                  </div>
                )}

                {ticket.status === "reopened" && (
                  <div className="d-flex align-items-center mb-4">
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#dc3545", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>↻</div>
                    <div className="ms-3">
                      <div className="fw-bold text-dark small">Ticket Reopened</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Issue persists, reopened</div>
                    </div>
                  </div>
                )}

                {ticket.status === "closed" && (
                  <div className="d-flex align-items-center">
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#6c757d", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>✕</div>
                    <div className="ms-3">
                      <div className="fw-bold text-dark small">Ticket Closed</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Successfully completed</div>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Assign Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fw-bold">Assign Technician</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="shadow-none mb-3">
            <option value="">Select a technician...</option>
            {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} (@{t.username})</option>)}
          </Form.Select>
          <Button variant="primary w-100 rounded-pill" onClick={handleAssign} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" /> : "Assign Now"}
          </Button>
        </Modal.Body>
      </Modal>

      {/* Reopen Modal */}
      <Modal show={showReopenModal} onHide={() => setShowReopenModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fw-bold">Reopen Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Control as="textarea" rows={3} placeholder="Why are you reopening this ticket?" value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} className="shadow-none mb-3" />
          <Button variant="warning w-100 rounded-pill text-dark" onClick={handleReopen} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" /> : "Submit Reopen Request"}
          </Button>
        </Modal.Body>
      </Modal>

      {ticket && <FeedbackModal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} ticket={ticket} />}

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

export default TicketDetails;