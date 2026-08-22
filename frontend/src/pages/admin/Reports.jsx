import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Container,
  Form,
  Collapse,
} from 'react-bootstrap';
import {
  FaTicketAlt,
  FaUserTie,
  FaLaptop,
  FaStar,
  FaClock,
  FaFilePdf,
  FaDownload,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaUsers,
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import reportService from '../../services/reportService';
import api from '../../services/api';

/* ── Static choices ─────────────────────────────────────────── */

const STATUS_CHOICES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_CHOICES = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

/* ── Report definitions ─────────────────────────────────────── */

const reports = [
  {
    id: 'tickets',
    title: 'Complete Ticket Report',
    description:
      'All tickets with department, category, priority, status, SLA status, and resolution time.',
    icon: <FaTicketAlt />,
    endpoint: '/reports/tickets-pdf/',
    filename: 'all_tickets_report.pdf',
    color: '#4f46e5',
    bgColor: '#e0e7ff',
  },
  {
    id: 'technician',
    title: 'Technician Performance',
    description:
      'Workload, resolution counts, average resolution time, SLA compliance, and performance percentage.',
    icon: <FaUserTie />,
    endpoint: '/reports/technician-performance-pdf/',
    filename: 'technician_performance_report.pdf',
    color: '#059669',
    bgColor: '#d1fae5',
  },
  {
    id: 'asset',
    title: 'Asset Report',
    description:
      'Full inventory with asset code, brand, model, assignment status, purchase and warranty dates.',
    icon: <FaLaptop />,
    endpoint: '/reports/asset-pdf/',
    filename: 'asset_report.pdf',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  {
    id: 'feedback',
    title: 'Feedback & Rating Report',
    description:
      'All employee feedback with ratings, reviews, associated tickets, and average rating summary.',
    icon: <FaStar />,
    endpoint: '/reports/feedback-pdf/',
    filename: 'feedback_report.pdf',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  {
    id: 'sla',
    title: 'SLA Report',
    description:
      'SLA deadline tracking with met, breached, and pending counts plus compliance rate.',
    icon: <FaClock />,
    endpoint: '/reports/sla-pdf/',
    filename: 'sla_report.pdf',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  {
    id: 'employee',
    title: 'Employee / Ticket Summary',
    description:
      'Per-employee ticket counts, status breakdown, average resolution time, and SLA met percentage.',
    icon: <FaUsers />,
    endpoint: '/reports/employee-summary-pdf/',
    filename: 'employee_ticket_summary_report.pdf',
    color: '#0891b2',
    bgColor: '#cffafe',
  },
];

/* ── Component ──────────────────────────────────────────────── */

const Reports = () => {
  const [downloading, setDownloading] = useState({});
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /* Filter state */
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    priority: '',
    department: '',
    category: '',
    technician: '',
  });

  /* Dropdown data */
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  /* ── Fetch dropdown options on mount ── */
    useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const endpoints = [
          { key: 'departments', url: '/departments/' },
          { key: 'categories', url: '/tickets/categories/' },
          { key: 'technicians', url: '/users/' },
        ];

        const results = await Promise.allSettled(
          endpoints.map((ep) => api.get(ep.url))
        );

        const resp = (idx) => {
          const r = results[idx];
          if (r.status !== 'fulfilled') return [];
          const d = r.value.data;
          const list = Array.isArray(d) ? d : d.results || [];
          // Filter technicians client-side in case API doesn't support ?role= filter
          if (idx === 2) {
            return list.filter(
              (u) =>
                u.role === 'technician' ||
                u.role_key === 'technician' ||
                (u.is_technician === true)
            );
          }
          return list;
        };

        setDepartments(resp(0));
        setCategories(resp(1));
        setTechnicians(resp(2));
      } catch {
        /* Filters will simply show "All" options */
      }
    };
    fetchDropdowns();
  }, []);

  /* ── Helpers ── */
  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      status: '',
      priority: '',
      department: '',
      category: '',
      technician: '',
    });
  };

  const buildParams = () => {
    const p = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val) p[key] = val;
    });
    return p;
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Download handler ── */
  const handleDownload = async (report) => {
    setError('');
    setDownloading((prev) => ({ ...prev, [report.id]: true }));
    try {
      const params = buildParams();
      await reportService.downloadReport(
        report.endpoint,
        report.filename,
        params
      );
    } catch (err) {
      const errorData = err.parsedError || err.response?.data;
      let msg = 'Unable to generate report. Please try again.';

      if (errorData) {
        if (typeof errorData.error === 'string') {
          msg = errorData.error;
        } else if (
          typeof errorData.error === 'object' &&
          errorData.error !== null
        ) {
          const firstKey = Object.keys(errorData.error)[0];
          msg = Array.isArray(errorData.error[firstKey])
            ? errorData.error[firstKey][0]
            : String(errorData.error[firstKey]);
        }
      } else if (!err.response) {
        msg = 'Network error. Please check your connection and try again.';
      }

      setError(msg);
    } finally {
      setDownloading((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  /* ── Active filter badge count ── */
  const activeCount = Object.values(filters).filter((v) => v !== '').length;

  /* ── Render ── */
  return (
    <Container fluid className="py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold">Reports &amp; Analytics</h3>
          <p className="text-muted mb-0">
            Generate and download PDF reports. Apply filters to narrow results.
          </p>
        </div>

        <Button
          variant={showFilters ? 'outline-secondary' : 'primary'}
          onClick={() => setShowFilters((v) => !v)}
          className="d-flex align-items-center gap-2"
        >
          <FaFilter />
          Filters
          {activeCount > 0 && (
            <span
              className="badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem' }}
            >
              {activeCount}
            </span>
          )}
          <FaChevronDown
            size={12}
            style={{
              transition: 'transform 0.2s',
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FiAlertCircle className="me-2" />
          {error}
          <span
            className="float-end"
            style={{ cursor: 'pointer', fontSize: '1.2rem' }}
            onClick={() => setError('')}
          >
            &times;
          </span>
        </Alert>
      )}

      {/* Filter Panel */}
      <Collapse in={showFilters}>
        <div className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Report Filters</h6>
                {hasActiveFilters && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={clearFilters}
                    className="d-flex align-items-center gap-1"
                  >
                    <FaTimes size={11} />
                    Clear All
                  </Button>
                )}
              </div>

              <Row className="g-3">
                {/* Date Range */}
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">
                    Start Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.start_date}
                    onChange={(e) =>
                      handleFilterChange('start_date', e.target.value)
                    }
                  />
                </Col>
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">
                    End Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.end_date}
                    onChange={(e) =>
                      handleFilterChange('end_date', e.target.value)
                    }
                  />
                </Col>

                {/* Status */}
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">Status</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange('status', e.target.value)
                    }
                  >
                    {STATUS_CHOICES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Priority */}
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">
                    Priority
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange('priority', e.target.value)
                    }
                  >
                    {PRIORITY_CHOICES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Department */}
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">
                    Department
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.department}
                    onChange={(e) =>
                      handleFilterChange('department', e.target.value)
                    }
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Category */}
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">
                    Category
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange('category', e.target.value)
                    }
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Technician */}
                <Col md={6} lg={3}>
                  <Form.Label className="small fw-semibold">
                    Technician
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.technician}
                    onChange={(e) =>
                      handleFilterChange('technician', e.target.value)
                    }
                  >
                    <option value="">All Technicians</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Info */}
                <Col
                  md={6}
                  lg={3}
                  className="d-flex align-items-end"
                >
                  <small className="text-muted">
                    {hasActiveFilters
                      ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active — applies to all reports below`
                      : 'No filters active — reports include all data'}
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </Collapse>

      {/* Report Cards */}
      <Row className="g-4">
        {reports.map((report) => (
          <Col md={6} lg={4} key={report.id}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '52px',
                      height: '52px',
                      backgroundColor: report.bgColor,
                    }}
                  >
                    <span
                      style={{ fontSize: '1.4rem', color: report.color }}
                    >
                      {report.icon}
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{report.title}</h6>
                    <FaFilePdf style={{ color: '#ef4444', fontSize: '0.85rem' }} />
                    <span className="text-muted small ms-1">PDF</span>
                  </div>
                </div>

                <p
                  className="text-muted small flex-grow-1"
                  style={{ lineHeight: '1.6' }}
                >
                  {report.description}
                </p>

                <Button
                  variant="primary"
                  className="w-100 mt-2"
                  disabled={downloading[report.id]}
                  onClick={() => handleDownload(report)}
                >
                  {downloading[report.id] ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-1" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Reports;