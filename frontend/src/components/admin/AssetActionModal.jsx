import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { FiUserCheck, FiCornerUpLeft, FiTool } from "react-icons/fi";
import api from "../../services/api";

const AssetActionModal = ({ show, onHide, mode, asset, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [assignedDate, setAssignedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "assign" && show) {
      fetchEmployees();
    }
    setError("");
    setSelectedEmployee("");
  }, [mode, show]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/auth/users/", {
        params: { role: "employee", page_size: 1000 },
      });
      const data = res.data.results || res.data;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch employees");
    }
  };

  const handleAction = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "assign") {
        if (!selectedEmployee) return setError("Please select an employee.");
        await onSuccess(
          {
            asset_id: asset.id,
            employee_id: parseInt(selectedEmployee),
            assigned_date: assignedDate,
          },
          "assign",
        );
      } else if (mode === "return") {
        // FIX: Sending asset_id now instead of assignment_id
        await onSuccess({ asset_id: asset.id }, "return");
      } else if (mode === "maintenance") {
        await onSuccess({ status: "maintenance" }, "maintenance");
      }
      onHide();
    } catch (err) {
      const errData = err.response?.data;
      // Bulletproof: Convert ANY error object into a readable string so React doesn't crash
      if (typeof errData === "string") {
        setError(errData);
      } else if (errData?.error) {
        setError(
          typeof errData.error === "string"
            ? errData.error
            : JSON.stringify(errData.error),
        );
      } else if (typeof errData === "object") {
        setError(Object.values(errData).flat().join(", ") || "Action failed.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "assign")
      return (
        <>
          <FiUserCheck className="me-2 text-primary" />
          Assign Asset
        </>
      );
    if (mode === "return")
      return (
        <>
          <FiCornerUpLeft className="me-2 text-warning" />
          Return Asset
        </>
      );
    return (
      <>
        <FiTool className="me-2 text-info" />
        Mark for Maintenance
      </>
    );
  };

  const getBody = () => {
    if (mode === "assign") {
      return (
        <Form>
          <div className="p-3 bg-light rounded mb-3 border">
            <Row className="align-items-center">
              <Col xs="auto">
                <span className="text-muted small">Asset:</span>
              </Col>
              <Col>
                <span className="fw-bold">
                  {asset?.asset_code || ""} - {asset?.name || "Unknown"}
                </span>
              </Col>
            </Row>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Select Employee <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="py-2"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name ||
                    `${emp.first_name || ""} ${emp.last_name || ""}`}{" "}
                  ({emp.employee_id || emp.email || emp.username})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-0">
            <Form.Label className="fw-semibold">Assigned Date</Form.Label>
            <Form.Control
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="py-2"
            />
          </Form.Group>
        </Form>
      );
    }

    if (mode === "return") {
      return (
        <div className="text-center py-4">
          <div className="mb-3">
            <FiCornerUpLeft size={50} className="text-warning" />
          </div>
          <h5>Return Asset?</h5>
          <p className="text-muted mb-0">
            This will mark <strong>{asset?.asset_code}</strong> as available
            again.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <div className="mb-3">
          <FiTool size={50} className="text-info" />
        </div>
        <h5>Move to Maintenance?</h5>
        <p className="text-muted mb-0">
          This will update the status of <strong>{asset?.asset_code}</strong> to
          under maintenance.
        </p>
      </div>
    );
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size={mode === "assign" ? "md" : undefined}
    >
      <Modal.Header closeButton className="bg-light border-bottom">
        <Modal.Title className="fw-bold">{getTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="py-2">
            {error}
          </Alert>
        )}
        {getBody()}
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
          className="px-4"
        >
          Cancel
        </Button>
        <Button
          variant={mode === "return" ? "warning" : "primary"}
          onClick={handleAction}
          disabled={loading}
          className="px-4"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-1" /> Processing...
            </>
          ) : mode === "assign" ? (
            "Assign Now"
          ) : (
            "Confirm"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssetActionModal;
