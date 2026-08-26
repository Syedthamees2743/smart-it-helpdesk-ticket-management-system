import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Button, Badge, Spinner } from "react-bootstrap";
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
  FiUser,
  FiBox,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import assetService from "../../services/assetService";
import AssetFormModal from "../../components/admin/AssetFormModal";
import AssetActionModal from "../../components/admin/AssetActionModal";

import "../../styles/assetDetails.css";

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
      return {
        text: "Expired",
        variant: "expired",
        icon: <FiAlertTriangle size={12} />,
      };
    if (diffDays <= 30)
      return {
        text: `${diffDays} days left`,
        variant: "warning",
        icon: <FiAlertTriangle size={12} />,
      };
    if (diffDays <= 90)
      return {
        text: `${diffDays} days left`,
        variant: "info",
        icon: <FiClock size={12} />,
      };
    return {
      text: `${diffDays} days left`,
      variant: "success",
      icon: <FiCheck size={12} />,
    };
  };

  const warrantyInfo = getWarrantyInfo();

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
    if (!window.confirm("Delete this asset? This action cannot be undone."))
      return;
    try {
      await assetService.deleteAsset(id);
      navigate("/admin/assets");
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete asset.");
    }
  };

  if (loading)
    return (
      <div className="ad-loading">
        <Spinner animation="border" className="ad-spinner" />
        <p className="ad-loading-text">Loading asset details...</p>
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

  const InfoBox = ({ icon, label, value, children, highlight }) => (
    <div className={`ad-info-box ${highlight ? "ad-info-highlight" : ""}`}>
      <div className="ad-info-box-header">
        <span className="ad-info-icon">{icon}</span>
        <span className="ad-info-label">{label}</span>
      </div>
      <div className="ad-info-value">
        {children || value || "—"}
      </div>
    </div>
  );

  return (
    <div className="ad-page">
      {/* Header */}
      <div className="ad-page-header">
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
                onClick={() => {
                  setActionMode("assign");
                  setShowActionModal(true);
                }}
              >
                <FiUserCheck />
                <span>Assign</span>
              </Button>
            )}
            {info.status?.toLowerCase() === "assigned" && (
              <Button
                className="ad-action-btn ad-btn-warning"
                onClick={() => {
                  setActionMode("return");
                  setShowActionModal(true);
                }}
              >
                <FiCornerUpLeft />
                <span>Return</span>
              </Button>
            )}
            {["available", "assigned"].includes(info.status?.toLowerCase()) && (
              <Button
                className="ad-action-btn ad-btn-info"
                onClick={() => {
                  setActionMode("maintenance");
                  setShowActionModal(true);
                }}
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
            <Button
              className="ad-action-btn ad-btn-danger"
              onClick={handleDelete}
            >
              <FiTrash2 />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </div>

      <Row className="g-4">
        {/* Left Column - Asset Info */}
        <Col lg={8}>
          {/* Title Card */}
          <Card className="ad-card ad-title-card">
            <div className="ad-card-glow"></div>
            <Card.Body className="p-4">
              {/* Asset Title */}
              <div className="ad-asset-header">
                <div className="ad-asset-icon-wrap">
                  <FiBox />
                </div>
                <div className="ad-asset-title-info">
                  <h4 className="ad-asset-name">{info.asset_name}</h4>
                  <div className="ad-asset-meta">
                    <span className="ad-asset-code">
                      <FiHash /> {info.asset_code}
                    </span>
                    {getStatusBadge(info.status)}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="ad-divider"></div>

              {/* Info Grid */}
              <div className="ad-info-grid">
                <InfoBox
                  icon={<FiLayers />}
                  label="Category"
                  value={info.category_name}
                />
                <InfoBox
                  icon={<FiCpu />}
                  label="Brand"
                  value={info.brand}
                />
                <InfoBox
                  icon={<FiCpu />}
                  label="Model"
                  value={info.model}
                />
                <InfoBox
                  icon={<FiShield />}
                  label="Serial Number"
                >
                  <span className="ad-serial">{info.serial_number}</span>
                </InfoBox>
                <InfoBox
                  icon={<FiCalendar />}
                  label="Purchase Date"
                  value={formatDate(info.purchase_date)}
                />
                <InfoBox
                  icon={<FiShield />}
                  label="Warranty Expiry"
                  highlight
                >
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
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Assignment */}
        <Col lg={4}>
          <Card className="ad-card ad-assignment-card">
            <Card.Header className="ad-assignment-header">
              <FiUserCheck />
              <span>Assignment Info</span>
            </Card.Header>
            <Card.Body className="ad-assignment-body">
              {info.assigned_to ? (
                <div className="ad-assigned-state">
                  <div className="ad-assigned-avatar">
                    <FiUser />
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
                    Currently Assigned
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