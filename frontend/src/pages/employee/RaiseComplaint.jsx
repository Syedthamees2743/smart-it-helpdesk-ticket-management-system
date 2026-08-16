import { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaTicketAlt, FaTag, FaHeading, FaAlignLeft,
  FaFlag, FaImage, FaPaperPlane, FaExclamationTriangle,
  FaMagic, FaRobot, FaTimes, FaCheck, FaBook
} from 'react-icons/fa';
import { createTicket } from '../../services/ticketService';
import { getCategories } from '../../services/categoryService';
import aiService from '../../services/aiService';

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium',
    screenshot: null
  });

  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    getCategories({ page_size: 1000 })
      .then(res => setCategories(res.data?.results || res.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setFileName(files[0].name);
    } else if (name === 'screenshot') {
      setFileName('');
    }
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
    // Clear AI result when user manually changes category or priority
    if (name === 'category' || name === 'priority') {
      setAiResult(null);
    }
  };

  // ── AI Analyze Handler ──
  const handleAnalyze = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setAiError('Please enter both title and description before analyzing.');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const res = await aiService.analyzeComplaint({
        title: formData.title,
        description: formData.description,
      });

      if (res.success && res.data) {
        setAiResult(res.data);
      } else {
        setAiError(res.error || 'AI analysis failed. Please select manually.');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        const e = err.response.data.error;
        setAiError(typeof e === 'string' ? e : 'AI analysis failed.');
      } else if (!err.response) {
        setAiError('Network error. Please check your connection.');
      } else {
        setAiError('AI assistance is currently unavailable. You can continue using the system normally.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  // ── Accept AI Suggestion ──
  const handleAcceptSuggestion = () => {
    if (aiResult) {
      setFormData(prev => ({
        ...prev,
        category: aiResult.suggested_category_id || '',
        priority: aiResult.suggested_priority || 'medium',
      }));
      setAiResult(null);
      setAiError('');
    }
  };

  // ── Dismiss AI Suggestion ──
  const handleDismissAi = () => {
    setAiResult(null);
    setAiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('category', formData.category);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('priority', formData.priority);
    if (formData.screenshot) data.append('screenshot', formData.screenshot);

    try {
      await createTicket(data);
      navigate('/employee/tickets');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to raise complaint.";
      setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#22c55e', desc: 'Minor issue, no urgency' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', desc: 'Normal priority' },
    { value: 'high', label: 'High', color: '#f59e0b', desc: 'Urgent, affects work' },
    { value: 'critical', label: 'Critical', color: '#dc2626', desc: 'System down, immediate action' },
  ];

  const getPriorityColor = (p) => {
    const found = priorityOptions.find(o => o.value === p);
    return found ? found.color : '#6b7280';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">
          <FaTicketAlt className="me-2 text-primary" />Raise Complaint
        </h4>
        <p className="text-muted mb-0">Submit a new IT support request.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="d-flex align-items-center mb-4" dismissible onClose={() => setError('')}>
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      <Row className="g-4">
        {/* Main Form */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit} noValidate>

                {/* Title */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold mb-1">
                    <FaHeading className="me-1 text-primary" />Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of the issue"
                    required
                    className="py-2"
                  />
                </Form.Group>

                {/* Description */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold mb-1">
                    <FaAlignLeft className="me-1 text-primary" />Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Explain the issue in detail — what happened, when it started, any error messages, steps you've already tried..."
                    required
                    className="py-2"
                    style={{ resize: 'vertical' }}
                  />
                </Form.Group>

                                {/* ── AI Analyze Button ── */}
                <div className="mb-3">
                  <Button
                    variant="outline-primary"
                    onClick={handleAnalyze}
                    disabled={aiLoading || loading}
                    className="rounded-3 px-3 py-2"
                  >
                    {aiLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FaMagic className="me-2" />
                        Analyze Complaint
                      </>
                    )}
                  </Button>
                  <small className="text-muted ms-2">AI suggests category & priority</small>
                </div>

                {/* ── AI Error ── */}
                {aiError && (
                  <Alert variant="warning" className="d-flex align-items-start py-2 mb-3" dismissible onClose={() => setAiError('')}>
                    <FaRobot className="me-2 mt-1 flex-shrink-0" />
                    <div>
                      <div className="fw-semibold small">AI Analysis Unavailable</div>
                      <div className="small mb-0">{aiError}</div>
                    </div>
                  </Alert>
                )}

                {/* ── AI Result Card ── */}
                {aiResult && (
                  <div
                    className="border rounded-3 p-3 mb-3"
                    style={{
                      backgroundColor: '#f0f9ff',
                      borderColor: '#bae6fd',
                      borderLeft: '4px solid #0ea5e9'
                    }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <FaMagic className="me-2 text-primary" />
                      <span className="fw-bold" style={{ fontSize: '0.9rem' }}>AI Suggestion</span>
                    </div>

                    {/* Category + Priority */}
                    <Row className="g-2 mb-2">
                      <Col xs="auto">
                        <div className="text-muted small">Suggested Category</div>
                        {aiResult.suggested_category ? (
                          <Badge bg="primary" className="px-3 py-1 mt-1" style={{ fontSize: '0.85rem' }}>
                            {aiResult.suggested_category}
                          </Badge>
                        ) : (
                          <div className="text-muted small mt-1">—</div>
                        )}
                      </Col>
                      <Col xs="auto">
                        <div className="text-muted small">Suggested Priority</div>
                        {aiResult.suggested_priority && (
                          <Badge
                            className="px-3 py-1 mt-1"
                            style={{
                              fontSize: '0.85rem',
                              backgroundColor: getPriorityColor(aiResult.suggested_priority),
                              color: '#fff'
                            }}
                          >
                            {aiResult.suggested_priority.charAt(0).toUpperCase() + aiResult.suggested_priority.slice(1)}
                          </Badge>
                        )}
                      </Col>
                    </Row>

                    {/* Reason */}
                    {aiResult.reason && (
                      <div className="text-muted small mb-2" style={{ fontStyle: 'italic' }}>
                        "{aiResult.reason}"
                      </div>
                    )}

                    {/* Related FAQs */}
                    {aiResult.related_faqs && aiResult.related_faqs.length > 0 && (
                      <div className="mb-2">
                        <div className="small fw-semibold mb-1">
                          <FaBook className="me-1" /> Related Knowledge Base Articles
                        </div>
                        {aiResult.related_faqs.map((faq, idx) => (
                          <div
                            key={faq.id || idx}
                            className="small text-primary mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/employee/faqs')}
                          >
                            • {faq.question}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="d-flex gap-2 align-items-center pt-2 border-top" style={{ borderColor: '#bae6fd' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleAcceptSuggestion}
                        className="rounded-pill px-3"
                      >
                        <FaCheck className="me-1" /> Accept Suggestion
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={handleDismissAi}
                        className="rounded-pill px-3"
                      >
                        <FaTimes className="me-1" /> Dismiss
                      </Button>
                      <small className="text-muted ms-auto" style={{ fontSize: '0.72rem' }}>
                        AI-generated — verify before submitting
                      </small>
                    </div>
                  </div>
                )}

                 {/* Category & Priority */}
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-1">
                        <FaTag className="me-1 text-primary" />Category <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="py-2"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-1">
                        <FaFlag className="me-1 text-primary" />Priority
                      </Form.Label>
                      <Form.Select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="py-2"
                      >
                        {priorityOptions.map(p => (
                          <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* File Upload */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-1">
                    <FaImage className="me-1 text-primary" />Screenshot / Attachment
                  </Form.Label>
                  <div
                    className="border border-dashed rounded-3 p-4 text-center"
                    style={{
                      borderColor: fileName ? '#22c55e' : '#cbd5e1',
                      backgroundColor: fileName ? '#f0fdf4' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('screenshot-input').click()}
                  >
                    <input
                      id="screenshot-input"
                      type="file"
                      name="screenshot"
                      onChange={handleChange}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                    {fileName ? (
                      <div>
                        <FaImage className="text-success mb-2" style={{ fontSize: '1.5rem' }} />
                        <div className="fw-medium text-success">{fileName}</div>
                        <small className="text-muted">Click to change</small>
                      </div>
                    ) : (
                      <div>
                        <FaImage className="text-muted mb-2" style={{ fontSize: '1.5rem' }} />
                        <div className="text-muted">Click to upload screenshot or PDF</div>
                        <small className="text-muted">Accepted: Images, PDF</small>
                      </div>
                    )}
                  </div>
                </Form.Group>

                {/* Submit Button */}
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => navigate('/employee/tickets')}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-3 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" />Submit Complaint
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Side Panel — Tips */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">💡 Tips for a Good Ticket</h6>
              <ul className="list-unstyled mb-0 small">
                {[
                  'Be specific in the title — avoid "Help needed"',
                  'Include error messages or codes if any',
                  'Mention when the issue started',
                  'List steps you\'ve already tried',
                  'Attach screenshots if possible',
                ].map((tip, i) => (
                  <li key={i} className="d-flex mb-2">
                    <span className="text-primary me-2 fw-bold">✓</span>
                    <span className="text-muted">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">🚨 Priority Guide</h6>
              {priorityOptions.map(p => (
                <div key={p.value} className="d-flex align-items-start mb-3">
                  <span
                    className="rounded-circle me-2 mt-1 flex-shrink-0"
                    style={{ width: 10, height: 10, backgroundColor: p.color }}
                  />
                  <div>
                    <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{p.label}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm bg-primary bg-opacity-10 border-0">
            <Card.Body className="p-4 text-center">
              <h6 className="fw-bold mb-2">Check FAQs First</h6>
              <p className="text-muted small mb-3">
                Many common issues have solutions in our Knowledge Base.
              </p>
              <Button
                variant="outline-primary"
                size="sm"
                className="w-100 rounded-pill"
                onClick={() => navigate('/employee/faqs')}
              >
                View FAQs
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RaiseComplaint;