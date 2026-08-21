import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert, Row, Col, Badge } from "react-bootstrap";
import { FiUserCheck, FiCornerUpLeft, FiTool, FiMonitor, FiAlertTriangle, FiCheck, FiCalendar, FiHash } from "react-icons/fi";
import api from "../../services/api";

const AssetActionModal = ({ show, onHide, mode, asset, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeesLoading, setEmployeesLoading] = useState(false);

  useEffect(() => {
    if (mode === "assign" && show) {
      fetchEmployees();
    }
    setError("");
    setSelectedEmployee("");
  }, [mode, show]);

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await api.get("/auth/users/", {
        params: { role: "employee", is_active: "true", page_size: 1000 },
      });
      const data = res.data.results || res.data;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const getSelectedEmployeeName = () => {
    if (!selectedEmployee) return "";
    const emp = employees.find((e) => e.id === parseInt(selectedEmployee));
    return emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.username : "";
  };

  const handleAction = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "assign") {
        if (!selectedEmployee) return setError("Please select an employee to assign this asset.");
        await onSuccess(
          {
            asset_id: asset.id,
            employee_id: parseInt(selectedEmployee),
            assigned_date: assignedDate,
          },
          "assign"
        );
      } else if (mode === "return") {
        await onSuccess({ asset_id: asset.id }, "return");
      } else if (mode === "maintenance") {
        await onSuccess({ status: "maintenance" }, "maintenance");
      }
      onHide();
    } catch (err) {
      const errData = err.response?.data;
      if (typeof errData === "string") {
        setError(errData);
      } else if (errData?.error) {
        setError(typeof errData.error === "string" ? errData.error : JSON.stringify(errData.error));
      } else if (typeof errData === "object") {
        setError(Object.values(errData).flat().join(", ") || "Action failed.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getModalConfig = () => {
    switch (mode) {
      case "assign":
        return {
          icon: <FiUserCheck size={24} />,
          iconBg: "bg-primary bg-opacity-10 text-primary",
          title: "Assign Asset",
          subtitle: "Allocate this asset to an employee",
          btnVariant: "primary",
          btnText: "Assign Now",
          btnIcon: <FiUserCheck className="me-2" />,
        };
      case "return":
        return {
          icon: <FiCornerUpLeft size={24} />,
          iconBg: "bg-warning bg-opacity-10 text-warning",
          title: "Return Asset",
          subtitle: "Mark this asset as returned and available",
          btnVariant: "warning",
          btnText: "Confirm Return",
          btnIcon: <FiCornerUpLeft className="me-2" />,
        };
      case "maintenance":
        return {
          icon: <FiTool size={24} />,
          iconBg: "bg-info bg-opacity-10 text-info",
          title: "Send for Maintenance",
          subtitle: "Mark this asset as under maintenance",
          btnVariant: "info",
          btnText: "Confirm Maintenance",
          btnIcon: <FiTool className="me-2" />,
        };
      default:
        return {};
    }
  };

  const config = getModalConfig();

  const renderAssetInfoCard = () => (
    <div className="p-3 rounded-3 border bg-light mb-4">
      <div className="d-flex align-items-start gap-3">
        <div className="bg-white rounded-2 p-2 shadow-sm">
          <FiMonitor size={24} className="text-primary" />
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-bold">{asset?.asset_name || asset?.name || "Unknown Asset"}</span>
            <Badge bg="light" text="dark" className="border" style={{ fontSize: "0.7rem" }}>
              <FiHash size={10} className="me-1" />
              {asset?.asset_code || "N/A"}
            </Badge>
          </div>
          <div className="d-flex gap-3 flex-wrap">
            {asset?.category_name && (
              <small className="text-muted">
                <span className="fw-medium text-dark">{asset.category_name}</span>
              </small>
            )}
            {asset?.brand && (
              <small className="text-muted">
                Brand: <span className="fw-medium text-dark">{asset.brand}</span>
              </small>
            )}
            {asset?.serial_number && (
              <small className="text-muted">
                S/N: <span className="fw-medium text-dark">{asset.serial_number}</span>
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignForm = () => (
    <Form>
      {renderAssetInfoCard()}

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold small">
          Select Employee <span className="text-danger">*</span>
        </Form.Label>
        {employeesLoading ? (
          <div className="d-flex align-items-center py-3">
            <Spinner size="sm" className="me-2" /> Loading employees...
          </div>
        ) : (
          <>
            <Form.Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="py-2"
              size="lg"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => {
                const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.username;
                const empId = emp.employee_id || emp.employee_profile?.employee_id;
                const dept = emp.employee_department || emp.employee_profile?.department?.name;
                return (
                  <option key={emp.id} value={emp.id}>
                    {fullName} {empId ? `(${empId})` : `(${emp.email || emp.username})`} {dept ? `- ${dept}` : ""}
                  </option>
                );
              })}
            </Form.Select>
            {selectedEmployee && (
              <div className="mt-2 p-2 bg-success bg-opacity-10 rounded-2 border border-success border-opacity-20">
                <small className="text-success d-flex align-items-center gap-1">
                  <FiCheck size={14} /> Assigning to: <strong>{getSelectedEmployeeName()}</strong>
                </small>
              </div>
            )}
          </>
        )}
      </Form.Group>

      <Form.Group className="mb-0">
        <Form.Label className="fw-semibold small">
          <FiCalendar className="me-1" /> Assignment Date
        </Form.Label>
        <Form.Control
          type="date"
          value={assignedDate}
          onChange={(e) => setAssignedDate(e.target.value)}
          className="py-2"
        />
      </Form.Group>
    </Form>
  );

  const renderConfirmView = () => {
    if (mode === "return") {
      return (
        <>
          {renderAssetInfoCard()}
          <div className="text-center py-3">
            <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
              <FiCornerUpLeft size={36} className="text-warning" />
            </div>
            <h5 className="fw-bold mb-2">Confirm Asset Return?</h5>
            <p className="text-muted mb-0" style={{ maxWidth: "350px", margin: "0 auto" }}>
              This asset will be marked as <strong>Available</strong> and can be assigned to another employee.
            </p>
            {asset?.current_assignment?.employee_name && (
              <div className="mt-3 p-2 bg-light rounded-2">
                <small className="text-muted">
                  Currently assigned to: <strong className="text-dark">{asset.current_assignment.employee_name}</strong>
                </small>
              </div>
            )}
          </div>
        </>
      );
    }

    if (mode === "maintenance") {
      return (
        <>
          {renderAssetInfoCard()}
          <div className="text-center py-3">
            <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
              <FiTool size={36} className="text-info" />
            </div>
            <h5 className="fw-bold mb-2">Send for Maintenance?</h5>
            <p className="text-muted mb-0" style={{ maxWidth: "350px", margin: "0 auto" }}>
              This asset will be marked as <strong>Under Maintenance</strong> and cannot be assigned until restored.
            </p>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <Modal show={show} onHide={onHide} centered size={mode === "assign" ? "lg" : "md"} backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom">
        <Modal.Title className="d-flex align-items-center gap-2">
          <div className={`rounded-2 p-2 ${config.iconBg}`}>
            {config.icon}
          </div>
          <div>
            <span className="fw-bold">{config.title}</span>
            <small className="d-block text-muted fw-normal" style={{ fontSize: "0.75rem" }}>
              {config.subtitle}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {error && (
          <Alert variant="danger" className="py-2 px-3 small" dismissible onClose={() => setError("")}>
            <FiAlertTriangle className="me-1" /> {error}
          </Alert>
        )}

        {mode === "assign" ? renderAssignForm() : renderConfirmView()}
      </Modal.Body>

      <Modal.Footer className="border-top bg-light">
        <Button variant="secondary" onClick={onHide} disabled={loading} className="px-4">
          Cancel
        </Button>
        <Button
          variant={config.btnVariant}
          onClick={handleAction}
          disabled={loading || (mode === "assign" && !selectedEmployee)}
          className="px-4"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              {config.btnIcon}
              {config.btnText}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssetActionModal;