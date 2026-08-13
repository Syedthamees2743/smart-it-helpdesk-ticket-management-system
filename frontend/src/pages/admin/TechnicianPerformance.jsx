import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Badge, Spinner, Alert, Container,
} from 'react-bootstrap';
import {
  FaUsers, FaListAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaTachometerAlt, FaClock, FaStar, FaUserTie,
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { FiAlertCircle } from 'react-icons/fi';
import dashboardService from '../../services/dashboardService';

const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#6b7280', '#ef4444'];
const SLA_COLORS = ['#22c55e', '#ef4444'];
const WORKLOAD_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };

const TechnicianPerformance = () => {
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
      const res = await dashboardService.getTechnicianPerformance();
      setData(res);
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else {
        setError('Failed to load technician performance data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadBadge = (workload) => {
    const color = WORKLOAD_COLORS[workload] || '#6b7280';
    return (
      <Badge pill style={{ backgroundColor: color, fontSize: '0.75rem' }}>
        {workload}
      </Badge>
    );
  };

  const getSlaBadge = (pct) => {
    if (pct === null || pct === undefined) return <Badge bg="secondary">N/A</Badge>;
    if (pct >= 90) return <Badge bg="success">{pct}%</Badge>;
    if (pct >= 70) return <Badge bg="warning" text="dark">{pct}%</Badge>;
    return <Badge bg="danger">{pct}%</Badge>;
  };

  // Chart data prep
  const workloadChartData = (data?.technicians || []).map((t) => ({
    name: t.name.split(' ')[0],
    fullName: t.name,
    assigned: t.total_assigned,
    active: t.active_tickets,
  }));

  const statusChartData = (data?.technicians || []).reduce(
    (acc, t) => {
      acc[0].value += t.open;
      acc[1].value += t.in_progress;
      acc[2].value += t.resolved;
      acc[3].value += t.closed;
      acc[4].value += t.reopened;
      return acc;
    },
    [
      { name: 'Open', value: 0 },
      { name: 'In Progress', value: 0 },
      { name: 'Resolved', value: 0 },
      { name: 'Closed', value: 0 },
      { name: 'Reopened', value: 0 },
    ]
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading technician performance...</p>
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

  if (!data) return null;

  const { kpis, technicians } = data;

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Technician Performance</h3>
        <p className="text-muted mb-0">Monitor technician workload and SLA performance</p>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaUsers className="text-primary mb-2" style={{ fontSize: '1.3rem' }} />
              <div className="text-muted small">Technicians</div>
              <div className="fw-bold fs-4">{kpis.total_technicians}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaListAlt className="text-info mb-2" style={{ fontSize: '1.3rem' }} />
              <div className="text-muted small">Total Assigned</div>
              <div className="fw-bold fs-4">{kpis.total_assigned}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaSpinner className="text-warning mb-2" style={{ fontSize: '1.3rem' }} />
              <div className="text-muted small">In Progress</div>
              <div className="fw-bold fs-4">{kpis.in_progress}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaCheckCircle className="text-success mb-2" style={{ fontSize: '1.3rem' }} />
              <div className="text-muted small">Resolved</div>
              <div className="fw-bold fs-4">{kpis.resolved}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaTachometerAlt className="text-success mb-2" style={{ fontSize: '1.3rem' }} />
              <div className="text-muted small">SLA Met</div>
              <div className="fw-bold fs-4 text-success">{kpis.sla_met}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg={2}>
          <Card className="border-0 shadow-sm h-100 border-start border-4 border-danger">
            <Card.Body className="text-center">
              <FaExclamationTriangle className="text-danger mb-2" style={{ fontSize: '1.3rem' }} />
              <div className="text-muted small">SLA Breached</div>
              <div className="fw-bold fs-4 text-danger">{kpis.sla_breached}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold mb-3">Technician Workload</h6>
              {technicians.length === 0 ? (
                <div className="text-center py-4 text-muted">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workloadChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white border rounded p-2 shadow-sm" style={{ fontSize: '0.8rem' }}>
                              <strong>{d.fullName}</strong><br />
                              Assigned: {d.assigned} | Active: {d.active}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="assigned" fill="#4f46e5" name="Total Assigned" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" fill="#f59e0b" name="Currently Active" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold mb-3">Status Distribution (All Technicians)</h6>
              {statusChartData.every((s) => s.value === 0) ? (
                <div className="text-center py-4 text-muted">No data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-2" style={{ fontSize: '0.8rem' }}>
                    {statusChartData.map((item, i) => (
                      <div key={i} className="d-flex align-items-center">
                        <span className="me-1 rounded-circle" style={{ width: 10, height: 10, backgroundColor: STATUS_COLORS[i] }}></span>
                        {item.name} ({item.value})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h6 className="fw-bold mb-3">Technician Details</h6>
          {technicians.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FaUserTie style={{ fontSize: '2.5rem', color: '#d1d5db' }} />
              <h5 className="mt-3">No technicians found</h5>
              <p>Add technicians and assign tickets to see performance data.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th>Technician</th>
                    <th className="text-center">Assigned</th>
                    <th className="text-center">Active</th>
                    <th className="text-center">Resolved</th>
                    <th className="text-center">Closed</th>
                    <th className="text-center">High/Crit</th>
                    <th className="text-center">Avg Rating</th>
                    <th className="text-center">SLA %</th>
                    <th className="text-center">Avg Time</th>
                    <th className="text-center">Workload</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-medium">{t.name}</td>
                      <td className="text-center">{t.total_assigned}</td>
                      <td className="text-center">{t.active_tickets}</td>
                      <td className="text-center">{t.resolved}</td>
                      <td className="text-center">{t.closed}</td>
                      <td className="text-center">
                        {t.high_critical > 0 ? (
                          <Badge bg="danger">{t.high_critical}</Badge>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={t.avg_rating >= 4 ? 'text-success' : t.avg_rating >= 3 ? 'text-warning' : 'text-danger'}>
                          {t.avg_rating}
                        </span>
                        <FaStar className="ms-1" style={{ fontSize: '0.7rem', color: '#f59e0b' }} />
                      </td>
                      <td className="text-center">{getSlaBadge(t.sla_success_pct)}</td>
                      <td className="text-center text-muted">
                        {t.avg_resolution_time !== null ? `${t.avg_resolution_time}h` : '—'}
                      </td>
                      <td className="text-center">{getWorkloadBadge(t.workload)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TechnicianPerformance;