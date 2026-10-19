
import { useState, useEffect, useContext, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Form,
  Spinner,
  Image,
  Modal,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaRedo,
  FaUserPlus,
  FaComment,
  FaPaperclip,
  FaCheckCircle,
  FaDownload,
  FaExpand,
  FaTags,
  FaBuilding,
  FaUserCircle,
  FaCalendarAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";

import FeedbackModal from "./FeedbackModal";
import { AuthContext } from "../../context/AuthContext";
import {
  getTicketById,
  getComments,
  addComment,
  assignTicket,
  reopenTicket,
  changeTicketStatus,
} from "../../services/ticketService";
import api from "../../services/api";
import { getFullImageUrl } from "../utils/imageHelper";

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = user?.role;

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [imageError, setImageError] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch ticket details and comments
  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const [ticketRes, commentRes] = await Promise.all([
        getTicketById(id),
        getComments(id),
      ]);

      setTicket(ticketRes.data);

      const commentData = commentRes.data;
      setComments(
        Array.isArray(commentData)
          ? commentData
          : commentData.results || []
      );
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
      setPageError(
        err.response?.status === 404
          ? "Ticket not found."
          : "Unable to load ticket details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset image error when the attachment changes
  useEffect(() => {
    setImageError(false);
    setShowImageModal(false);
  }, [ticket?.screenshot]);

  // Load technicians for assignment
  const openAssignModal = async () => {
    try {
      const res = await api.get("/auth/users/", {
        params: { role: "technician" },
      });

      const data = res.data;
      setTechnicians(
        Array.isArray(data) ? data : data.results || []
      );

      setSelectedTech(
        String(ticket?.assigned_technician?.id || "")
      );

      setShowAssignModal(true);
    } catch (err) {
      console.error("Failed to load technicians:", err);
      alert("Failed to load technicians. Please try again.");
    }
  };

  // Assign ticket to a technician
  const handleAssign = async () => {
    if (!selectedTech) {
      alert("Please select a technician.");
      return;
    }

    setModalLoading(true);

    try {
      await assignTicket(id, {
        technician_id: Number(selectedTech),
      });

      setShowAssignModal(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to assign ticket:", err);
      alert(
        err.response?.data?.error || "Assignment failed."
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Reopen a resolved ticket
  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      alert("Please enter a reason for reopening the ticket.");
      return;
    }

    setModalLoading(true);

    try {
      await reopenTicket(id, {
        reason: reopenReason.trim(),
      });

      setShowReopenModal(false);
      setReopenReason("");
      await fetchData();
    } catch (err) {
      console.error("Failed to reopen ticket:", err);
      alert(
        err.response?.data?.error || "Failed to reopen ticket."
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Confirm and close a resolved ticket
  const handleCloseTicket = async () => {
    const confirmed = window.confirm(
      "Are you sure the issue is resolved? This will close the ticket."
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      await changeTicketStatus(id, {
        status: "closed",
      });

      await fetchData();
    } catch (err) {
      console.error("Failed to close ticket:", err);
      alert(
        err.response?.data?.error || "Failed to close ticket."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Add a comment
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    setSubmittingComment(true);

    try {
      await addComment(id, {
        comment: commentText.trim(),
      });

      setCommentText("");

      const commentRes = await getComments(id);
      const data = commentRes.data;

      setComments(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Failed to add comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const config = {
      open: { bg: "info", label: "Open" },
      assigned: { bg: "primary", label: "Assigned" },
      in_progress: { bg: "warning", label: "In Progress" },
      resolved: { bg: "success", label: "Resolved" },
      reopened: { bg: "danger", label: "Reopened" },
      closed: { bg: "dark", label: "Closed" },
    };

    const item = config[status] || {
      bg: "secondary",
      label: status || "Unknown",
    };

    return (
      <Badge
        bg={item.bg}
        text={status === "in_progress" ? "dark" : undefined}
        className="text-capitalize px-3 py-2"
        pill
      >
        {item.label}
      </Badge>
    );
  };

  // Priority badge
  const getPriorityBadge = (priority) => {
    const config = {
      low: { bg: "info", label: "Low" },
      medium: { bg: "warning", label: "Medium" },
      high: { bg: "danger", label: "High" },
      critical: { bg: "danger", label: "Critical" },
    };

    const item = config[priority] || {
      bg: "secondary",
      label: priority || "Unknown",
    };

    return (
      <Badge
        bg={item.bg}
        text={priority === "medium" ? "dark" : undefined}
        className="text-capitalize px-3 py-2"
        pill
      >
        {item.label}
      </Badge>
    );
  };

  // SLA badge
  const getSlaBadge = (sla) => {
    if (sla === "Breached") {
      return <Badge bg="danger" pill>Breached</Badge>;
    }

    if (sla === "Met") {
      return <Badge bg="success" pill>Met</Badge>;
    }

    return (
      <Badge bg="warning" text="dark" pill>
        {sla || "Pending"}
      </Badge>
    );
  };

  // Format dates safely
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString();
  };

  // Direct image URL - no blob fetching or axios image request
  const attachmentUrl = ticket?.screenshot
    ? getFullImageUrl(ticket.screenshot)
    : null;

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container py-5 text-center">
        <h5 className="text-danger">
          {pageError || "Ticket not found."}
        </h5>
        <Button
          variant="outline-primary"
          className="mt-3"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div
      className="ticket-details-page"
      style={{
        backgroundColor: "#f8f9fc",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div className="container-fluid px-0">

        {/* Header */}
        <div className="d-flex align-items-center mb-4 flex-wrap gap-3">
          <Button
            variant="light"
            className="border shadow-sm d-flex align-items-center justify-content-center"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
            }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FaArrowLeft />
          </Button>

          <div className="flex-grow-1">
            <div className="text-muted small mb-1">
              Ticket Details
            </div>
            <h4 className="fw-bold text-dark mb-1">
              {ticket.ticket_number}
            </h4>
            <h6 className="text-muted mb-0">
              {ticket.title}
            </h6>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
            {getSlaBadge(ticket.sla_status)}
          </div>
        </div>

        {pageError && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center">
            <span>{pageError}</span>
            <Button
              size="sm"
              variant="outline-dark"
              onClick={fetchData}
            >
              <FaRedo className="me-1" />
              Retry
            </Button>
          </div>
        )}

        <Row className="g-4">

          {/* Left column */}
          <Col lg={8}>

            {/* Description and attachment */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-dark border-bottom pb-3 mb-3">
                  Description
                </h6>

                <p
                  className="text-secondary mb-0"
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.8",
                    overflowWrap: "anywhere",
                  }}
                >
                  {ticket.description || "No description provided."}
                </p>

                {/* Screenshot attachment */}
                {ticket.screenshot && (
                  <div className="mt-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <FaPaperclip className="text-primary" />
                      <strong className="text-dark">
                        Attachment
                      </strong>
                    </div>

                    {!imageError ? (
                      <div
                        className="text-center bg-light p-3 rounded-4 border"
                      >
                        <Image
                          src={attachmentUrl}
                          alt="Ticket attachment"
                          fluid
                          rounded
                          onError={() => {
                            console.error(
                              "Failed to load ticket attachment:",
                              attachmentUrl
                            );
                            setImageError(true);
                          }}
                          style={{
                            maxHeight: "350px",
                            maxWidth: "100%",
                            objectFit: "contain",
                            cursor: "pointer",
                          }}
                          onClick={() => setShowImageModal(true)}
                        />

                        <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
                          <Button
                            size="sm"
                            variant="light"
                            className="border rounded-pill px-3"
                            onClick={() => setShowImageModal(true)}
                          >
                            <FaExpand className="me-2" />
                            View Full
                          </Button>

                          <Button
                            as="a"
                            size="sm"
                            variant="light"
                            className="border rounded-pill px-3"
                            href={attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <FaDownload className="me-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-4 bg-light text-center">
                        <FaPaperclip className="text-danger mb-2" />
                        <p className="text-danger mb-3">
                          Unable to display the attachment.
                        </p>

                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="rounded-pill px-4"
                          onClick={() => {
                            setImageError(false);
                          }}
                        >
                          <FaRedo className="me-2" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Comments */}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-dark border-bottom pb-3 mb-3">
                  <FaComment className="text-primary me-2" />
                  Comments ({comments.length})
                </h6>

                {comments.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FiMessageSquare
                      style={{
                        fontSize: "2.5rem",
                        color: "#cbd5e1",
                      }}
                    />
                    <p className="mt-3 mb-0">
                      No comments yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div
                    className="mb-4"
                    style={{
                      maxHeight: "350px",
                      overflowY: "auto",
                      paddingRight: "8px",
                    }}
                  >
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="mb-3 p-3 bg-light rounded-4 border"
                      >
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                          <strong className="text-dark small">
                            {comment.user_name ||
                              comment.user?.username ||
                              "User"}
                          </strong>

                          <small className="text-muted">
                            {formatDate(comment.created_at)}
                          </small>
                        </div>

                        <p
                          className="mb-0 text-secondary"
                          style={{
                            fontSize: "0.9rem",
                            lineHeight: "1.7",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {comment.comment}
                        </p>
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
                    onChange={(e) =>
                      setCommentText(e.target.value)
                    }
                    className="mb-3 shadow-none"
                    style={{ borderRadius: "12px" }}
                    disabled={submittingComment}
                  />

                  <div className="d-flex justify-content-end">
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      className="px-4 py-2 rounded-pill"
                      disabled={
                        submittingComment || !commentText.trim()
                      }
                    >
                      {submittingComment ? (
                        <>
                          <Spinner
                            size="sm"
                            className="me-2"
                          />
                          Posting...
                        </>
                      ) : (
                        <>
                          <FaComment className="me-2" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Right column */}
          <Col lg={4}>

            {/* Ticket information */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-dark border-bottom pb-3 mb-4">
                  Ticket Information
                </h6>

                <div className="d-flex flex-column gap-4">
                  <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted small">
                      <FaTags className="me-2" />
                      Category
                    </span>
                    <span className="fw-semibold text-dark small text-end">
                      {ticket.category_name || "-"}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted small">
                      <FaBuilding className="me-2" />
                      Department
                    </span>
                    <span className="fw-semibold text-dark small text-end">
                      {ticket.department_name || "-"}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted small">
                      <FaUserCircle className="me-2" />
                      Assigned To
                    </span>
                    <span className="fw-semibold text-dark small text-end">
                      {ticket.technician_name ||
                        ticket.assigned_technician?.username ||
                        "Unassigned"}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted small">
                      <FaCalendarAlt className="me-2" />
                      Created
                    </span>
                    <span className="text-dark small text-end">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted small">
                      <FaSyncAlt className="me-2" />
                      Updated
                    </span>
                    <span className="text-dark small text-end">
                      {formatDate(ticket.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Role-based ticket actions */}
                <div className="mt-4 d-flex flex-column gap-3">

                  {role === "admin" &&
                    ["open", "reopened"].includes(ticket.status) && (
                      <Button
                        variant="primary"
                        className="w-100 py-2 rounded-pill"
                        onClick={openAssignModal}
                      >
                        <FaUserPlus className="me-2" />
                        Assign Technician
                      </Button>
                    )}

                  {(role === "employee" || role === "admin") &&
                    ticket.status === "resolved" && (
                      <Button
                        variant="warning"
                        className="w-100 py-2 rounded-pill text-dark"
                        onClick={() => setShowReopenModal(true)}
                      >
                        <FaRedo className="me-2" />
                        Reopen Ticket
                      </Button>
                    )}

                  {role === "employee" &&
                    ticket.status === "resolved" && (
                      <Button
                        variant="success"
                        className="w-100 py-2 rounded-pill"
                        onClick={handleCloseTicket}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Spinner size="sm" className="me-2" />
                        ) : (
                          <FaCheckCircle className="me-2" />
                        )}
                        Confirm &amp; Close Ticket
                      </Button>
                    )}

                  {role === "employee" &&
                    ticket.status === "closed" && (
                      <button
                        type="button"
                        className="d-flex align-items-center gap-3 p-3 rounded-4 border text-start w-100"
                        style={{
                          borderColor: "#f59e0b",
                          backgroundColor: "#fffbeb",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowFeedbackModal(true)}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            backgroundColor: "#f59e0b",
                            color: "white",
                            borderRadius: "50%",
                            width: "42px",
                            height: "42px",
                          }}
                        >
                          <FiMessageSquare />
                        </div>

                        <div>
                          <div
                            className="fw-bold"
                            style={{ color: "#92400e" }}
                          >
                            Share Your Feedback
                          </div>
                          <div className="text-muted small">
                            Rate the support you received
                          </div>
                        </div>
                      </button>
                    )}
                </div>
              </Card.Body>
            </Card>

            {/* Timeline */}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-dark border-bottom pb-3 mb-4">
                  Ticket Timeline
                </h6>

                <div className="d-flex flex-column gap-4">
                  <TimelineItem
                    color="#0d6efd"
                    symbol="✓"
                    title="Ticket Created"
                    description={formatDate(ticket.created_at)}
                  />

                  {ticket.assigned_at && (
                    <TimelineItem
                      color="#0dcaf0"
                      symbol="➤"
                      title="Assigned to Technician"
                      description={formatDate(ticket.assigned_at)}
                    />
                  )}

                  {ticket.status === "in_progress" && (
                    <TimelineItem
                      color="#ffc107"
                      symbol="⚙"
                      title="In Progress"
                      description="Technician is working on the issue."
                    />
                  )}

                  {ticket.status === "resolved" && (
                    <TimelineItem
                      color="#198754"
                      symbol="✓"
                      title="Issue Resolved"
                      description="Awaiting employee confirmation."
                    />
                  )}

                  {ticket.status === "reopened" && (
                    <TimelineItem
                      color="#dc3545"
                      symbol="↻"
                      title="Ticket Reopened"
                      description="The issue requires further attention."
                    />
                  )}

                  {ticket.status === "closed" && (
                    <TimelineItem
                      color="#6c757d"
                      symbol="✓"
                      title="Ticket Closed"
                      description="The ticket has been closed."
                    />
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Assign Technician Modal */}
      <Modal
        show={showAssignModal}
        onHide={() => {
          if (!modalLoading) setShowAssignModal(false);
        }}
        centered
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fw-bold">
            Assign Technician
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Form.Label>Select a technician</Form.Label>

          <Form.Select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="shadow-none mb-3"
            disabled={modalLoading}
          >
            <option value="">Select a technician...</option>

            {technicians.map((technician) => (
              <option
                key={technician.id}
                value={technician.id}
              >
                {[
                  technician.first_name,
                  technician.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") ||
                  technician.username}
                {" "}(@{technician.username})
              </option>
            ))}
          </Form.Select>

          <Button
            variant="primary"
            className="w-100 rounded-pill"
            onClick={handleAssign}
            disabled={modalLoading || !selectedTech}
          >
            {modalLoading ? (
              <Spinner size="sm" />
            ) : (
              "Assign Now"
            )}
          </Button>
        </Modal.Body>
      </Modal>

      {/* Reopen Ticket Modal */}
      <Modal
        show={showReopenModal}
        onHide={() => {
          if (!modalLoading) setShowReopenModal(false);
        }}
        centered
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fw-bold">
            Reopen Ticket
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Form.Label>
            Why are you reopening this ticket?
          </Form.Label>

          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Describe why the issue is not resolved..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            className="shadow-none mb-3"
            disabled={modalLoading}
          />

          <Button
            variant="warning"
            className="w-100 rounded-pill text-dark"
            onClick={handleReopen}
            disabled={modalLoading || !reopenReason.trim()}
          >
            {modalLoading ? (
              <Spinner size="sm" />
            ) : (
              "Submit Reopen Request"
            )}
          </Button>
        </Modal.Body>
      </Modal>

      {/* Feedback Modal */}
      {ticket && (
        <FeedbackModal
          show={showFeedbackModal}
          onHide={() => setShowFeedbackModal(false)}
          ticket={ticket}
        />
      )}

      {/* Full Image Preview Modal */}
      <Modal
        show={showImageModal && !imageError}
        onHide={() => setShowImageModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fw-bold">
            Attachment Preview
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-center p-3 bg-dark">
          {attachmentUrl && (
            <Image
              src={attachmentUrl}
              alt="Full ticket attachment preview"
              fluid
              rounded
              onError={() => setImageError(true)}
              style={{
                maxHeight: "75vh",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          )}
        </Modal.Body>

        <Modal.Footer className="border-top">
          <Button
            variant="light"
            className="border"
            onClick={() => setShowImageModal(false)}
          >
            Close
          </Button>

          {attachmentUrl && (
            <Button
              as="a"
              variant="primary"
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <FaDownload className="me-2" />
              Download
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Reusable timeline item
const TimelineItem = ({
  color,
  symbol,
  title,
  description,
}) => (
  <div className="d-flex align-items-start">
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        backgroundColor: color,
        color: "#fff",
        fontSize: "13px",
      }}
    >
      {symbol}
    </div>

    <div className="ms-3">
      <div className="fw-bold text-dark small">
        {title}
      </div>
      <div
        className="text-muted mt-1"
        style={{
          fontSize: "0.78rem",
          lineHeight: "1.5",
          overflowWrap: "anywhere",
        }}
      >
        {description}
      </div>
    </div>
  </div>
);

export default TicketDetails;
