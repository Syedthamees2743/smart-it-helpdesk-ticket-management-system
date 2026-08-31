import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  FiMonitor,
  FiCalendar,
  FiHash,
  FiCpu,
  FiLayers,
  FiPackage,
  FiChevronRight,
  FiBox,
  FiSmartphone,
  FiPrinter,
  FiTablet,
  FiHeadphones,
  FiHardDrive,
  FiServer,
  FiRefreshCw,
} from "react-icons/fi";
import { FaLaptop } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import assetService from "../../services/assetService";
import "../../styles/MyAssets.css";

/* ── Category → Icon + Color mapping ── */
const CATEGORY_STYLES = [
  { keys: ["laptop", "notebook"], icon: FaLaptop, bar: "linear-gradient(90deg,#2563eb,#60a5fa)", glow: "rgba(37,99,235,0.25)", bg: "#eff6ff", fg: "#2563eb" },
  { keys: ["monitor", "desktop", "computer", "pc"], icon: FiMonitor, bar: "linear-gradient(90deg,#7c3aed,#a78bfa)", glow: "rgba(124,58,237,0.25)", bg: "#f5f3ff", fg: "#7c3aed" },
  { keys: ["phone", "mobile"], icon: FiSmartphone, bar: "linear-gradient(90deg,#059669,#34d399)", glow: "rgba(5,150,105,0.25)", bg: "#ecfdf5", fg: "#059669" },
  { keys: ["printer", "scanner"], icon: FiPrinter, bar: "linear-gradient(90deg,#d97706,#fbbf24)", glow: "rgba(217,119,6,0.25)", bg: "#fffbeb", fg: "#d97706" },
  { keys: ["tablet", "ipad"], icon: FiTablet, bar: "linear-gradient(90deg,#0891b2,#22d3ee)", glow: "rgba(8,145,178,0.25)", bg: "#ecfeff", fg: "#0891b2" },
  { keys: ["headphone", "audio", "speaker", "earphone"], icon: FiHeadphones, bar: "linear-gradient(90deg,#db2777,#f472b6)", glow: "rgba(219,39,119,0.25)", bg: "#fdf2f8", fg: "#db2777" },
  { keys: ["server", "network", "router", "switch", "firewall"], icon: FiServer, bar: "linear-gradient(90deg,#4f46e5,#818cf8)", glow: "rgba(79,70,229,0.25)", bg: "#eef2ff", fg: "#4f46e5" },
  { keys: ["storage", "hard", "ssd", "drive", "pendrive"], icon: FiHardDrive, bar: "linear-gradient(90deg,#0d9488,#2dd4bf)", glow: "rgba(13,148,136,0.25)", bg: "#f0fdfa", fg: "#0d9488" },
];

const DEFAULT_STYLE = {
  icon: FiBox,
  bar: "linear-gradient(90deg,#2563eb,#60a5fa)",
  glow: "rgba(37,99,235,0.25)",
  bg: "#eff6ff",
  fg: "#2563eb",
};

const getCategoryStyle = (name) => {
  if (!name) return DEFAULT_STYLE;
  const lower = name.toLowerCase();
  return CATEGORY_STYLES.find((s) => s.keys.some((k) => lower.includes(k))) || DEFAULT_STYLE;
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ── Count-up hook (0 → target animation) ── */
const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let start = null;
    let rafId;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
};

const StatCard = ({ icon: Icon, value, label, variant, isDate, delay }) => {
  const count = useCountUp(isDate ? 0 : value);

  return (
    <div className={`ma-summary-card ma-summary-${variant}`} style={{ animationDelay: `${delay}s` }}>
      <div className="ma-summary-icon">
        <Icon size={18} />
      </div>
      <div>
        <div className="ma-summary-value">
          {isDate ? value : count}
        </div>
        <div className="ma-summary-label">{label}</div>
      </div>
    </div>
  );
};

