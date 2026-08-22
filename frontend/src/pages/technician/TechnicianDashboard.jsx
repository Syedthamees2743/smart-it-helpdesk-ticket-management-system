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

import {
  FaListAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaClock,
  FaRedo,
  FaTimesCircle,
  FaShieldAlt,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

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

import dashboardService from "../../services/dashboardService";

/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_DATA = {
  total_assigned: 0,
  open_assigned: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
  reopened: 0,

  status_distribution: [],
  priority_distribution: [],

  sla_success_pct: null,
  sla_met: 0,
  sla_breached: 0,

  avg_resolution_time: null,

  workload: "Low",
  active_tickets: 0,

  avg_rating: 0,
  high_critical: 0,

  recent_tickets: [],
};

/* =========================================================
   STATUS COLORS
========================================================= */

const STATUS_COLORS = {
  Open: "#3b82f6",
  open: "#3b82f6",

  Assigned: "#06b6d4",
  assigned: "#06b6d4",

  "Open/Assigned": "#06b6d4",

  "In Progress": "#f59e0b",
  in_progress: "#f59e0b",

  Resolved: "#10b981",
  resolved: "#10b981",

  Closed: "#6b7280",
  closed: "#6b7280",

  Reopened: "#ef4444",
  reopened: "#ef4444",
};

/* =========================================================
   PRIORITY COLORS
========================================================= */

const PRIORITY_COLORS = {
  Low: "#10b981",
  low: "#10b981",

  Medium: "#3b82f6",
  medium: "#3b82f6",

  High: "#f59e0b",
  high: "#f59e0b",

  Critical: "#ef4444",
  critical: "#ef4444",
};

/* =========================================================
   HELPERS
========================================================= */

const formatResolutionTime = (hours) => {
  if (hours === null || hours === undefined) {
    return "N/A";
  }

  const numericHours = Number(hours);

  if (Number.isNaN(numericHours)) {
    return "N/A";
  }

  if (numericHours < 1) {
    return `${Math.round(numericHours * 60)} min`;
  }

  if (numericHours < 24) {
    return `${numericHours.toFixed(1)} hrs`;
  }

  return `${(numericHours / 24).toFixed(1)} days`;
};


const getSlaColor = (pct) => {
  if (pct === null || pct === undefined) {
    return "text-muted";
  }

  if (pct >= 90) {
    return "text-success";
  }

  if (pct >= 70) {
    return "text-warning";
  }

  return "text-danger";
};


const getWorkloadVariant = (workload) => {
  if (workload === "High") {
    return "danger";
  }

  if (workload === "Medium") {
    return "warning";
  }

  return "success";
};


/* =========================================================
   NORMALIZE CHART DATA
========================================================= */

const normalizeStatusData = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const name = item.name || item.status || "Unknown";

    return {
      ...item,
      name,
      value: Number(item.value || item.count || 0),
      fill:
        item.fill ||
        STATUS_COLORS[name] ||
        STATUS_COLORS[name?.toLowerCase()] ||
        "#64748b",
    };
  });
};


const normalizePriorityData = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const name = item.name || item.priority || "Unknown";

    return {
      ...item,
      name,
      value: Number(item.value || item.count || 0),
      fill:
        item.fill ||
        PRIORITY_COLORS[name] ||
        PRIORITY_COLORS[name?.toLowerCase()] ||
        "#64748b",
    };
  });
};


/* =========================================================
   KPI CARD
========================================================= */

const KPICard = ({ label, value, color, icon }) => {
  return (
    <Card className="border-0 shadow-sm h-100 overflow-hidden position-relative">

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          backgroundColor: color,
          borderRadius: "4px 0 0 4px",
        }}
      />

      <Card.Body className="d-flex align-items-center justify-content-between ps-3">

        <div>
          <div
            className="text-muted"
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </div>

          <div
            className="fw-bold mt-1"
            style={{
              fontSize: "1.6rem",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
          style={{
            width: "42px",
            height: "42px",
            backgroundColor: `${color}18`,
          }}
        >
          {icon}
        </div>

      </Card.Body>
    </Card>
  );
};


