import { useState, useEffect, useContext, useRef } from "react";
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
  FaRegStar,
  FaClock,
  FaRedo,
  FaTimesCircle,
  FaShieldAlt,
  FaTachometerAlt,
  FaSyncAlt,
  FaCalendarAlt,
  FaChevronRight,
  FaBolt,
  FaTags,
  FaChartPie,
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
import { AuthContext } from "../../context/AuthContext";

/* ══════════════════════════════════════════════
   GLOBAL ANIMATION STYLES (self-contained)
══════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    /* ── Keyframes ── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -500px 0; }
      100% { background-position: 500px 0; }
    }
    @keyframes gradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes pulseDot {
      0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70%  { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    @keyframes pulseDanger {
      0%   { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
      70%  { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    @keyframes pulseAmber {
      0%   { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.45); }
      70%  { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes popIn {
      0%   { transform: scale(0); opacity: 0; }
      80%  { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateX(-16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-5px); }
    }
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.06); }
    }

    /* ── Entrance ── */
    .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

    /* ── Hero header (sunset theme) ── */
    .hero-header {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #9a3412 0%, #ea580c 45%, #f59e0b 100%);
      background-size: 200% 200%;
      animation: gradientShift 10s ease infinite;
    }
    .hero-blob {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.07);
      pointer-events: none;
    }
    .hero-blob.b1 { width: 240px; height: 240px; right: -70px; top: -80px; animation: float 6s ease-in-out infinite; }
    .hero-blob.b2 { width: 140px; height: 140px; right: 150px; bottom: -60px; animation: float 8s ease-in-out infinite reverse; }
    .glass-pill {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      transition: all 0.25s ease;
    }
    .glass-pill:hover { background: rgba(255, 255, 255, 0.22); color: #fff; transform: translateY(-1px); }
    .glass-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      transition: all 0.25s ease;
    }
    .glass-btn:hover, .glass-btn:focus { background: rgba(255, 255, 255, 0.28); color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #34d399; display: inline-block;
      animation: pulseDot 2s infinite;
    }
    .spin-icon { animation: spin 0.9s linear infinite; display: inline-block; }

    /* ── KPI Cards ── */
    .kpi-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease;
    }
    .kpi-card::before {
      content: '';
      position: absolute; top: 0; left: -80%;
      width: 50%; height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
      transform: skewX(-20deg);
      transition: left 0.7s ease;
      z-index: 1; pointer-events: none;
    }
    .kpi-card:hover::before { left: 130%; }
    .kpi-card:hover {
      transform: translateY(-6px) scale(1.01);
      box-shadow: 0 16px 32px -8px rgba(15, 23, 42, 0.14) !important;
    }
    .kpi-card .decor-circle {
      position: absolute; right: -24px; bottom: -24px;
      width: 90px; height: 90px; border-radius: 50%;
      pointer-events: none; opacity: 0.07;
    }
    .kpi-icon { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .kpi-card:hover .kpi-icon { transform: scale(1.12) rotate(-6deg); }

    /* ── Shimmer Skeletons ── */
    .skeleton {
      background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%);
      background-size: 1000px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 8px;
    }

    /* ── Charts / Cards ── */
    .chart-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .chart-card:hover { box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.12) !important; }
    .chart-tooltip {
      animation: fadeInUp 0.18s ease;
      border-radius: 10px !important;
      border: 1px solid #e2e8f0 !important;
    }
    .donut-center { pointer-events: none; }

    /* ── Performance stat rows ── */
    .perf-row {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .perf-row:hover {
      transform: translateX(4px);
      box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.12);
      border-color: #fcd34d !important;
    }

    /* ── Quick Actions ── */
    .quick-action {
      display: flex; align-items: center; gap: 14px;
      width: 100%; text-align: left;
      padding: 14px 16px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .quick-action:hover {
      transform: translateX(6px);
      border-color: #fdba74;
      box-shadow: 0 8px 20px -8px rgba(234, 88, 12, 0.25);
      background: #fffbeb;
    }
    .quick-action .qa-icon {
      width: 42px; height: 42px; min-width: 42px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .quick-action:hover .qa-icon { transform: scale(1.12) rotate(-6deg); }
    .quick-action .qa-arrow {
      margin-left: auto; color: #cbd5e1;
      transition: all 0.25s ease;
      font-size: 0.75rem;
    }
    .quick-action:hover .qa-arrow { color: #ea580c; transform: translateX(4px); }

    /* ── Tables ── */
    .anim-table tbody tr {
      animation: rowIn 0.45s ease both;
      transition: background 0.2s ease;
    }
    .anim-table tbody tr:hover { background: #fffbeb; }

    /* ── Workload gauge ── */
    .wl-segment {
      flex: 1; height: 8px; border-radius: 50rem;
      background: #f1f5f9;
      transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* ── Misc ── */
    .breathe { animation: breathe 4s ease-in-out infinite; }
    .breach-alert { animation: pulseDanger 2s infinite; }
    .hc-alert { animation: pulseAmber 2s infinite; }
    .star-pop { display: inline-block; animation: popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */

/* Animated number counter (easeOutCubic) */
const AnimatedNumber = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (typeof value !== "number" || isNaN(value)) return;
    const startValue = prevRef.current;
    const startTime = performance.now();
    let raf;
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startValue + (value - startValue) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
      else prevRef.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (typeof value !== "number" || isNaN(value)) return value;
  return Number.isInteger(value) ? Math.round(display) : display.toFixed(1);
};

/* Renders value — animates numbers & "92%" strings */
const AnimatedValue = ({ value }) => {
  if (typeof value === "number") return <AnimatedNumber value={value} />;
  const match = String(value).match(/^([\d.]+)(.*)$/);
  if (match) {
    return (
      <>
        <AnimatedNumber value={parseFloat(match[1])} />
        {match[2]}
      </>
    );
  }
  return value;
};

/* Scroll-reveal wrapper using IntersectionObserver */
const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* Delayed mount — triggers CSS width/stroke transitions */
const useMounted = (delay = 400) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return mounted;
};

/* ══════════════════════════════════════════════
   DEFAULT DATA
══════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════
   COLORS
══════════════════════════════════════════════ */

const STATUS_COLORS = {
  Open: "#3b82f6",
  open: "#3b82f6",
  Assigned: "#06b6d4",
  assigned: "#06b6d4",
  "In Progress": "#f59e0b",
  in_progress: "#f59e0b",
  Resolved: "#10b981",
  resolved: "#10b981",
  Closed: "#6b7280",
  closed: "#6b7280",
  Reopened: "#ef4444",
  reopened: "#ef4444",
};

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

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */

const formatResolutionTime = (hours) => {
  if (hours === null || hours === undefined) return "N/A";
  const numericHours = Number(hours);
  if (Number.isNaN(numericHours)) return "N/A";
  if (numericHours < 1) return `${Math.round(numericHours * 60)} min`;
  if (numericHours < 24) return `${numericHours.toFixed(1)} hrs`;
  return `${(numericHours / 24).toFixed(1)} days`;
};

const getSlaColor = (pct) => {
  if (pct === null || pct === undefined) return "#64748b";
  if (pct >= 90) return "#10b981";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
};

const getWorkloadVariant = (workload) => {
  if (workload === "High") return "danger";
  if (workload === "Medium") return "warning";
  return "success";
};

const getWorkloadColorHex = (workload) => {
  if (workload === "High") return "#ef4444";
  if (workload === "Medium") return "#f59e0b";
  return "#10b981";
};

const normalizeStatusData = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const name = item.name || item.status || "Unknown";
    return {
      ...item,
      name,
      value: Number(item.value || item.count || 0),
      fill: item.fill || STATUS_COLORS[name] || STATUS_COLORS[name?.toLowerCase()] || "#64748b",
    };
  });
};

const normalizePriorityData = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const name = item.name || item.priority || "Unknown";
    return {
      ...item,
      name,
      value: Number(item.value || item.count || 0),
      fill: item.fill || PRIORITY_COLORS[name] || PRIORITY_COLORS[name?.toLowerCase()] || "#64748b",
    };
  });
};

