import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Badge, Spinner, Alert, Button,
} from 'react-bootstrap';
import {
  FaListAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaTachometerAlt, FaClock, FaStar, FaUserTie, FaRedo,
  FaTimesCircle, FaEnvelopeOpenText, FaChartPie, FaShieldAlt,
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';

const STATUS_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#6b7280', '#ef4444'];
const SLA_COLORS = ['#22c55e', '#ef4444'];
const WORKLOAD_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };

/* =========================================================
   KPI CARD (Reusable)
========================================================= */

const KPICard = ({ icon, bgColor, label, value, valueColor }) => (
  <Card className="border-0 shadow-sm rounded-4 h-100">
    <Card.Body className="d-flex align-items-center p-4">
      <div
        className="rounded-4 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
        style={{ width: "52px", height: "52px", backgroundColor: bgColor }}
      >
        {icon}
      </div>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fw-bold fs-4" style={{ color: valueColor || '#1e293b' }}>
          {value}
        </div>
      </div>
    </Card.Body>
  </Card>
);

/* =========================================================
   SECTION HEADER
========================================================= */

const SectionHeader = ({ icon, iconBg, title }) => (
  <div className="d-flex align-items-center gap-2 mb-4">
    <div
      className="rounded-4 d-flex align-items-center justify-content-center"
      style={{ width: "36px", height: "36px", backgroundColor: iconBg }}
    >
      {icon}
    </div>
    <h6 className="fw-bold text-dark mb-0">{title}</h6>
  </div>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

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
      <div className="py-4 px-3 px-md-4">
        <div className="mb-4">
          <div className="rounded mb-2" style={{ width: "35%", height: 28, backgroundColor: "#e2e8f0" }} />
          <div className="rounded" style={{ width: "55%", height: 14, backgroundColor: "#e2e8f0" }} />
        </div>
        <Row className="g-3 mb-4">
          {[...Array(6)].map((_, i) => (
            <Col xs={6} md={4} lg={2} key={i}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="d-flex align-items-center p-4">
                  <div className="rounded-4 me-3" style={{ width: 52, height: 52, minWidth: 52, backgroundColor: "#e2e8f0" }} />
                  <div>
                    <div className="rounded mb-2" style={{ width: 70, height: 12, backgroundColor: "#e2e8f0" }} />
                    <div className="rounded" style={{ width: 36, height: 24, backgroundColor: "#e2e8f0" }} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted mb-0">Loading your performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-3 px-md-4">
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">My Performance</h4>
          <p className="text-muted mb-0">Your performance overview</p>
        </div>
        <Alert variant="danger" className="rounded-4 border-0 d-flex align-items-center">
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
        <Button variant="primary" className="rounded-pill px-4 mt-3" onClick={fetchPerformance}>
          <FaRedo className="me-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data || !data.technician) return null;

  const t = data.technician;
  const hasData = t.total_assigned > 0;

  // SLA ring color
  const slaColor =
    t.sla_success_pct === null || t.sla_success_pct === undefined
      ? '#64748b'
      : t.sla_success_pct >= 90
        ? '#10b981'
        : t.sla_success_pct >= 70
          ? '#f59e0b'
          : '#ef4444';

  const formatResolutionTime = (hours) => {
    if (hours === null || hours === undefined) return 'N/A';
    const h = Number(hours);
    if (Number.isNaN(h)) return 'N/A';
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} hrs`;
    return `${(h / 24).toFixed(1)} days`;
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }} className="py-4 px-3 px-md-4">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark">My Performance</h4>
        <p className="text-muted mb-0">
          {t.name} — Performance overview
        </p>
      </div>

      {!hasData ? (
        <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="text-center py-5">
            <FaUserTie style={{ fontSize: '3rem', color: '#dee2e6' }} />
            <h5 className="mt-3 fw-bold text-dark">No Performance Data Yet</h5>
            <p className="text-muted mb-0">
              Performance statistics will appear once tickets are assigned to you.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* =====================================================
              KPI CARDS
          ===================================================== */}

          <Row className="g-3 mb-4">
            <Col xs={6} md={4} lg={2}>
              <KPICard
                icon={<FaListAlt style={{ fontSize: '1.4rem', color: '#4f46e5' }} />}
                bgColor="#e0e7ff"
                label="Total"
                value={t.total_assigned}
              />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <KPICard
                icon={<FaEnvelopeOpenText style={{ fontSize: '1.4rem', color: '#06b6d4' }} />}
                bgColor="#cffafe"
                label="Open"
                value={t.open}
              />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <KPICard
                icon={<FaClock style={{ fontSize: '1.4rem', color: '#f59e0b' }} />}
                bgColor="#fef3c7"
                label="In Progress"
                value={t.in_progress}
              />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <KPICard
                icon={<FaCheckCircle style={{ fontSize: '1.4rem', color: '#10b981' }} />}
                bgColor="#d1fae5"
                label="Resolved"
                value={t.resolved}
              />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <KPICard
                icon={<FaTachometerAlt style={{ fontSize: '1.4rem', color: '#22c55e' }} />}
                bgColor="#dcfce7"
                label="SLA Met"
                value={t.sla_met}
                valueColor="#10b981"
              />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <KPICard
                icon={<FaExclamationTriangle style={{ fontSize: '1.4rem', color: '#ef4444' }} />}
                bgColor="#fee2e2"
                label="SLA Breached"
                value={t.sla_breached}
                valueColor="#ef4444"
              />
            </Col>
          </Row>

          {/* =====================================================
              CHARTS
          ===================================================== */}

          <Row className="g-3 mb-4">
            {/* Status Distribution */}
            <Col md={5}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <SectionHeader
                    icon={<FaChartPie style={{ fontSize: '0.9rem', color: '#4f46e5' }} />}
                    iconBg="#e0e7ff"
                    title="Ticket Status"
                  />

                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={t.status_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {t.status_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const d = payload[0].payload;
                            return (
                              <div
                                className="bg-white border rounded-3 p-2 shadow-sm"
                                style={{ fontSize: '0.8rem', borderColor: '#e2e8f0' }}
                              >
                                <strong className="text-dark">{d.name}:</strong> {d.value}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend pills */}
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                    {t.status_distribution.map((item, i) => (
                      <div
                        key={i}
                        className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                        style={{ backgroundColor: '#f8fafc', fontSize: '0.72rem' }}
                      >
                        <span
                          className="rounded-circle"
                          style={{ width: 8, height: 8, backgroundColor: STATUS_COLORS[i] }}
                        />
                        <span className="text-muted">{item.name}</span>
                        <strong className="text-dark">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* SLA Performance */}
            <Col md={7}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <SectionHeader
                    icon={<FaShieldAlt style={{ fontSize: '0.9rem', color: '#10b981' }} />}
                    iconBg="#d1fae5"
                    title="SLA Performance"
                  />

                  <Row className="align-items-center g-4">
                    {/* SLA Ring */}
                    <Col xs={12} md={5} className="text-center">
                      <div
                        className="d-flex flex-column align-items-center justify-content-center mx-auto rounded-4"
                        style={{
                          width: '120px',
                          height: '120px',
                          backgroundColor: '#f8fafc',
                          border: `3px solid ${slaColor}`,
                        }}
                      >
                        <span className="fw-bold" style={{ fontSize: '2rem', lineHeight: 1, color: slaColor }}>
                          {t.sla_success_pct !== null && t.sla_success_pct !== undefined
                            ? `${t.sla_success_pct}%`
                            : 'N/A'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          Success Rate
                        </span>
                      </div>
                      <div className="text-muted small mt-2">Overall SLA Compliance</div>
                    </Col>

                    {/* SLA Bar Chart */}
                    <Col xs={12} md={7}>
                      {t.sla_distribution.every((s) => s.value === 0) ? (
                        <div className="text-center py-4 text-muted">No SLA data yet</div>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={t.sla_distribution} barCategoryGap="35%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis
                                dataKey="name"
                                fontSize={12}
                                tickLine={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                              />
                              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                              <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                content={({ payload }) => {
                                  if (payload && payload.length > 0) {
                                    const d = payload[0].payload;
                                    return (
                                      <div
                                        className="bg-white border rounded-3 p-2 shadow-sm"
                                        style={{ fontSize: '0.8rem', borderColor: '#e2e8f0' }}
                                      >
                                        <strong className="text-dark">{d.name}:</strong> {d.value}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                                {t.sla_distribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={SLA_COLORS[index]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="d-flex justify-content-center gap-2">
                            {t.sla_distribution.map((item, i) => (
                              <div
                                key={i}
                                className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                                style={{ backgroundColor: '#f8fafc', fontSize: '0.72rem' }}
                              >
                                <span
                                  className="rounded-circle"
                                  style={{ width: 8, height: 8, backgroundColor: SLA_COLORS[i] }}
                                />
                                <span className="text-muted">{item.name}</span>
                                <strong className="text-dark">{item.value}</strong>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* =====================================================
              STATS + WORKLOAD
          ===================================================== */}

          <Row className="g-3">
            {/* My Stats */}
            <Col md={7}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <SectionHeader
                    icon={<FaStar style={{ fontSize: '0.9rem', color: '#f59e0b' }} />}
                    iconBg="#fef3c7"
                    title="My Stats"
                  />

                  <Row className="g-3">
                    <Col sm={6}>
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border h-100">
                        <div>
                          <div className="text-muted small">Closed Tickets</div>
                          <div className="fw-bold fs-5 text-dark">{t.closed}</div>
                        </div>
                        <div
                          className="rounded-4 d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9' }}
                        >
                          <FaTimesCircle style={{ color: '#6b7280', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </Col>

                    <Col sm={6}>
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border h-100">
                        <div>
                          <div className="text-muted small">Reopened Tickets</div>
                          <div className="fw-bold fs-5 text-dark">{t.reopened}</div>
                        </div>
                        <div
                          className="rounded-4 d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px', backgroundColor: '#fee2e2' }}
                        >
                          <FaRedo style={{ color: '#ef4444', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </Col>

                    <Col sm={6}>
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border h-100">
                        <div>
                          <div className="text-muted small">High/Critical Active</div>
                          <Badge
                            bg={t.high_critical > 0 ? 'danger' : 'success'}
                            pill
                            className="fs-6 px-3 py-2"
                          >
                            {t.high_critical}
                          </Badge>
                        </div>
                        <div
                          className="rounded-4 d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7' }}
                        >
                          <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </Col>

                    <Col sm={6}>
                      <div
                        className="d-flex justify-content-between align-items-center p-3 rounded-4 h-100"
                        style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
                      >
                        <div>
                          <div className="text-muted small">Average Rating</div>
                          <div className="fw-bold fs-5 d-flex align-items-center gap-1" style={{ color: '#f59e0b' }}>
                            {t.avg_rating} <FaStar style={{ fontSize: '0.9rem' }} />
                          </div>
                        </div>
                        <div
                          className="rounded-4 d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7' }}
                        >
                          <FaStar style={{ color: '#f59e0b', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </Col>

                    <Col sm={12}>
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border">
                        <div className="d-flex align-items-center gap-2">
                          <FaClock className="text-primary" style={{ fontSize: '0.9rem' }} />
                          <span className="text-muted small">Avg. Resolution Time</span>
                        </div>
                        <span className="fw-bold text-dark fs-6">
                          {formatResolutionTime(t.avg_resolution_time)}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Current Workload */}
            <Col md={5}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex flex-column">
                  <SectionHeader
                    icon={<FaSpinner style={{ fontSize: '0.9rem', color: '#3b82f6' }} />}
                    iconBg="#dbeafe"
                    title="Current Workload"
                  />

                  <div className="text-center flex-grow-1 d-flex flex-column justify-content-center py-3">
                    <div
                      className="d-flex flex-column align-items-center justify-content-center mx-auto rounded-4 mb-3"
                      style={{
                        width: '130px',
                        height: '130px',
                        backgroundColor: `${WORKLOAD_COLORS[t.workload] || '#22c55e'}15`,
                        border: `3px solid ${WORKLOAD_COLORS[t.workload] || '#22c55e'}`,
                      }}
                    >
                      <span className="fw-bold text-dark" style={{ fontSize: '2.8rem', lineHeight: 1 }}>
                        {t.active_tickets}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Active Tickets
                      </span>
                    </div>

                    <Badge
                      pill
                      className="px-4 py-2 mx-auto"
                      style={{
                        fontSize: '0.95rem',
                        backgroundColor: WORKLOAD_COLORS[t.workload] || '#22c55e',
                      }}
                    >
                      {t.workload} Workload
                    </Badge>

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
    </div>
  );
};

export default MyPerformance;