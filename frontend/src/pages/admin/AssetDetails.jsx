import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Button } from "react-bootstrap";
import {
  FiArrowLeft,
  FiEdit2,
  FiUserCheck,
  FiCornerUpLeft,
  FiTool,
  FiTrash2,
  FiPackage,
  FiHash,
  FiLayers,
  FiCpu,
  FiShield,
  FiCalendar,
  FiCheck,
  FiAlertTriangle,
  FiClock,
  FiBox,
  FiCopy,
  FiMonitor,
  FiSmartphone,
  FiPrinter,
  FiTablet,
  FiHeadphones,
  FiHardDrive,
  FiServer,
} from "react-icons/fi";
import { FaLaptop, FaTicketAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import assetService from "../../services/assetService";
import AssetFormModal from "../../components/admin/AssetFormModal";
import AssetActionModal from "../../components/admin/AssetActionModal";

import "../../styles/assetDetails.css";

/* ── Category → Icon + Color mapping ── */
const CATEGORY_STYLES = [
  { keys: ["laptop", "notebook"], icon: FaLaptop, bar: "linear-gradient(90deg,#2563eb,#60a5fa,#2563eb)", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", fg: "#2563eb", border: "#bfdbfe" },
  { keys: ["monitor", "desktop", "computer", "pc"], icon: FiMonitor, bar: "linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed)", bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)", fg: "#7c3aed", border: "#ddd6fe" },
  { keys: ["phone", "mobile"], icon: FiSmartphone, bar: "linear-gradient(90deg,#059669,#34d399,#059669)", bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)", fg: "#059669", border: "#a7f3d0" },
  { keys: ["printer", "scanner"], icon: FiPrinter, bar: "linear-gradient(90deg,#d97706,#fbbf24,#d97706)", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", fg: "#d97706", border: "#fde68a" },
  { keys: ["tablet", "ipad"], icon: FiTablet, bar: "linear-gradient(90deg,#0891b2,#22d3ee,#0891b2)", bg: "linear-gradient(135deg,#ecfeff,#cffafe)", fg: "#0891b2", border: "#a5f3fc" },
  { keys: ["headphone", "audio", "speaker", "earphone"], icon: FiHeadphones, bar: "linear-gradient(90deg,#db2777,#f472b6,#db2777)", bg: "linear-gradient(135deg,#fdf2f8,#fce7f3)", fg: "#db2777", border: "#fbcfe8" },
  { keys: ["server", "network", "router", "switch", "firewall"], icon: FiServer, bar: "linear-gradient(90deg,#4f46e5,#818cf8,#4f46e5)", bg: "linear-gradient(135deg,#eef2ff,#e0e7ff)", fg: "#4f46e5", border: "#c7d2fe" },
  { keys: ["storage", "hard", "ssd", "drive", "pendrive"], icon: FiHardDrive, bar: "linear-gradient(90deg,#0d9488,#2dd4bf,#0d9488)", bg: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", fg: "#0d9488", border: "#99f6e4" },
];

const DEFAULT_STYLE = {
  icon: FiBox,
  bar: "linear-gradient(90deg,#2563eb,#60a5fa,#2563eb)",
  bg: "linear-gradient(135deg,#eff6ff,#dbeafe)",
  fg: "#2563eb",
  border: "#bfdbfe",
};

const getCategoryStyle = (name) => {
  if (!name) return DEFAULT_STYLE;
  const lower = String(name).toLowerCase();
  return CATEGORY_STYLES.find((s) => s.keys.some((k) => lower.includes(k))) || DEFAULT_STYLE;
};

const getInitials = (name) => {
  if (!name || name === "—") return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isEmployee =
    user?.role === "employee" || location.pathname.startsWith("/employee");

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState("");

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (isEmployee) {
        const res = await assetService.getAssignmentById(id);
        data = res.data;
      } else {
        const res = await assetService.getAssetById(id);
        data = res.data;
      }
      setAsset(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Asset not found."
          : "Failed to load asset details."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWarrantyInfo = () => {
    const expiry = asset?.warranty_expiry || asset?.asset?.warranty_expiry;
    if (!expiry) return null;
    const diffDays = Math.ceil(
      (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0)
      return { text: "Expired", variant: "expired", icon: <FiAlertTriangle size={12} /> };
    if (diffDays <= 30)
      return { text: `${diffDays} days left`, variant: "warning", icon: <FiAlertTriangle size={12} /> };
    if (diffDays <= 90)
      return { text: `${diffDays} days left`, variant: "info", icon: <FiClock size={12} /> };
    return { text: `${diffDays} days left`, variant: "success", icon: <FiCheck size={12} /> };
  };

  const warrantyInfo = isAdmin ? getWarrantyInfo() : null;

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    const config = {
      available: { cls: "ad-status-available", text: "Available" },
      assigned: { cls: "ad-status-assigned", text: "Assigned" },
      active: { cls: "ad-status-active", text: "Active" },
      maintenance: { cls: "ad-status-maintenance", text: "Maintenance" },
      retired: { cls: "ad-status-retired", text: "Retired" },
    };
    const c = config[s] || { cls: "ad-status-default", text: status || "Unknown" };
    return <span className={`ad-status-badge ${c.cls}`}>{c.text}</span>;
  };

  const copySerial = (serial) => {
    if (!serial || serial === "—") return;
    navigator.clipboard?.writeText(serial).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async (data) => {
    await assetService.updateAsset(id, data);
    fetchAsset();
  };

  const handleAction = async (payload, mode) => {
    if (mode === "assign") await assetService.assignAsset(payload);
    else if (mode === "return") await assetService.returnAsset(payload);
    else if (mode === "maintenance")
      await assetService.updateAsset(id, { status: "maintenance" });
    fetchAsset();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this asset? This action cannot be undone.")) return;
    try {
      await assetService.deleteAsset(id);
      navigate("/admin/assets");
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete asset.");
    }
  };

  /* ── Skeleton Loading ── */
  if (loading)
    return (
      <div className="ad-page">
        <div className="ad-skeleton ad-skeleton-btn" />
        <Row className="g-4">
          <Col lg={8}>
            <div className="ad-skeleton ad-skeleton-main">
              <div className="ad-skeleton ad-skeleton-line w-60" />
              <div className="ad-skeleton ad-skeleton-line w-40" />
              <div className="ad-skeleton ad-skeleton-line w-100" />
              <div className="ad-skeleton ad-skeleton-line w-80" />
            </div>
          </Col>
          <Col lg={4}>
            <div className="ad-skeleton ad-skeleton-side" />
          </Col>
        </Row>
      </div>
    );

  if (error)
    return (
      <div className="ad-error-box">
        <FiAlertTriangle className="me-2" />
        {error}
      </div>
    );

  if (!asset) return null;

  /* ── Normalize data ── */
  const info = {
    asset_code: asset.asset_code || "—",
    asset_name: asset.asset_name || asset.name || "Unknown Asset",
    category_name: asset.category_name || "—",
    brand: asset.brand || "—",
    model: asset.model || "—",
    serial_number: asset.serial_number || "—",
    status: asset.asset_status || asset.status || "—",
    purchase_date: asset.purchase_date || "—",
    warranty_expiry: asset.warranty_expiry || "—",
    assigned_to:
      asset.current_assignment?.employee_name || asset.employee_name || null,
    assigned_date:
      asset.current_assignment?.assigned_date || asset.assigned_date || null,
    employee_id:
      asset.current_assignment?.employee_id || asset.employee_id || null,
    department:
      asset.current_assignment?.employee_department ||
      asset.employee_department ||
      null,
  };

  const style = getCategoryStyle(info.category_name);
  const CategoryIcon = style.icon;

  const InfoBox = ({ icon, label, value, children, highlight, delay }) => (
    <div
      className={`ad-info-box ${highlight ? "ad-info-highlight" : ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="ad-info-box-header">
        <span className="ad-info-icon" style={{ color: style.fg }}>{icon}</span>
        <span className="ad-info-label">{label}</span>
      </div>
      <div className="ad-info-value">{children || value || "—"}</div>
    </div>
  );

  return (
    <div className="ad-page">
      {/* ── Header ── */}
      <div className="ad-page-header ad-anim" style={{ animationDelay: "0.05s" }}>
        <div className="ad-header-left">
          <Button className="ad-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
            <span>Back</span>
          </Button>
        </div>

        {isAdmin && (
          <div className="ad-header-actions">
            {info.status?.toLowerCase() === "available" && (
              <Button
                className="ad-action-btn ad-btn-success"
                onClick={() => { setActionMode("assign"); setShowActionModal(true); }}
              >
                <FiUserCheck />
                <span>Assign</span>
              </Button>
            )}
            {info.status?.toLowerCase() === "assigned" && (
              <Button
                className="ad-action-btn ad-btn-warning"
                onClick={() => { setActionMode("return"); setShowActionModal(true); }}
              >
                <FiCornerUpLeft />
                <span>Return</span>
              </Button>
            )}
            {["available", "assigned"].includes(info.status?.toLowerCase()) && (
              <Button
                className="ad-action-btn ad-btn-info"
                onClick={() => { setActionMode("maintenance"); setShowActionModal(true); }}
              >
                <FiTool />
                <span>Maintenance</span>
              </Button>
            )}
            <Button
              className="ad-action-btn ad-btn-primary"
              onClick={() => setShowEditModal(true)}
            >
              <FiEdit2 />
              <span>Edit</span>
            </Button>
            <Button className="ad-action-btn ad-btn-danger" onClick={handleDelete}>
              <FiTrash2 />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </div>

      <Row className="g-4">
        {/* ── Left Column — Asset Info ── */}
        <Col lg={isEmployee ? 7 : 8}>
          <Card className="ad-card ad-title-card ad-anim" style={{ animationDelay: "0.15s" }}>
            {/* Animated gradient top bar */}
            <div
              className="ad-title-bar"
              style={{ background: style.bar, backgroundSize: "200% 100%" }}
            />
            <div className="ad-card-glow"></div>

            <Card.Body className="p-4">
              {/* Asset Header */}
              <div className="ad-asset-header">
                <div
                  className="ad-asset-icon-wrap"
                  style={{ background: style.bg, color: style.fg, borderColor: style.border }}
                >
                  <CategoryIcon />
                </div>
                <div className="ad-asset-title-info">
                  <h4 className="ad-asset-name">{info.asset_name}</h4>
                  <div className="ad-asset-meta">
                    <span className="ad-asset-code">
                      <FiHash /> {info.asset_code}
                    </span>
                    {info.category_name !== "—" && (
                      <span className="ad-category-chip" style={{ color: style.fg, borderColor: style.border }}>
                        <FiLayers size={11} />
                        {info.category_name}
                      </span>
                    )}
                    {getStatusBadge(info.status)}
                  </div>
                </div>
              </div>

              <div className="ad-divider"></div>

              {/* Info Grid — staggered slide-up */}
              <div className="ad-info-grid">
                <InfoBox icon={<FiLayers />} label="Category" value={info.category_name} delay={0.25} />
                <InfoBox icon={<FiCpu />} label="Brand" value={info.brand} delay={0.32} />
                <InfoBox icon={<FiCpu />} label="Model" value={info.model} delay={0.39} />

                {/* Serial with copy */}
                <InfoBox icon={<FiShield />} label="Serial Number" delay={0.46}>
                  <div className="ad-serial-row">
                    <span className="ad-serial">{info.serial_number}</span>
                    {info.serial_number !== "—" && (
                      <button
                        type="button"
                        className={`ad-copy-btn ${copied ? "ad-copy-done" : ""}`}
                        onClick={() => copySerial(info.serial_number)}
                        title={copied ? "Copied!" : "Copy serial number"}
                      >
                        {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      </button>
                    )}
                  </div>
                </InfoBox>

                {/* ADMIN ONLY */}
                {isAdmin && (
                  <>
                    <InfoBox
                      icon={<FiCalendar />}
                      label="Purchase Date"
                      value={formatDate(info.purchase_date)}
                      delay={0.53}
                    />
                    <InfoBox icon={<FiShield />} label="Warranty Expiry" highlight delay={0.6}>
                      <div className="ad-warranty-row">
                        <span>{formatDate(info.warranty_expiry)}</span>
                        {warrantyInfo && (
                          <span className={`ad-warranty-badge ad-warranty-${warrantyInfo.variant}`}>
                            {warrantyInfo.icon}
                            {warrantyInfo.text}
                          </span>
                        )}
                      </div>
                    </InfoBox>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Right Column ── */}
        <Col lg={isEmployee ? 5 : 4}>
          <Card className="ad-card ad-assignment-card ad-anim" style={{ animationDelay: "0.3s" }}>
            <Card.Header className="ad-assignment-header">
              <FiUserCheck />
              <span>{isEmployee ? "Your Assignment" : "Assignment Info"}</span>
            </Card.Header>
            <Card.Body className="ad-assignment-body">
              {info.assigned_to ? (
                <div className="ad-assigned-state">
                  <div className="ad-assigned-avatar">
                    {getInitials(info.assigned_to)}
                  </div>
                  <h5 className="ad-assigned-name">{info.assigned_to}</h5>

                  {info.employee_id && (
                    <p className="ad-assigned-id">ID: {info.employee_id}</p>
                  )}

                  {info.department && (
                    <span className="ad-dept-badge">{info.department}</span>
                  )}

                  <div className="ad-assigned-pill">
                    <FiCheck size={11} />
                    {isEmployee ? "Assigned to You" : "Currently Assigned"}
                  </div>

                  <div className="ad-assigned-date-box">
                    <span className="ad-date-label">Assigned Date</span>
                    <span className="ad-date-value">
                      {formatDate(info.assigned_date)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="ad-unassigned-state">
                  <div className="ad-unassigned-icon">
                    <FiPackage />
                  </div>
                  <h5 className="ad-unassigned-title">Available</h5>
                  <p className="ad-unassigned-text">
                    Asset is unassigned and ready to deploy.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* EMPLOYEE ONLY: Raise Ticket CTA */}
          {isEmployee && (
            <Card className="ad-card ad-cta-card ad-anim" style={{ animationDelay: "0.45s" }}>
              <div className="ad-cta-icon">
                <FaTicketAlt />
              </div>
              <h6 className="ad-cta-title">Having issues with this asset?</h6>
              <p className="ad-cta-text">
                Raise a support ticket and our IT team will assist you.
              </p>
              <Button className="ad-cta-btn" onClick={() => navigate("/employee/tickets/new")}>
                <FaTicketAlt size={13} />
                Raise a Ticket
              </Button>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modals */}
      {isAdmin && (
        <>
          <AssetFormModal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            asset={asset}
            onSubmit={handleUpdate}
          />
          <AssetActionModal
            show={showActionModal}
            onHide={() => setShowActionModal(false)}
            mode={actionMode}
            asset={asset}
            onSuccess={handleAction}
          />
        </>
      )}
    </div>
  );
};

export default AssetDetails;