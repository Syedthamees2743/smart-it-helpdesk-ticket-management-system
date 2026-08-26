import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import {
  FaUsers,
  FaListAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTachometerAlt,
  FaStar,
  FaUserTie,
  FaClock,
  FaSync,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FiAlertCircle, FiX } from "react-icons/fi";
import dashboardService from "../../services/dashboardService";

const STATUS_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#6b7280", "#ef4444"];
const SLA_COLORS = ["#22c55e", "#ef4444"];
const WORKLOAD_COLORS = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

const AVATAR_COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
];

const TechnicianPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getTechnicianPerformance();
      setData(res);
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === "string") {
        setError(errorMsg);
      } else {
        setError("Failed to load technician performance data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI HELPERS
  // =========================================================

  const getAvatar = (name, index) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

    return (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3"
        style={{
          width: "36px",
          height: "36px",
          backgroundColor: `${color}20`, // 20 = 12% opacity hex
          color: color,
          fontWeight: "700",
          fontSize: "0.8rem",
        }}
      >
        {initials}
      </div>
    );
  };

  const getWorkloadBadge = (workload) => {
    const color = WORKLOAD_COLORS[workload] || "#6b7280";
    return (
      <Badge
        pill
        style={{ backgroundColor: color, fontSize: "0.72rem" }}
        className="px-3 py-2"
      >
        {workload}
      </Badge>
    );
  };

  const getSlaBadge = (pct) => {
    if (pct === null || pct === undefined)
      return <span className="text-muted">—</span>;
    if (pct >= 90)
      return (
        <Badge bg="success" pill className="px-3 py-2">
          {pct}%
        </Badge>
      );
    if (pct >= 70)
      return (
        <Badge bg="warning" text="dark" pill className="px-3 py-2">
          {pct}%
        </Badge>
      );
    return (
      <Badge bg="danger" pill className="px-3 py-2">
        {pct}%
      </Badge>
    );
  };

  // SLA Progress Bar for table
  const getSlaBar = (pct) => {
    if (pct === null || pct === undefined)
      return <span className="text-muted">—</span>;
    let color = "#ef4444";
    if (pct >= 90) color = "#22c55e";
    else if (pct >= 70) color = "#f59e0b";

    return (
      <div
        className="d-flex flex-column align-items-center gap-1"
        style={{ minWidth: "80px" }}
      >
        <div
          className="w-100 rounded-pill overflow-hidden"
          style={{ height: "6px", backgroundColor: "#f1f5f9" }}
        >
          <div
            className="h-100 rounded-pill"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span className="fw-semibold" style={{ fontSize: "0.75rem", color }}>
          {pct}%
        </span>
      </div>
    );
  };

  // =========================================================
  // KPI CARD COMPONENT
  // =========================================================

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
          <div
            className="fw-bold fs-4"
            style={{ color: valueColor || "#1e293b" }}
          >
            {value}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // =========================================================
  // CHART DATA PREP
  // =========================================================

  const workloadChartData = (data?.technicians || []).map((t) => ({
    name: t.name.split(" ")[0],
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
      { name: "Open", value: 0 },
      { name: "In Progress", value: 0 },
      { name: "Resolved", value: 0 },
      { name: "Closed", value: 0 },
      { name: "Reopened", value: 0 },
    ],
  );

  const totalStatusCount = statusChartData.reduce((sum, s) => sum + s.value, 0);

  // =========================================================
  // LOADING / ERROR STATES
  // =========================================================

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading technician performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-3">
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="rounded-4 border-0"
        >
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, technicians } = data;

  return (
    <div
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
      className="py-4 px-3 px-md-4"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Technician Performance</h4>
          <p className="text-muted mb-0">
            Monitor technician workload and SLA performance
          </p>
        </div>
        <Button
          variant="light"
          className="border rounded-pill px-4 d-flex align-items-center"
          onClick={fetchPerformance}
        >
          <FaSync className="me-2" />
          Refresh
        </Button>
      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Row className="g-3 mb-4">
        <Col xl={2} md={4} sm={6}>
          <KPICard
            icon={<FaUsers style={{ fontSize: "1.4rem", color: "#4f46e5" }} />}
            bgColor="#e0e7ff"
            label="Technicians"
            value={kpis.total_technicians}
          />
        </Col>
        <Col xl={2} md={4} sm={6}>
          <KPICard
            icon={
              <FaListAlt style={{ fontSize: "1.4rem", color: "#0ea5e9" }} />
            }
            bgColor="#e0f2fe"
            label="Total Assigned"
            value={kpis.total_assigned}
          />
        </Col>
        <Col xl={2} md={4} sm={6}>
          <KPICard
            icon={
              <FaSpinner style={{ fontSize: "1.4rem", color: "#f59e0b" }} />
            }
            bgColor="#fef3c7"
            label="In Progress"
            value={kpis.in_progress}
          />
        </Col>
        <Col xl={2} md={4} sm={6}>
          <KPICard
            icon={
              <FaCheckCircle style={{ fontSize: "1.4rem", color: "#10b981" }} />
            }
            bgColor="#d1fae5"
            label="Resolved"
            value={kpis.resolved}
          />
        </Col>
        <Col xl={2} md={4} sm={6}>
          <KPICard
            icon={
              <FaTachometerAlt
                style={{ fontSize: "1.4rem", color: "#22c55e" }}
              />
            }
            bgColor="#dcfce7"
            label="SLA Met"
            value={kpis.sla_met}
            valueColor="#10b981"
          />
        </Col>
        <Col xl={2} md={4} sm={6}>
          <KPICard
            icon={
              <FaExclamationTriangle
                style={{ fontSize: "1.4rem", color: "#ef4444" }}
              />
            }
            bgColor="#fee2e2"
            label="SLA Breached"
            value={kpis.sla_breached}
            valueColor="#ef4444"
          />
        </Col>
      </Row>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <Row className="g-3 mb-4">
        {/* Workload Bar Chart */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#e0e7ff",
                  }}
                >
                  <FaUsers style={{ fontSize: "0.9rem", color: "#4f46e5" }} />
                </div>
                <h6 className="fw-bold text-dark mb-0">Technician Workload</h6>
              </div>

              {technicians.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FaUsers style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workloadChartData} barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const d = payload[0].payload;
                          return (
                            <div
                              className="bg-white border rounded-3 p-3 shadow-sm"
                              style={{
                                fontSize: "0.8rem",
                                borderColor: "#e2e8f0",
                              }}
                            >
                              <strong className="text-dark d-block mb-2">
                                {d.fullName}
                              </strong>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span
                                  className="rounded-circle"
                                  style={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: "#4f46e5",
                                  }}
                                />
                                <span className="text-muted">
                                  Total Assigned:
                                </span>
                                <strong className="text-dark">
                                  {d.assigned}
                                </strong>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="rounded-circle"
                                  style={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: "#f59e0b",
                                  }}
                                />
                                <span className="text-muted">
                                  Currently Active:
                                </span>
                                <strong className="text-dark">
                                  {d.active}
                                </strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "0.8rem", paddingTop: "8px" }}
                    />
                    <Bar
                      dataKey="assigned"
                      fill="#4f46e5"
                      name="Total Assigned"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="active"
                      fill="#f59e0b"
                      name="Currently Active"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Status Pie Chart */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#d1fae5",
                  }}
                >
                  <FaListAlt style={{ fontSize: "0.9rem", color: "#10b981" }} />
                </div>
                <h6 className="fw-bold text-dark mb-0">Status Distribution</h6>
              </div>

              {totalStatusCount === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FaListAlt style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No data available</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const d = payload[0].payload;
                            return (
                              <div
                                className="bg-white border rounded-3 p-2 shadow-sm"
                                style={{
                                  fontSize: "0.8rem",
                                  borderColor: "#e2e8f0",
                                }}
                              >
                                <strong className="text-dark">{d.name}:</strong>{" "}
                                {d.value}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                    {statusChartData.map((item, i) => (
                      <div
                        key={i}
                        className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                        style={{
                          backgroundColor: "#f8fafc",
                          fontSize: "0.75rem",
                        }}
                      >
                        <span
                          className="rounded-circle"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: STATUS_COLORS[i],
                          }}
                        />
                        <span className="text-muted">{item.name}</span>
                        <strong className="text-dark">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* =====================================================
          PERFORMANCE TABLE
      ===================================================== */}

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          <div className="d-flex align-items-center gap-2 p-4 pb-3">
            <div
              className="rounded-4 d-flex align-items-center justify-content-center"
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "#fef3c7",
              }}
            >
              <FaUserTie style={{ fontSize: "0.9rem", color: "#f59e0b" }} />
            </div>
            <h6 className="fw-bold text-dark mb-0">Technician Details</h6>
          </div>

          {technicians.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaUserTie style={{ fontSize: "3rem", color: "#dee2e6" }} />
              <h5 className="mt-3 fw-bold text-dark">No Technicians Found</h5>
              <p className="mb-0">
                Add technicians and assign tickets to see performance data.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover responsive className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ paddingLeft: "24px", minWidth: "180px" }}>
                      Technician
                    </th>
                    <th className="text-center" style={{ width: "90px" }}>
                      Assigned
                    </th>
                    <th className="text-center" style={{ width: "80px" }}>
                      Active
                    </th>
                    <th className="text-center" style={{ width: "90px" }}>
                      Resolved
                    </th>
                    <th className="text-center" style={{ width: "80px" }}>
                      Closed
                    </th>
                    <th className="text-center" style={{ width: "90px" }}>
                      High/Crit
                    </th>
                    <th className="text-center" style={{ width: "110px" }}>
                      Avg Rating
                    </th>
                    <th className="text-center" style={{ width: "110px" }}>
                      SLA %
                    </th>
                    <th className="text-center" style={{ width: "90px" }}>
                      Avg Time
                    </th>
                    <th
                      className="text-center"
                      style={{ width: "110px", paddingRight: "24px" }}
                    >
                      Workload
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((t, index) => (
                    <tr key={t.id}>
                      {/* Technician with Avatar */}
                      <td style={{ paddingLeft: "24px" }}>
                        <div className="d-flex align-items-center">
                          {getAvatar(t.name, index)}
                          <div>
                            <div className="fw-semibold text-dark">
                              {t.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="text-center fw-semibold text-dark">
                        {t.total_assigned}
                      </td>
                      <td className="text-center">
                        {t.active_tickets > 0 ? (
                          <Badge
                            bg="light"
                            text="dark"
                            pill
                            className="border px-3 py-2"
                          >
                            {t.active_tickets}
                          </Badge>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td className="text-center fw-semibold text-success">
                        {t.resolved}
                      </td>
                      <td className="text-center text-muted">{t.closed}</td>
                      <td className="text-center">
                        {t.high_critical > 0 ? (
                          <Badge bg="danger" pill className="px-3 py-2">
                            {t.high_critical}
                          </Badge>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td className="text-center">
                        {t.avg_rating && t.avg_rating > 0 ? (
                          <div
                            className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                            style={{ backgroundColor: "#fef3c7" }}
                          >
                            <FaStar
                              style={{ fontSize: "0.7rem", color: "#f59e0b" }}
                            />
                            <span
                              className="fw-bold"
                              style={{
                                fontSize: "0.8rem",
                                color:
                                  t.avg_rating >= 4
                                    ? "#10b981"
                                    : t.avg_rating >= 3
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            >
                              {t.avg_rating}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        {getSlaBar(t.sla_success_pct)}
                      </td>
                      <td className="text-center">
                        {t.avg_resolution_time !== null ? (
                          <div className="d-inline-flex align-items-center gap-1 text-muted">
                            <FaClock style={{ fontSize: "0.7rem" }} />
                            <span style={{ fontSize: "0.8rem" }}>
                              {t.avg_resolution_time}h
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td
                        className="text-center"
                        style={{ paddingRight: "24px" }}
                      >
                        {getWorkloadBadge(t.workload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TechnicianPerformance;
