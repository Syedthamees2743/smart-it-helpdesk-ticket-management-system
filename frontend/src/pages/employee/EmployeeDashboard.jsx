import { useState, useEffect, useRef } from "react";
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
  FaBookOpen,
  FaSyncAlt,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaChartPie,
  FaTags,
  FaBoxOpen,
  FaLock,
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
import dashboardService from "../../services/dashboardService";
import { getMyEligibleAssets } from "../../services/ticketService";

/* ══════════════════════════════════════════════
   GLOBAL ANIMATION STYLES (self-contained)
════════════════════════════════════ */
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
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35); }
      50%      { box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
    }

    /* ── Entrance ── */
    .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

    /* ── Hero header ── */
    .hero-header {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #0f766e 0%, #0e7490 45%, #4f46e5 100%);
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
    .btn-cta {
      background: #fff;
      color: #0f766e;
      border: none;
      border-radius: 50rem;
      font-weight: 600;
      box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.4);
      animation: glowPulse 2.6s ease-in-out infinite;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
    }
    .btn-cta:hover, .btn-cta:focus {
      background: #fff !important;
      color: #0f766e !important;
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 14px 30px -8px rgba(0, 0, 0, 0.45) !important;
    }
    .btn-cta .cta-icon { transition: transform 0.3s ease; display: inline-block; }
    .btn-cta:hover .cta-icon { transform: rotate(90deg) scale(1.15); }
    .btn-cta:disabled {
      animation: none;
      transform: none !important;
      box-shadow: none !important;
      opacity: 0.75;
      cursor: not-allowed;
    }
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

    /* ── Tables ── */
    .anim-table tbody tr {
      animation: rowIn 0.45s ease both;
      transition: background 0.2s ease;
    }
    .anim-table tbody tr:hover { background: #f8fafc; }
    .btn-view {
      display: inline-flex; align-items: center; justify-content: center; gap: 5px;
      border-radius: 50rem; padding: 4px 12px;
      background: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff;
      font-size: 0.75rem; font-weight: 600;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .btn-view:hover { background: #4f46e5; color: #fff; border-color: #4f46e5; transform: scale(1.06); }

    /* ── Assets ── */
    .asset-item {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .asset-item:hover {
      transform: translateX(4px);
      box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.12);
      border-color: #bfdbfe !important;
    }

    /* ── Misc ── */
    .breathe { animation: breathe 4s ease-in-out infinite; }
    .breach-alert { animation: pulseDanger 2s infinite; }
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
   HOOKS & UTILITIES
════════════════════════════════════ */

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

/* Renders value — animates numbers & "92%" strings; falls back gracefully */
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
   KPICard — Gradient icon, shine sweep, counter
════════════════════════════════════ */
const KPICard = ({ icon, bgColor, label, value, valueColor, delay = 0, onClick }) => (
  <Card
    className="border-0 shadow-sm rounded-4 h-100 kpi-card fade-in-up"
    style={{ cursor: onClick ? "pointer" : "default", animationDelay: `${delay}ms` }}
    onClick={onClick}
  >
    <div className="decor-circle" style={{ backgroundColor: "#4f46e5" }} />
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
   Section Header + Chart Tooltip
══════════════════════════════════════════════ */
const SectionHeader = ({ icon, iconBg, title, actionButton }) => (
  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <div className="d-flex align-items-center gap-2">
      {icon && (
        <div
          className="rounded-4 d-flex align-items-center justify-content-center breathe"
          style={{ width: "36px", height: "36px", backgroundColor: iconBg }}
        >
          {icon}
        </div>
      )}
      <h6 className="fw-bold text-dark mb-0" style={{ letterSpacing: "-0.01em" }}>{title}</h6>
    </div>
    {actionButton}
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
   Shimmer Skeletons
════════════════════════════════════ */
const SkeletonCard = () => (
  <Card className="border-0 shadow-sm rounded-4">
    <Card.Body className="d-flex align-items-center py-3 px-3">
      <div className="skeleton me-3" style={{ width: 48, height: 48, minWidth: 48, borderRadius: 14 }} />
      <div className="w-100">
        <div className="skeleton mb-2" style={{ width: "75%", height: 12 }} />
        <div className="skeleton" style={{ width: "45%", height: 22 }} />
      </div>
    </Card.Body>
  </Card>
);

const SkeletonChart = () => (
  <Card className="border-0 shadow-sm rounded-4 h-100">
    <Card.Body className="p-4">
      <div className="skeleton mb-3" style={{ width: "45%", height: 16 }} />
      <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
        <Spinner animation="border" variant="secondary" size="sm" />
      </div>
    </Card.Body>
  </Card>
);

/* ══════════════════════════════════════════════
   Helper Functions
══════════════════════════════════════════════ */
const getSlaColorHex = (pct) => {
  if (pct === null || pct === undefined) return "#64748b";
  if (pct >= 90) return "#10b981";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
};

const getAssetBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("maintain")) return { bg: "warning", text: "dark" };
  if (s.includes("retir")) return { bg: "secondary" };
  if (s.includes("avail")) return { bg: "info" };
  return { bg: "success" };
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const mounted = useMounted(500);

  // ═══════════════════════════════════════════════
  // NEW: Asset restriction state (ticket creation)
  // ═══════════════════════════════════════════════
  const [canCreateTicket, setCanCreateTicket] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ═══════════════════════════════════════════════
  // NEW: Check if employee has active assets
  // ═══════════════════════════════════════════════
  useEffect(() => {
    getMyEligibleAssets()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setCanCreateTicket(list.length > 0);
      })
      .catch(() => setCanCreateTicket(true));
  }, []);

  const fetchDashboard = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
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
      setRefreshing(false);
    }
  };

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

  /* ── Loading ── */
  if (loading) {
    return (
      <div>
        <GlobalStyles />
        <div className="skeleton mb-4" style={{ width: "100%", height: 110, borderRadius: 18 }} />
        <Row className="g-3 mb-4">
          {[...Array(7)].map((_, i) => (
            <Col xs={6} md key={i}>
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

  /* ── Error ── */
  if (error) {
    return (
      <div>
        <GlobalStyles />
        <div className="mb-4">
          <h4 className="fw-bold mb-1">Employee Dashboard</h4>
        </div>
        <Alert variant="danger" className="d-flex align-items-center rounded-4 border-0 fade-in-up">
          <FaTimesCircle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
        <Button variant="primary" className="rounded-pill px-4 mt-3" onClick={() => fetchDashboard()}>
          <FaSyncAlt className="me-2" /> Retry
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

  const slaColor = getSlaColorHex(sla.success_pct);

  /* ── SLA Ring geometry ── */
  const slaRingSize = 130;
  const slaRingThickness = 5;
  const slaRadius = (slaRingSize - slaRingThickness) / 2;
  const slaCircumference = 2 * Math.PI * slaRadius;
  const slaProgress = sla.success_pct ? (sla.success_pct / 100) * slaCircumference : 0;

  /* ── KPI config (data-driven for stagger) ── */
  const kpiCards = [
    { icon: <FaTicketAlt size={22} className="text-white" />, bg: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "My Tickets", value: tickets.my_total || 0 },
    { icon: <FaClock size={22} className="text-white" />, bg: "linear-gradient(135deg, #38bdf8, #0ea5e9)", label: "Open", value: tickets.my_open || 0 },
    { icon: <FaLink size={22} className="text-white" />, bg: "linear-gradient(135deg, #94a3b8, #64748b)", label: "Assigned", value: tickets.my_assigned || 0 },
    { icon: <FaSpinner size={22} className="text-white" />, bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", label: "In Progress", value: tickets.my_in_progress || 0 },
    { icon: <FaCheckCircle size={22} className="text-white" />, bg: "linear-gradient(135deg, #34d399, #10b981)", label: "Resolved", value: tickets.my_resolved || 0 },
    { icon: <FaRedo size={22} className="text-white" />, bg: "linear-gradient(135deg, #f87171, #ef4444)", label: "Reopened", value: tickets.my_reopened || 0 },
    { icon: <FaTimesCircle size={22} className="text-white" />, bg: "linear-gradient(135deg, #94a3b8, #475569)", label: "Closed", value: tickets.my_closed || 0 },
  ];

  return (
    <div>
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
              <small style={{ opacity: 0.8, fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                MY WORKSPACE
              </small>
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
              <FaClock style={{ fontSize: "0.7rem" }} /> Open: <strong>{tickets.my_open || 0}</strong>
            </span>
            <span className="glass-pill rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
              <FaCheckCircle style={{ fontSize: "0.7rem" }} /> Resolved: <strong>{tickets.my_resolved || 0}</strong>
            </span>
            <Button className="glass-btn rounded-pill px-3 py-2 d-flex align-items-center" onClick={() => fetchDashboard(true)} disabled={refreshing}>
              {refreshing ? <FaSyncAlt className="spin-icon" /> : <FaSyncAlt />}
            </Button>

            {/* ═══════════════════════════════════════════
                NEW: Primary CTA — asset restriction check
                ═══════════════════════════════════════════ */}
            {canCreateTicket ? (
              <Button className="btn-cta px-4 py-2 d-flex align-items-center gap-2" onClick={() => navigate("/employee/tickets/new")}>
                <FaPlus className="cta-icon" /> Raise New Complaint
              </Button>
            ) : (
              <Button
                className="btn-cta px-4 py-2 d-flex align-items-center gap-2"
                disabled
                title="No IT asset assigned — contact IT Admin"
              >
                <FaLock /> No Asset Assigned
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════ KPI CARDS ════════════ */}
      <Row className="g-3 mb-4">
        {kpiCards.map((k, i) => (
          <Col xs={6} md key={i}>
            <KPICard
              icon={k.icon}
              bgColor={k.bg}
              label={k.label}
              value={k.value}
              delay={i * 70}
              onClick={() => navigate("/employee/tickets")}
            />
          </Col>
        ))}
      </Row>

      {/* ════════════ STATUS | PRIORITY | SLA ════════════ */}
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
              {tickets.status_distribution && tickets.status_distribution.length > 0 ? (
                <>
                  <div className="position-relative">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={tickets.status_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                          animationDuration={900}
                          animationEasing="ease-out"
                        >
                          {tickets.status_distribution.map((entry, i) => (
                            <Cell key={`s-${i}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip suffix=" tickets" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Animated center total */}
                    <div className="donut-center position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                      <span className="fw-bold fs-4 text-dark" style={{ lineHeight: 1 }}>
                        <AnimatedNumber value={tickets.my_total || 0} />
                      </span>
                      <span className="text-muted" style={{ fontSize: "0.62rem" }}>Total</span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-2" style={{ fontSize: "0.72rem" }}>
                    {tickets.status_distribution.map((item, i) => (
                      <span key={i} className="d-flex align-items-center px-2 py-1 rounded-pill fade-in-up" style={{ backgroundColor: "#f8fafc", animationDelay: `${i * 80}ms` }}>
                        <span className="me-1 rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: item.fill }} />
                        <span className="text-muted">{item.name}</span>
                        <strong className="text-dark ms-1">{item.value}</strong>
                      </span>
                    ))}
                  </div>
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

        {/* Priority Overview */}
        <Reveal delay={100} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaTags style={{ fontSize: "0.9rem", color: "#f59e0b" }} />}
                iconBg="#fef3c7"
                title="Priority Overview"
              />
              {tickets.priority_distribution && tickets.priority_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart data={tickets.priority_distribution} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip suffix=" tickets" />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tickets" maxBarSize={44} animationDuration={900} animationEasing="ease-out">
                      {tickets.priority_distribution.map((entry, i) => (
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

        {/* SLA Overview — Animated Ring */}
        <Reveal delay={200} className="col-md-4">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <Card.Body className="p-4">
              <SectionHeader
                icon={<FaShieldAlt style={{ fontSize: "0.9rem", color: "#10b981" }} />}
                iconBg="#d1fae5"
                title="SLA Overview"
              />
              <div className="text-center">
                {/* Ring */}
                <div className="position-relative d-inline-block mb-3">
                  <svg width={slaRingSize} height={slaRingSize} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={slaRingSize / 2} cy={slaRingSize / 2} r={slaRadius} fill="none" stroke="#f1f5f9" strokeWidth={slaRingThickness} />
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
                      <AnimatedValue value={sla.success_pct !== null ? `${sla.success_pct}%` : "N/A"} />
                    </span>
                    <span className="text-muted" style={{ fontSize: "0.62rem" }}>Success Rate</span>
                  </div>
                </div>

                {/* Met / Breached */}
                <Row className="g-2 mb-3">
                  <Col xs={6}>
                    <div className="p-3 rounded-4 border fade-in-up" style={{ backgroundColor: "#f0fdf4", animationDelay: "500ms" }}>
                      <div className="fw-bold text-success fs-5">
                        <AnimatedNumber value={sla.met || 0} duration={1400} />
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>SLA Met</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 rounded-4 border fade-in-up" style={{ backgroundColor: "#fef2f2", animationDelay: "600ms" }}>
                      <div className="fw-bold text-danger fs-5">
                        <AnimatedNumber value={sla.breached || 0} duration={1400} />
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>SLA Breached</div>
                    </div>
                  </Col>
                </Row>

                {/* Active breach warning — pulsing */}
                {(sla.active_breached || 0) > 0 && (
                  <div className="mt-2 p-3 rounded-4 border border-danger breach-alert d-flex align-items-center gap-2" style={{ backgroundColor: "#fef2f2" }}>
                    <FaExclamationTriangle className="text-danger flex-shrink-0" style={{ fontSize: "0.9rem" }} />
                    <div style={{ fontSize: "0.78rem" }}>
                      <span className="text-danger fw-bold">{sla.active_breached}</span>
                      <span className="text-muted ms-1">ticket(s) currently past SLA deadline</span>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Reveal>
      </Row>

      {/* ════════════ RECENT TICKETS | MY ASSETS ════════════ */}
      <Row className="g-3 mb-4">
        {/* Recent Tickets */}
        <Reveal delay={0} className="col-lg-8">
          <Card className="border-0 shadow-sm rounded-4 h-100 chart-card">
            <div className="p-4 pb-2">
              <SectionHeader
                icon={<FaTicketAlt style={{ fontSize: "0.9rem", color: "#0ea5e9" }} />}
                iconBg="#e0f2fe"
                title="My Recent Tickets"
                actionButton={
                  <Button
                    variant="light"
                    className="border rounded-pill px-3"
                    size="sm"
                    onClick={() => navigate("/employee/tickets")}
                    style={{ transition: "all .2s ease" }}
                  >
                    View All
                  </Button>
                }
              />
            </div>
            {tickets.recent && tickets.recent.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="itsm-table anim-table align-middle mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ paddingLeft: "24px" }} className="text-muted small text-uppercase">Title</th>
                      <th className="text-muted small text-uppercase">Priority</th>
                      <th className="text-muted small text-uppercase">Status</th>
                      <th className="text-muted small text-uppercase">SLA</th>
                      <th className="text-muted small text-uppercase">Date</th>
                      <th className="text-muted small text-uppercase" style={{ paddingRight: "24px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.recent.map((t, idx) => (
                      <tr key={idx} style={{ animationDelay: `${idx * 70}ms`, cursor: "pointer" }} onClick={() => navigate(`/employee/tickets/${t.id}`)}>
                        <td className="fw-medium text-dark" style={{ paddingLeft: "24px", maxWidth: 280 }}>
                          <div className="text-truncate">{t.title}</div>
                        </td>
                        <td>
                          <Badge className={`badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</Badge>
                        </td>
                        <td>
                          <Badge className={`badge-status-${t.status.toLowerCase().replace(" ", "_")}`}>
                            {t.status}
                          </Badge>
                        </td>
                        <td>
                          <span
                            className="fw-bold d-flex align-items-center gap-1"
                            style={{ color: t.sla === "Breached" ? "#ef4444" : "#10b981", fontSize: "0.8rem" }}
                          >
                            <span
                              className="rounded-circle d-inline-block"
                              style={{
                                width: 6,
                                height: 6,
                                backgroundColor: t.sla === "Breached" ? "#ef4444" : "#10b981",
                                animation: t.sla === "Breached" ? "pulseDanger 1.6s infinite" : "none",
                              }}
                            />
                            {t.sla}
                          </span>
                        </td>
                        <td className="text-muted text-nowrap">{t.date}</td>
                        <td style={{ paddingRight: "24px" }}>
                          <span className="btn-view">
                            <FaEye style={{ fontSize: "0.75rem" }} /> View
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted py-5">
                <FaTicketAlt style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                <p className="mt-2 mb-0">No recent tickets found.</p>
                {/* ═══ NEW: Conditional empty state button ═══ */}
                {canCreateTicket ? (
                  <Button variant="primary" size="sm" className="rounded-pill px-3 mt-3" onClick={() => navigate("/employee/tickets/new")}>
                    <FaPlus className="me-1" /> Raise your first complaint
                  </Button>
                ) : (
                  <div className="text-muted small mt-3 d-flex align-items-center justify-content-center gap-2">
                    <FaLock style={{ fontSize: "0.7rem" }} />
                    Contact IT Admin to get an asset assigned before creating tickets.
                  </div>
                )}
              </div>
            )}
          </Card>
        </Reveal>

        {/* My Assets + Knowledge Base */}
        <Reveal delay={150} className="col-lg-4">
          <div className="d-flex flex-column gap-3 h-100">
            <Card className="border-0 shadow-sm rounded-4 chart-card flex-grow-1">
              <Card.Body className="p-4">
                <SectionHeader
                  icon={<FaLaptop style={{ fontSize: "0.9rem", color: "#3b82f6" }} />}
                  iconBg="#dbeafe"
                  title="My Assets"
                />
                {assets.list && assets.list.length > 0 ? (
                  assets.list.map((asset, idx) => {
                    const badge = getAssetBadge(asset.status);
                    return (
                      <div
                        key={idx}
                        className="d-flex justify-content-between align-items-center p-3 border rounded-4 mb-2 asset-item fade-in-up bg-white"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="min-w-0">
                          <div className="fw-medium text-dark text-truncate">{asset.name}</div>
                          <small className="text-muted">
                            {asset.code} • {asset.category}
                          </small>
                        </div>
                        <Badge bg={badge.bg} text={badge.text} pill className="px-3 flex-shrink-0">
                          {asset.status}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted py-4">
                    <FaBoxOpen style={{ fontSize: "2.2rem", color: "#dee2e6" }} />
                    <p className="mt-2 mb-0 small">No assets assigned</p>
                    {/* ═══ NEW: Ticket restriction note ═══ */}
                    <div className="mt-2 small d-flex align-items-center justify-content-center gap-1" style={{ color: "#dc2626" }}>
                      <FaLock style={{ fontSize: "0.65rem" }} />
                      Ticket creation blocked
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Knowledge Base CTA */}
            <Card className="border-0 shadow-sm rounded-4 chart-card overflow-hidden">
              <div
                className="px-4 py-3 ai-banner text-white d-flex align-items-center gap-2"
                style={{ background: "linear-gradient(135deg, #0f766e, #0e7490)" }}
              >
                <FaBookOpen className="ai-icon-float" style={{ animation: "float 3s ease-in-out infinite" }} />
                <span className="fw-bold" style={{ fontSize: "0.9rem" }}>Knowledge Base</span>
              </div>
              <Card.Body className="p-4">
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                  Find answers to common IT issues before raising a ticket — save time and get instant solutions.
                </p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100 rounded-pill py-2 fw-semibold"
                  onClick={() => navigate("/employee/faqs")}
                  style={{ transition: "all .25s cubic-bezier(0.34,1.56,0.64,1)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(79,70,229,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaBookOpen className="me-2" /> Browse FAQs
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Reveal>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;