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
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import assetService from "../../services/assetService";
import AssetFormModal from "../../components/admin/AssetFormModal";
import AssetActionModal from "../../components/admin/AssetActionModal";

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
        // Employee: get assignment detail (has all asset fields now)
        const res = await assetService.getAssignmentById(id);
        data = res.data;
      } else {
        // Admin: get asset detail directly
        const res = await assetService.getAssetById(id);
        data = res.data;
      }
      console.log("Asset Detail Data:", JSON.stringify(data, null, 2));
      setAsset(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Asset not found."
          : "Failed to load asset details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Extract field safely from both admin and employee response
  const getField = (field) => {
    if (!asset) return "-";
    return asset[field] || "-";
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Warranty status
  const getWarrantyInfo = () => {
    const expiry = asset?.warranty_expiry || asset?.asset?.warranty_expiry;
    if (!expiry) return null;
    const diffDays = Math.ceil(
      (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0)
      return {
        text: "Expired",
        color: "danger",
        icon: <FiAlertTriangle size={12} />,
      };
    if (diffDays <= 30)
      return {
        text: `${diffDays} days left`,
        color: "warning",
        icon: <FiAlertTriangle size={12} />,
      };
    if (diffDays <= 90)
      return {
        text: `${diffDays} days left`,
        color: "info",
        icon: <FiClock size={12} />,
      };
    return {
      text: `${diffDays} days left`,
      color: "success",
      icon: <FiCheck size={12} />,
    };
  };

  const warrantyInfo = getWarrantyInfo();

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    const config = {
      available: { bg: "success", text: "Available" },
      assigned: { bg: "primary", text: "Assigned" },
      active: { bg: "primary", text: "Active" },
      maintenance: { bg: "warning", text: "Maintenance" },
      retired: { bg: "secondary", text: "Retired" },
    };
    const c = config[s] || { bg: "light", text: status || "Unknown" };
    return (
      <Badge bg={c.bg} className="px-3 py-2">
        {c.text}
      </Badge>
    );
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
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading asset details...</p>
      </div>
    );
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!asset) return null;

  // Build info object from both admin & employee response formats
  const info = {
    asset_code: asset.asset_code || "-",
    asset_name: asset.asset_name || asset.name || "Unknown Asset",
    category_name: asset.category_name || "-",
    brand: asset.brand || "-",
    model: asset.model || "-",
    serial_number: asset.serial_number || "-",
    status: asset.asset_status || asset.status || "-",
    purchase_date: asset.purchase_date || "-",
    warranty_expiry: asset.warranty_expiry || "-",
    // Assignment info
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

  const InfoBox = ({ icon, label, value, children }) => (
    <div
      className="p-3 rounded-3"
      style={{ backgroundColor: "#f8f9fc", border: "1px solid #eef0f5" }}
    >
      <div className="d-flex align-items-center gap-2 mb-1">
        <span style={{ color: "#6b7280" }}>{icon}</span>
        <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
          {label}
        </span>
      </div>
      <div className="fw-semibold text-dark" style={{ fontSize: "0.95rem" }}>
        {children || value || "—"}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft className="me-1" /> Back
        </Button>
        {isAdmin && (
          <div className="d-flex gap-2 flex-wrap">
            {info.status?.toLowerCase() === "available" && (
              <Button
                variant="success"
                onClick={() => {
                  setActionMode("assign");
                  setShowActionModal(true);
                }}
              >
                <FiUserCheck className="me-1" /> Assign
              </Button>
            )}
            {info.status?.toLowerCase() === "assigned" && (
              <Button
                variant="warning"
                onClick={() => {
                  setActionMode("return");
                  setShowActionModal(true);
                }}
              >
                <FiCornerUpLeft className="me-1" /> Return
              </Button>
            )}
            {["available", "assigned"].includes(info.status?.toLowerCase()) && (
              <Button
                variant="info"
                onClick={() => {
                  setActionMode("maintenance");
                  setShowActionModal(true);
                }}
              >
                <FiTool className="me-1" /> Maintenance
              </Button>
            )}
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <FiEdit2 className="me-1" /> Edit
            </Button>
            <Button variant="outline-danger" onClick={handleDelete}>
              <FiTrash2 className="me-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Row className="g-4">
        {/* Left Column - Asset Info */}
        <Col lg={8}>
          {/* Title Card */}
          <Card className="shadow-sm border-0 mb-4 overflow-hidden">
            <div
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #1a73e8, #4fc3f7)",
              }}
            />
            <Card.Body className="p-4">
              <div className="d-flex align-items-start gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{
                    width: "52px",
                    height: "52px",
                    backgroundColor: "#e8f0fe",
                  }}
                >
                  <FiPackage size={26} style={{ color: "#1a73e8" }} />
                </div>
                <div className="flex-grow-1">
                  <h4 className="fw-bold mb-1">{info.asset_name}</h4>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span
                      className="d-flex align-items-center gap-1 text-muted"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <FiHash size={14} /> {info.asset_code}
                    </span>
                    {getStatusBadge(info.status)}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <Row className="g-3">
                <Col md={6}>
                  <InfoBox
                    icon={<FiLayers size={14} />}
                    label="Category"
                    value={info.category_name}
                  />
                </Col>
                <Col md={6}>
                  <InfoBox
                    icon={<FiCpu size={14} />}
                    label="Brand"
                    value={info.brand}
                  />
                </Col>
                <Col md={6}>
                  <InfoBox
                    icon={<FiCpu size={14} />}
                    label="Model"
                    value={info.model}
                  />
                </Col>
                <Col md={6}>
                  <InfoBox icon={<FiShield size={14} />} label="Serial Number">
                    <span className="text-uppercase">{info.serial_number}</span>
                  </InfoBox>
                </Col>
                <Col md={6}>
                  <InfoBox
                    icon={<FiCalendar size={14} />}
                    label="Purchase Date"
                    value={formatDate(info.purchase_date)}
                  />
                </Col>
                <Col md={6}>
                  <div
                    className="p-3 rounded-3"
                    style={{
                      backgroundColor: "#f8f9fc",
                      border: "1px solid #eef0f5",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ color: "#6b7280" }}>
                        <FiShield size={14} />
                      </span>
                      <span
                        className="text-muted small"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Warranty Expiry
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span
                        className="fw-semibold text-dark"
                        style={{ fontSize: "0.95rem" }}
                      >
                        {formatDate(info.warranty_expiry)}
                      </span>
                      {warrantyInfo && (
                        <span
                          className={`d-flex align-items-center gap-1 px-2 py-1 rounded-pill`}
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: `var(--bs-${warrantyInfo.color})`,
                            backgroundColor: `var(--bs-${warrantyInfo.color})10`,
                          }}
                        >
                          {warrantyInfo.icon} {warrantyInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Assignment */}
        <Col lg={4}>
          <Card
            className="shadow-sm border-0 h-100"
            style={{ backgroundColor: "#f8f9ff" }}
          >
            <Card.Header className="bg-transparent fw-bold border-bottom d-flex align-items-center gap-2">
              <span className="text-primary">●</span> Assignment Info
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center py-4">
              {info.assigned_to ? (
                <div className="text-center">
                  <div
                    className="bg-white shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <FiUserCheck size={32} className="text-primary" />
                  </div>
                  <h5 className="fw-bold mb-1">{info.assigned_to}</h5>
                  {info.employee_id && (
                    <p className="text-muted small mb-2">
                      ID: {info.employee_id}
                    </p>
                  )}
                  {info.department && (
                    <Badge bg="light" text="dark" className="border mb-3">
                      {info.department}
                    </Badge>
                  )}
                  <Badge
                    bg="success"
                    className="px-3 py-2 rounded-pill shadow-sm mb-4"
                  >
                    Currently Assigned
                  </Badge>
                  <div className="bg-white p-3 rounded-3 shadow-sm text-start">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Assigned Date</span>
                      <span className="fw-bold text-dark">
                        {formatDate(info.assigned_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  <div
                    className="bg-white shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <FiPackage size={32} className="opacity-50" />
                  </div>
                  <h5 className="fw-bold text-dark mb-1">Available</h5>
                  <small className="opacity-75">
                    Asset is unassigned and ready to deploy.
                  </small>
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
