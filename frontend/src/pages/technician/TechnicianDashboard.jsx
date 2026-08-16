import { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Badge, Button, Table } from 'react-bootstrap';
import {
  FaTicketAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaStar, FaClock, FaListAlt, FaRedo, FaTimesCircle, FaShieldAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer
} from 'recharts';
import dashboardService from '../../services/dashboardService';


/* ── Loading Skeleton ── */
const SkeletonCard = () => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Body className="d-flex align-items-center">
      <div className="me-3 rounded-circle" style={{ width: 48, height: 48, minWidth: 48, backgroundColor: '#e2e8f0' }} />
      <div>
        <div className="rounded mb-1" style={{ width: 80, height: 12, backgroundColor: '#e2e8f0' }} />
        <div className="rounded" style={{ width: 40, height: 22, backgroundColor: '#e2e8f0' }} />
      </div>
    </Card.Body>
  </Card>
);

const SkeletonChart = () => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Body>
      <div className="rounded mb-3" style={{ width: '45%', height: 16, backgroundColor: '#e2e8f0' }} />
      <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
        <Spinner animation="border" variant="secondary" size="sm" />
      </div>
    </Card.Body>
  </Card>
);


/* ── Helpers ── */
const formatResolutionTime = (hours) => {
  if (hours === null || hours === undefined) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
};

const getSlaColor = (pct) => {
  if (pct === null || pct === undefined) return 'text-muted';
  if (pct >= 90) return 'text-success';
  if (pct >= 70) return 'text-warning';
  return 'text-danger';
};

const getWorkloadVariant = (w) => {
  if (w === 'High') return 'danger';
  if (w === 'Medium') return 'warning';
  return 'success';
};