/* ══════════════════════════════════════════════
   KPICard — Gradient icon, shine sweep, counter
══════════════════════════════════════════════ */
const KPICard = ({ icon, bgColor, label, value, valueColor, delay = 0, onClick }) => (
  <Card
    className="border-0 shadow-sm rounded-4 h-100 kpi-card fade-in-up"
    style={{ cursor: onClick ? "pointer" : "default", animationDelay: `${delay}ms` }}
    onClick={onClick}
  >
    <div className="decor-circle" style={{ backgroundColor: "#ea580c" }} />
    <Card.Body className="d-flex align-items-center p-3 p-lg-4" style={{ position: "relative", zIndex: 2 }}>
      <div
        className="rounded-4 d-flex align-items-center justify-content-center me-3 flex-shrink-0 kpi-icon"
        style={{ width: "48px", height: "48px", background: bgColor, boxShadow: "0 6px 16px -6px rgba(0,0,0,0.25)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-muted small text-truncate" style={{ fontSize: "0.76rem", fontWeight: 500, letterSpacing: "0.02em" }}>
          {label}
        </div>
        <div className="fw-bold fs-4" style={{ color: valueColor || "#1e293b", lineHeight: 1.2 }}>
          <AnimatedValue value={value} />
        </div>
      </div>
    </Card.Body>
  </Card>
);

/* ══════════════════════════════════════════════
   SECTION HEADER + CHART TOOLTIP
══════════════════════════════════════════════ */
const SectionHeader = ({ icon, iconBg, title }) => (
  <div className="d-flex align-items-center gap-2 mb-4">
    <div
      className="rounded-4 d-flex align-items-center justify-content-center breathe"
      style={{ width: "36px", height: "36px", backgroundColor: iconBg }}
    >
      {icon}
    </div>
    <h6 className="fw-bold text-dark mb-0" style={{ letterSpacing: "-0.01em" }}>{title}</h6>
  </div>
);

const ChartTooltip = ({ payload, suffix }) => {
  if (payload && payload.length > 0) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border p-2 px-3 shadow-sm chart-tooltip" style={{ fontSize: "0.8rem" }}>
        <strong className="text-dark">{d.name}:</strong> {d.value}{suffix || ""}
      </div>
    );
  }
  return null;
};

