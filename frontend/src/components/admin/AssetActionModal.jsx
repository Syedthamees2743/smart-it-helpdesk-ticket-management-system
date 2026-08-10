import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";

const AssetActionModal = ({ show, onHide, mode, asset, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!show) {
      setComment("");
      setError("");
      setLoading(false);
    }
  }, [show]);

  const getTitle = () => {
    switch (mode) {
      case "assign":
        return "Assign Asset";
      case "return":
        return "Return Asset";
      case "maintenance":
        return "Send Asset to Maintenance";
      default:
        return "Asset Action";
    }
  };

  const getSubmitLabel = () => {
    switch (mode) {
      case "assign":
        return "Assign";
      case "return":
        return "Return";
      case "maintenance":
        return "Update";
      default:
        return "Submit";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!asset?.id) {
      setError("Asset data is missing.");
      setLoading(false);
      return;
    }

    const payload = {
      asset_id: asset.id,
      comment: comment || undefined,
    };

    try {
      await onSuccess(payload, mode);
      onHide();
    } catch (err) {
      const responseData = err.response?.data;
      setError(
        responseData?.detail || responseData?.error || "Unable to perform this action."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>{getTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p className="small text-muted">
          Asset: <strong>{asset?.name || "Unknown"}</strong>
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="actionComment">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional notes for this action"
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner size="sm" /> : getSubmitLabel()}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AssetActionModal;
