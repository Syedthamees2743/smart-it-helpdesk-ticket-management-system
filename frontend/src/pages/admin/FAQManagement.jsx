import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Modal,
  Container,
} from 'react-bootstrap';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaBook,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import faqService from '../../services/faqService';

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Account', 'Security', 'Printer', 'General'];

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [deletingFAQ, setDeletingFAQ] = useState(null);
  const [viewingFAQ, setViewingFAQ] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [faqStatus, setFaqStatus] = useState('active');

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await faqService.getFAQs();
      setFaqs(data.results || data);
    } catch (err) {
      setError('Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  };

  // KPI calculations
  const totalFAQs = faqs.length;
  const activeCount = faqs.filter((f) => f.status === 'active').length;
  const inactiveCount = faqs.filter((f) => f.status === 'inactive').length;
  const categoryCount = [...new Set(faqs.map((f) => f.category))].length;

  // Client-side filtering
  const filteredFAQs = faqs.filter((f) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === '' ||
      f.question.toLowerCase().includes(searchLower) ||
      (f.answer || '').toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === '' || f.category === categoryFilter;
    const matchesStatus = statusFilter === '' || f.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open create modal
  const openCreateModal = () => {
    setEditingFAQ(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
    setFaqStatus('active');
    setFormError('');
    setShowFormModal(true);
  };

  // Open edit modal
  const openEditModal = async (faq) => {
    setEditingFAQ(faq);
    setFormError('');
    try {
      const data = await faqService.getFAQ(faq.id);
      setQuestion(data.question);
      setAnswer(data.answer);
      setCategory(data.category);
      setFaqStatus(data.status);
      setShowFormModal(true);
    } catch (err) {
      setError('Failed to load FAQ details.');
    }
  };

  // Submit create/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setFormError('Question is required.');
      return;
    }
    if (!answer.trim()) {
      setFormError('Answer is required.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        category: category,
        status: faqStatus,
      };
      if (editingFAQ) {
        await faqService.updateFAQ(editingFAQ.id, payload);
      } else {
        await faqService.createFAQ(payload);
      }
      setShowFormModal(false);
      fetchFAQs();
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (Array.isArray(errorMsg)) {
        setFormError(errorMsg[0]);
      } else if (typeof errorMsg === 'string') {
        setFormError(errorMsg);
      } else if (typeof errorMsg === 'object' && errorMsg !== null) {
        const firstKey = Object.keys(errorMsg)[0];
        setFormError(Array.isArray(errorMsg[firstKey]) ? errorMsg[firstKey][0] : errorMsg[firstKey]);
      } else {
        setFormError('Failed to save FAQ. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingFAQ) return;
    setSubmitting(true);
    try {
      await faqService.deleteFAQ(deletingFAQ.id);
      setShowDeleteModal(false);
      setDeletingFAQ(null);
      fetchFAQs();
    } catch (err) {
      setError('Failed to delete FAQ.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status
  const toggleStatus = async (faq) => {
    const newStatus = faq.status === 'active' ? 'inactive' : 'active';
    try {
      await faqService.updateFAQ(faq.id, { status: newStatus });
      fetchFAQs();
    } catch (err) {
      setError('Failed to update FAQ status.');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return <Badge bg="success">Active</Badge>;
    return <Badge bg="secondary">Inactive</Badge>;
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      Hardware: '🖥️',
      Software: '💿',
      Network: '🌐',
      Account: '🔐',
      Security: '🛡️',
      Printer: '🖨️',
      General: '📋',
    };
    return icons[cat] || '📋';
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold">FAQ Management</h3>
          <p className="text-muted mb-0">Create and manage knowledge base articles</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <FaPlus className="me-2" /> Add FAQ
        </Button>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff' }}>
                <FaBook style={{ fontSize: '1.3rem', color: '#4f46e5' }} />
              </div>
              <div>
                <div className="text-muted small">Total FAQs</div>
                <div className="fw-bold fs-4">{totalFAQs}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', backgroundColor: '#d1fae5' }}>
                <FaCheckCircle style={{ fontSize: '1.3rem', color: '#10b981' }} />
              </div>
              <div>
                <div className="text-muted small">Active</div>
                <div className="fw-bold fs-4">{activeCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2' }}>
                <FaTimesCircle style={{ fontSize: '1.3rem', color: '#ef4444' }} />
              </div>
              <div>
                <div className="text-muted small">Inactive</div>
                <div className="fw-bold fs-4">{inactiveCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7' }}>
                <FaBook style={{ fontSize: '1.3rem', color: '#f59e0b' }} />
              </div>
              <div>
                <div className="text-muted small">Categories</div>
                <div className="fw-bold fs-4">{categoryCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Label className="small fw-semibold">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control placeholder="Search by question or answer..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Category</Form.Label>
              <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-semibold">Status</Form.Label>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="text-muted small">Showing <strong>{filteredFAQs.length}</strong> of <strong>{totalFAQs}</strong></div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading FAQs...</p></div>
          ) : error ? (
            <Alert variant="danger" className="m-3"><FiAlertCircle className="me-2" />{error}</Alert>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-5">
              <FaBook style={{ fontSize: '3rem', color: '#d1d5db' }} />
              <h5 className="mt-3 text-muted">No FAQs Found</h5>
              <p className="text-muted">{search || categoryFilter || statusFilter ? 'Try adjusting your filters.' : 'Click "Add FAQ" to create one.'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-3">Question</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Updated</th>
                    <th className="pe-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFAQs.map((f) => (
                    <tr key={f.id}>
                      <td className="ps-3" style={{ maxWidth: '300px' }}>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                          {f.question}
                        </div>
                      </td>
                      <td>
                        <span className="me-1">{getCategoryIcon(f.category)}</span>
                        {f.category}
                      </td>
                      <td>{getStatusBadge(f.status)}</td>
                      <td className="text-muted small">{f.created_by_name || '—'}</td>
                      <td className="text-muted small">
                        {f.updated_at ? new Date(f.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="pe-3">
                        <div className="d-flex justify-content-center gap-1">
                          <Button size="sm" variant="outline-primary" onClick={() => { setViewingFAQ(f); setShowViewModal(true); }} title="View"><FaEye /></Button>
                          <Button size="sm" variant="outline-secondary" onClick={() => openEditModal(f)} title="Edit"><FaEdit /></Button>
                          <Button size="sm" variant={f.status === 'active' ? 'outline-warning' : 'outline-success'} onClick={() => toggleStatus(f)} title={f.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {f.status === 'active' ? <FaEyeSlash /> : <FaCheckCircle />}
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => { setDeletingFAQ(f); setShowDeleteModal(true); }} title="Delete"><FaTrash /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* === CREATE/EDIT MODAL === */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title>{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger"><FiAlertCircle className="me-2" />{formError}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Question <span className="text-danger">*</span></Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="Enter the question..." value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} />
              <Form.Text className="text-muted">{question.length}/500</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Answer <span className="text-danger">*</span></Form.Label>
              <Form.Control as="textarea" rows={6} placeholder="Enter the detailed answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Label className="fw-semibold">Category</Form.Label>
                <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="fw-semibold">Status</Form.Label>
                <Form.Select value={faqStatus} onChange={(e) => setFaqStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={() => setShowFormModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? <><Spinner size="sm" className="me-1" />Saving...</> : (editingFAQ ? 'Update FAQ' : 'Create FAQ')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* === VIEW MODAL === */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title>FAQ Details</Modal.Title>
        </Modal.Header>
        {viewingFAQ && (
          <Modal.Body>
            <div className="mb-3">
              <span className="me-1" style={{ fontSize: '1.2rem' }}>{getCategoryIcon(viewingFAQ.category)}</span>
              <Badge bg="secondary">{viewingFAQ.category}</Badge>
              {getStatusBadge(viewingFAQ.category !== viewingFAQ.status ? viewingFAQ.status : '') && (
                <span className="ms-2">{getStatusBadge(viewingFAQ.status)}</span>
              )}
            </div>
            <h5 className="fw-bold mb-3">{viewingFAQ.question}</h5>
            <div className="p-3 rounded-3 border bg-light" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
              {viewingFAQ.answer}
            </div>
            <div className="d-flex gap-4 mt-3 text-muted small">
              <span>Created by: <strong>{viewingFAQ.created_by_name || '—'}</strong></span>
              <span>Updated: <strong>{viewingFAQ.updated_at ? new Date(viewingFAQ.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</strong></span>
            </div>
          </Modal.Body>
        )}
      </Modal>

      {/* === DELETE MODAL === */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title>Delete FAQ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this FAQ?</p>
          <div className="p-2 bg-light rounded-3">
            <strong>{deletingFAQ?.question}</strong>
          </div>
          <p className="text-muted small mt-2">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? <><Spinner size="sm" className="me-1" />Deleting...</> : 'Delete FAQ'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FAQManagement;