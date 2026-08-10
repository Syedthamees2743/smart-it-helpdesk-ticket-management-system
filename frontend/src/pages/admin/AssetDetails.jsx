import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Button, Badge, Spinner, Table } from "react-bootstrap";
import {
  FiArrowLeft,
  FiEdit2,
  FiUserCheck,
  FiCornerUpLeft,
  FiTool,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import assetService from "../../services/assetService";
import AssetFormModal from "../../components/admin/AssetFormModal";
import AssetActionModal from "../../components/admin/AssetActionModal";

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
      const res = await assetService.getAssetById(id);
      setAsset(res.data);
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

  const handleUpdate = async (data) => {
    await assetService.updateAsset(id, data);
    fetchAsset();
  };

  const handleAction = async (payload, mode) => {
    if (mode === "assign") await assetService.assignAsset(payload);
    else if (mode === "return") await assetService.returnAsset(payload);
    else if (mode === "maintenance")
      await assetService.updateAsset(id, { status: "maintenance" }); // Force lowercase here too
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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft className="me-1" /> Back
        </Button>
        <div className="d-flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              {/* FIXED: Added ?.toLowerCase() to all status checks */}
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
            </>
          )}
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white fw-bold">
              Asset Information
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {[
                  ["Asset Code", asset.asset_code],
                  ["Asset Name", asset.name],
                  ["Category", asset.category_name || "-"],
                  ["Brand", asset.brand || "-"],
                  ["Model", asset.model || "-"],
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

          {asset.history && asset.history.length > 0 && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white fw-bold">
                Asset History
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Action</th>
                        <th>Employee</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.history.map((h, i) => (
                        <tr key={i}>
                          <td>
                            <Badge
                              bg={
                                h.action === "Assigned" ? "primary" : "warning"
                              }
                            >
                              {h.action}
                            </Badge>
                          </td>
                          <td>{h.employee_name || "-"}</td>
                          <td className="text-nowrap small">
                            {new Date(h.date).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-start border-4 border-primary">
            <Card.Header className="bg-white fw-bold">
              Assignment Info
            </Card.Header>
            <Card.Body>
              {asset.current_assignment ? (
                <>
                  <p className="text-muted small mb-1">Assigned To</p>
                  <p className="fw-bold mb-3 fs-5">
                    {asset.current_assignment.employee_name}
                  </p>
                  <p className="text-muted small mb-1">Assigned Date</p>
                  <p className="fw-semibold mb-3">
                    {new Date(
                      asset.current_assignment.assigned_date
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-muted small mb-1">Status</p>
                  <Badge bg="success">Active</Badge>
                </>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FiUserCheck size={30} className="mb-2 opacity-50" />
                  <p className="mb-0">Currently Available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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