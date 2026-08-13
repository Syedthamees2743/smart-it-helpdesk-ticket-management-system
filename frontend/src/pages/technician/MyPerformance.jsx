import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Badge, Spinner, Alert, Container,
} from 'react-bootstrap';
import {
  FaListAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaTachometerAlt, FaClock, FaStar, FaUserTie,
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';

const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#6b7280', '#ef4444'];
const SLA_COLORS = ['#22c55e', '#ef4444'];
const WORKLOAD_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };

const MyPerformance = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getMyPerformance();
      setData(res);
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else {
        setError('Failed to load performance data.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading your performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!data || !data.technician) return null;

  const t = data.technician;
  const hasData = t.total_assigned > 0;

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">My Performance</h3>
        <p className="text-muted mb-0">{t.name} — Performance overview</p>
      </div>

      {!hasData ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FaUserTie style={{ fontSize: '3rem', color: '#d1d5db' }} />
            <h5 className="mt-3">No performance data yet</h5>
            <p className="text-muted">Performance statistics will appear once tickets are assigned to you.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={4} lg={2}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <FaListAlt className="text-primary mb-2" style={{ fontSize: '1.2rem' }} />
                  <div className="text-muted small">Total</div>
                  <div className="fw-bold fs-4">{t.total_assigned}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <FaSpinner className="text-info mb-2" style={{ fontSize: '1.2rem' }} />
                  <div className="text-muted small">Open</div>
                  <div className="fw-bold fs-4">{t.open}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <FaClock className="text-warning mb-2" style={{ fontSize: '1.2rem' }} />
                  <div className="text-muted small">In Progress</div>
                  <div className="fw-bold fs-4">{t.in_progress}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <FaCheckCircle className="text-success mb-2" style={{ fontSize: '1.2rem' }} />
                  <div className="text-muted small">Resolved</div>
                  <div className="fw-bold fs-4">{t.resolved}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <FaTachometerAlt className="text-success mb-2" style={{ fontSize: '1.2rem' }} />
                  <div className="text-muted small">SLA Met</div>
                  <div className="fw-bold fs-4 text-success">{t.sla_met}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Card className="border-0 shadow-sm h-100 border-start border-4 border-danger">
                <Card.Body className="text-center">
                  <FaExclamationTriangle className="text-danger mb-2" style={{ fontSize: '1.2rem' }} />
                  <div className="text-muted small">SLA Breached</div>
                  <div className="fw-bold fs-4 text-danger">{t.sla_breached}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Ticket Status Distribution</h6>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={t.status_distribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {t.status_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-2" style={{ fontSize: '0.8rem' }}>
                    {t.status_distribution.map((item, i) => (
                      <div key={i} className="d-flex align-items-center">
                        <span className="me-1 rounded-circle" style={{ width: 10, height: 10, backgroundColor: STATUS_COLORS[i] }}></span>
                        {item.name} ({item.value})
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">SLA Performance</h6>
                  {t.sla_distribution.every((s) => s.value === 0) ? (
                    <div className="text-center py-4 text-muted">No SLA data yet</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={t.sla_distribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {t.sla_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={SLA_COLORS[index]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="text-center mt-3">
                        <span className="text-muted">Success Rate: </span>
                        <strong className={t.sla_success_pct !== null && t.sla_success_pct >= 90 ? 'text-success' : 'text-danger'}>
                          {t.sla_success_pct !== null ? `${t.sla_success_pct}%` : 'N/A'}
                        </strong>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Details */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="fw-bold border-bottom pb-2 mb-3">
                    <FaStar className="me-2 text-warning" />My Stats
                  </h6>
                  <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                    <span className="text-muted">Closed Tickets:</span>
                    <span className="fw-bold">{t.closed}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                    <span className="text-muted">Reopened Tickets:</span>
                    <span className="fw-bold">{t.reopened}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                    <span className="text-muted">High/Critical Active:</span>
                    <span className="fw-bold">{t.high_critical}</span>
                  </div>
                  <div className="d-flex justify-content-between p-2 bg-light rounded">
                    <span className="text-muted">Average Rating:</span>
                    <span className="fw-bold text-warning">
                      {t.avg_rating} <FaStar style={{ fontSize: '0.8rem', color: '#f59e0b' }} />
                    </span>
                  </div>
                  <div className="d-flex justify-content-between p-2 bg-light rounded">
                    <span className="text-muted">Avg Resolution Time:</span>
                    <span className="fw-bold">
                      {t.avg_resolution_time !== null ? `${t.avg_resolution_time} hours` : 'N/A'}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Current Workload</h6>
                  <div className="text-center py-3">
                    <div className="fw-bold mb-2" style={{ fontSize: '2.5rem' }}>
                      {t.active_tickets}
                    </div>
                    <div className="text-muted mb-3">Active Tickets</div>
                    <span
                      className="px-4 py-2 rounded-pill"
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        backgroundColor: WORKLOAD_COLORS[t.workload],
                        color: '#fff',
                      }}
                    >
                      {t.workload} Workload
                    </span>
                    <div className="text-muted small mt-3">
                      (Open + In Progress + Reopened)
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default MyPerformance;