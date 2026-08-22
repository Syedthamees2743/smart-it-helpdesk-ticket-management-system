import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Badge,
  Button,
  Table,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserTie,
  FaTicketAlt,
  FaClock,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaLaptop,
  FaLink,
  FaStar,
  FaChartLine,
  FaShieldAlt,
  FaTools,
  FaEye,
  FaMagic,
  FaRobot,
  FaTimes,
  FaLightbulb,
  FaSyncAlt,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import aiService from '../../services/aiService';
import StatCard from "../../components/dashboard/StatCard";
import dashboardService from "../../services/dashboardService";

/* ──────────────────────────────────────────────
   Loading Skeleton Components
   ────────────────────────────────────────────── */
const SkeletonCard = () => (
  <Card className="border-0 shadow-sm">
    <Card.Body className="d-flex align-items-center py-3">
      <div
        className="rounded-circle me-3"
        style={{
          width: 48,
          height: 48,
          minWidth: 48,
          backgroundColor: "#e2e8f0",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div>
        <div
          className="rounded mb-1"
          style={{ width: 90, height: 12, backgroundColor: "#e2e8f0" }}
        />
        <div
          className="rounded"
          style={{ width: 50, height: 22, backgroundColor: "#e2e8f0" }}
        />
      </div>
    </Card.Body>
  </Card>
);

const SkeletonChart = () => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Body>
      <div
        className="rounded mb-3"
        style={{ width: "45%", height: 16, backgroundColor: "#e2e8f0" }}
      />
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: 260 }}
      >
        <Spinner animation="border" variant="secondary" size="sm" />
      </div>
    </Card.Body>
  </Card>
);

const SkeletonTable = () => (
  <Card className="border-0 shadow-sm">
    <Card.Body>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="d-flex mb-2">
          {[...Array(6)].map((_, j) => (
            <div
              key={j}
              className="rounded me-2"
              style={{
                width: `${100 / 6}%`,
                height: 14,
                backgroundColor: "#e2e8f0",
              }}
            />
          ))}
        </div>
      ))}
    </Card.Body>
  </Card>
);

/* ──────────────────────────────────────────────
   Helper Functions
   ────────────────────────────────────────────── */
const formatResolutionTime = (hours) => {
  if (hours === null || hours === undefined) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
};

const getSlaColor = (pct) => {
  if (pct === null || pct === undefined) return "text-muted";
  if (pct >= 90) return "text-success";
  if (pct >= 70) return "text-warning";
  return "text-danger";
};

const getWorkloadVariant = (w) => {
  if (w === "High") return "danger";
  if (w === "Medium") return "warning";
  return "success";
};