/* ══════════════════════════════════════════════
   SKELETONS (shimmer)
══════════════════════════════════════════════ */
const SkeletonCard = () => (
  <Card className="border-0 shadow-sm rounded-4 h-100">
    <Card.Body className="d-flex align-items-center p-4">
      <div className="skeleton me-3" style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14 }} />
      <div className="w-100">
        <div className="skeleton mb-2" style={{ width: "70%", height: 12 }} />
        <div className="skeleton" style={{ width: "40%", height: 24 }} />
      </div>
    </Card.Body>
  </Card>
);

const SkeletonChart = () => (
  <Card className="border-0 shadow-sm rounded-4 h-100">
    <Card.Body className="p-4">
      <div className="skeleton mb-4" style={{ width: "45%", height: 16 }} />
      <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
        <Spinner animation="border" variant="secondary" size="sm" />
      </div>
    </Card.Body>
  </Card>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const mounted = useMounted(500);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const res = await dashboardService.getMyPerformance();

      let technicianData = null;

      if (res?.success && res?.technician) {
        technicianData = res.technician;
      } else if (res?.data?.technician) {
        technicianData = res.data.technician;
      } else if (res?.data) {
        technicianData = res.data;
      }

      if (!technicianData) {
        setError(res?.error || "Dashboard data not found.");
        return;
      }

      const normalizedData = {
        ...DEFAULT_DATA,
        ...technicianData,
        status_distribution: normalizeStatusData(technicianData.status_distribution),
        priority_distribution: normalizePriorityData(technicianData.priority_distribution),
        recent_tickets: Array.isArray(technicianData.recent_tickets)
          ? technicianData.recent_tickets
          : [],
      };

      setData(normalizedData);
    } catch (err) {
      console.error("TECHNICIAN DASHBOARD ERROR:", err);

      if (err.response?.status === 403) {
        setError("Access denied.");
      } else if (err.response?.data?.error) {
        const apiError = err.response.data.error;
        setError(typeof apiError === "string" ? apiError : "Failed to load dashboard.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── Greeting & date ── */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const userName =
    user?.first_name || user?.username
      ? `${user?.first_name || user?.username}`
      : "Technician";

  const slaColor = getSlaColor(data.sla_success_pct);
  const workloadColor = getWorkloadColorHex(data.workload);

  /* ── SLA Ring geometry ── */
  const slaRingSize = 130;
  const slaRingThickness = 5;
  const slaRadius = (slaRingSize - slaRingThickness) / 2;
  const slaCircumference = 2 * Math.PI * slaRadius;
  const slaProgress =
    data.sla_success_pct ? (data.sla_success_pct / 100) * slaCircumference : 0;

  /* ── KPI config (data-driven for stagger) ── */
  const kpiCards = [
    { icon: <FaListAlt size={22} className="text-white" />, bg: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "Total Assigned", value: data.total_assigned || 0, route: "/technician/tickets" },
    { icon: <FaListAlt size={22} className="text-white" />, bg: "linear-gradient(135deg, #22d3ee, #06b6d4)", label: "Open / Assigned", value: data.open_assigned || 0, route: "/technician/tickets?status=assigned,reopened" },
    { icon: <FaClock size={22} className="text-white" />, bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", label: "In Progress", value: data.in_progress || 0, route: "/technician/tickets?status=in_progress" },
    { icon: <FaCheckCircle size={22} className="text-white" />, bg: "linear-gradient(135deg, #34d399, #10b981)", label: "Resolved", value: data.resolved || 0, route: "/technician/tickets?status=resolved" },
    { icon: <FaTimesCircle size={22} className="text-white" />, bg: "linear-gradient(135deg, #94a3b8, #64748b)", label: "Closed", value: data.closed || 0, route: "/technician/tickets?status=closed" },
    { icon: <FaRedo size={22} className="text-white" />, bg: "linear-gradient(135deg, #f87171, #ef4444)", label: "Reopened", value: data.reopened || 0, route: "/technician/tickets?status=reopened" },
  ];

  /* ── Quick actions config ── */
  const quickActions = [
    { icon: <FaListAlt className="text-white" style={{ fontSize: "1rem" }} />, bg: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "View Pending Tickets", onClick: () => navigate("/technician/tickets?status=assigned,reopened") },
    { icon: <FaClock className="text-white" style={{ fontSize: "1rem" }} />, bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", label: "View In-Progress", onClick: () => navigate("/technician/tickets?status=in_progress") },
    { icon: <FaCheckCircle className="text-white" style={{ fontSize: "1rem" }} />, bg: "linear-gradient(135deg, #34d399, #10b981)", label: "View Resolved", onClick: () => navigate("/technician/tickets?status=resolved") },
    { icon: <FaStar className="text-white" style={{ fontSize: "1rem" }} />, bg: "linear-gradient(135deg, #f472b6, #db2777)", label: "View Full Performance", onClick: () => navigate("/technician/performance") },
  ];

  /* ════════════ LOADING ════════════ */
  if (loading) {
    return (
      <div className="py-4 px-3 px-md-4">
        <GlobalStyles />
        <div className="skeleton mb-4" style={{ width: "100%", height: 110, borderRadius: 18 }} />
        <Row className="g-3 mb-4">
          {[...Array(6)].map((_, i) => (
            <Col xs={6} md={4} lg={2} key={i}>
              <SkeletonCard />
            </Col>
          ))}
        </Row>
        <Row className="g-3">
          {[...Array(3)].map((_, i) => (
            <Col md={4} key={i}>
              <SkeletonChart />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  /* ════════════ ERROR ════════════ */
  if (error) {
    return (
      <div className="py-4 px-3 px-md-4">
        <GlobalStyles />
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">Technician Dashboard</h4>
          <p className="text-muted mb-0">Manage your assigned IT support requests.</p>
        </div>

        <Alert variant="danger" className="d-flex align-items-center rounded-4 border-0 fade-in-up">
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>

        <Button variant="primary" className="rounded-pill px-4 mt-3" onClick={() => fetchDashboard()}>
          <FaSyncAlt className="me-2" /> Retry
        </Button>
      </div>
    );
  }

  const statusData = Array.isArray(data.status_distribution) ? data.status_distribution : [];
  const priorityData = Array.isArray(data.priority_distribution) ? data.priority_distribution : [];
  const roundedRating = Math.round(Number(data.avg_rating) || 0);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      <GlobalStyles />

      {/* ════════════ HERO HEADER ════════════ */}
      <div className="hero-header rounded-4 p-4 p-md-5 mb-4 text-white fade-in-up">
        <div className="hero-blob b1" />
        <div className="hero-blob b2" />
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-3"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="live-dot" />
              <small style={{ opacity: 0.85, fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                MY WORK QUEUE
              </small>
            </div>
            <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.02em" }}>
              {getGreeting()}, {userName}! 👋
            </h3>
            <div className="d-flex align-items-center gap-2" style={{ opacity: 0.9, fontSize: "0.85rem" }}>
              <FaCalendarAlt style={{ fontSize: "0.75rem" }} /> {todayStr}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Quick stat pills */}
            <span className="glass-pill rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
              <FaClock style={{ fontSize: "0.7rem" }} /> Active: <strong>{data.active_tickets || 0}</strong>
            </span>
            <span className="glass-pill rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
              <FaExclamationTriangle style={{ fontSize: "0.7rem" }} /> High/Critical: <strong>{data.high_critical || 0}</strong>
            </span>
            <Button
              className="glass-btn rounded-pill px-4 d-flex align-items-center"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <><FaSyncAlt className="me-2 spin-icon" /> Refreshing...</>
              ) : (
                <><FaSyncAlt className="me-2" /> Refresh</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ════════════ KPI CARDS ════════════ */}
      <Row className="g-3 mb-4">
        {kpiCards.map((k, i) => (
          <Col xs={6} md={4} lg={2} key={i}>
            <KPICard
              icon={k.icon}
              bgColor={k.bg}
              label={k.label}
              value={k.value}
              delay={i * 70}
              onClick={() => navigate(k.route)}
            />
          </Col>
        ))}
      </Row>

      {/* ════════════ STATUS / PRIORITY / SLA ════════════ */}
      <Row className="g-3 mb-4">
        {/* Ticket Status Donut */}
        <Reveal delay={0} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaChartPie style={{ fontSize: "0.9rem", color: "#4f46e5" }} />}
                iconBg="#e0e7ff"
                title="Ticket Status"
              />

              {statusData.length > 0 ? (
                <>
                  <div className="position-relative">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                          animationDuration={900}
                          animationEasing="ease-out"
                        >
                          {statusData.map((entry, index) => (
                            <Cell
                              key={`status-${index}`}
                              fill={entry.fill || STATUS_COLORS[entry.name] || "#64748b"}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip suffix=" tickets" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Animated center total */}
                    <div className="donut-center position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                      <span className="fw-bold fs-4 text-dark" style={{ lineHeight: 1 }}>
                        <AnimatedNumber value={data.total_assigned || 0} />
                      </span>
                      <span className="text-muted" style={{ fontSize: "0.62rem" }}>Total</span>
                    </div>
                  </div>

                  {/* Legend pills */}
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                    {statusData.map((item, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill fade-in-up"
                        style={{ backgroundColor: "#f8fafc", fontSize: "0.72rem", animationDelay: `${index * 80}ms` }}
                      >
                        <span
                          className="rounded-circle"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: item.fill || STATUS_COLORS[item.name] || "#64748b",
                          }}
                        />
                        <span className="text-muted">{item.name}</span>
                        <strong className="text-dark">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaListAlt style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No ticket status data</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Reveal>

        {/* Priority Bar */}
        <Reveal delay={100} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaTags style={{ fontSize: "0.9rem", color: "#f59e0b" }} />}
                iconBg="#fef3c7"
                title="Priority Overview"
              />

              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priorityData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "#fffbeb" }}
                      content={<ChartTooltip suffix=" tickets" />}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      name="Tickets"
                      maxBarSize={40}
                      animationDuration={900}
                      animationEasing="ease-out"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell
                          key={`priority-${index}`}
                          fill={entry.fill || PRIORITY_COLORS[entry.name] || "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaTachometerAlt style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No priority data</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Reveal>

        {/* SLA Performance — Animated Ring */}
        <Reveal delay={200} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaShieldAlt style={{ fontSize: "0.9rem", color: "#10b981" }} />}
                iconBg="#d1fae5"
                title="SLA Performance"
              />

              <div className="text-center">
                {/* Animated SLA Ring */}
                <div className="position-relative d-inline-block mb-3">
                  <svg width={slaRingSize} height={slaRingSize} style={{ transform: "rotate(-90deg)" }}>
                    <circle
                      cx={slaRingSize / 2}
                      cy={slaRingSize / 2}
                      r={slaRadius}
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth={slaRingThickness}
                    />
                    <circle
                      cx={slaRingSize / 2}
                      cy={slaRingSize / 2}
                      r={slaRadius}
                      fill="none"
                      stroke={slaColor}
                      strokeWidth={slaRingThickness}
                      strokeDasharray={slaCircumference}
                      strokeDashoffset={mounted ? slaCircumference - slaProgress : slaCircumference}
                      strokeLinecap="round"
                      style={{
                        transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)",
                        filter: `drop-shadow(0 0 6px ${slaColor}55)`,
                      }}
                    />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                    <span className="fw-bold" style={{ fontSize: "1.7rem", lineHeight: 1, color: slaColor }}>
                      <AnimatedValue
                        value={
                          data.sla_success_pct !== null && data.sla_success_pct !== undefined
                            ? `${data.sla_success_pct}%`
                            : "N/A"
                        }
                      />
                    </span>
                    <span className="text-muted" style={{ fontSize: "0.62rem" }}>Success Rate</span>
                  </div>
                </div>

                {/* SLA Met / Breached */}
                <Row className="g-2 mt-2 mb-3">
                  <Col xs={6}>
                    <div className="p-3 rounded-4 border fade-in-up" style={{ backgroundColor: "#f0fdf4", animationDelay: "500ms" }}>
                      <div className="fw-bold text-success fs-5">
                        <AnimatedNumber value={data.sla_met || 0} duration={1400} />
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>SLA Met</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 rounded-4 border fade-in-up" style={{ backgroundColor: "#fef2f2", animationDelay: "600ms" }}>
                      <div className="fw-bold text-danger fs-5">
                        <AnimatedNumber value={data.sla_breached || 0} duration={1400} />
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>Breached</div>
                    </div>
                  </Col>
                </Row>

                {/* Resolution Time */}
                <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>Avg. Resolution Time</span>
                  <span className="fw-bold text-dark fs-6">{formatResolutionTime(data.avg_resolution_time)}</span>
                </div>

                {/* Workload — Animated Segmented Gauge */}
                <div className="pt-3 mt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>Active Workload</span>
                    <span className="fw-bold" style={{ fontSize: "0.8rem", color: workloadColor }}>
                      {data.workload || "Low"} — {data.active_tickets || 0} active
                    </span>
                  </div>
                  <div className="d-flex gap-1">
                    {["Low", "Medium", "High"].map((level) => {
                      const isActive = (data.workload || "Low") === level;
                      return (
                        <div
                          key={level}
                          className="wl-segment"
                          style={{
                            backgroundColor: isActive ? workloadColor : "#f1f5f9",
                            boxShadow: isActive ? `0 0 8px ${workloadColor}66` : "none",
                            animation: isActive && level === "High" ? "pulseDanger 2s infinite" : "none",
                            transform: isActive ? "scaleY(1.3)" : "scaleY(1)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Reveal>
      </Row>

      {/* ════════════ PERFORMANCE / QUICK ACTIONS / RECENT TICKETS ════════════ */}
      <Row className="g-3">
        {/* My Performance */}
        <Reveal delay={0} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaStar style={{ fontSize: "0.9rem", color: "#f59e0b" }} />}
                iconBg="#fef3c7"
                title="My Performance"
              />

              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border perf-row fade-in-up" style={{ animationDelay: "0ms" }}>
                  <span className="text-muted small">Tickets Resolved</span>
                  <span className="fw-bold text-dark">
                    <AnimatedNumber value={data.resolved || 0} />
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border perf-row fade-in-up" style={{ animationDelay: "80ms" }}>
                  <span className="text-muted small">Tickets Closed</span>
                  <span className="fw-bold text-dark">
                    <AnimatedNumber value={data.closed || 0} />
                  </span>
                </div>

                {/* Average Rating — stars pop in */}
                <div
                  className="p-3 rounded-4 border perf-row fade-in-up"
                  style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a", animationDelay: "160ms" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Average Rating</span>
                    <span className="fw-bold d-flex align-items-center gap-1" style={{ color: "#f59e0b" }}>
                      <AnimatedNumber value={Number(data.avg_rating) || 0} duration={1400} /> / 5.0
                      <FaStar style={{ fontSize: "0.8rem" }} />
                    </span>
                  </div>
                  <div className="d-flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="star-pop"
                        style={{
                          color: star <= roundedRating ? "#f59e0b" : "#e5e7eb",
                          fontSize: "1rem",
                          animationDelay: `${star * 90 + 200}ms`,
                        }}
                      >
                        {star <= roundedRating ? <FaStar /> : <FaRegStar />}
                      </span>
                    ))}
                  </div>
                </div>

                {/* High/Critical — pulses when > 0 */}
                <div
                  className={`d-flex justify-content-between align-items-center p-3 rounded-4 border perf-row fade-in-up ${data.high_critical > 0 ? "hc-alert" : ""}`}
                  style={{
                    backgroundColor: data.high_critical > 0 ? "#fef2f2" : "#f0fdf4",
                    borderColor: data.high_critical > 0 ? "#fecaca" : "#bbf7d0",
                    animationDelay: "240ms",
                  }}
                >
                  <span className="text-muted small">High/Critical Active</span>
                  <Badge bg={data.high_critical > 0 ? "danger" : "success"} pill className="px-3 py-2">
                    <AnimatedNumber value={data.high_critical || 0} />
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Reveal>

        {/* Quick Actions */}
        <Reveal delay={100} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaBolt style={{ fontSize: "0.9rem", color: "#3b82f6" }} />}
                iconBg="#dbeafe"
                title="Quick Actions"
              />

              <div className="d-grid gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    className="quick-action fade-in-up border-0"
                    style={{ animationDelay: `${i * 90}ms` }}
                    onClick={action.onClick}
                  >
                    <div className="qa-icon" style={{ background: action.bg }}>
                      {action.icon}
                    </div>
                    <span className="fw-semibold text-dark" style={{ fontSize: "0.88rem" }}>
                      {action.label}
                    </span>
                    <FaChevronRight className="qa-arrow" />
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Reveal>

        {/* Recent Tickets */}
        <Reveal delay={200} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden chart-card">
            <div className="d-flex justify-content-between align-items-center p-4 pb-3">
              <SectionHeader
                icon={<FaListAlt style={{ fontSize: "0.9rem", color: "#06b6d4" }} />}
                iconBg="#cffafe"
                title="Recent Tickets"
              />
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 text-decoration-none fw-semibold"
                onClick={() => navigate("/technician/tickets")}
                style={{ transition: "all .2s ease" }}
              >
                View All
              </Button>
            </div>

            {data.recent_tickets && data.recent_tickets.length > 0 ? (
              <div className="table-responsive">
                <Table hover size="sm" className="align-middle mb-0 anim-table">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ fontSize: "0.72rem", paddingLeft: "24px" }} className="text-muted small text-uppercase">Ticket #</th>
                      <th style={{ fontSize: "0.72rem" }} className="text-muted small text-uppercase">Employee</th>
                      <th style={{ fontSize: "0.72rem" }} className="text-muted small text-uppercase">Priority</th>
                      <th style={{ fontSize: "0.72rem", paddingRight: "24px" }} className="text-muted small text-uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_tickets.map((ticket, idx) => (
                      <tr
                        key={ticket.id}
                        style={{ cursor: "pointer", animationDelay: `${idx * 70}ms` }}
                        onClick={() => navigate(`/technician/tickets/${ticket.id}`)}
                      >
                        <td className="fw-bold text-primary text-nowrap" style={{ fontSize: "0.78rem", paddingLeft: "24px" }}>
                          #{ticket.ticket_number}
                        </td>
                        <td className="text-muted text-truncate" style={{ fontSize: "0.78rem", maxWidth: 120 }}>
                          {ticket.employee_name}
                        </td>
                        <td>
                          <Badge className={`badge-priority-${ticket.priority}`} pill style={{ fontSize: "0.68rem" }}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td style={{ paddingRight: "24px" }}>
                          <Badge className={`badge-status-${ticket.status}`} pill style={{ fontSize: "0.68rem" }}>
                            {String(ticket.status || "").replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <FaListAlt style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                <p className="mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                  No recent tickets found.
                </p>
              </div>
            )}
          </Card>
        </Reveal>
      </Row>
    </div>
  );
};

export default TechnicianDashboard;