const MyAssets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await assetService.getMyAssets();
      let rawData = res.data;
      if (rawData?.results && Array.isArray(rawData.results)) rawData = rawData.results;
      else if (rawData?.data && Array.isArray(rawData.data)) rawData = rawData.data;

      setAssets(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error("My Assets Error:", err);
      setAssets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── Summary stats ── */
  const totalAssets = assets.length;
  const uniqueCategories = new Set(
    assets.map((a) => a.category_name).filter(Boolean)
  ).size;
  const latestAssignment = assets.reduce((latest, a) => {
    if (!a.assigned_date) return latest;
    const d = new Date(a.assigned_date);
    return !latest || d > latest ? d : latest;
  }, null);

  /* ── Skeleton Loading State ── */
  if (loading) {
    return (
      <div className="ma-page">
        <div className="ma-header mb-4">
          <div className="ma-skeleton ma-skeleton-icon" />
          <div>
            <div className="ma-skeleton ma-skeleton-title" />
            <div className="ma-skeleton ma-skeleton-sub" />
          </div>
        </div>
        <Row className="g-3 mb-4">
          {[1, 2, 3].map((i) => (
            <Col xs={12} sm={4} key={i}>
              <div className="ma-skeleton ma-skeleton-stat" />
            </Col>
          ))}
        </Row>
        <Row className="g-4">
          {[1, 2, 3].map((i) => (
            <Col xs={12} md={6} xl={4} key={i}>
              <div className="ma-skeleton ma-skeleton-card">
                <div className="ma-skeleton ma-skeleton-line w-60" />
                <div className="ma-skeleton ma-skeleton-line w-40" />
                <div className="ma-skeleton ma-skeleton-line w-100" />
                <div className="ma-skeleton ma-skeleton-line w-80" />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div className="ma-page">
      {/* ── Header ── */}
      <div className="ma-header mb-4">
        <div className="ma-header-icon">
          <FiPackage size={24} />
        </div>
        <div className="flex-grow-1">
          <h4 className="ma-header-title">My Assets</h4>
          <p className="ma-header-sub">IT assets currently assigned to you</p>
        </div>
        <button
          type="button"
          className={`ma-refresh-btn ${refreshing ? "ma-refreshing" : ""}`}
          onClick={() => fetchMyAssets(true)}
          disabled={refreshing}
          title="Refresh"
        >
          <FiRefreshCw size={15} />
        </button>
      </div>

      {/* ── Empty State ── */}
      {assets.length === 0 ? (
        <Card className="ma-card ma-empty-card">
          <Card.Body className="text-center py-5">
            <div className="ma-empty-icon">
              <FiMonitor size={34} />
            </div>
            <h5 className="ma-empty-title">No Assets Assigned</h5>
            <p className="ma-empty-text">
              You currently don't have any IT assets assigned.
              <br />
              Contact IT Support if you need equipment.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* ── Summary Cards (count-up) ── */}
          <Row className="g-3 mb-4">
            <Col xs={12} sm={4}>
              <StatCard
                icon={FiPackage}
                value={totalAssets}
                label="Total Assets"
                variant="blue"
                delay={0.05}
              />
            </Col>
            <Col xs={12} sm={4}>
              <StatCard
                icon={FiLayers}
                value={uniqueCategories}
                label={uniqueCategories === 1 ? "Category" : "Categories"}
                variant="green"
                delay={0.15}
              />
            </Col>
            <Col xs={12} sm={4}>
              <StatCard
                icon={FiCalendar}
                value={latestAssignment ? formatDate(latestAssignment) : "—"}
                label="Latest Assigned"
                variant="amber"
                isDate
                delay={0.25}
              />
            </Col>
          </Row>

          {/* ── Asset Cards ── */}
          <Row className="g-4">
            {assets.map((item, index) => {
              const assetId = item.id;
              if (!assetId) return null;

              const assetName = item.asset_name || "Unknown Asset";
              const assetCode = item.asset_code || "-";
              const categoryName = item.category_name || null;
              const brand = item.brand || null;
              const model = item.model || null;
              const serialNumber = item.serial_number || null;
              const assignedDate = item.assigned_date || null;

              const style = getCategoryStyle(categoryName);
              const Icon = style.icon;
              const brandModel = [brand, model].filter(Boolean).join(" ");

              return (
                <Col xs={12} md={6} xl={4} key={assetId}>
                  <Card
                    className="ma-card"
                    onClick={() => navigate(`/employee/assets/${assetId}`)}
                    style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                  >
                    {/* Category-colored top bar */}
                    <div
                      className="ma-card-bar"
                      style={{ background: style.bar, boxShadow: `0 0 12px ${style.glow}` }}
                    />

                    <Card.Body className="p-3">
                      {/* Header */}
                      <div className="ma-card-head">
                        <div className="ma-card-head-left">
                          <div
                            className="ma-category-icon"
                            style={{ background: style.bg, color: style.fg }}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="ma-card-title-wrap">
                            <div className="ma-card-name" title={assetName}>
                              {assetName}
                            </div>
                            <div className="ma-card-code">
                              <FiHash size={11} />
                              <span>{assetCode}</span>
                            </div>
                          </div>
                        </div>

                        <span className="ma-status-badge">
                          <span className="ma-status-dot" />
                          Active
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="ma-info-grid">
                        <div className="ma-info-box">
                          <div className="ma-info-label">
                            <FiLayers size={10} /> Category
                          </div>
                          <div className="ma-info-value">{categoryName || "—"}</div>
                        </div>

                        <div className="ma-info-box">
                          <div className="ma-info-label">
                            <FiCpu size={10} /> Brand / Model
                          </div>
                          <div className="ma-info-value" title={brandModel}>
                            {brandModel || "—"}
                          </div>
                        </div>

                        <div className="ma-info-box">
                          <div className="ma-info-label">
                            <FiBox size={10} /> Serial Number
                          </div>
                          <div className="ma-info-value ma-serial" title={serialNumber}>
                            {serialNumber || "—"}
                          </div>
                        </div>

                        <div className="ma-info-box">
                          <div className="ma-info-label">
                            <FiCalendar size={10} /> Assigned On
                          </div>
                          <div className="ma-info-value">
                            {formatDate(assignedDate) || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="ma-card-footer">
                        <span className="ma-footer-text">View Details</span>
                        <FiChevronRight size={14} className="ma-footer-arrow" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </div>
  );
};

export default MyAssets;