/* =========================================================
   SKELETON
========================================================= */

const SkeletonCard = () => {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="d-flex align-items-center">

        <div
          className="me-3 rounded-circle"
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
            style={{
              width: 80,
              height: 12,
              backgroundColor: "#e2e8f0",
            }}
          />

          <div
            className="rounded"
            style={{
              width: 40,
              height: 22,
              backgroundColor: "#e2e8f0",
            }}
          />
        </div>

      </Card.Body>
    </Card>
  );
};


const SkeletonChart = () => {
  return (
    <Card className="border-0 shadow-sm h-100">

      <Card.Body>

        <div
          className="rounded mb-3"
          style={{
            width: "45%",
            height: 16,
            backgroundColor: "#e2e8f0",
          }}
        />

        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: 200 }}
        >
          <Spinner
            animation="border"
            variant="secondary"
            size="sm"
          />
        </div>

      </Card.Body>
    </Card>
  );
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

const TechnicianDashboard = () => {

  const navigate = useNavigate();

  const [data, setData] = useState(DEFAULT_DATA);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  useEffect(() => {
    fetchDashboard();
  }, []);


  const fetchDashboard = async () => {

    setLoading(true);
    setError("");

    try {

      const res = await dashboardService.getMyPerformance();

      console.log("TECHNICIAN DASHBOARD RESPONSE:", res);


      /*
        Your existing API response is expected like:

        {
          success: true,
          technician: {
             ...
          }
        }
      */

      let technicianData = null;


      if (res?.success && res?.technician) {

        technicianData = res.technician;

      } else if (res?.data?.technician) {

        technicianData = res.data.technician;

      } else if (res?.data) {

        technicianData = res.data;

      }


      if (!technicianData) {

        setError(
          res?.error ||
          "Dashboard data not found."
        );

        return;
      }


      /* ===================================================
         NORMALIZE EVERYTHING
      =================================================== */

      const normalizedData = {

        ...DEFAULT_DATA,

        ...technicianData,

        status_distribution:
          normalizeStatusData(
            technicianData.status_distribution
          ),

        priority_distribution:
          normalizePriorityData(
            technicianData.priority_distribution
          ),

        recent_tickets:
          Array.isArray(technicianData.recent_tickets)
            ? technicianData.recent_tickets
            : [],
      };


      console.log(
        "NORMALIZED TECHNICIAN DATA:",
        normalizedData
      );


      setData(normalizedData);

    } catch (err) {

      console.error(
        "TECHNICIAN DASHBOARD ERROR:",
        err
      );


      if (err.response?.status === 403) {

        setError("Access denied.");

      } else if (err.response?.data?.error) {

        const apiError = err.response.data.error;

        setError(
          typeof apiError === "string"
            ? apiError
            : "Failed to load dashboard."
        );

      } else if (!err.response) {

        setError(
          "Network error. Please check your connection."
        );

      } else {

        setError(
          "Something went wrong. Please try again."
        );
      }

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <div>

        <div className="mb-4">

          <div
            className="rounded mb-2"
            style={{
              width: "40%",
              height: 28,
              backgroundColor: "#e2e8f0",
            }}
          />

          <div
            className="rounded"
            style={{
              width: "55%",
              height: 14,
              backgroundColor: "#e2e8f0",
            }}
          />

        </div>


        <Row className="g-3 mb-4">

          {[...Array(5)].map((_, i) => (

            <Col xs={6} md={4} lg key={i}>
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


  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {

    return (
      <div>

        <div className="mb-4">

          <h4 className="fw-bold mb-1">
            Technician Dashboard
          </h4>

          <p className="text-muted mb-0">
            Manage your assigned IT support requests.
          </p>

        </div>


        <Alert
          variant="danger"
          className="d-flex align-items-center"
        >
          <FaExclamationTriangle className="me-2 flex-shrink-0" />

          <div>{error}</div>

        </Alert>


        <Button
          variant="primary"
          onClick={fetchDashboard}
        >
          Retry
        </Button>

      </div>
    );
  }


  /* =======================================================
     CHART DATA
  ======================================================= */

  const statusData = Array.isArray(data.status_distribution)
    ? data.status_distribution
    : [];


  const priorityData = Array.isArray(data.priority_distribution)
    ? data.priority_distribution
    : [];


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-4">

        <h4 className="fw-bold mb-1">
          Technician Dashboard
        </h4>

        <p className="text-muted mb-0">
          Manage your assigned IT support requests.
        </p>

      </div>


      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <Row className="g-3 mb-4">

        <Col xs={6} md={4} lg>
          <KPICard
            label="Total Assigned"
            value={data.total_assigned || 0}
            color="#4f46e5"
            icon={
              <FaListAlt
                size={18}
                style={{ color: "#4f46e5" }}
              />
            }
          />
        </Col>


        <Col xs={6} md={4} lg>
          <KPICard
            label="Open / Assigned"
            value={data.open_assigned || 0}
            color="#06b6d4"
            icon={
              <FaListAlt
                size={18}
                style={{ color: "#06b6d4" }}
              />
            }
          />
        </Col>


        <Col xs={6} md={4} lg>
          <KPICard
            label="In Progress"
            value={data.in_progress || 0}
            color="#f59e0b"
            icon={
              <FaClock
                size={18}
                style={{ color: "#f59e0b" }}
              />
            }
          />
        </Col>


        <Col xs={6} md={4} lg>
          <KPICard
            label="Resolved"
            value={data.resolved || 0}
            color="#10b981"
            icon={
              <FaCheckCircle
                size={18}
                style={{ color: "#10b981" }}
              />
            }
          />
        </Col>


        <Col xs={6} md={4} lg>
          <KPICard
            label="Closed"
            value={data.closed || 0}
            color="#6b7280"
            icon={
              <FaTimesCircle
                size={18}
                style={{ color: "#6b7280" }}
              />
            }
          />
        </Col>


        <Col xs={6} md={4} lg>
          <KPICard
            label="Reopened"
            value={data.reopened || 0}
            color="#ef4444"
            icon={
              <FaRedo
                size={18}
                style={{ color: "#ef4444" }}
              />
            }
          />
        </Col>

      </Row>


      {/* ===================================================
          STATUS / PRIORITY / SLA
      =================================================== */}

      <Row className="g-3 mb-4">


        {/* =================================================
            TICKET STATUS
        ================================================= */}

        <Col md={4}>

          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <Card.Title className="fw-bold h6">
                Ticket Status
              </Card.Title>


              {statusData.length > 0 ? (

                <>

                  <ResponsiveContainer
                    width="100%"
                    height={200}
                  >

                    <PieChart>

                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >

                        {statusData.map((entry, index) => (

                          <Cell
                            key={`status-${index}`}
                            fill={
                              entry.fill ||
                              STATUS_COLORS[entry.name] ||
                              "#64748b"
                            }
                          />

                        ))}

                      </Pie>


                      <Tooltip />

                    </PieChart>

                  </ResponsiveContainer>


                  {/* LEGEND */}

                  <div
                    className="d-flex flex-wrap justify-content-center gap-3 mt-2"
                    style={{
                      fontSize: "0.75rem",
                    }}
                  >

                    {statusData.map((item, index) => (

                      <span
                        key={index}
                        className="d-flex align-items-center"
                      >

                        <span
                          className="me-1 rounded-circle d-inline-block"
                          style={{
                            width: 9,
                            height: 9,
                            backgroundColor:
                              item.fill ||
                              STATUS_COLORS[item.name] ||
                              "#64748b",
                          }}
                        />

                        <span>
                          {item.name} ({item.value})
                        </span>

                      </span>

                    ))}

                  </div>

                </>

              ) : (

                <div className="text-center text-muted py-5">
                  No ticket status data available
                </div>

              )}

            </Card.Body>

          </Card>

        </Col>


        {/* =================================================
            PRIORITY
        ================================================= */}

        <Col md={4}>

          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <Card.Title className="fw-bold h6">
                Priority Overview
              </Card.Title>


              {priorityData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height={250}
                >

                  <BarChart data={priorityData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />

                    <XAxis
                      dataKey="name"
                      fontSize={12}
                    />

                    <YAxis
                      fontSize={12}
                      allowDecimals={false}
                    />

                    <Tooltip />


                    <Bar
                      dataKey="value"
                      radius={[5, 5, 0, 0]}
                      name="Tickets"
                    >

                      {priorityData.map(
                        (entry, index) => (

                          <Cell
                            key={`priority-${index}`}
                            fill={
                              entry.fill ||
                              PRIORITY_COLORS[entry.name] ||
                              "#64748b"
                            }
                          />

                        )
                      )}

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="text-center text-muted py-5">
                  No priority data available
                </div>

              )}

            </Card.Body>

          </Card>

        </Col>


        {/* =================================================
            SLA PERFORMANCE
        ================================================= */}

        <Col md={4}>

          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <Card.Title className="fw-bold h6">

                <FaShieldAlt className="me-2 text-primary" />

                SLA Performance

              </Card.Title>


              <div className="text-center py-2">


                {/* SLA PERCENTAGE */}

                <div
                  className={`display-5 fw-bold ${getSlaColor(
                    data.sla_success_pct
                  )}`}
                >

                  {data.sla_success_pct !== null &&
                  data.sla_success_pct !== undefined
                    ? `${data.sla_success_pct}%`
                    : "N/A"}

                </div>


                <div className="text-muted small mb-3">
                  SLA Success Rate
                </div>


                {/* SLA MET / BREACHED */}

                <Row className="g-2 text-center mb-3">

                  <Col xs={6}>

                    <div
                      className="p-2 rounded"
                      style={{
                        backgroundColor: "#f0fdf4",
                      }}
                    >

                      <div className="fw-bold text-success fs-5">
                        {data.sla_met || 0}
                      </div>

                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.75rem",
                        }}
                      >
                        SLA Met
                      </div>

                    </div>

                  </Col>


                  <Col xs={6}>

                    <div
                      className="p-2 rounded"
                      style={{
                        backgroundColor: "#fef2f2",
                      }}
                    >

                      <div className="fw-bold text-danger fs-5">
                        {data.sla_breached || 0}
                      </div>

                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.75rem",
                        }}
                      >
                        SLA Breached
                      </div>

                    </div>

                  </Col>

                </Row>


                {/* RESOLUTION TIME */}

                <div className="pt-3 border-top">

                  <div
                    className="text-muted"
                    style={{
                      fontSize: "0.8rem",
                    }}
                  >
                    Avg. Resolution Time
                  </div>

                  <div className="fw-bold fs-5 mt-1">
                    {formatResolutionTime(
                      data.avg_resolution_time
                    )}
                  </div>

                </div>


                {/* ACTIVE WORKLOAD */}

                <div className="pt-3 border-top">

                  <div
                    className="text-muted"
                    style={{
                      fontSize: "0.8rem",
                    }}
                  >
                    Active Workload
                  </div>

                  <div className="mt-1">

                    <Badge
                      bg={getWorkloadVariant(
                        data.workload
                      )}
                      className="px-3 py-2"
                      style={{
                        fontSize: "0.9rem",
                      }}
                    >

                      {data.workload || "Low"} —{" "}
                      {data.active_tickets || 0} active

                    </Badge>

                  </div>

                </div>

              </div>

            </Card.Body>

          </Card>

        </Col>

      </Row>


      {/* ===================================================
          PERFORMANCE / QUICK ACTIONS / RECENT TICKETS
      =================================================== */}

      <Row className="g-3 mb-4">


        {/* =================================================
            PERFORMANCE
        ================================================= */}

        <Col md={4}>

          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <h6 className="fw-bold border-bottom pb-2 mb-3">

                <FaStar className="me-2 text-warning" />

                My Performance

              </h6>


              <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">

                <span className="text-muted">
                  Tickets Resolved:
                </span>

                <span className="fw-bold">
                  {data.resolved || 0}
                </span>

              </div>


              <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">

                <span className="text-muted">
                  Tickets Closed:
                </span>

                <span className="fw-bold">
                  {data.closed || 0}
                </span>

              </div>


              <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">

                <span className="text-muted">
                  Average Rating:
                </span>

                <span className="fw-bold text-warning">
                  {data.avg_rating || 0} / 5.0 ⭐
                </span>

              </div>


              <div className="d-flex justify-content-between p-2 bg-light rounded">

                <span className="text-muted">
                  High/Critical Active:
                </span>

                <span
                  className={`fw-bold ${
                    data.high_critical > 0
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {data.high_critical || 0}
                </span>

              </div>

            </Card.Body>

          </Card>

        </Col>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <Col md={4}>

          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <h6 className="fw-bold border-bottom pb-2 mb-3">
                Quick Actions
              </h6>


              <div className="d-grid gap-2">


                <Button
                  variant="outline-primary"
                  className="text-start rounded-3"
                  onClick={() =>
                    navigate(
                      "/technician/tickets?status=assigned,reopened"
                    )
                  }
                >

                  <FaListAlt className="me-2" />

                  View Pending Tickets

                </Button>


                <Button
                  variant="outline-warning"
                  className="text-start rounded-3"
                  onClick={() =>
                    navigate(
                      "/technician/tickets?status=in_progress"
                    )
                  }
                >

                  <FaClock className="me-2" />

                  View In-Progress

                </Button>


                <Button
                  variant="outline-success"
                  className="text-start rounded-3"
                  onClick={() =>
                    navigate(
                      "/technician/tickets?status=resolved"
                    )
                  }
                >

                  <FaCheckCircle className="me-2" />

                  View Resolved

                </Button>


                <Button
                  variant="outline-secondary"
                  className="text-start rounded-3"
                  onClick={() =>
                    navigate("/technician/performance")
                  }
                >

                  <FaStar className="me-2" />

                  View Full Performance

                </Button>

              </div>

            </Card.Body>

          </Card>

        </Col>


        {/* =================================================
            RECENT TICKETS
        ================================================= */}

        <Col md={4}>

          <Card className="border-0 shadow-sm h-100">

            <Card.Header
              className="bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center"
            >

              <h6 className="fw-bold mb-0">
                Recent Tickets
              </h6>


              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 text-decoration-none"
                onClick={() =>
                  navigate("/technician/tickets")
                }
              >
                View All
              </Button>

            </Card.Header>


            <Card.Body className="pt-2">

              {data.recent_tickets &&
              data.recent_tickets.length > 0 ? (

                <div className="table-responsive">

                  <Table
                    hover
                    size="sm"
                    className="align-middle mb-0"
                  >

                    <thead>

                      <tr>

                        <th
                          style={{
                            fontSize: "0.78rem",
                          }}
                        >
                          Ticket #
                        </th>

                        <th
                          style={{
                            fontSize: "0.78rem",
                          }}
                        >
                          Employee
                        </th>

                        <th
                          style={{
                            fontSize: "0.78rem",
                          }}
                        >
                          Priority
                        </th>

                        <th
                          style={{
                            fontSize: "0.78rem",
                          }}
                        >
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {data.recent_tickets.map(
                        (ticket) => (

                          <tr
                            key={ticket.id}
                            style={{
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(
                                `/technician/tickets/${ticket.id}`
                              )
                            }
                          >

                            <td
                              className="fw-medium"
                              style={{
                                fontSize: "0.78rem",
                              }}
                            >
                              {ticket.ticket_number}
                            </td>


                            <td
                              className="text-muted"
                              style={{
                                fontSize: "0.78rem",
                              }}
                            >
                              {ticket.employee_name}
                            </td>


                            <td>

                              <Badge
                                className={`badge-priority-${ticket.priority}`}
                                style={{
                                  fontSize: "0.7rem",
                                }}
                              >
                                {ticket.priority}
                              </Badge>

                            </td>


                            <td>

                              <Badge
                                className={`badge-status-${ticket.status}`}
                                style={{
                                  fontSize: "0.7rem",
                                }}
                              >

                                {String(
                                  ticket.status || ""
                                ).replace(
                                  "_",
                                  " "
                                )}

                              </Badge>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </Table>

                </div>

              ) : (

                <div
                  className="text-center text-muted py-4"
                  style={{
                    fontSize: "0.85rem",
                  }}
                >
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