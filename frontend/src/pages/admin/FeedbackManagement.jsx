import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Container,
  Modal,
} from 'react-bootstrap';
import {
  FaStar,
  FaRegStar,
  FaComments,
  FaThumbsDown,
  FaSearch,
  FaEye,
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import feedbackService from '../../services/feedbackService';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await feedbackService.getFeedbackList();
      setFeedbacks(data.results || data);
    } catch (err) {
      setError('Failed to load feedback data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalFeedback = feedbacks.length;
  const averageRating =
    totalFeedback > 0
      ? (
          feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        ).toFixed(1)
      : '0.0';
  const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
  const lowRatingCount = feedbacks.filter((f) => f.rating <= 2).length;

  const filteredFeedbacks = feedbacks.filter((f) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === '' ||
      (f.ticket_number || '').toLowerCase().includes(searchLower) ||
      (f.employee_name || '').toLowerCase().includes(searchLower) ||
      (f.employee_id || '').toLowerCase().includes(searchLower) ||
      (f.technician_name || '').toLowerCase().includes(searchLower) ||
      (f.technician_id || '').toLowerCase().includes(searchLower) ||
      (f.review || '').toLowerCase().includes(searchLower);
    const matchesRating =
      ratingFilter === '' || f.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const openDetail = (f) => {
    setSelectedFeedback(f);
    setShowDetailModal(true);
  };

  const renderStars = (rating, size) => {
    const sz = size || '0.9rem';
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: i <= rating ? '#f59e0b' : '#d1d5db',
            fontSize: sz,
            marginRight: '2px',
          }}
        >
          {i <= rating ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return <span>{stars}</span>;
  };

  const getRatingBadgeVariant = (rating) => {
    if (rating === 1) return 'danger';
    if (rating === 2) return 'warning';
    if (rating === 3) return 'info';
    if (rating === 4) return 'primary';
    if (rating === 5) return 'success';
    return 'secondary';
  };

  const getRatingLabel = (r) => {
    if (r === 1) return 'Very Poor';
    if (r === 2) return 'Poor';
    if (r === 3) return 'Average';
    if (r === 4) return 'Good';
    if (r === 5) return 'Excellent';
    return '';
  };

  const empLabel = (f) => {
    const id = f.employee_id ? `  ${f.employee_id}` : "";
    const dept = f.employee_department ? ` - ${f.employee_department}` : "";
    const sub = [id, dept].filter(Boolean).join("");
    return (
      <div>
        <div className="fw-semibold">{f.employee_name}</div>
        {sub && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{sub}</div>}
      </div>
    );
  };

  const techLabel = (f) => {
    if (!f.technician_name) return <span className="text-muted fst-italic">Unassigned</span>;
    const id = f.technician_id ? `  ${f.technician_id}` : "";
    const dept = f.technician_department ? ` - ${f.technician_department}` : "";
    const sub = [id, dept].filter(Boolean).join("");
    return (
      <div>
        <div className="fw-semibold">{f.technician_name}</div>
        {sub && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{sub}</div>}
      </div>
    );
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1 fw-bold">Feedback Management</h3>
          <p className="text-muted mb-0">
            View and analyze employee feedback across all tickets
          </p>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff' }}
              >
                <FaComments style={{ fontSize: '1.3rem', color: '#4f46e5' }} />
              </div>
              <div>
                <div className="text-muted small">Total Feedback</div>
                <div className="fw-bold fs-4">{totalFeedback}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7' }}
              >
                <FaStar style={{ fontSize: '1.3rem', color: '#f59e0b' }} />
              </div>
              <div>
                <div className="text-muted small">Average Rating</div>
                <div className="fw-bold fs-4">
                  {averageRating} <span className="fs-6 text-muted">/ 5</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '48px', height: '48px', backgroundColor: '#d1fae5' }}
              >
                <FaStar style={{ fontSize: '1.3rem', color: '#10b981' }} />
              </div>
              <div>
                <div className="text-muted small">5 Star Ratings</div>
                <div className="fw-bold fs-4">{fiveStarCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2' }}
              >
                <FaThumbsDown style={{ fontSize: '1.3rem', color: '#ef4444' }} />
              </div>
              <div>
                <div className="text-muted small">Low Ratings (1-2)</div>
                <div className="fw-bold fs-4">{lowRatingCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Label className="small fw-semibold">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by ticket, employee, technician, ID, review..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Filter by Rating</Form.Label>
              <Form.Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted small">
                Showing <strong>{filteredFeedbacks.length}</strong> of{' '}
                <strong>{totalFeedback}</strong> feedbacks
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading feedback...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <FiAlertCircle className="me-2" />
              {error}
            </Alert>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-5">
              <FaComments style={{ fontSize: '3rem', color: '#d1d5db' }} />
              <h5 className="mt-3 text-muted">No Feedback Found</h5>
              <p className="text-muted">
                {search || ratingFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No feedback has been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-3">Ticket</th>
                    <th>Employee</th>
                    <th>Technician</th>
                    <th>Rating</th>
                    <th style={{ minWidth: '280px' }}>Review</th>
                    <th className="pe-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((f) => (
                    <tr key={f.id}>
                      <td className="ps-3">
                        <strong>{f.ticket_number}</strong>
                      </td>
                      <td style={{ minWidth: "150px" }}>{empLabel(f)}</td>
                      <td style={{ minWidth: "150px" }}>{techLabel(f)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          {renderStars(f.rating)}
                          <Badge bg={getRatingBadgeVariant(f.rating)} className="ms-1" pill>
                            {f.rating}
                          </Badge>
                        </div>
                      </td>
                      <td>
                        {f.review ? (
                          <div>
                            <div
                              style={{
                                maxHeight: '44px',
                                overflow: 'hidden',
                                lineHeight: '1.4',
                                wordBreak: 'break-word',
                              }}
                            >
                              {f.review}
                            </div>
                            <span
                              className="d-inline-flex align-items-center gap-1 mt-1"
                              style={{ color: '#4f46e5', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                              onClick={() => openDetail(f)}
                            >
                              <FaEye style={{ fontSize: '0.75rem' }} />
                              View Detail
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">No review</span>
                        )}
                      </td>
                      <td className="pe-3 text-muted small">
                        {new Date(f.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaComments className="text-primary" />
            Feedback Details
          </Modal.Title>
        </Modal.Header>
        {selectedFeedback && (
          <Modal.Body>
            <div className="text-center mb-4 pb-3 border-bottom">
              <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                {renderStars(selectedFeedback.rating, '2rem')}
              </div>
              <h4 className="mb-1">
                <Badge bg={getRatingBadgeVariant(selectedFeedback.rating)} pill className="fs-6 px-3 py-2">
                  {selectedFeedback.rating}/5 — {getRatingLabel(selectedFeedback.rating)}
                </Badge>
              </h4>
              <p className="text-muted small mb-0">
                for ticket <strong>{selectedFeedback.ticket_number}</strong>
              </p>
            </div>

            <Row className="g-3 mb-4">
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small mb-1">Employee</div>
                  <div>{empLabel(selectedFeedback)}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small mb-1">Technician</div>
                  <div>{techLabel(selectedFeedback)}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small mb-1">Submitted On</div>
                  <div className="fw-semibold">
                    {new Date(selectedFeedback.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' — '}
                    {new Date(selectedFeedback.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small mb-1">Rating</div>
                  <div className="fw-semibold d-flex align-items-center gap-1">
                    {renderStars(selectedFeedback.rating, '1rem')}
                    <Badge bg={getRatingBadgeVariant(selectedFeedback.rating)} pill className="ms-1">
                      {selectedFeedback.rating}/5
                    </Badge>
                  </div>
                </div>
              </Col>
            </Row>

            <div>
              <h6 className="fw-bold mb-2">Review</h6>
              {selectedFeedback.review ? (
                <div
                  className="p-3 rounded-3 border"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    backgroundColor: '#f8fafc',
                    lineHeight: '1.7',
                    fontSize: '0.95rem',
                  }}
                >
                  {selectedFeedback.review}
                </div>
              ) : (
                <div className="p-3 text-center text-muted fst-italic bg-light rounded-3">
                  No review was provided.
                </div>
              )}
            </div>
          </Modal.Body>
        )}
        <Modal.Footer className="border-top">
          <Button variant="outline-secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FeedbackManagement;