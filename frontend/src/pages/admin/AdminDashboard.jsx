import { useState, useEffect, useRef } from "react";
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
  FaChartPie,
  FaTags,
  FaBuilding,
  FaRegStar,
  FaCalendarAlt,
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
  AreaChart,
  Area,
} from "recharts";
import aiService from "../../services/aiService";
import dashboardService from "../../services/dashboardService";

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

    /* ── Hero header ── */
    .hero-header {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%);
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
    .hero-blob.b2 { width: 140px; height: 140px; right: 130px; bottom: -60px; animation: float 8s ease-in-out infinite reverse; }
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
      pointer-events: none;
    }
    .kpi-icon {
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
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

    /* ── AI Section ── */
    .ai-banner {
      background: linear-gradient(135deg, #6d28d9, #4f46e5, #9333ea, #6d28d9);
      background-size: 300% 300%;
      animation: gradientShift 8s ease infinite;
    }
    .ai-icon-float { animation: float 3s ease-in-out infinite; }
    .insight-card {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .insight-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px -6px rgba(139, 92, 246, 0.2);
      border-color: #ddd6fe !important;
    }

    /* ── Tables ── */
    .admin-table tbody tr {
      animation: rowIn 0.45s ease both;
      transition: background 0.2s ease;
    }
    .admin-table tbody tr:hover { background: #f8fafc; }
    .btn-view {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 50%;
      background: #f1f5f9; color: #4f46e5;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .btn-view:hover { background: #4f46e5; color: #fff; transform: scale(1.15) rotate(8deg); }

    /* ── Stars / misc ── */
    .star-pop { display: inline-block; animation: popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .breathe { animation: breathe 4s ease-in-out infinite; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

/* ══════════════════════════════════════════════
   HOOKS & UTILITIES
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

/* Renders value — animates numbers, "92%" strings; falls back gracefully */
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

const AVATAR_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899"];

/* ══════════════════════════════════════════════
   KPICard — Gradient icon, shine sweep, counter
══════════════════════════════════════════════ */
const KPICard = ({ icon, bgColor, label, value, valueColor, subtitle, subtitleColor, onClick, delay = 0 }) => (
  <Card
    className="border-0 shadow-sm rounded-4 h-100 kpi-card fade-in-up"
    style={{ cursor: onClick ? "pointer" : "default", animationDelay: `${delay}ms` }}
    onClick={onClick}
  >
    <div className="decor-circle" style={{ backgroundColor: bgColor.includes("gradient") ? "#6366f1" : bgColor, opacity: 0.07 }} />
    <Card.Body className="d-flex align-items-center p-4" style={{ position: "relative", zIndex: 2 }}>
      <div
        className="rounded-4 d-flex align-items-center justify-content-center me-3 flex-shrink-0 kpi-icon"
        style={{ width: "52px", height: "52px", background: bgColor, boxShadow: `0 6px 16px -6px rgba(0,0,0,0.25)` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-muted small text-truncate" style={{ fontSize: "0.78rem", fontWeight: 500, letterSpacing: "0.02em" }}>
          {label}
        </div>
        <div className="fw-bold fs-4" style={{ color: valueColor || "#1e293b", lineHeight: 1.2 }}>
          <AnimatedValue value={value} />
        </div>
        {subtitle && (
          <div className={`small ${subtitleColor || "text-muted"}`} style={{ fontSize: "0.72rem" }}>
            {subtitle}
          </div>
        )}
      </div>
    </Card.Body>
  </Card>
);

/* ══════════════════════════════════════════════
   SectionHeader
══════════════════════════════════════════════ */
const SectionHeader = ({ icon, iconBg, title, actionButton }) => (
  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div className="d-flex align-items-center gap-2">
      <div
        className="rounded-4 d-flex align-items-center justify-content-center breathe"
        style={{ width: "36px", height: "36px", backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <h6 className="fw-bold text-dark mb-0" style={{ letterSpacing: "-0.01em" }}>{title}</h6>
    </div>
    {actionButton}
  </div>
);

/* ══════════════════════════════════════════════
   Chart Tooltip / Legend
══════════════════════════════════════════════ */
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

const LegendPills = ({ items }) => (
  <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
    {items.map((item, i) => (
      <div
        key={i}
        className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill fade-in-up"
        style={{ backgroundColor: "#f8fafc", fontSize: "0.72rem", animationDelay: `${i * 80}ms` }}
      >
        <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: item.fill }} />
        <span className="text-muted">{item.name}</span>
        <strong className="text-dark">{item.value}</strong>
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════════
   Shimmer Skeletons
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: 220 }}>
        <Spinner animation="border" variant="secondary" size="sm" />
      </div>
    </Card.Body>
  </Card>
);

/* ══════════════════════════════════════════════
   Helper Functions
══════════════════════════════════════════════ */
const formatResolutionTime = (hours) => {
  if (hours === null || hours === undefined) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
};

const getSlaColorHex = (pct) => {
  if (pct === null || pct === undefined) return "#64748b";
  if (pct >= 90) return "#10b981";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
};

const getWorkloadVariant = (w) => (w === "High" ? "danger" : w === "Medium" ? "warning" : "success");

const formatDate = (isoStr) => {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getAvatar = (name, index) => {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3"
      style={{
        width: "34px", height: "34px",
        backgroundColor: `${color}20`, color,
        fontWeight: "700", fontSize: "0.75rem",
        border: `1.5px solid ${color}40`,
      }}
    >
      {initials}
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const mounted = useMounted(500);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
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
      setRefreshing(false);
    }
  };

  const fetchAiInsights = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await aiService.getSupportInsights();
      if (res.success && res.data) {
        setAiInsights(res.data);
      } else {
        setAiError(res.error || "AI insights unavailable.");
      }
    } catch (err) {
      if (err.response?.data?.error) {
        const e = err.response.data.error;
        setAiError(typeof e === "string" ? e : "AI insights unavailable.");
      } else if (!err.response) {
        setAiError("Network error.");
      } else {
        setAiError("AI insights are currently unavailable. Please try again later.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (data && !aiInsights && !aiLoading) {
      fetchAiInsights();
    }
  }, [data]);

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

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="py-4 px-3 px-md-4">
        <GlobalStyles />
        <div className="mb-4">
          <div className="skeleton mb-2" style={{ width: "35%", height: 34, borderRadius: 12 }} />
          <div className="skeleton" style={{ width: "55%", height: 14 }} />
        </div>
        <Row className="g-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <Col xs={12} sm={6} lg={3} key={i}><SkeletonCard /></Col>
          ))}
        </Row>
        <Row className="g-3 mb-4">
          {[...Array(6)].map((_, i) => (
            <Col xs={6} sm={4} lg key={i}><SkeletonCard /></Col>
          ))}
        </Row>
        <Row className="g-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <Col md={4} key={i}><SkeletonChart /></Col>
          ))}
        </Row>
        <Row className="g-3">
          <Col xs={12}><SkeletonChart /></Col>
        </Row>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="py-4 px-3 px-md-4">
        <GlobalStyles />
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">Admin Dashboard</h4>
          <p className="text-muted mb-0">Monitor your organization's IT support operations.</p>
        </div>
        <Alert variant="danger" className="rounded-4 border-0 d-flex align-items-center fade-in-up">
          <FaTimesCircle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
        <Button variant="primary" className="rounded-pill px-4 mt-3" onClick={() => fetchAnalytics()}>
          <FaSyncAlt className="me-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const {
    kpis, ticket_status, priority_distribution, category_distribution,
    department_distribution, monthly_trend, sla, avg_resolution_time,
    assets, feedback, recent_tickets, technician_summary,
  } = data;

  const userName = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).first_name || "Admin"
    : "Admin";

  const slaColor = getSlaColorHex(sla.success_pct);

  /* ── SLA Ring geometry ── */
  const slaRingSize = 130;
  const slaRingThickness = 5;
  const slaRadius = (slaRingSize - slaRingThickness) / 2;
  const slaCircumference = 2 * Math.PI * slaRadius;
  const slaProgress = sla.success_pct ? (sla.success_pct / 100) * slaCircumference : 0;

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      <GlobalStyles />

      {/* ════════════ HERO HEADER ════════════ */}
      <div className="hero-header rounded-4 p-4 p-md-5 mb-4 text-white fade-in-up">
        <div className="hero-blob b1" />
        <div className="hero-blob b2" />
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ position: "relative", zIndex: 2 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="live-dot" />
              <small style={{ opacity: 0.8, fontSize: "0.75rem", letterSpacing: "0.05em" }}>LIVE OVERVIEW</small>
            </div>
            <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.02em" }}>
              {getGreeting()}, {userName}! 👋
            </h3>
            <div className="d-flex align-items-center gap-2" style={{ opacity: 0.85, fontSize: "0.85rem" }}>
              <FaCalendarAlt style={{ fontSize: "0.75rem" }} /> {todayStr}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Quick stat pills */}
            <span className="glass-pill rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
              <FaClock style={{ fontSize: "0.7rem" }} /> Open: <strong>{kpis.open_tickets}</strong>
            </span>
            <span className="glass-pill rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
              <FaCheckCircle style={{ fontSize: "0.7rem" }} /> Resolved: <strong>{kpis.resolved_tickets}</strong>
            </span>
            <Button className="glass-btn rounded-pill px-4 d-flex align-items-center" onClick={() => fetchAnalytics(true)} disabled={refreshing}>
              {refreshing ? (
                <><FaSyncAlt className="me-2 spin-icon" /> Refreshing...</>
              ) : (
                <><FaSyncAlt className="me-2" /> Refresh</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ════════════ PRIMARY KPI CARDS ════════════ */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <KPICard delay={0}
            icon={<FaUsers style={{ fontSize: "1.4rem", color: "#fff" }} />}
            bgColor="linear-gradient(135deg,#2563eb, #3b82f6)"
            label="Total Employees"
            value={kpis.total_employees}
            subtitle={kpis.inactive_employees > 0 ? `${kpis.inactive_employees} inactive` : "All active"}
            subtitleColor={kpis.inactive_employees > 0 ? "text-danger" : "text-success"}
            onClick={() => navigate("/admin/users")}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <KPICard delay={80}
            icon={<FaUserTie style={{ fontSize: "1.4rem", color: "#fff" }} />}
            bgColor="linear-gradient(135deg, #34d399, #10b981)"
            label="Total Technicians"
            value={kpis.total_technicians}
            subtitle={kpis.inactive_technicians > 0 ? `${kpis.inactive_technicians} inactive` : "All active"}
            subtitleColor={kpis.inactive_technicians > 0 ? "text-danger" : "text-success"}
            onClick={() => navigate("/admin/users")}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <KPICard delay={160}
            icon={<FaTicketAlt style={{ fontSize: "1.4rem", color: "#fff" }} />}
            bgColor="linear-gradient(135deg, #2563eb, #3b82f6)"
            label="Total Tickets"
            value={kpis.total_tickets}
            onClick={() => navigate("/admin/tickets")}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <KPICard delay={240}
            icon={<FaShieldAlt style={{ fontSize: "1.4rem", color: "#fff" }} />}
            bgColor={`linear-gradient(135deg, ${slaColor}CC, ${slaColor})`}
            label="SLA Success"
            value={sla.success_pct !== null ? `${sla.success_pct}%` : "N/A"}
            valueColor={slaColor}
            onClick={() => navigate("/admin/technician-performance")}
          />
        </Col>
      </Row>

      {/* ════════════ SECONDARY KPI ROW ════════════ */}
      <Row className="g-3 mb-4">
        {[
          { icon: <FaClock style={{ fontSize: "1.1rem", color: "#3b82f6" }} />, bg: "#dbeafe", label: "Open", value: kpis.open_tickets, delay: 0 },
          { icon: <FaLink style={{ fontSize: "1.1rem", color: "#06b6d4" }} />, bg: "#cffafe", label: "Assigned", value: kpis.assigned_tickets, delay: 60 },
          { icon: <FaSpinner style={{ fontSize: "1.1rem", color: "#f59e0b" }} />, bg: "#fef3c7", label: "In Progress", value: kpis.in_progress_tickets, delay: 120 },
          { icon: <FaCheckCircle style={{ fontSize: "1.1rem", color: "#10b981" }} />, bg: "#d1fae5", label: "Resolved", value: kpis.resolved_tickets, delay: 180 },
          { icon: <FaTimesCircle style={{ fontSize: "1.1rem", color: "#6b7280" }} />, bg: "#f1f5f9", label: "Closed", value: kpis.closed_tickets, delay: 240 },
          { icon: <FaRedo style={{ fontSize: "1.1rem", color: "#ef4444" }} />, bg: "#fee2e2", label: "Reopened", value: kpis.reopened_tickets, delay: 300 },
        ].map((k, i) => (
          <Col xs={6} sm={4} lg key={i}>
            <KPICard delay={k.delay}
              icon={k.icon} bgColor={k.bg} label={k.label} value={k.value}
            />
          </Col>
        ))}
      </Row>

      {/* ════════════ AI SUPPORT INSIGHTS ════════════ */}
      <Reveal className="mb-4">
        <Row className="g-3">
          <Col xs={12}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              {/* Animated gradient banner */}
              <div className="d-flex justify-content-between align-items-center px-4 py-3 ai-banner">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-4 d-flex align-items-center justify-content-center ai-icon-float" style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.2)" }}>
                    <FaMagic style={{ fontSize: "1rem", color: "white" }} />
                  </div>
                  <div>
                    <span className="fw-bold d-block text-white" style={{ fontSize: "0.95rem" }}>AI Support Insights</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)" }}>Smart analysis of your support data</span>
                  </div>
                </div>
                <Button className="glass-btn rounded-pill px-3 d-flex align-items-center" size="sm" onClick={fetchAiInsights} disabled={aiLoading}>
                  {aiLoading ? (
                    <><FaSyncAlt className="me-1 spin-icon" /> Analyzing...</>
                  ) : (
                    <><FaSyncAlt className="me-1" /> Refresh</>
                  )}
                </Button>
              </div>

              <Card.Body className="p-4">
                {aiError && (
                  <Alert variant="warning" className="d-flex align-items-start py-2 mb-0 rounded-4 border-0 fade-in-up" dismissible onClose={() => setAiError("")}>
                    <FaRobot className="me-2 mt-1 flex-shrink-0" />
                    <div>
                      <div className="fw-semibold small">AI Insights Unavailable</div>
                      <div className="small mb-0">{aiError}</div>
                    </div>
                  </Alert>
                )}

                {aiLoading && !aiInsights && !aiError && (
                  <div className="text-center py-4">
                    <Spinner animation="border" style={{ color: "#2563eb" }} size="sm" />
                    <div className="text-muted small mt-2">Analyzing your support data...</div>
                  </div>
                )}

                {aiInsights && (
                  <div>
                    {aiInsights.summary && (
                      <div className="p-4 rounded-4 mb-4 fade-in-up" style={{ backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                        <div className="d-flex align-items-start gap-3">
                          <div className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0 breathe" style={{ width: "36px", height: "36px", backgroundColor: "#ede9fe" }}>
                            <FaLightbulb style={{ fontSize: "0.85rem", color:  "#3b82f6" }} />
                          </div>
                          <div className="fw-medium text-dark" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                            {aiInsights.summary}
                          </div>
                        </div>
                      </div>
                    )}

                    {aiInsights.insights && aiInsights.insights.length > 0 && (
                      <Row className="g-3">
                        {aiInsights.insights.map((insight, idx) => (
                          <Col md={6} key={idx}>
                            <div className="p-3 rounded-4 border h-100 d-flex align-items-start gap-2 insight-card fade-in-up"
                              style={{ backgroundColor: "#fafafa", animationDelay: `${idx * 100}ms` }}>
                              <span
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                                style={{ width: 22, height: 22, backgroundColor: insight.color || "#8b5cf6", fontSize: "0.7rem", marginTop: "2px" }}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <Badge bg="light" text="dark" pill className="mb-1 border" style={{ fontSize: "0.6rem", fontWeight: 600 }}>
                                  {insight.type.replace("_", " ")}
                                </Badge>
                                <div className="text-muted" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                                  {insight.text}
                                </div>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}

                    <div className="mt-4 pt-3 border-top d-flex align-items-center gap-2">
                      <FaRobot style={{ fontSize: "0.75rem", color: "#94a3b8" }} />
                      <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                        AI-generated insights from your current PostgreSQL support data
                      </small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Reveal>

      {/* ════════════ TICKET STATUS | PRIORITY | SLA ════════════ */}
      <Row className="g-3 mb-4">
        {/* Ticket Status Donut */}
        <Reveal delay={0} className="col-md-6 col-lg-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader icon={<FaChartPie style={{ fontSize: "0.9rem", color: "#4f46e5" }} />} iconBg="#e0e7ff" title="Ticket Status" />
              {ticket_status.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={ticket_status} cx="50%" cy="50%"
                        innerRadius={50} outerRadius={82} paddingAngle={4} dataKey="value"
                        animationDuration={900} animationEasing="ease-out"
                      >
                        {ticket_status.map((entry, i) => (
                          <Cell key={`s-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <LegendPills items={ticket_status} />
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaChartPie style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Reveal>

        {/* Priority Distribution */}
        <Reveal delay={100} className="col-md-6 col-lg-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader icon={<FaTags style={{ fontSize: "0.9rem", color: "#f59e0b" }} />} iconBg="#fef3c7" title="Priority Distribution" />
              {priority_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart data={priority_distribution} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip suffix=" tickets" />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tickets" maxBarSize={44} animationDuration={900} animationEasing="ease-out">
                      {priority_distribution.map((entry, i) => (
                        <Cell key={`p-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaTags style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Reveal>

        {/* SLA Performance Ring */}
        <Reveal delay={200} className="col-md-12 col-lg-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader icon={<FaShieldAlt style={{ fontSize: "0.9rem", color: "#10b981" }} />} iconBg="#d1fae5" title="SLA Performance" />

              <div className="text-center">
                <div className="position-relative d-inline-block mb-3">
                  <svg width={slaRingSize} height={slaRingSize} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={slaRingSize / 2} cy={slaRingSize / 2} r={slaRadius} fill="none" stroke="#f1f5f9" strokeWidth={slaRingThickness} />
                    <circle
                      cx={slaRingSize / 2} cy={slaRingSize / 2} r={slaRadius}
                      fill="none" stroke={slaColor} strokeWidth={slaRingThickness}
                      strokeDasharray={slaCircumference}
                      strokeDashoffset={mounted ? slaCircumference - slaProgress : slaCircumference}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 6px ${slaColor}55)` }}
                    />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                    <span className="fw-bold" style={{ fontSize: "1.7rem", lineHeight: 1, color: slaColor }}>
                      <AnimatedValue value={sla.success_pct !== null ? `${sla.success_pct}%` : "N/A"} />
                    </span>
                    <span className="text-muted" style={{ fontSize: "0.62rem" }}>Success Rate</span>
                  </div>
                </div>

                <Row className="g-2 mb-3">
                  <Col xs={6}>
                    <div className="p-3 rounded-4 border fade-in-up" style={{ backgroundColor: "#f0fdf4", animationDelay: "500ms" }}>
                      <div className="fw-bold text-success fs-5"><AnimatedNumber value={sla.met} duration={1400} /></div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>SLA Met</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 rounded-4 border fade-in-up" style={{ backgroundColor: "#fef2f2", animationDelay: "600ms" }}>
                      <div className="fw-bold text-danger fs-5"><AnimatedNumber value={sla.breached} duration={1400} /></div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>Breached</div>
                    </div>
                  </Col>
                </Row>

                <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>Avg. Resolution Time</span>
                  <span className="fw-bold text-dark fs-6">{formatResolutionTime(avg_resolution_time)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Reveal>
      </Row>

      {/* ════════════ MONTHLY TICKET TREND ════════════ */}
      <Reveal className="mb-4">
        <Row className="g-3">
          <Col xs={12}>
            <Card className="border-0 shadow-sm rounded-4 chart-card">
              <Card.Body className="p-4">
                <SectionHeader icon={<FaChartLine style={{ fontSize: "0.9rem", color: "#3b82f6" }} />} iconBg="#dbeafe" title="Monthly Ticket Trend" />
                {monthly_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthly_trend}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip suffix=" tickets" />} />
                      <Area
                        type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3}
                        fill="url(#colorTrend)"
                        dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7, strokeWidth: 4 }}
                        name="Tickets" animationDuration={1200} animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-5">
                    <FaChartLine style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                    <p className="mt-2 mb-0">No trend data available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Reveal>

      {/* ════════════ CATEGORY | DEPARTMENT ════════════ */}
      <Row className="g-3 mb-4">
        {[{
          icon: <FaTags style={{ fontSize: "0.9rem", color: "#8b5cf6" }} />, bg: "#ede9fe",
          title: "Tickets by Category", dist: category_distribution, key: "cat",
        }, {
          icon: <FaBuilding style={{ fontSize: "0.9rem", color: "#06b6d4" }} />, bg: "#cffafe",
          title: "Tickets by Department", dist: department_distribution, key: "dept",
        }].map((section, sIdx) => (
          <Reveal key={section.key} delay={sIdx * 100} className="col-md-6">
            <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
              <Card.Body className="p-4">
                <SectionHeader icon={section.icon} iconBg={section.bg} title={section.title} />
                {section.dist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(200, section.dist.length * 40)}>
                    <BarChart data={section.dist} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" fontSize={12} width={110} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip suffix=" tickets" />} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Tickets" maxBarSize={22} animationDuration={900} animationEasing="ease-out">
                        {section.dist.map((entry, i) => (
                          <Cell key={`${section.key}-${i}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-5">
                    {section.icon}
                    <p className="mt-2 mb-0">No data available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Reveal>
        ))}
      </Row>

      {/* ════════════ ASSET OVERVIEW | FEEDBACK ════════════ */}
      <Row className="g-3 mb-4">
        {/* Asset Overview */}
        <Reveal delay={0} className="col-md-6">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaLaptop style={{ fontSize: "0.9rem", color: "#3b82f6" }} />} iconBg="#dbeafe" title="Asset Overview"
                actionButton={
                  <Button variant="light" className="border rounded-pill px-3 d-flex align-items-center" size="sm"
                    onClick={() => navigate("/admin/assets")}
                    style={{ transition: "all .2s ease" }}>
                    Manage <FaEye className="ms-1" />
                  </Button>
                }
              />
              <Row className="g-2">
                {[
                  { label: "Total", value: assets.total, bg: "#eff6ff", color: "#3b82f6" },
                  { label: "Available", value: assets.available, bg: "#f0fdf4", color: "#22c55e" },
                  { label: "Assigned", value: assets.assigned, bg: "#fffbeb", color: "#f59e0b" },
                  { label: "Maintenance", value: assets.maintenance, bg: "#f5f3ff", color: "#8b5cf6" },
                  { label: "Retired", value: assets.retired, bg: "#f8fafc", color: "#64748b" },
                ].map((item, i) => (
                  <Col xs={4} key={i}>
                    <div className="p-3 rounded-4 text-center border h-100 fade-in-up"
                      style={{ backgroundColor: item.bg, animationDelay: `${i * 90}ms` }}>
                      <div className="fw-bold fs-5" style={{ color: item.color }}>
                        <AnimatedNumber value={item.value} />
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>{item.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              {assets.total > 0 && (
                <ResponsiveContainer width="100%" height={170} className="mt-3">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Available", value: assets.available, fill: "#22c55e" },
                        { name: "Assigned", value: assets.assigned, fill: "#f59e0b" },
                        { name: "Maintenance", value: assets.maintenance, fill: "#8b5cf6" },
                        { name: "Retired", value: assets.retired, fill: "#64748b" },
                      ].filter((d) => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={4} dataKey="value"
                      animationDuration={900} animationEasing="ease-out"
                    />
                    <Tooltip content={<ChartTooltip suffix=" assets" />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Reveal>

        {/* Feedback Overview */}
        <Reveal delay={100} className="col-md-6">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaStar style={{ fontSize: "0.9rem", color: "#f59e0b" }} />} iconBg="#fef3c7" title="Feedback Overview"
                actionButton={
                  <Button variant="light" className="border rounded-pill px-3 d-flex align-items-center" size="sm"
                    onClick={() => navigate("/admin/feedback")}
                    style={{ transition: "all .2s ease" }}>
                    View All <FaEye className="ms-1" />
                  </Button>
                }
              />
              {feedback.total > 0 ? (
                <>
                  <div className="text-center py-3 mb-3">
                    <div className="d-flex justify-content-center align-items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="star-pop"
                          style={{ color: star <= Math.round(feedback.avg_rating) ? "#f59e0b" : "#d1d5db", fontSize: "1.2rem", animationDelay: `${star * 90}ms` }}>
                          {star <= Math.round(feedback.avg_rating) ? <FaStar /> : <FaRegStar />}
                        </span>
                      ))}
                    </div>
                    <div className="fw-bold display-6" style={{ color: "#f59e0b", lineHeight: 1 }}>
                      <AnimatedValue value={feedback.avg_rating} />
                      <span className="fs-6 text-muted"> / 5</span>
                    </div>
                    <div className="text-muted small">
                      {feedback.total} review{feedback.total !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {feedback.rating_distribution && feedback.rating_distribution.length > 0 ? (
                    <div className="d-flex flex-column gap-2 px-2">
                      {[...feedback.rating_distribution].reverse().map((item, i) => {
                        const pct = feedback.total > 0 ? (item.value / feedback.total) * 100 : 0;
                        const starCount = 5 - i;
                        return (
                          <div key={i} className="d-flex align-items-center gap-2">
                            <span className="d-flex align-items-center flex-shrink-0" style={{ fontSize: "0.72rem", color: "#64748b", minWidth: "26px" }}>
                              {starCount} <FaStar style={{ color: "#f59e0b", fontSize: "0.6rem", marginLeft: "2px" }} />
                            </span>
                            <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: "8px", backgroundColor: "#f1f5f9" }}>
                              <div
                                className="h-100 rounded-pill"
                                style={{
                                  width: mounted ? `${pct}%` : "0%",
                                  backgroundColor: starCount >= 4 ? "#10b981" : starCount === 3 ? "#f59e0b" : "#ef4444",
                                  transition: `width 1s cubic-bezier(0.22,1,0.36,1) ${i * 120}ms`,
                                }}
                              />
                            </div>
                            <span className="text-muted flex-shrink-0" style={{ fontSize: "0.72rem", minWidth: "20px", textAlign: "right" }}>
                              {item.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3 small">No rating breakdown available</div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaStar style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No feedback data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Reveal>
      </Row>

      {/* ════════════ TECHNICIAN SUMMARY ════════════ */}
      <Reveal className="mb-4">
        <Row className="g-3">
          <Col xs={12}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden chart-card">
              <div className="p-4 pb-3">
                <SectionHeader
                  icon={<FaTools style={{ fontSize: "0.9rem", color: "#f59e0b" }} />} iconBg="#fef3c7" title="Technician Workload Summary"
                  actionButton={
                    <Button variant="light" className="border rounded-pill px-3" size="sm"
                      onClick={() => navigate("/admin/technician-performance")}
                      style={{ transition: "all .2s ease" }}>
                      View All Performance
                    </Button>
                  }
                />
              </div>

              {technician_summary.length > 0 ? (
                <div className="table-responsive">
                  <Table hover responsive className="align-middle mb-0 admin-table">
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ paddingLeft: "24px", minWidth: "180px" }} className="text-muted small text-uppercase">Technician</th>
                        <th className="text-center text-muted small text-uppercase" style={{ width: "120px" }}>Active</th>
                        <th className="text-center text-muted small text-uppercase" style={{ width: "110px" }}>Resolved</th>
                        <th className="text-center text-muted small text-uppercase" style={{ width: "130px" }}>SLA %</th>
                        <th className="text-center text-muted small text-uppercase" style={{ width: "120px", paddingRight: "24px" }}>Workload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technician_summary.map((tech, index) => (
                        <tr key={tech.id} style={{ animationDelay: `${index * 70}ms` }}>
                          <td style={{ paddingLeft: "24px" }}>
                            <div className="d-flex align-items-center">
                              {getAvatar(tech.name, index)}
                              <span className="fw-semibold text-dark">{tech.name}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            {tech.active_tickets > 0 ? (
                              <Badge bg="light" text="dark" pill className="border px-3 py-2">{tech.active_tickets}</Badge>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td className="text-center fw-semibold text-success">{tech.resolved}</td>
                          <td className="text-center">
                            {tech.sla_success_pct !== null ? (
                              <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: "80px" }}>
                                <div className="w-100 rounded-pill overflow-hidden" style={{ height: "6px", backgroundColor: "#f1f5f9" }}>
                                  <div className="h-100 rounded-pill"
                                    style={{
                                      width: mounted ? `${tech.sla_success_pct}%` : "0%",
                                      backgroundColor: getSlaColorHex(tech.sla_success_pct),
                                      transition: `width 1s cubic-bezier(0.22,1,0.36,1) ${index * 100}ms`,
                                    }}
                                  />
                                </div>
                                <span className="fw-semibold" style={{ fontSize: "0.75rem", color: getSlaColorHex(tech.sla_success_pct) }}>
                                  {tech.sla_success_pct}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td className="text-center" style={{ paddingRight: "24px" }}>
                            <Badge bg={getWorkloadVariant(tech.workload)} pill className="px-3 py-2">{tech.workload}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaTools style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No technician data available</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Reveal>

      {/* ════════════ RECENT TICKETS ════════════ */}
      <Reveal>
        <Row className="g-3">
          <Col xs={12}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden chart-card">
              <div className="p-4 pb-3">
                <SectionHeader
                  icon={<FaTicketAlt style={{ fontSize: "0.9rem", color: "#0ea5e9" }} />} iconBg="#e0f2fe" title="Recent Tickets"
                  actionButton={
                    <Button variant="light" className="border rounded-pill px-3" size="sm"
                      onClick={() => navigate("/admin/tickets")}
                      style={{ transition: "all .2s ease" }}>
                      View All Tickets
                    </Button>
                  }
                />
              </div>

              {recent_tickets.length > 0 ? (
                <div className="table-responsive">
                  <Table hover responsive className="align-middle mb-0 admin-table">
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ paddingLeft: "24px" }} className="text-muted small text-uppercase">Ticket #</th>
                        <th className="text-muted small text-uppercase">Title</th>
                        <th className="d-none d-md-table-cell text-muted small text-uppercase">Employee</th>
                        <th className="d-none d-lg-table-cell text-muted small text-uppercase">Technician</th>
                        <th className="text-muted small text-uppercase">Priority</th>
                        <th className="text-muted small text-uppercase">Status</th>
                        <th className="d-none d-md-table-cell text-muted small text-uppercase">Created</th>
                        <th className="text-center text-muted small text-uppercase" style={{ paddingRight: "24px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_tickets.map((t, index) => (
                        <tr
                          key={t.id}
                          style={{ cursor: "pointer", animationDelay: `${index * 60}ms` }}
                          onClick={() => navigate(`/admin/tickets/${t.id}`)}
                        >
                          <td className="fw-bold text-primary text-nowrap" style={{ paddingLeft: "24px" }}>
                            #{t.ticket_number}
                          </td>
                          <td className="text-dark" style={{ maxWidth: 260 }}>
                            <div className="text-truncate">{t.title}</div>
                          </td>
                          <td className="d-none d-md-table-cell text-muted">{t.employee_name}</td>
                          <td className="d-none d-lg-table-cell text-muted">{t.technician_name || "—"}</td>
                          <td>
                            <Badge className={`badge-priority-${t.priority}`} pill>{t.priority}</Badge>
                          </td>
                          <td>
                            <Badge className={`badge-status-${t.status}`} pill>
                              {t.status?.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="d-none d-md-table-cell text-muted text-nowrap">{formatDate(t.created_at)}</td>
                          <td className="text-center" style={{ paddingRight: "24px" }}>
                            <span className="btn-view"><FaEye style={{ fontSize: "0.8rem" }} /></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaTicketAlt style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                  <p className="mt-2 mb-0">No recent tickets</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Reveal>
    </div>
  );
};

export default AdminDashboard;