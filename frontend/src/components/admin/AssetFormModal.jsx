import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { FiSave } from "react-icons/fi";
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
  const [formData, setFormData] = useState(initialFormState);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) fetchCategories();
  }, [show]);

  useEffect(() => {
    if (asset) {
      let categoryValue = asset.category?.id ?? asset.category ?? "";
      if (
        typeof categoryValue === "string" &&
        !/^[0-9]+$/.test(categoryValue)
      ) {
        const matchedCategory = categories.find(
          (cat) =>
            cat.name === asset.category || cat.name === asset.category_name,
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
    try {
      const res = await assetCategoryService.getCategories({ page_size: 100 });
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      setCategories([]);
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
      asset_code: formData.asset_code.trim(),
      category: formData.category ? parseInt(formData.category, 10) : null,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      serial_number: formData.serial_number.trim(),
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

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-light py-2">
        <Modal.Title className="fs-5">
          {asset ? "Edit Asset" : "Add New Asset"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3 pb-2">
        {error && (
          <Alert variant="danger" className="py-2 px-3 small">
            <strong>Error:</strong> {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Row className="g-2">
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">
                Asset Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                name="asset_name"
                value={formData.asset_name}
                onChange={handleChange}
                placeholder="e.g., Dell Laptop"
                required
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">
                Asset Code <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                name="asset_code"
                value={formData.asset_code}
                onChange={handleChange}
                placeholder="e.g., LAP-001"
                required
                disabled={!!asset}
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">
                Category <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                size="sm"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">Status</Form.Label>
              <Form.Select
                size="sm"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">Brand</Form.Label>
              <Form.Control
                size="sm"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g., Dell"
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">Model</Form.Label>
              <Form.Control
                size="sm"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., Latitude 5520"
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">
                Serial Number
              </Form.Label>
              <Form.Control
                size="sm"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="Enter serial number"
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">
                Purchase Date <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                required
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="mb-1 small fw-semibold">
                Warranty Expiry
              </Form.Label>
              <Form.Control
                size="sm"
                type="date"
                name="warranty_expiry"
                value={formData.warranty_expiry}
                onChange={handleChange}
              />
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={onHide}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Spinner size="sm" className="me-1" />
              ) : (
                <>
                  <FiSave className="me-1" /> {asset ? "Update" : "Create"}
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
