import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import {
  FiMonitor,
  FiCalendar,
  FiHash,
  FiCpu,
  FiShield,
  FiLayers,
  FiPackage,
  FiChevronRight,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import assetService from "../../services/assetService";

const MyAssets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    setLoading(true);
    try {
      const res = await assetService.getMyAssets();
      let rawData = res.data;
      if (rawData?.results && Array.isArray(rawData.results))
        rawData = rawData.results;
      else if (rawData?.data && Array.isArray(rawData.data))
        rawData = rawData.data;

      const list = Array.isArray(rawData) ? rawData : [];
      console.log("My Assets Data:", JSON.stringify(list, null, 2));
      setAssets(list);
    } catch (err) {
      console.error("My Assets Error:", err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyInfo = (warrantyExpiry) => {
    if (!warrantyExpiry) return null;
    const expiry = new Date(warrantyExpiry);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
      return {
        text: "Expired",
        color: "danger",
        icon: <FiAlertTriangle size={12} />,
      };
    if (diffDays <= 30)
      return {
        text: `${diffDays}d left`,
        color: "warning",
        icon: <FiAlertTriangle size={12} />,
      };
    if (diffDays <= 90)
      return {
        text: `${diffDays}d left`,
        color: "info",
        icon: <FiClock size={12} />,
      };
    return {
      text: `${diffDays}d left`,
      color: "success",
      icon: <FiCheckCircle size={12} />,
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Summary stats
  const totalAssets = assets.length;
  const expiringSoon = assets.filter((item) => {
    const w = item.warranty_expiry;
    if (!w) return false;
    const d = Math.ceil((new Date(w) - new Date()) / (1000 * 60 * 60 * 24));
    return d > 0 && d <= 90;
  }).length;
  const expired = assets.filter((item) => {
    const w = item.warranty_expiry;
    if (!w) return false;
    return new Date(w) < new Date();
  }).length;

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading your assigned assets...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: "46px", height: "46px", backgroundColor: "#e8f0fe" }}
        >
          <FiPackage size={24} style={{ color: "#1a73e8" }} />
        </div>
        <div>
          <h4 className="mb-0 fw-bold">My Assets</h4>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            IT assets currently assigned to you
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {assets.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={4}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ backgroundColor: "#f0f7ff" }}
            >
              <Card.Body className="py-3 px-3 text-center">
                <div className="text-primary fs-4 fw-bold">{totalAssets}</div>
                <div className="text-muted small fw-medium">Total Assets</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ backgroundColor: "#fff8e1" }}
            >
              <Card.Body className="py-3 px-3 text-center">
                <div className="text-warning fs-4 fw-bold">{expiringSoon}</div>
                <div className="text-muted small fw-medium">
                  Warranty Expiring
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ backgroundColor: "#fde8e8" }}
            >
              <Card.Body className="py-3 px-3 text-center">
                <div className="text-danger fs-4 fw-bold">{expired}</div>
                <div className="text-muted small fw-medium">
                  Warranty Expired
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Empty State */}
      {assets.length === 0 ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <FiMonitor size={36} className="text-muted" />
            </div>
            <h5 className="text-dark fw-bold mb-2">No Assets Assigned</h5>
            <p
              className="text-muted"
              style={{ maxWidth: "350px", margin: "0 auto" }}
            >
              You currently don't have any IT assets assigned. Contact IT
              Support if you need equipment.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {assets.map((item, index) => {
            // Data comes directly from AssetAssignmentListSerializer now
            const assetId = item.id;
            const assetName = item.asset_name || "Unknown Asset";
            const assetCode = item.asset_code || "-";
            const categoryName = item.category_name || null;
            const brand = item.brand || null;
            const model = item.model || null;
            const serialNumber = item.serial_number || null;
            const purchaseDate = item.purchase_date || null;
            const warrantyExpiry = item.warranty_expiry || null;
            const assignedDate = item.assigned_date || null;
            const warrantyInfo = getWarrantyInfo(warrantyExpiry);

            const brandModel = [brand, model].filter(Boolean).join(" ");

            if (!assetId) return null;

            return (
              <Col xs={12} md={6} xl={4} key={assetId || index}>
                <Card
                  className="shadow-sm h-100 border-0 overflow-hidden"
                  style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  onClick={() => navigate(`/employee/assets/${assetId}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 25px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.06)";
                  }}
                >
                  {/* Top Color Bar */}
                  <div
                    style={{
                      height: "4px",
                      background: "linear-gradient(90deg, #1a73e8, #4fc3f7)",
                    }}
                  />

                  <Card.Body className="p-3">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-start gap-2">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#e8f0fe",
                          }}
                        >
                          <FiMonitor size={18} style={{ color: "#1a73e8" }} />
                        </div>
                        <div style={{ maxWidth: "180px" }}>
                          <div
                            className="fw-bold text-dark"
                            style={{ fontSize: "0.92rem", lineHeight: 1.3 }}
                          >
                            {assetName}
                          </div>
                          <div
                            className="d-flex align-items-center gap-1 text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <FiHash size={11} />
                            <span className="text-uppercase">{assetCode}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        bg="success"
                        className="px-2 py-1 flex-shrink-0"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Active
                      </Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="mb-3">
                      <Row className="g-2">
                        {/* Category */}
                        <Col xs={6}>
                          <div
                            className="p-2 rounded-2"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            <div
                              className="text-muted d-flex align-items-center gap-1"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <FiLayers size={10} /> Category
                            </div>
                            <div
                              className="fw-semibold text-dark"
                              style={{ fontSize: "0.82rem" }}
                            >
                              {categoryName || "—"}
                            </div>
                          </div>
                        </Col>

                        {/* Brand / Model */}
                        <Col xs={6}>
                          <div
                            className="p-2 rounded-2"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            <div
                              className="text-muted d-flex align-items-center gap-1"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <FiCpu size={10} /> Brand / Model
                            </div>
                            <div
                              className="fw-semibold text-dark"
                              style={{ fontSize: "0.82rem" }}
                            >
                              {brandModel || "—"}
                            </div>
                          </div>
                        </Col>

                        {/* Serial Number */}
                        <Col xs={6}>
                          <div
                            className="p-2 rounded-2"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            <div
                              className="text-muted d-flex align-items-center gap-1"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <FiShield size={10} /> Serial Number
                            </div>
                            <div
                              className="fw-semibold text-dark text-uppercase"
                              style={{ fontSize: "0.82rem" }}
                            >
                              {serialNumber || "—"}
                            </div>
                          </div>
                        </Col>

                        {/* Assigned Date */}
                        <Col xs={6}>
                          <div
                            className="p-2 rounded-2"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            <div
                              className="text-muted d-flex align-items-center gap-1"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <FiCalendar size={10} /> Assigned On
                            </div>
                            <div
                              className="fw-semibold text-dark"
                              style={{ fontSize: "0.82rem" }}
                            >
                              {formatDate(assignedDate) || "—"}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Warranty Status Bar */}
                    <div
                      className="d-flex justify-content-between align-items-center p-2 rounded-2"
                      style={{
                        backgroundColor: warrantyInfo
                          ? `${warrantyInfo.color}08`
                          : "#f8f9fa",
                        border: `1px solid ${warrantyInfo ? `${warrantyInfo.color}20` : "#e9ecef"}`,
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <FiShield
                          size={14}
                          style={{
                            color: warrantyInfo
                              ? `var(--bs-${warrantyInfo.color})`
                              : "#6b7280",
                          }}
                        />
                        <span className="small fw-medium text-dark">
                          Warranty
                        </span>
                      </div>
                      {warrantyInfo ? (
                        <div
                          className="d-flex align-items-center gap-1 px-2 py-0 rounded-pill"
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: `var(--bs-${warrantyInfo.color})`,
                            backgroundColor: `${warrantyInfo.color}15`,
                          }}
                        >
                          {warrantyInfo.icon} {warrantyInfo.text}
                        </div>
                      ) : (
                        <span className="small text-muted">Not specified</span>
                      )}
                    </div>

                    {/* Purchase Date */}
                    {purchaseDate && (
                      <div className="mt-2 text-end">
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.7rem" }}
                        >
                          Purchased: {formatDate(purchaseDate)}
                        </small>
                      </div>
                    )}

                    {/* View Detail Arrow */}
                    <div
                      className="d-flex justify-content-end align-items-center gap-1 mt-2 pt-2 border-top"
                      style={{ borderColor: "#f0f0f0" }}
                    >
                      <span
                        className="small text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        View Details
                      </span>
                      <FiChevronRight size={14} className="text-muted" />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default MyAssets;