const formatDate = (isoStr) => {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [data, setData] = useState(null);
    // AI Insights State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardService.getAdminAnalytics();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || "Failed to load dashboard data.");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else if (err.response?.data?.error) {
        const e = err.response.data.error;
        setError(typeof e === "string" ? e : "Failed to load dashboard data.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

    // ── AI Insights ──
  const fetchAiInsights = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await aiService.getSupportInsights();
      if (res.success && res.data) {
        setAiInsights(res.data);
      } else {
        setAiError(res.error || 'AI insights unavailable.');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        const e = err.response.data.error;
        setAiError(typeof e === 'string' ? e : 'AI insights unavailable.');
      } else if (!err.response) {
        setAiError('Network error.');
      } else {
        setAiError('AI insights are currently unavailable. Please try again later.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-fetch AI insights on first load (after analytics load)
  useEffect(() => {
    if (data && !aiInsights && !aiLoading) {
      fetchAiInsights();
    }
  }, [data]);

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <div
            className="rounded mb-2"
            style={{ width: "45%", height: 28, backgroundColor: "#e2e8f0" }}
          />
          <div
            className="rounded"
            style={{ width: "60%", height: 16, backgroundColor: "#e2e8f0" }}
          />
        </div>
        <Row className="g-3 mb-4">
          {[...Array(8)].map((_, i) => (
            <Col xs={12} sm={6} lg={3} key={i}>
              <SkeletonCard />
            </Col>
          ))}
        </Row>
        <Row className="g-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <Col md={4} key={i}>
              <SkeletonChart />
            </Col>
          ))}
        </Row>
        <Row className="g-3 mb-4">
          <Col xs={12}>
            <SkeletonChart />
          </Col>
        </Row>
        <SkeletonTable />
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div>
        <div className="mb-4">
          <h4 className="fw-bold mb-1">Admin Dashboard</h4>
        </div>
        <Alert variant="danger" className="d-flex align-items-center">
          <FaTimesCircle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
        <Button variant="primary" onClick={fetchAnalytics}>
          <FaSpinner className="me-1" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const {
    kpis,
    ticket_status,
    priority_distribution,
    category_distribution,
    department_distribution,
    monthly_trend,
    sla,
    avg_resolution_time,
    assets,
    feedback,
    recent_tickets,
    technician_summary,
  } = data;

  const userName = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).first_name
    : "Admin";

  return (
    <div>
      {/* ════════════ HEADER ════════════ */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Welcome back, {userName} 👋</h4>
        <p className="text-muted mb-0">
          Monitor your organization's IT support operations.
        </p>
      </div>

      {/* ════════════ KPI CARDS ════════════ */}
      <Row className="g-3 mb-4">
                <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaUsers size={24} />}
            title="Total Employees"
            value={kpis.total_employees}
            color="secondary"
            subtitle={
              kpis.inactive_employees > 0
                ? `${kpis.inactive_employees} inactive`
                : null
            }
            subtitleColor="text-danger"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaUserTie size={24} />}
            title="Total Technicians"
            value={kpis.total_technicians}
            color="primary"
            subtitle={
              kpis.inactive_technicians > 0
                ? `${kpis.inactive_technicians} inactive`
                : null
            }
            subtitleColor="text-danger"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaTicketAlt size={24} />}
            title="Total Tickets"
            value={kpis.total_tickets}
            color="info"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaClock size={24} />}
            title="Open Tickets"
            value={kpis.open_tickets}
            subtitle="Needs attention"
            color="primary"
          />
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaLink size={24} />}
            title="Assigned Tickets"
            value={kpis.assigned_tickets}
            color="secondary"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaSpinner size={24} />}
            title="In Progress"
            value={kpis.in_progress_tickets}
            color="warning"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaCheckCircle size={24} />}
            title="Resolved"
            value={kpis.resolved_tickets}
            color="success"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaTimesCircle size={24} />}
            title="Closed"
            value={kpis.closed_tickets}
            color="secondary"
          />
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaRedo size={24} />}
            title="Reopened"
            value={kpis.reopened_tickets}
            color="danger"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaLaptop size={24} />}
            title="Total Assets"
            value={assets.total}
            color="info"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaLink size={24} />}
            title="Assigned Assets"
            value={assets.assigned}
            color="primary"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={<FaCheckCircle size={24} />}
            title="Available Assets"
            value={assets.available}
            color="success"
          />
        </Col>
      </Row>


      {/* ═══════ AI SUPPORT INSIGHTS ═══════ */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <FaMagic className="text-primary" />
                  <h6 className="fw-bold mb-0">AI Support Insights</h6>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={fetchAiInsights}
                  disabled={aiLoading}
                  className="rounded-pill px-3"
                >
                  {aiLoading ? (
                    <><Spinner size="sm" className="me-1" />Analyzing...</>
                  ) : (
                    <><FaSyncAlt className="me-1" />Refresh Insights</>
                  )}
                </Button>
              </div>

              {aiError && (
                <Alert variant="warning" className="d-flex align-items-start py-2 mb-0" dismissible onClose={() => setAiError('')}>
                  <FaRobot className="me-2 mt-1 flex-shrink-0" />
                  <div>
                    <div className="fw-semibold small">AI Insights Unavailable</div>
                    <div className="small mb-0">{aiError}</div>
                  </div>
                </Alert>
              )}

              {aiLoading && !aiInsights && !aiError && (
                <div className="text-center py-3">
                  <Spinner animation="border" variant="primary" size="sm" />
                  <div className="text-muted small mt-2">Analyzing your support data...</div>
                </div>
              )}

              {aiInsights && (
                <div>
                  {aiInsights.summary && (
                    <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#f5f3ff' }}>
                      <div className="d-flex align-items-start gap-2">
                        <FaLightbulb className="text-primary flex-shrink-0 mt-1" />
                        <div className="fw-medium" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                          {aiInsights.summary}
                        </div>
                      </div>
                    </div>
                  )}

                  {aiInsights.insights && aiInsights.insights.length > 0 && (
                    <div>
                      <div className="fw-semibold small text-muted mb-2">Key Insights</div>
                      {aiInsights.insights.map((insight, idx) => (
                        <div key={idx} className="d-flex align-items-start gap-2 mb-2">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                            style={{
                              width: 20,
                              height: 20,
                              backgroundColor: insight.color || '#8b5cf6',
                              fontSize: '0.65rem',
                              marginTop: '2px'
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <Badge
                              bg="light"
                              text="dark"
                              className="me-1"
                              style={{ fontSize: '0.6rem', verticalAlign: 'middle', fontWeight: 600 }}
                            >
                              {insight.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-muted" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                              {insight.text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-top">
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      <FaRobot className="me-1" />
                      Generated from current PostgreSQL support data
                    </small>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ════════════ TICKET STATUS | PRIORITY | SLA ════════════ */}
      <Row className="g-3 mb-4">
        {/* Ticket Status Donut */}
        <Col md={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                Ticket Status Distribution
              </Card.Title>
              {ticket_status.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={ticket_status}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {ticket_status.map((entry, i) => (
                          <Cell key={`s-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="d-flex flex-wrap justify-content-center gap-2 mt-1"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {ticket_status.map((item, i) => (
                      <span key={i} className="d-flex align-items-center">
                        <span
                          className="me-1 rounded-circle d-inline-block"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: item.fill,
                          }}
                        />
                        {item.name} ({item.value})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Priority Distribution */}
        <Col md={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                Priority Distribution
              </Card.Title>
              {priority_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priority_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tickets">
                      {priority_distribution.map((entry, i) => (
                        <Cell key={`p-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* SLA Performance */}
        <Col md={12} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                <FaShieldAlt className="me-2 text-primary" />
                SLA Performance
              </Card.Title>
              <div className="text-center py-2">
                <div
                  className={`display-4 fw-bold ${getSlaColor(sla.success_pct)}`}
                >
                  {sla.success_pct !== null ? `${sla.success_pct}%` : "N/A"}
                </div>
                <div className="text-muted small mb-3">SLA Success Rate</div>

                <Row className="g-2 text-center mb-3">
                  <Col xs={6}>
                    <div
                      className="p-2 rounded"
                      style={{ backgroundColor: "#f0fdf4" }}
                    >
                      <div className="fw-bold text-success fs-5">{sla.met}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        SLA Met
                      </div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div
                      className="p-2 rounded"
                      style={{ backgroundColor: "#fef2f2" }}
                    >
                      <div className="fw-bold text-danger fs-5">
                        {sla.breached}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        SLA Breached
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="pt-3 border-top">
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    Avg. Resolution Time
                  </div>
                  <div className="fw-bold fs-5 mt-1">
                    {formatResolutionTime(avg_resolution_time)}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ════════════ MONTHLY TICKET TREND ════════════ */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                <FaChartLine className="me-2 text-primary" />
                Monthly Ticket Trend
              </Card.Title>
              {monthly_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: "#3b82f6",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 7 }}
                      name="Tickets"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ════════════ CATEGORY | DEPARTMENT ════════════ */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                Tickets by Category
              </Card.Title>
              {category_distribution.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(200, category_distribution.length * 40)}
                >
                  <BarChart
                    data={category_distribution}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={12}
                      width={110}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Tickets">
                      {category_distribution.map((entry, i) => (
                        <Cell key={`cat-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                Tickets by Department
              </Card.Title>
              {department_distribution.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(200, department_distribution.length * 40)}
                >
                  <BarChart
                    data={department_distribution}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={12}
                      width={110}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Tickets">
                      {department_distribution.map((entry, i) => (
                        <Cell key={`dept-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ════════════ ASSET OVERVIEW | FEEDBACK ════════════ */}
      <Row className="g-3 mb-4">
        {/* Asset Overview */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                <FaLaptop className="me-2 text-primary" />
                Asset Overview
              </Card.Title>
              <Row className="g-2 mt-1">
                {[
                  {
                    label: "Total",
                    value: assets.total,
                    bg: "#eff6ff",
                    color: "#3b82f6",
                  },
                  {
                    label: "Available",
                    value: assets.available,
                    bg: "#f0fdf4",
                    color: "#22c55e",
                  },
                  {
                    label: "Assigned",
                    value: assets.assigned,
                    bg: "#fffbeb",
                    color: "#f59e0b",
                  },
                  {
                    label: "Maintenance",
                    value: assets.maintenance,
                    bg: "#f5f3ff",
                    color: "#8b5cf6",
                  },
                  {
                    label: "Retired",
                    value: assets.retired,
                    bg: "#f8fafc",
                    color: "#64748b",
                  },
                ].map((item, i) => (
                  <Col xs={4} key={i}>
                    <div
                      className="p-2 rounded text-center"
                      style={{ backgroundColor: item.bg }}
                    >
                      <div
                        className="fw-bold fs-5"
                        style={{ color: item.color }}
                      >
                        {item.value}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {item.label}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              {assets.total > 0 && (
                <ResponsiveContainer width="100%" height={170} className="mt-1">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Available", value: assets.available },
                        { name: "Assigned", value: assets.assigned },
                        { name: "Maintenance", value: assets.maintenance },
                        { name: "Retired", value: assets.retired },
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#64748b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Feedback Overview */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                <FaStar className="me-2 text-warning" />
                Feedback Overview
              </Card.Title>
              {feedback.total > 0 ? (
                <>
                  <div className="text-center py-2">
                    <div
                      className="display-5 fw-bold"
                      style={{ color: "#f59e0b" }}
                    >
                      <FaStar className="me-1" style={{ fontSize: "0.7em" }} />
                      {feedback.avg_rating}
                      <span className="fs-6 text-muted"> / 5</span>
                    </div>
                    <div className="text-muted small">
                      {feedback.total} review{feedback.total !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {feedback.rating_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={170}>
                      <BarChart data={feedback.rating_distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          name="Reviews"
                        >
                          {feedback.rating_distribution.map((entry, i) => (
                            <Cell key={`r-${i}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted py-3 small">
                      No rating breakdown available
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  No feedback data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ════════════ TECHNICIAN SUMMARY ════════════ */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <FaTools className="me-2 text-primary" />
                Technician Workload Summary
              </h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => navigate("/admin/technician-performance")}
              >
                View All Performance
              </Button>
            </Card.Header>
            <Card.Body className="pt-0">
              {technician_summary.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="itsm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Technician</th>
                        <th className="text-center">Active Tickets</th>
                        <th className="text-center">Resolved</th>
                        <th className="text-center">SLA %</th>
                        <th className="text-center">Workload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technician_summary.map((tech) => (
                        <tr key={tech.id}>
                          <td className="fw-medium">{tech.name}</td>
                          <td className="text-center">{tech.active_tickets}</td>
                          <td className="text-center">{tech.resolved}</td>
                          <td className="text-center">
                            {tech.sla_success_pct !== null ? (
                              <span
                                className={`fw-bold ${getSlaColor(tech.sla_success_pct)}`}
                              >
                                {tech.sla_success_pct}%
                              </span>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td className="text-center">
                            <Badge bg={getWorkloadVariant(tech.workload)}>
                              {tech.workload}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  No technician data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ════════════ RECENT TICKETS ════════════ */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Recent Tickets</h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => navigate("/admin/tickets")}
              >
                View All Tickets
              </Button>
            </Card.Header>
            <Card.Body className="pt-0">
              {recent_tickets.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="itsm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Ticket #</th>
                        <th>Title</th>
                        <th className="d-none d-md-table-cell">Employee</th>
                        <th className="d-none d-lg-table-cell">Technician</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th className="d-none d-md-table-cell">Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_tickets.map((t) => (
                        <tr key={t.id}>
                          <td className="fw-medium text-nowrap">
                            {t.ticket_number}
                          </td>
                          <td>{t.title}</td>
                          <td className="d-none d-md-table-cell">
                            {t.employee_name}
                          </td>
                          <td className="d-none d-lg-table-cell text-muted">
                            {t.technician_name}
                          </td>
                          <td>
                            <Badge className={`badge-priority-${t.priority}`}>
                              {t.priority}
                            </Badge>
                          </td>
                          <td>
                            <Badge className={`badge-status-${t.status}`}>
                              {t.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="d-none d-md-table-cell text-muted text-nowrap">
                            {formatDate(t.created_at)}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/admin/tickets/${t.id}`)}
                            >
                              <FaEye className="me-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
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

export default AdminDashboard;