/* ── Main Component ── */
const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getMyPerformance();
      if (res.success) {
        setData(res.technician);
      } else {
        setError(res.error || 'Failed to load dashboard data.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied.');
      } else if (err.response?.data?.error) {
        setError(typeof err.response.data.error === 'string' ? err.response.data.error : 'Failed to load dashboard.');
      } else if (!err.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <div className="rounded mb-2" style={{ width: '40%', height: 28, backgroundColor: '#e2e8f0' }} />
          <div className="rounded" style={{ width: '55%', height: 14, backgroundColor: '#e2e8f0' }} />
        </div>
        <Row className="g-3 mb-4">
          {[...Array(4)].map((_, i) => <Col xs={6} md={3} key={i}><SkeletonCard /></Col>)}
        </Row>
        <Row className="g-3 mb-4">
          {[...Array(3)].map((_, i) => <Col md={4} key={i}><SkeletonChart /></Col>)}
        </Row>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div>
        <div className="mb-4">
          <h4 className="fw-bold mb-1">Technician Dashboard</h4>
        </div>
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
        <Button variant="primary" onClick={fetchDashboard}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Technician Dashboard</h4>
        <p className="text-muted mb-0">Manage your assigned IT support requests.</p>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3 p-2 bg-primary bg-opacity-10 rounded-circle">
                <FaListAlt size={20} className="text-primary" />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Assigned</div>
                <div className="fw-bold fs-5">{data.total_assigned || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3 p-2 bg-info bg-opacity-10 rounded-circle">
                <FaTicketAlt size={20} className="text-info" />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Open/Assigned</div>
                <div className="fw-bold fs-5">{data.open || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3 p-2 bg-warning bg-opacity-10 rounded-circle">
                <FaClock size={20} className="text-warning" />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>In Progress</div>
                <div className="fw-bold fs-5">{data.in_progress || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3 p-2 bg-success bg-opacity-10 rounded-circle">
                <FaCheckCircle size={20} className="text-success" />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Resolved</div>
                <div className="fw-bold fs-5">{data.resolved || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3 p-2 bg-secondary bg-opacity-10 rounded-circle">
                <FaTimesCircle size={20} className="text-secondary" />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Closed</div>
                <div className="fw-bold fs-5">{data.closed || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3 p-2 bg-danger bg-opacity-10 rounded-circle">
                <FaRedo size={20} className="text-danger" />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Reopened</div>
                <div className="fw-bold fs-5">{data.reopened || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ═══ Status Chart | Priority Chart | SLA Performance ═══ */}
      <Row className="g-3 mb-4">
        {/* Ticket Status */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Ticket Status</Card.Title>
              {data.status_distribution && data.status_distribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.status_distribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                        {data.status_distribution.map((entry, i) => (
                          <Cell key={`s-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-1" style={{ fontSize: '0.75rem' }}>
                    {data.status_distribution.map((item, i) => (
                      <span key={i} className="d-flex align-items-center">
                        <span className="me-1 rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: item.fill }} />
                        {item.name} ({item.value})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">No data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Priority Overview */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Priority Overview</Card.Title>
              {data.priority_distribution && data.priority_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.priority_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tickets">
                      {data.priority_distribution.map((entry, i) => (
                        <Cell key={`p-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-4">No data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* SLA Performance */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                <FaShieldAlt className="me-2 text-primary" />SLA Performance
              </Card.Title>
              <div className="text-center py-2">
                <div className={`display-5 fw-bold ${getSlaColor(data.sla_success_pct)}`}>
                  {data.sla_success_pct !== null ? `${data.sla_success_pct}%` : 'N/A'}
                </div>
                <div className="text-muted small mb-3">SLA Success Rate</div>

                <Row className="g-2 text-center mb-3">
                  <Col xs={6}>
                    <div className="p-2 rounded" style={{ backgroundColor: '#f0fdf4' }}>
                      <div className="fw-bold text-success fs-5">{data.sla_met || 0}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>SLA Met</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-2 rounded" style={{ backgroundColor: '#fef2f2' }}>
                      <div className="fw-bold text-danger fs-5">{data.sla_breached || 0}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>SLA Breached</div>
                    </div>
                  </Col>
                </Row>

                <div className="pt-3 border-top">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Avg. Resolution Time</div>
                  <div className="fw-bold fs-5 mt-1">{formatResolutionTime(data.avg_resolution_time)}</div>
                </div>

                <div className="pt-3 border-top">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Active Workload</div>
                  <div className="mt-1">
                    <Badge bg={getWorkloadVariant(data.workload)} className="px-3 py-2" style={{ fontSize: '0.9rem' }}>
                      {data.workload} — {data.active_tickets || 0} active
                    </Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ═══ Performance | Quick Actions | Recent Tickets ═══ */}
      <Row className="g-3 mb-4">
        {/* My Performance */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold border-bottom pb-2 mb-3">
                <FaStar className="me-2 text-warning" />My Performance
              </h6>
              <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                <span className="text-muted">Tickets Resolved:</span>
                <span className="fw-bold">{data.resolved || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                <span className="text-muted">Tickets Closed:</span>
                <span className="fw-bold">{data.closed || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                <span className="text-muted">Average Rating:</span>
                <span className="fw-bold text-warning">{data.avg_rating || 0.0} / 5.0 ⭐</span>
              </div>
              <div className="d-flex justify-content-between p-2 bg-light rounded">
                <span className="text-muted">High/Critical Active:</span>
                <span className={`fw-bold ${data.high_critical > 0 ? 'text-danger' : 'text-success'}`}>
                  {data.high_critical || 0}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold border-bottom pb-2 mb-3">Quick Actions</h6>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" className="text-start rounded-3" onClick={() => navigate('/technician/tickets?status=assigned,reopened')}>
                  <FaListAlt className="me-2" /> View Pending Tickets
                </Button>
                <Button variant="outline-warning" className="text-start rounded-3" onClick={() => navigate('/technician/tickets?status=in_progress')}>
                  <FaClock className="me-2" /> View In-Progress
                </Button>
                <Button variant="outline-success" className="text-start rounded-3" onClick={() => navigate('/technician/tickets?status=resolved')}>
                  <FaCheckCircle className="me-2" /> View Resolved
                </Button>
                <Button variant="outline-secondary" className="text-start rounded-3" onClick={() => navigate('/technician/performance')}>
                  <FaStar className="me-2" /> View Full Performance
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Assigned Tickets */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Recent Tickets</h6>
              <Button variant="link" size="sm" className="text-primary p-0 text-decoration-none" onClick={() => navigate('/technician/tickets')}>
                View All
              </Button>
            </Card.Header>
            <Card.Body className="pt-2">
              {data.recent_tickets && data.recent_tickets.length > 0 ? (
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ fontSize: '0.78rem' }}>Ticket #</th>
                        <th style={{ fontSize: '0.78rem' }}>Employee</th>
                        <th style={{ fontSize: '0.78rem' }}>Priority</th>
                        <th style={{ fontSize: '0.78rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_tickets.map((t) => (
                        <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/technician/tickets/${t.id}`)}>
                          <td className="fw-medium" style={{ fontSize: '0.78rem' }}>{t.ticket_number}</td>
                          <td className="text-muted" style={{ fontSize: '0.78rem' }}>{t.employee_name}</td>
                          <td><Badge className={`badge-priority-${t.priority}`} style={{ fontSize: '0.7rem' }}>{t.priority}</Badge></td>
                          <td><Badge className={`badge-status-${t.status}`} style={{ fontSize: '0.7rem' }}>{t.status.replace('_', ' ')}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>
                  No recent tickets found.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TechnicianDashboard;