import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert, Row, Col, InputGroup } from "react-bootstrap";
import { FiSave, FiMonitor, FiPackage, FiCpu, FiCalendar, FiHash, FiTag, FiLayers, FiShield, FiClock } from "react-icons/fi";
import assetCategoryService from "../../services/assetCategoryService";

const initialFormState = {
  asset_name: "",
  asset_code: "",
  category: "",
  brand: "",
  model: "",
  serial_number: "",
  purchase_date: "",
  warranty_expiry: "",
  status: "available",
};

const AssetFormModal = ({ show, onHide, asset, onSubmit }) => {
  const isEditMode = !!asset;
  const [formData, setFormData] = useState(initialFormState);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (show) fetchCategories();
  }, [show]);

  useEffect(() => {
    if (asset) {
      let categoryValue = asset.category?.id ?? asset.category ?? "";
      if (typeof categoryValue === "string" && !/^[0-9]+$/.test(categoryValue)) {
        const matchedCategory = categories.find(
          (cat) => cat.name === asset.category || cat.name === asset.category_name
        );
        categoryValue = matchedCategory?.id ?? "";
      }
      setFormData({
        asset_name: asset.asset_name || asset.name || "",
        asset_code: asset.asset_code || "",
        category: categoryValue,
        brand: asset.brand || "",
        model: asset.model || "",
        serial_number: asset.serial_number || "",
        purchase_date: asset.purchase_date || "",
        warranty_expiry: asset.warranty_expiry || "",
        status: asset.status?.toLowerCase() || "available",
      });
    } else {
      setFormData(initialFormState);
    }
    setError("");
  }, [asset, show, categories]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await assetCategoryService.getCategories({ page_size: 100 });
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      asset_name: formData.asset_name.trim(),
      asset_code: formData.asset_code.trim().toUpperCase(),
      category: formData.category ? parseInt(formData.category, 10) : null,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      serial_number: formData.serial_number.trim().toUpperCase(),
      purchase_date: formData.purchase_date || null,
      warranty_expiry: formData.warranty_expiry || null,
      status: formData.status.toLowerCase(),
    };

    try {
      await onSubmit(payload);
      onHide();
      setFormData(initialFormState);
    } catch (err) {
      const responseData = err.response?.data;
      let errorMessage = "Failed to save asset.";
      if (responseData?.error) {
        const errObj = responseData.error;
        if (typeof errObj === "string") errorMessage = errObj;
        else if (typeof errObj === "object")
          errorMessage = Object.entries(errObj)
            .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(", ") : m}`)
            .join(" | ");
      } else if (typeof responseData === "object") {
        errorMessage = Object.entries(responseData)
          .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(", ") : m}`)
          .join(" | ");
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyStatus = () => {
    if (!formData.purchase_date || !formData.warranty_expiry) return null;
    const expiry = new Date(formData.warranty_expiry);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: "Expired", color: "danger", icon: "✕" };
    if (diffDays <= 30) return { text: `${diffDays} days left`, color: "warning", icon: "⚠" };
    if (diffDays <= 90) return { text: `${diffDays} days left`, color: "info", icon: "⏳" };
    return { text: `${diffDays} days left`, color: "success", icon: "✓" };
  };

  const warrantyStatus = getWarrantyStatus();

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" centered>
      <Modal.Header closeButton className="border-bottom py-3" style={{ backgroundColor: "#f8f9fc" }}>
        <Modal.Title className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "44px", height: "44px", backgroundColor: "#e8f0fe" }}>
            <FiMonitor size={22} style={{ color: "#1a73e8" }} />
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: "1.05rem" }}>
              {isEditMode ? "Edit Asset" : "Register New Asset"}
            </div>
            <div className="text-muted" style={{ fontSize: "0.78rem", fontWeight: 400 }}>
              {isEditMode ? "Update asset details in the inventory" : "Add a new IT asset to the organization inventory"}
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 py-4" style={{ backgroundColor: "#fafbfe" }}>
        {error && (
          <Alert variant="danger" className="py-2 px-3 small mb-4" dismissible onClose={() => setError("")}>
            <strong>Error:</strong> {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* ═══════════════════════════════════════════════════════════
              SECTION 1: ASSET IDENTIFICATION
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "28px", height: "28px", backgroundColor: "#e8f0fe" }}>
                <FiTag size={14} style={{ color: "#1a73e8" }} />
              </div>
              <span className="fw-bold text-dark" style={{ fontSize: "0.82rem", letterSpacing: "0.3px" }}>
                ASSET IDENTIFICATION
              </span>
            </div>

            <Row className="g-4">
              <Col lg={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Asset Name <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup className="mb-1">
                    <InputGroup.Text className="bg-white border-end-0" style={{ color: "#6b7280" }}>
                      <FiMonitor size={15} />
                    </InputGroup.Text>
                    <Form.Control
                      name="asset_name"
                      value={formData.asset_name}
                      onChange={handleChange}
                      placeholder="Dell Latitude 5520 Laptop"
                      required
                      className="border-start-0 py-2"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Enter the full name of the asset (e.g., Dell Latitude 5520 Laptop, HP LaserJet Pro Printer)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col lg={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Asset Code <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup className="mb-1">
                    <InputGroup.Text className="bg-white border-end-0" style={{ color: "#6b7280" }}>
                      <FiHash size={15} />
                    </InputGroup.Text>
                    <Form.Control
                      name="asset_code"
                      value={formData.asset_code}
                      onChange={handleChange}
                      placeholder="LAP-001"
                      required
                      disabled={isEditMode}
                      className="border-start-0 py-2 text-uppercase"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </InputGroup>
                  {isEditMode ? (
                    <Form.Text className="text-warning" style={{ fontSize: "0.72rem" }}>
                      ⚠ Asset code is auto-generated and cannot be modified
                    </Form.Text>
                  ) : (
                    <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                      Unique identifier (e.g., LAP-001, DESK-001, PRN-001, MON-001)
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 2: CLASSIFICATION & STATUS
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "28px", height: "28px", backgroundColor: "#fef3e0" }}>
                <FiLayers size={14} style={{ color: "#f59e0b" }} />
              </div>
              <span className="fw-bold text-dark" style={{ fontSize: "0.82rem", letterSpacing: "0.3px" }}>
                CLASSIFICATION & STATUS
              </span>
            </div>

            <Row className="g-4">
              <Col lg={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  {categoriesLoading ? (
                    <div className="d-flex align-items-center py-2">
                      <Spinner size="sm" className="me-2" /> Loading categories...
                    </div>
                  ) : (
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="py-2"
                      style={{ fontSize: "0.9rem" }}
                    >
                      <option value="">── Select asset category ──</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Form.Select>
                  )}
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Select the appropriate IT asset category from the list
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col lg={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Current Status
                  </Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="py-2"
                    style={{ fontSize: "0.9rem" }}
                  >
                    <option value="available">🟢  Available — Ready for deployment</option>
                    <option value="assigned">🔵  Assigned — In use by employee</option>
                    <option value="maintenance">🟡  Under Maintenance — Repair in progress</option>
                    <option value="retired">⚫  Retired — No longer in service</option>
                  </Form.Select>
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Current operational status of this asset in the inventory
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 3: HARDWARE SPECIFICATIONS
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "28px", height: "28px", backgroundColor: "#e8f5e9" }}>
                <FiCpu size={14} style={{ color: "#2e7d32" }} />
              </div>
              <span className="fw-bold text-dark" style={{ fontSize: "0.82rem", letterSpacing: "0.3px" }}>
                HARDWARE SPECIFICATIONS
              </span>
            </div>

            <Row className="g-4">
              <Col lg={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Brand / Manufacturer
                  </Form.Label>
                  <Form.Control
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Dell, HP, Lenovo, Apple"
                    className="py-2"
                    style={{ fontSize: "0.9rem" }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    OEM manufacturer or brand name
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col lg={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Model Number
                  </Form.Label>
                  <Form.Control
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Latitude 5520, ProBook 450"
                    className="py-2"
                    style={{ fontSize: "0.9rem" }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Specific model or part number
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col lg={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Serial Number
                  </Form.Label>
                  <InputGroup className="mb-1">
                    <InputGroup.Text className="bg-white border-end-0" style={{ color: "#6b7280" }}>
                      <FiShield size={13} />
                    </InputGroup.Text>
                    <Form.Control
                      name="serial_number"
                      value={formData.serial_number}
                      onChange={handleChange}
                      placeholder="ABC123XYZ456"
                      className="border-start-0 py-2 text-uppercase"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Unique serial number from manufacturer
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 4: PURCHASE & WARRANTY INFORMATION
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "28px", height: "28px", backgroundColor: "#fce4ec" }}>
                <FiCalendar size={14} style={{ color: "#c62828" }} />
              </div>
              <span className="fw-bold text-dark" style={{ fontSize: "0.82rem", letterSpacing: "0.3px" }}>
                PURCHASE & WARRANTY INFORMATION
              </span>
            </div>

            <Row className="g-4">
              <Col lg={5}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Purchase Date <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup className="mb-1">
                    <InputGroup.Text className="bg-white border-end-0" style={{ color: "#6b7280" }}>
                      <FiCalendar size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      name="purchase_date"
                      value={formData.purchase_date}
                      onChange={handleChange}
                      required
                      className="border-start-0 py-2"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Date when the asset was procured by the organization
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col lg={5}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                    Warranty Expiry Date
                  </Form.Label>
                  <InputGroup className="mb-1">
                    <InputGroup.Text className="bg-white border-end-0" style={{ color: "#6b7280" }}>
                      <FiShield size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      name="warranty_expiry"
                      value={formData.warranty_expiry}
                      onChange={handleChange}
                      min={formData.purchase_date || undefined}
                      className="border-start-0 py-2"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Last date of manufacturer warranty coverage
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col lg={2} className="d-flex flex-column justify-content-end">
                {warrantyStatus ? (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center py-2 px-2 rounded-3 h-100"
                    style={{
                      backgroundColor: `${warrantyStatus.color}10`,
                      border: `1px solid ${warrantyStatus.color}40`,
                      minHeight: "58px"
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{warrantyStatus.icon}</span>
                    <span
                      className="fw-bold mt-1"
                      style={{ fontSize: "0.68rem", color: `var(--bs-${warrantyStatus.color})` }}
                    >
                      {warrantyStatus.text}
                    </span>
                  </div>
                ) : (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center py-2 px-2 rounded-3 bg-light h-100"
                    style={{ minHeight: "58px" }}
                  >
                    <FiClock size={16} className="text-muted mb-1" />
                    <span className="text-muted fw-medium" style={{ fontSize: "0.68rem" }}>
                      No warranty info
                    </span>
                  </div>
                )}
              </Col>
            </Row>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              FOOTER BUTTONS
          ═══════════════════════════════════════════════════════════ */}
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button
              variant="light"
              onClick={onHide}
              disabled={loading}
              className="px-4 py-2 border"
              style={{ fontSize: "0.9rem" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-4 py-2"
              style={{ fontSize: "0.9rem", backgroundColor: "#1a73e8", borderColor: "#1a73e8" }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {isEditMode ? "Updating Asset..." : "Registering Asset..."}
                </>
              ) : (
                <>
                  <FiSave className="me-2" />
                  {isEditMode ? "Update Asset" : "Register Asset"}
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AssetFormModal;