import { useState, useEffect } from "react";
import { Row, Col, Card, Button, Spinner, Alert, Badge, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaTicketAlt,
  FaClock,
  FaSpinner,
  FaCheckCircle,
  FaPlus,
  FaLink,
  FaRedo,
  FaTimesCircle,
  FaShieldAlt,
  FaLaptop,
  FaEye,
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
} from "recharts";
import StatCard from "../../components/dashboard/StatCard";
import dashboardService from "../../services/dashboardService";

/* ── Loading Skeleton ── */
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
        style={{ height: 200 }}
      >
        <Spinner animation="border" variant="secondary" size="sm" />
      </div>
    </Card.Body>
  </Card>
);

/* ── Helper ── */
const getSlaColor = (pct) => {
  if (pct === null || pct === undefined) return "text-muted";
  if (pct >= 90) return "text-success";
  if (pct >= 70) return "text-warning";
  return "text-danger";
};

/* ── Main Component ── */
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getEmployeeDashboard();
      setData(res);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access denied.");
      } else if (err.response?.data?.error) {
        setError(
          typeof err.response.data.error === "string"
            ? err.response.data.error
            : "Failed to load dashboard.",
        );
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div
              className="rounded mb-2"
              style={{ width: "40%", height: 28, backgroundColor: "#e2e8f0" }}
            />
            <div
              className="rounded"
              style={{ width: "55%", height: 14, backgroundColor: "#e2e8f0" }}
            />
          </div>
          <div
            className="rounded"
            style={{ width: 160, height: 38, backgroundColor: "#e2e8f0" }}
          />
        </div>
        <Row className="g-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <Col xs={6} md key={i}>
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
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div>
        <div className="mb-4">
          <h4 className="fw-bold mb-1">Employee Dashboard</h4>
        </div>
        <Alert variant="danger" className="d-flex align-items-center">
          <FaTimesCircle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
        <Button variant="primary" onClick={fetchDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const tickets = data.tickets || {};
  const assets = data.assets || {};
  const sla = tickets.sla || {};
  const userName = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).first_name
    : "Employee";

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Welcome back, {userName} 👋</h4>
          <p className="text-muted mb-0">
            Track your IT support requests and assigned assets.
          </p>
        </div>
        <Button
          variant="primary"
          className="rounded-3 px-4 shadow-sm"
          onClick={() => navigate("/employee/tickets/new")}
        >
          <FaPlus className="me-2" /> Raise New Complaint
        </Button>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <Row className="g-3 mb-4">
        <Col xs={6} md>
          <StatCard
            icon={<FaTicketAlt size={24} />}
            title="My Tickets"
            value={tickets.my_total || 0}
            color="primary"
          />
        </Col>
        <Col xs={6} md>
          <StatCard
            icon={<FaClock size={24} />}
            title="Open"
            value={tickets.my_open || 0}
            color="info"
          />
        </Col>
        <Col xs={6} md>
          <StatCard
            icon={<FaLink size={24} />}
            title="Assigned"
            value={tickets.my_assigned || 0}
            color="secondary"
          />
        </Col>
        <Col xs={6} md>
          <StatCard
            icon={<FaSpinner size={24} />}
            title="In Progress"
            value={tickets.my_in_progress || 0}
            color="warning"
          />
        </Col>
        <Col xs={6} md>
          <StatCard
            icon={<FaCheckCircle size={24} />}
            title="Resolved"
            value={tickets.my_resolved || 0}
            color="success"
          />
        </Col>
        <Col xs={6} md>
          <StatCard
            icon={<FaRedo size={24} />}
            title="Reopened"
            value={tickets.my_reopened || 0}
            color="danger"
          />
        </Col>
        <Col xs={6} md>
          <StatCard
            icon={<FaTimesCircle size={24} />}
            title="Closed"
            value={tickets.my_closed || 0}
            color="secondary"
          />
        </Col>
      </Row>

      {/* ═══ Status Chart | Priority Chart | SLA Overview ═══ */}
      <Row className="g-3 mb-4">
        {/* Ticket Status */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Ticket Status</Card.Title>
              {tickets.status_distribution &&
              tickets.status_distribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tickets.status_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {tickets.status_distribution.map((entry, i) => (
                          <Cell key={`s-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="d-flex flex-wrap justify-content-center gap-2 mt-1"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {tickets.status_distribution.map((item, i) => (
                      <span key={i} className="d-flex align-items-center">
                        <span
                          className="me-1 rounded-circle d-inline-block"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: item.fill,
                          }}
                        />
                        {item.name} ({item.value})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Priority Overview */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Priority Overview</Card.Title>
              {tickets.priority_distribution &&
              tickets.priority_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tickets.priority_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tickets">
                      {tickets.priority_distribution.map((entry, i) => (
                        <Cell key={`p-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-4">
                  No data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* SLA Overview */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">
                <FaShieldAlt className="me-2 text-primary" />
                SLA Overview
              </Card.Title>
              <div className="text-center py-2">
                <div
                  className={`display-5 fw-bold ${getSlaColor(sla.success_pct)}`}
                >
                  {sla.success_pct !== null ? `${sla.success_pct}%` : "N/A"}
                </div>
                <div className="text-muted small mb-3">SLA Success Rate</div>
                <Row className="g-2 text-center">
                  <Col xs={6}>
                    <div
                      className="p-2 rounded"
                      style={{ backgroundColor: "#f0fdf4" }}
                    >
                      <div className="fw-bold text-success fs-5">
                        {sla.met || 0}
                      </div>
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
                        {sla.breached || 0}
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
                {(sla.active_breached || 0) > 0 && (
                  <div className="mt-3 p-2 rounded bg-danger bg-opacity-10">
                    <span className="text-danger fw-bold">
                      {sla.active_breached}
                    </span>
                    <span className="text-muted small ms-1">
                      ticket(s) currently past SLA deadline
                    </span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ═══ Recent Tickets | My Assets ═══ */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
              <h6 className="fw-bold mb-0">My Recent Tickets</h6>
            </Card.Header>
            <Card.Body className="pt-0">
              {tickets.recent && tickets.recent.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="itsm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>SLA</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.recent.map((t, idx) => (
                        <tr key={idx}>
                          <td className="fw-medium">{t.title}</td>
                          <td>
                            <Badge
                              className={`badge-priority-${t.priority.toLowerCase()}`}
                            >
                              {t.priority}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              className={`badge-status-${t.status.toLowerCase().replace(" ", "_")}`}
                            >
                              {t.status}
                            </Badge>
                          </td>
                          <td>
                            <span
                              className={`fw-bold ${t.sla === "Breached" ? "text-danger" : "text-success"}`}
                            >
                              {t.sla}
                            </span>
                          </td>
                          <td className="text-muted">{t.date}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              type="button"
                              onClick={() =>
                                navigate(`/employee/tickets/${t.id}`)
                              }
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
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
              <h6 className="fw-bold mb-0">
                <FaLaptop className="me-2 text-primary" />
                My Assets
              </h6>
            </Card.Header>
            <Card.Body>
              {assets.list && assets.list.length > 0 ? (
                assets.list.map((asset, idx) => (
                  <div
                    key={idx}
                    className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light"
                  >
                    <div>
                      <div className="fw-medium">{asset.name}</div>
                      <small className="text-muted">
                        {asset.code} • {asset.category}
                      </small>
                    </div>
                    <Badge bg="success">{asset.status}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-4">
                  No assets assigned
                </div>
              )}
            </Card.Body>
          </Card>
          <Card className="border-0 shadow-sm mt-3">
            <Card.Body>
              <h6 className="fw-bold">Knowledge Base</h6>
              <p className="text-muted small">
                Find answers to common IT issues before raising a ticket.
              </p>
              <Button
                variant="outline-primary"
                size="sm"
                className="w-100"
                onClick={() => navigate("/employee/faqs")}
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

export default EmployeeDashboard;
