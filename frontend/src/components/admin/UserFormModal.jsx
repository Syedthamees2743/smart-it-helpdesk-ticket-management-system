import { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Row, Col, Alert } from "react-bootstrap";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../services/api";
import profileService from "../../services/profileService";

const UserFormModal = ({ show, onHide, onSave, editingUser }) => {
  const isEditMode = !!editingUser;

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "employee",
    password: "",
    password2: "",
    is_active: true,
  });

  // employee_id / technician_id kept for DISPLAY only (edit mode) —
  // never editable, never sent to the backend. Backend generates them.
  const [profileData, setProfileData] = useState({
    employee_id: "",
    department: "",
    designation: "",
    technician_id: "",
    specialization: "",
  });

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // ===== NEW: holds the backend-generated ID after user creation =====
  const [createdId, setCreatedId] = useState(null);

  const isEmployee = formData.role === "employee";
  const isTechnician = formData.role === "technician";
  const showProfileFields = isEmployee || isTechnician;

  useEffect(() => {
    if (!show) return;

    const fetchAllDepartments = async () => {
      setDepartmentLoading(true);
      try {
        let allDepartments = [];
        let response = await api.get("/departments/", { params: { page_size: 1000 } });
        let data = response.data;

        if (data && Array.isArray(data.results)) {
          allDepartments = [...data.results];
          let nextUrl = data.next;
          while (nextUrl) {
            try {
              const nextResponse = await api.get(nextUrl);
              const nextData = nextResponse.data;
              if (nextData && Array.isArray(nextData.results)) {
                allDepartments = [...allDepartments, ...nextData.results];
                nextUrl = nextData.next;
              } else {
                nextUrl = null;
              }
            } catch {
              nextUrl = null;
            }
          }
        } else if (Array.isArray(data)) {
          allDepartments = data;
        }

        const uniqueDepartments = allDepartments.filter(
          (dept, index, self) => index === self.findIndex((item) => item.id === dept.id)
        );
        uniqueDepartments.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setDepartments(uniqueDepartments);
      } catch {
        setDepartments([]);
      } finally {
        setDepartmentLoading(false);
      }
    };

    fetchAllDepartments();
  }, [show]);

  useEffect(() => {
    if (!show) return;

    // Reset the created-ID panel whenever the modal opens
    setCreatedId(null);

    if (editingUser) {
      setFormData({
        username: editingUser.username || "",
        first_name: editingUser.first_name || "",
        last_name: editingUser.last_name || "",
        email: editingUser.email || "",
        phone_number: editingUser.phone_number || "",
        role: editingUser.role || "employee",
        password: "",
        password2: "",
        is_active: editingUser.is_active !== undefined ? editingUser.is_active : true,
      });

      setProfileData({
        employee_id: "",
        department: "",
        designation: "",
        technician_id: "",
        specialization: "",
      });

      if (editingUser.role === "employee" || editingUser.role === "technician") {
        setProfileLoading(true);
        profileService
          .getUserRoleProfile(editingUser.id)
          .then((res) => {
            const d = res.data?.data;
            if (d) {
              setProfileData({
                employee_id: d.employee_id || "",
                department: d.department !== null && d.department !== undefined ? String(d.department) : "",
                designation: d.designation || "",
                technician_id: d.technician_id || "",
                specialization: d.specialization || "",
              });
            }
          })
          .catch(() => {})
          .finally(() => setProfileLoading(false));
      }
    } else {
      setFormData({
        username: "", first_name: "", last_name: "", email: "",
        phone_number: "", role: "employee", password: "", password2: "", is_active: true,
      });
      setProfileData({
        employee_id: "", department: "", designation: "", technician_id: "", specialization: "",
      });
    }
    setErrors({});
  }, [editingUser, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (name === "role") {
      setProfileData({ employee_id: "", department: "", designation: "", technician_id: "", specialization: "" });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleClose = () => {
    setCreatedId(null);
    onHide();
  };

  const getFilteredDepartments = () => {
    if (!departments || departments.length === 0) return [];
    return departments.filter((dept) => {
      const type = String(dept.department_type || "").toLowerCase().trim();
      if (isEmployee) return type === "employee" || type === "both";
      if (isTechnician) return type === "technician" || type === "both";
      return false;
    });
  };

  const filteredDepartments = getFilteredDepartments();

  const validate = () => {
    const tempErrors = {};
    if (!formData.username?.trim()) tempErrors.username = "Username is required";
    if (!formData.email?.trim()) tempErrors.email = "Email is required";
    if (!isEditMode && !formData.password) tempErrors.password = "Password is required";
    if (!isEditMode && formData.password !== formData.password2) tempErrors.password2 = "Passwords do not match";
    if (!isEditMode && formData.password && formData.password.length < 8) tempErrors.password = "Password must be at least 8 characters";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await onSave(formData, isEditMode);

      if (isEditMode && (formData.role === "employee" || formData.role === "technician")) {
        try {
          let profilePayload = {};
          // ===== CHANGED: employee_id / technician_id are NOT included —
          // they are generated by the backend and read-only. =====
          if (formData.role === "employee") {
            profilePayload = { department: profileData.department, designation: profileData.designation };
          }
          if (formData.role === "technician") {
            profilePayload = { department: profileData.department, specialization: profileData.specialization };
          }
          await profileService.updateUserRoleProfile(editingUser.id, profilePayload);
        } catch (profileErr) {
          const pErr = profileErr.response?.data?.error;
          setErrors(pErr && typeof pErr === "object" ? pErr : { general: typeof pErr === "string" ? pErr : "Failed to save profile fields." });
          setLoading(false);
          return;
        }
      }

      // ===== NEW: after creation, show the backend-generated ID and keep
      // the modal open so the admin can read/copy it before closing. =====
      if (!isEditMode) {
        const responseData = response?.data?.data;
        const generatedId =
          (formData.role === "employee" && responseData?.employee_id) ||
          (formData.role === "technician" && responseData?.technician_id) ||
          null;

        if (generatedId) {
          setCreatedId({
            value: generatedId,
            label: formData.role === "employee" ? "Employee ID" : "Technician ID",
            message: response?.data?.message || "Activation link has been sent to the user's email.",
          });
          return;
        }
      }

      const message = response?.data?.message || (isEditMode ? "User updated successfully." : "User created successfully.");
      toast.success(message);
      onHide();
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.success === false && data.error && typeof data.error === "object") {
          setErrors(data.error);
        } else if (data.success === false && typeof data.error === "string") {
          setErrors({ general: data.error });
        } else {
          setErrors(data);
        }
      } else {
        setErrors({ general: "Something went wrong." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {createdId ? "User Created Successfully" : isEditMode ? "Edit User" : "Add New User"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* ============ NEW: SUCCESS PANEL WITH GENERATED ID ============ */}
        {createdId ? (
          <div className="text-center py-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-success bg-opacity-10 text-success"
              style={{ width: "60px", height: "60px", fontSize: "26px" }}
            >
              <FaCheckCircle />
            </div>

            <h5 className="fw-bold mb-1">User Created Successfully</h5>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>{createdId.message}</p>

            <div
              className="mx-auto p-3 rounded-3 d-flex justify-content-between align-items-center"
              style={{
                maxWidth: "380px",
                backgroundColor: "rgba(25, 135, 84, 0.08)",
                border: "1px solid rgba(25, 135, 84, 0.3)",
              }}
            >
              <div className="text-start">
                <div
                  className="text-muted small text-uppercase fw-semibold"
                  style={{ letterSpacing: "0.5px" }}
                >
                  {createdId.label}
                </div>
                <div className="fs-4 fw-bold font-monospace text-success">{createdId.value}</div>
              </div>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(createdId.value)}
              >
                Copy
              </Button>
            </div>

            <p className="text-muted small mt-3 mb-0">
              Click <strong>Edit</strong> on the user in the table to add department &amp;{" "}
              {createdId.label === "Employee ID" ? "designation" : "specialization"} details.
            </p>
          </div>
        ) : (
          <>
            {errors.general && (
              <Alert variant="danger" dismissible onClose={() => setErrors((prev) => ({ ...prev, general: null }))}>
                {errors.general}
              </Alert>
            )}

            {isEditMode && !isEmployee && !isTechnician && (
              <Alert variant="info" className="py-2 small">Admin users do not have additional profile fields.</Alert>
            )}

            <Form noValidate>
              <h6 className="fw-bold text-muted mb-3" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Account Information
              </h6>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Username <span className="text-danger">*</span></Form.Label>
                    <Form.Control isInvalid={!!errors.username} name="username" value={formData.username} onChange={handleChange} disabled={isEditMode} className="py-2" />
                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="email" isInvalid={!!errors.email} name="email" value={formData.email} onChange={handleChange} className="py-2" />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">First Name</Form.Label>
                    <Form.Control name="first_name" value={formData.first_name} onChange={handleChange} isInvalid={!!errors.first_name} className="py-2" />
                    <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Last Name</Form.Label>
                    <Form.Control name="last_name" value={formData.last_name} onChange={handleChange} isInvalid={!!errors.last_name} className="py-2" />
                    <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Phone Number</Form.Label>
                    <Form.Control name="phone_number" value={formData.phone_number} onChange={handleChange} isInvalid={!!errors.phone_number} className="py-2" />
                    <Form.Control.Feedback type="invalid">{errors.phone_number}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Role <span className="text-danger">*</span></Form.Label>
                    <Form.Select name="role" value={formData.role} onChange={handleChange} isInvalid={!!errors.role} className="py-2">
                      <option value="employee">Employee</option>
                      <option value="technician">Technician</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {!isEditMode && (
                  <>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Password <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="password" isInvalid={!!errors.password} name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 characters" className="py-2" />
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Confirm Password <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="password" isInvalid={!!errors.password2} name="password2" value={formData.password2} onChange={handleChange} placeholder="Confirm password" className="py-2" />
                        <Form.Control.Feedback type="invalid">{errors.password2}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </>
                )}

                {isEditMode && (
                  <Col md={6}>
                    <Form.Check type="switch" label="Account Active" name="is_active" checked={formData.is_active} onChange={handleChange} className="mt-2" />
                  </Col>
                )}
              </Row>

              {showProfileFields && (
                <>
                  <hr />
                  <h6 className="fw-bold text-muted mb-3" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {isEmployee ? "👤 Employee Information" : "🔧 Technician Information"}
                  </h6>

                  {profileLoading ? (
                    <div className="text-center py-3"><Spinner size="sm" className="me-2" />Loading profile data...</div>
                  ) : (
                    <Row className="g-3 mb-3">
                      {/* ===== CHANGED: read-only display — ID is backend-generated ===== */}
                      {isEmployee && (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Employee ID</Form.Label>
                            <Form.Control
                              plaintext
                              readOnly
                              value={profileData.employee_id || (isEditMode ? "—" : "Auto-generated after creation")}
                              className="py-2 font-monospace"
                            />
                            <Form.Text className="text-muted">Generated automatically by the system</Form.Text>
                          </Form.Group>
                        </Col>
                      )}

                      {/* ===== CHANGED: read-only display — ID is backend-generated ===== */}
                      {isTechnician && (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Technician ID</Form.Label>
                            <Form.Control
                              plaintext
                              readOnly
                              value={profileData.technician_id || (isEditMode ? "—" : "Auto-generated after creation")}
                              className="py-2 font-monospace"
                            />
                            <Form.Text className="text-muted">Generated automatically by the system</Form.Text>
                          </Form.Group>
                        </Col>
                      )}

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Department</Form.Label>
                          <Form.Select name="department" value={profileData.department} onChange={handleProfileChange} isInvalid={!!errors.department} disabled={departmentLoading} className="py-2">
                            <option value="">{departmentLoading ? "Loading..." : `Select ${isEmployee ? "Employee" : "Technician"} Department`}</option>
                            {filteredDepartments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}{String(dept.department_type || "").toLowerCase().trim() === "both" ? " (Both)" : ""}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{errors.department}</Form.Control.Feedback>
                          {!departmentLoading && filteredDepartments.length > 0 && (
                            <Form.Text className="text-muted">{filteredDepartments.length} department{filteredDepartments.length !== 1 ? "s" : ""} available</Form.Text>
                          )}
                          {!departmentLoading && filteredDepartments.length === 0 && !errors.department && (
                            <div className="mt-2">
                              <Form.Text className="text-warning small d-block">⚠️ No {isEmployee ? "employee" : "technician"} departments found.</Form.Text>
                              <Form.Text className="text-muted small d-block">Go to <strong>Departments</strong> → Add New → Select type as <strong>{isEmployee ? "Employee" : "Technician"}</strong> or <strong>Both</strong>.</Form.Text>
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      {isEmployee && (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Designation</Form.Label>
                            <Form.Control name="designation" value={profileData.designation} onChange={handleProfileChange} placeholder="e.g., Software Engineer" className="py-2" />
                          </Form.Group>
                        </Col>
                      )}

                      {isTechnician && (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Specialization</Form.Label>
                            <Form.Control name="specialization" value={profileData.specialization} onChange={handleProfileChange} placeholder="e.g., Hardware, Networking" className="py-2" />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>
                  )}
                </>
              )}

              {!isEditMode && showProfileFields && (
                <Alert variant="info" className="py-2 small">
                  The {isEmployee ? "Employee ID" : "Technician ID"} is generated automatically after creation.
                  After creating the user, click <strong>Edit</strong> to fill in {isEmployee ? "employee" : "technician"} details.
                </Alert>
              )}
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {createdId ? (
          <Button variant="primary" onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} type="button">Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading} type="button">
              {loading ? (<><Spinner size="sm" className="me-2" />Saving...</>) : isEditMode ? "Update User" : "Create User"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default UserFormModal;