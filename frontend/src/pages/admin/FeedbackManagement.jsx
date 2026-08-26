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
  Modal,
} from 'react-bootstrap';
import {
  FaStar,
  FaRegStar,
  FaComments,
  FaThumbsDown,
  FaSearch,
  FaEye,
  FaUser,
  FaUserCog,
  FaCalendarAlt,
} from 'react-icons/fa';
import { FiAlertCircle, FiX } from 'react-icons/fi';
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

  // =========================================================
  // STATS CALCULATIONS
  // =========================================================

  const totalFeedback = feedbacks.length;
  const averageRating =
    totalFeedback > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1)
      : '0.0';
  const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
  const lowRatingCount = feedbacks.filter((f) => f.rating <= 2).length;

  // Rating distribution for bars
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbacks.filter((f) => f.rating === star).length,
    percentage: totalFeedback > 0 ? (feedbacks.filter((f) => f.rating === star).length / totalFeedback) * 100 : 0,
  }));

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
    const matchesRating = ratingFilter === '' || f.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const openDetail = (f) => {
    setSelectedFeedback(f);
    setShowDetailModal(true);
  };

  // =========================================================
  // UI HELPERS
  // =========================================================

  const renderStars = (rating, size) => {
    const sz = size || '0.9rem';
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#d1d5db', fontSize: sz, marginRight: '2px' }}>
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

  const getBarColor = (star) => {
    if (star === 5) return '#10b981';
    if (star === 4) return '#3b82f6';
    if (star === 3) return '#0dcaf0';
    if (star === 2) return '#f59e0b';
    return '#ef4444';
  };

  const empLabel = (f) => {
    const id = f.employee_id ? ` ${f.employee_id}` : "";
    const dept = f.employee_department ? ` - ${f.employee_department}` : "";
    const sub = [id, dept].filter(Boolean).join("");
    return (
      <div>
        <div className="fw-semibold text-dark">{f.employee_name}</div>
        {sub && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{sub}</div>}
      </div>
    );
  };

  const techLabel = (f) => {
    if (!f.technician_name) return <span className="text-muted fst-italic">Unassigned</span>;
    const id = f.technician_id ? ` ${f.technician_id}` : "";
    const dept = f.technician_department ? ` - ${f.technician_department}` : "";
    const sub = [id, dept].filter(Boolean).join("");
    return (
      <div>
        <div className="fw-semibold text-dark">{f.technician_name}</div>
        {sub && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{sub}</div>}
      </div>
    );
  };

  // =========================================================
  // KPI CARD COMPONENT
  // =========================================================

  const KPICard = ({ icon, bgColor, label, value, subValue }) => (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Body className="d-flex align-items-center p-4">
        <div
          className="rounded-4 d-flex align-items-center justify-content-center me-3"
          style={{ width: "52px", height: "52px", backgroundColor: bgColor }}
        >
          {icon}
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fw-bold fs-4 text-dark">
            {loading ? <Spinner size="sm" animation="border" /> : value}
            {subValue && <span className="fs-6 text-muted ms-1">{subValue}</span>}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const hasActiveFilters = search || ratingFilter;

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark">Feedback Management</h4>
        <p className="text-muted mb-0">View and analyze employee feedback across all tickets</p>
      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Row className="g-3 mb-4">
        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={<FaComments style={{ fontSize: '1.4rem', color: '#4f46e5' }} />}
            bgColor="#e0e7ff"
            label="Total Feedback"
            value={totalFeedback}
          />
        </Col>
        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={<FaStar style={{ fontSize: '1.4rem', color: '#f59e0b' }} />}
            bgColor="#fef3c7"
            label="Average Rating"
            value={averageRating}
            subValue="/ 5"
          />
        </Col>
        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={<FaStar style={{ fontSize: '1.4rem', color: '#10b981' }} />}
            bgColor="#d1fae5"
            label="5 Star Ratings"
            value={fiveStarCount}
          />
        </Col>
        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={<FaThumbsDown style={{ fontSize: '1.4rem', color: '#ef4444' }} />}
            bgColor="#fee2e2"
            label="Low Ratings (1-2)"
            value={lowRatingCount}
          />
        </Col>
      </Row>

      {/* =====================================================
          RATING DISTRIBUTION + FILTER
      ===================================================== */}

      <Row className="g-3 mb-4">
        {/* Rating Distribution Chart */}
        <Col xl={5} md={12}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-4">Rating Distribution</h6>

              <div className="d-flex align-items-center gap-4">
                {/* Big Average Circle */}
                <div className="text-center flex-shrink-0">
                  <div
                    className="d-flex flex-column align-items-center justify-content-center rounded-4"
                    style={{
                      width: "90px",
                      height: "90px",
                      backgroundColor: "#fef3c7",
                      border: "2px solid #f59e0b",
                    }}
                  >
                    <span className="fw-bold text-dark" style={{ fontSize: "1.6rem", lineHeight: 1 }}>
                      {averageRating}
                    </span>
                    <div className="mt-1">{renderStars(Math.round(averageRating), '0.55rem')}</div>
                  </div>
                  <div className="text-muted mt-2" style={{ fontSize: "0.7rem" }}>
                    {totalFeedback} reviews
                  </div>
                </div>

                {/* Bars */}
                <div className="flex-grow-1">
                  {ratingDistribution.map((r) => (
                    <div
                      key={r.star}
                      className="d-flex align-items-center gap-2 mb-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setRatingFilter(ratingFilter === String(r.star) ? '' : String(r.star))}
                      title={`Filter by ${r.star} stars`}
                    >
                      <span className="d-flex align-items-center flex-shrink-0" style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '26px' }}>
                        {r.star} <FaStar style={{ color: '#f59e0b', fontSize: '0.6rem', marginLeft: '2px' }} />
                      </span>
                      <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: '8px', backgroundColor: '#f1f5f9' }}>
                        <div
                          className="h-100 rounded-pill"
                          style={{
                            width: `${r.percentage}%`,
                            backgroundColor: getBarColor(r.star),
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span className="text-muted flex-shrink-0" style={{ fontSize: '0.7rem', minWidth: '20px', textAlign: 'right' }}>
                        {r.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Filter & Search Card */}
        <Col xl={7} md={12}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <Row className="g-3 align-items-end">
                <Col md={7}>
                  <Form.Label className="small fw-semibold text-muted mb-1">Search</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FaSearch size={14} className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search by ticket, employee, technician, review..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-start-0 border-end-0 shadow-none"
                      style={{ paddingLeft: "0" }}
                    />
                    {search && (
                      <InputGroup.Text className="bg-light border-start-0" style={{ cursor: "pointer" }} onClick={() => setSearch("")}>
                        <FiX size={14} className="text-danger" />
                      </InputGroup.Text>
                    )}
                  </InputGroup>
                </Col>

                <Col md={5}>
                  <Form.Label className="small fw-semibold text-muted mb-1">Filter by Rating</Form.Label>
                  <div className="position-relative">
                    <Form.Select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="shadow-none pe-4"
                    >
                      <option value="">All Ratings</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                      <option value="2">⭐⭐ 2 Stars</option>
                      <option value="1">⭐ 1 Star</option>
                    </Form.Select>
                  </div>
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <div className="text-muted small">
                  Showing <strong className="text-dark">{filteredFeedbacks.length}</strong> of{' '}
                  <strong className="text-dark">{totalFeedback}</strong> feedbacks
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="light"
                    className="border rounded-pill px-3 d-flex align-items-center"
                    size="sm"
                    onClick={() => { setSearch(''); setRatingFilter(''); }}
                  >
                    <FiX className="me-1" /> Clear All
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4 rounded-4 border-0">
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted mb-0">Loading feedback...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaComments style={{ fontSize: '3rem', color: '#dee2e6' }} />
              <h5 className="mt-3 fw-bold text-dark">No Feedback Found</h5>
              <p className="mb-3">
                {hasActiveFilters ? 'Try adjusting your search or filter criteria.' : 'No feedback has been submitted yet.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline-primary" size="sm" className="rounded-pill px-4" onClick={() => { setSearch(''); setRatingFilter(''); }}>
                  <FiX className="me-1" /> Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover responsive className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: "120px", paddingLeft: "24px" }}>Ticket</th>
                    <th style={{ width: "180px" }}>Employee</th>
                    <th style={{ width: "180px" }}>Technician</th>
                    <th style={{ width: "160px" }}>Rating</th>
                    <th style={{ minWidth: "280px" }}>Review</th>
                    <th style={{ width: "120px", paddingRight: "24px" }}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((f) => (
                    <tr
                      key={f.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openDetail(f)}
                    >
                      <td className="fw-bold text-primary" style={{ paddingLeft: "24px" }}>{f.ticket_number}</td>
                      <td>{empLabel(f)}</td>
                      <td>{techLabel(f)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {renderStars(f.rating)}
                          <Badge bg={getRatingBadgeVariant(f.rating)} pill>{f.rating}</Badge>
                        </div>
                      </td>
                      <td>
                        {f.review ? (
                          <div>
                            <div style={{ maxHeight: '44px', overflow: 'hidden', lineHeight: '1.4', wordBreak: 'break-word', color: '#475569' }}>
                              {f.review}
                            </div>
                            <span className="d-inline-flex align-items-center gap-1 mt-1 text-primary" style={{ fontSize: '0.8rem', cursor: "pointer", fontWeight: 500 }} onClick={(e) => { e.stopPropagation(); openDetail(f); }}>
                              <FaEye style={{ fontSize: '0.75rem' }} /> View Detail
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">No review</span>
                        )}
                      </td>
                      <td className="text-muted small" style={{ paddingRight: "24px" }}>
                        {new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* =====================================================
          DETAIL MODAL
      ===================================================== */}

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-bottom-0 pt-4 px-4">
          <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-dark">
            <FaComments className="text-primary" /> Feedback Details
          </Modal.Title>
        </Modal.Header>

        {selectedFeedback && (
          <Modal.Body className="px-4 pb-4">
            {/* Rating Hero Section */}
            <div className="text-center mb-4 p-4 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                {renderStars(selectedFeedback.rating, '2.2rem')}
              </div>
              <h4 className="mb-1">
                <Badge bg={getRatingBadgeVariant(selectedFeedback.rating)} pill className="fs-6 px-4 py-2">
                  {selectedFeedback.rating}/5 — {getRatingLabel(selectedFeedback.rating)}
                </Badge>
              </h4>
              <p className="text-muted small mb-0">
                for ticket <strong className="text-dark">{selectedFeedback.ticket_number}</strong>
              </p>
            </div>

            {/* Info Cards with Icons */}
            <Row className="g-3 mb-4">
              <Col md={6}>
                <div className="p-3 rounded-4 border h-100 d-flex align-items-center gap-3">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '40px', height: '40px', backgroundColor: '#e0e7ff' }}
                  >
                    <FaUser style={{ color: '#4f46e5', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <div className="text-muted small mb-1">Employee</div>
                    {empLabel(selectedFeedback)}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 rounded-4 border h-100 d-flex align-items-center gap-3">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '40px', height: '40px', backgroundColor: '#d1fae5' }}
                  >
                    <FaUserCog style={{ color: '#10b981', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <div className="text-muted small mb-1">Technician</div>
                    {techLabel(selectedFeedback)}
                  </div>
                </div>
              </Col>
              <Col md={12}>
                <div className="p-3 rounded-4 border d-flex align-items-center gap-3">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7' }}
                  >
                    <FaCalendarAlt style={{ color: '#f59e0b', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <div className="text-muted small mb-1">Submitted On</div>
                    <div className="fw-semibold text-dark">
                      {new Date(selectedFeedback.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' at '}
                      {new Date(selectedFeedback.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Review Section */}
            <div>
              <h6 className="fw-bold mb-2 text-dark">Review</h6>
              {selectedFeedback.review ? (
                <div
                  className="p-4 rounded-4 border"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    backgroundColor: '#f8fafc',
                    lineHeight: '1.8',
                    fontSize: '0.95rem',
                    color: '#475569',
                  }}
                >
                  "{selectedFeedback.review}"
                </div>
              ) : (
                <div className="p-4 text-center text-muted fst-italic bg-light rounded-4 border">
                  No review was provided.
                </div>
              )}
            </div>
          </Modal.Body>
        )}

        <Modal.Footer className="border-top-0 px-4 pb-4">
          <Button variant="light" className="border rounded-pill px-4" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeedbackManagement;