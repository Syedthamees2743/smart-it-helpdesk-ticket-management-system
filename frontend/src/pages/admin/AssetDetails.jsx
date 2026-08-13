import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Button, Badge, Spinner, Table } from "react-bootstrap";
import {
  FiArrowLeft,
  FiEdit2,
  FiUserCheck,
  FiCornerUpLeft,
  FiTool,
  FiTrash2,
  FiPackage,
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
  const isEmployee = user?.role === "employee" || location.pathname.startsWith("/employee");

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState("");

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const normalizeAssignmentData = (data) => {
    const assetData = data.asset || {};
    const categoryName =
      data.category_name ||
      assetData.category_name ||
      assetData.category?.name ||
      assetData.category?.category_name ||
      "-";
    const brand = data.brand || assetData.brand || assetData.make || "-";
    const model = data.model || assetData.model || "-";
    const serialNumber =
      data.serial_number || assetData.serial_number || assetData.serialNumber || "-";

    return {
      ...data,
      asset_code:
        data.asset_code || assetData.asset_code || assetData.code || "-",
      asset_name:
        data.asset_name || assetData.asset_name || assetData.name || "Unknown Asset",
      category_name: categoryName,
      brand,
      model,
      serial_number: serialNumber,
      purchase_date: data.purchase_date || assetData.purchase_date || assetData.purchased_date,
      warranty_expiry:
        data.warranty_expiry || assetData.warranty_expiry || assetData.warranty_expiry_date,
      status: data.status || assetData.status || assetData.asset_status || "Unknown",
      current_assignment: {
        employee_name:
          data.employee_name || data.asset?.employee_name || user?.name ||
          user?.full_name || "You",
        assigned_date: data.assigned_date || assetData.assigned_date,
        return_date: data.return_date || assetData.return_date,
      },
    };
  };

  const fetchAsset = async () => {
    setLoading(true);
    setError("");
    try {
      const res = isEmployee
        ? await assetService.getAssignmentById(id)
        : await assetService.getAssetById(id);
      const data = res.data;
      setAsset(isEmployee ? normalizeAssignmentData(data) : data);
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

  const getStatusBadge = (status) => {
    if (!status)
      return <span className="badge bg-light text-dark">Unknown</span>;
    let cls = "badge fs-6 ";
    const s = status.toLowerCase();
    const displayText =
      status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
    switch (s) {
      case "available":
        cls += "bg-success-subtle text-success";
        break;
      case "assigned":
        cls += "bg-primary-subtle text-primary";
        break;
      case "maintenance":
        cls += "bg-warning-subtle text-warning";
        break;
      case "retired":
        cls += "bg-secondary-subtle text-secondary";
        break;
      default:
        cls += "bg-light text-dark";
    }
    return <span className={cls}>{displayText}</span>;
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading asset details...</p>
      </div>
    );
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!asset) return null;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft className="me-1" /> Back
        </Button>

        {/* ADMIN ONLY ACTIONS */}
        {isAdmin && (
          <div className="d-flex gap-2 flex-wrap">
            {asset.status?.toLowerCase() === "available" && (
              <Button
                variant="success"
                onClick={() => {
                  setActionMode("assign");
                  setShowActionModal(true);
                }}
              >
                <FiUserCheck className="me-1" /> Assign Asset
              </Button>
            )}
            {asset.status?.toLowerCase() === "assigned" && (
              <Button
                variant="warning"
                onClick={() => {
                  setActionMode("return");
                  setShowActionModal(true);
                }}
              >
                <FiCornerUpLeft className="me-1" /> Return Asset
              </Button>
            )}
            {(asset.status?.toLowerCase() === "available" ||
              asset.status?.toLowerCase() === "assigned") && (
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

      <Row>
        {/* Left Column - Main Info */}
        <Col lg={8}>
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-white fw-bold border-bottom">
              <FiPackage className="me-2 text-primary" />
              Asset Information
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {[
                  ["Asset Code", asset.asset_code],
                  ["Asset Name", asset.asset_name || asset.name],
                  ["Category", asset.category_name || "-"],
                  ["Brand", asset.brand || "-"],
                  ["Model", asset.model || "-"],
                  ["Serial Number", asset.serial_number || "-"],
                  ["Status", getStatusBadge(asset.status)],
                  [
                    "Purchase Date",
                    asset.purchase_date
                      ? new Date(asset.purchase_date).toLocaleDateString()
                      : "-",
                  ],
                  [
                    "Warranty Expiry",
                    asset.warranty_expiry
                      ? new Date(asset.warranty_expiry).toLocaleDateString()
                      : "-",
                  ],
                ].map(([label, value], i) => (
                  <Col md={6} key={i}>
                    <p className="text-muted small mb-1">{label}</p>
                    <p className="fw-semibold mb-0">{value}</p>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Assignment Info */}
        <Col lg={4}>
          <Card
            className="shadow-sm border-0 h-100"
            style={{ backgroundColor: "#f8f9ff" }}
          >
            <Card.Header className="bg-transparent fw-bold border-bottom d-flex align-items-center gap-2">
              <span className="text-primary">●</span> Assignment Info
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center">
              {asset.current_assignment ? (
                <div className="text-center">
                  {/* Profile Icon */}
                  <div
                    className="bg-white shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <FiUserCheck size={32} className="text-primary" />
                  </div>

                  <h4 className="fw-bold mb-2">
                    {asset.current_assignment.employee_name}
                  </h4>
                  <Badge
                    bg="success"
                    className="px-3 py-2 rounded-pill mb-4 shadow-sm"
                  >
                    Currently Assigned
                  </Badge>

                  {/* Date Info Inner Card */}
                  <div className="bg-white p-3 rounded-3 shadow-sm text-start">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Assigned Date</span>
                      <span className="fw-bold text-dark">
                        {new Date(
                          asset.current_assignment.assigned_date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  {/* Empty State Icon */}
                  <div
                    className="bg-white shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <FiPackage size={32} className="text-muted opacity-50" />
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

      {/* Modals (Only accessible to Admins) */}
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
