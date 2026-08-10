import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";
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

  // Fetch categories
  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  // Load asset data when editing
  useEffect(() => {
    if (asset) {
      let categoryValue = asset.category?.id ?? asset.category ?? "";

      // If category is returned as name, find its ID
      if (
        typeof categoryValue === "string" &&
        !/^[0-9]+$/.test(categoryValue)
      ) {
        const matchedCategory = categories.find(
          (cat) =>
            cat.id === asset.category ||
            cat.name === asset.category ||
            cat.name === asset.category_name
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
      const res = await assetCategoryService.getCategories({
        page_size: 100,
      });

      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    // IMPORTANT:
    // Django model expects asset_name, NOT name.
    // Django choices expect lowercase values.

    const payload = {
      asset_name: formData.asset_name.trim(),
      asset_code: formData.asset_code.trim(),
      category: formData.category
        ? parseInt(formData.category, 10)
        : null,

      brand: formData.brand.trim(),
      model: formData.model.trim(),
      serial_number: formData.serial_number.trim(),

      purchase_date: formData.purchase_date || null,
      warranty_expiry: formData.warranty_expiry || null,

      // available / assigned / maintenance / retired
      status: formData.status.toLowerCase(),
    };

    console.log("ASSET PAYLOAD:", payload);

    try {
      await onSubmit(payload);

      onHide();

      // Reset form after successful creation
      setFormData(initialFormState);
    } catch (err) {
      console.error("ASSET CREATE/UPDATE ERROR:", err);

      const responseData = err.response?.data;

      let errorMessage = "Failed to save asset.";

      if (responseData?.error) {
        const backendErrors = responseData.error;

        if (typeof backendErrors === "string") {
          errorMessage = backendErrors;
        } else if (typeof backendErrors === "object") {
          errorMessage = Object.entries(backendErrors)
            .map(([field, messages]) => {
              const message = Array.isArray(messages)
                ? messages.join(", ")
                : messages;

              return `${field}: ${message}`;
            })
            .join(" | ");
        }
      } else if (responseData && typeof responseData === "object") {
        errorMessage = Object.entries(responseData)
          .map(([field, messages]) => {
            const message = Array.isArray(messages)
              ? messages.join(", ")
              : messages;

            return `${field}: ${message}`;
          })
          .join(" | ");
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          {asset ? "Edit Asset" : "Add New Asset"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>

          {/* Asset Name */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Asset Name <span className="text-danger">*</span>
            </Form.Label>

            <Form.Control
              type="text"
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="e.g. Dell Latitude 5520"
              required
            />
          </Form.Group>

          {/* Asset Code */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Asset Code <span className="text-danger">*</span>
            </Form.Label>

            <Form.Control
              type="text"
              name="asset_code"
              value={formData.asset_code}
              onChange={handleChange}
              placeholder="e.g. LAP-0001"
              required
              disabled={!!asset}
            />
          </Form.Group>

          {/* Category */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Category <span className="text-danger">*</span>
            </Form.Label>

            <Form.Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Category --</option>

              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Brand */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Brand
            </Form.Label>

            <Form.Control
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Dell"
            />
          </Form.Group>

          {/* Model */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Model
            </Form.Label>

            <Form.Control
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. Latitude 5520"
            />
          </Form.Group>

          {/* Serial Number */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Serial Number
            </Form.Label>

            <Form.Control
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              placeholder="Enter serial number"
            />
          </Form.Group>

          {/* Purchase Date */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Purchase Date <span className="text-danger">*</span>
            </Form.Label>

            <Form.Control
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              required
            />
          </Form.Group>

          {/* Warranty Expiry */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Warranty Expiry
            </Form.Label>

            <Form.Control
              type="date"
              name="warranty_expiry"
              value={formData.warranty_expiry}
              onChange={handleChange}
            />
          </Form.Group>

          {/* Status */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              Status
            </Form.Label>

            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </Form.Select>
          </Form.Group>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onHide}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="me-2" />
                  {asset ? "Update Asset" : "Create Asset"}
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
