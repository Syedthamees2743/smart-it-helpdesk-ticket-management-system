import { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Row, Col, Alert } from "react-bootstrap";

import api from "../../services/api";
import profileService from "../../services/profileService";

const UserFormModal = ({ show, onHide, onSave, editingUser }) => {
  const isEditMode = !!editingUser;

  // =========================================================
  // ACCOUNT FORM DATA
  // =========================================================

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

  // =========================================================
  // PROFILE DATA
  // =========================================================

  const [profileData, setProfileData] = useState({
    employee_id: "",
    department: "",
    designation: "",
    technician_id: "",
    specialization: "",
  });

  // =========================================================
  // STATES
  // =========================================================

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // =========================================================
  // ROLE CHECK
  // =========================================================

  const isEmployee = formData.role === "employee";
  const isTechnician = formData.role === "technician";

  const showProfileFields = isEmployee || isTechnician;

  // =========================================================
  // FETCH ALL DEPARTMENTS
  // =========================================================

  useEffect(() => {
    if (!show) return;

    const fetchAllDepartments = async () => {
      setDepartmentLoading(true);

      try {
        let allDepartments = [];

        // First request
        let response = await api.get("/departments/", {
          params: {
            page_size: 1000,
          },
        });

        let data = response.data;

        // -----------------------------------------------------
        // Handle paginated DRF response
        // -----------------------------------------------------

        if (data && Array.isArray(data.results)) {
          allDepartments = [...data.results];

          // Fetch remaining pages if "next" exists
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
            } catch (nextError) {
              console.error("Error fetching next department page:", nextError);
              nextUrl = null;
            }
          }
        } else if (Array.isArray(data)) {
          // Non-paginated response
          allDepartments = data;
        }

        // -----------------------------------------------------
        // Remove duplicate departments
        // -----------------------------------------------------

        const uniqueDepartments = allDepartments.filter(
          (dept, index, self) =>
            index === self.findIndex((item) => item.id === dept.id),
        );

        // Sort alphabetically
        uniqueDepartments.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || "")),
        );

        console.log("ALL DEPARTMENTS FROM API:", uniqueDepartments);

        console.log("TOTAL DEPARTMENTS:", uniqueDepartments.length);

        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Department fetch error:", error);

        setDepartments([]);
      } finally {
        setDepartmentLoading(false);
      }
    };

    fetchAllDepartments();
  }, [show]);

  // =========================================================
  // POPULATE FORM WHEN EDITING
  // =========================================================

  useEffect(() => {
    if (!show) return;

    if (editingUser) {
      // -----------------------------------------------------
      // Account data
      // -----------------------------------------------------

      setFormData({
        username: editingUser.username || "",
        first_name: editingUser.first_name || "",
        last_name: editingUser.last_name || "",
        email: editingUser.email || "",
        phone_number: editingUser.phone_number || "",
        role: editingUser.role || "employee",
        password: "",
        password2: "",
        is_active:
          editingUser.is_active !== undefined ? editingUser.is_active : true,
      });

      // -----------------------------------------------------
      // Reset profile before fetching
      // -----------------------------------------------------

      setProfileData({
        employee_id: "",
        department: "",
        designation: "",
        technician_id: "",
        specialization: "",
      });

      // -----------------------------------------------------
      // Fetch employee / technician profile
      // -----------------------------------------------------

      if (
        editingUser.role === "employee" ||
        editingUser.role === "technician"
      ) {
        setProfileLoading(true);

        profileService
          .getUserRoleProfile(editingUser.id)
          .then((res) => {
            console.log("USER PROFILE RESPONSE:", res.data);

            const d = res.data?.data;

            if (d) {
              setProfileData({
                employee_id: d.employee_id || "",
                department:
                  d.department !== null && d.department !== undefined
                    ? String(d.department)
                    : "",
                designation: d.designation || "",
                technician_id: d.technician_id || "",
                specialization: d.specialization || "",
              });
            }
          })
          .catch((err) => {
            console.error("Profile fetch error:", err);
          })
          .finally(() => {
            setProfileLoading(false);
          });
      }
    } else {
      // -----------------------------------------------------
      // New user
      // -----------------------------------------------------

      setFormData({
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

      setProfileData({
        employee_id: "",
        department: "",
        designation: "",
        technician_id: "",
        specialization: "",
      });
    }

    setErrors({});
  }, [editingUser, show]);

  // =========================================================
  // ACCOUNT FIELD CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // -------------------------------------------------------
    // IMPORTANT:
    // When role changes, reset department/profile fields
    // -------------------------------------------------------

    if (name === "role") {
      setProfileData({
        employee_id: "",
        department: "",
        designation: "",
        technician_id: "",
        specialization: "",
      });
    }
  };

  // =========================================================
  // PROFILE FIELD CHANGE
  // =========================================================

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // =========================================================
  // FILTER DEPARTMENTS BASED ON ROLE
  // =========================================================

  const getFilteredDepartments = () => {
    if (!departments || departments.length === 0) {
      return [];
    }

    return departments.filter((dept) => {
      const type = String(dept.department_type || "")
        .toLowerCase()
        .trim();

      // -----------------------------------------------------
      // EMPLOYEE
      //
      // employee departments + both departments
      // -----------------------------------------------------

      if (isEmployee) {
        return type === "employee" || type === "both";
      }

      // -----------------------------------------------------
      // TECHNICIAN
      //
      // technician departments + both departments
      // -----------------------------------------------------

      if (isTechnician) {
        return type === "technician" || type === "both";
      }

      return false;
    });
  };

  const filteredDepartments = getFilteredDepartments();

  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const tempErrors = {};

    if (!formData.username?.trim()) {
      tempErrors.username = "Username is required";
    }

    if (!formData.email?.trim()) {
      tempErrors.email = "Email is required";
    }

    if (!isEditMode && !formData.password) {
      tempErrors.password = "Password is required";
    }

    if (!isEditMode && formData.password !== formData.password2) {
      tempErrors.password2 = "Passwords do not match";
    }

    if (!isEditMode && formData.password && formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // -----------------------------------------------------
      // Save main user
      // -----------------------------------------------------

      await onSave(formData, isEditMode);

      // -----------------------------------------------------
      // Save profile
      // -----------------------------------------------------

      if (
        isEditMode &&
        (formData.role === "employee" || formData.role === "technician")
      ) {
        try {
          let profilePayload = {};

          if (formData.role === "employee") {
            profilePayload = {
              employee_id: profileData.employee_id,
              department: profileData.department,
              designation: profileData.designation,
            };
          }

          if (formData.role === "technician") {
            profilePayload = {
              technician_id: profileData.technician_id,
              department: profileData.department,
              specialization: profileData.specialization,
            };
          }

          console.log("PROFILE UPDATE PAYLOAD:", profilePayload);

          await profileService.updateUserRoleProfile(
            editingUser.id,
            profilePayload,
          );
        } catch (profileErr) {
          console.error("Profile update error:", profileErr);

          const pErr = profileErr.response?.data?.error;

          if (pErr && typeof pErr === "object") {
            setErrors(pErr);
          } else {
            setErrors({
              general:
                typeof pErr === "string"
                  ? pErr
                  : "Failed to save profile fields.",
            });
          }

          setLoading(false);
          return;
        }
      }

      // -----------------------------------------------------
      // Close modal
      // -----------------------------------------------------

      onHide();
    } catch (err) {
      console.error("User save error:", err);

      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({
          general: "Something went wrong.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Edit User" : "Add New User"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* =================================================
            GENERAL ERROR
        ================================================= */}

        {errors.general && (
          <Alert
            variant="danger"
            dismissible
            onClose={() =>
              setErrors((prev) => ({
                ...prev,
                general: null,
              }))
            }
          >
            {errors.general}
          </Alert>
        )}

        {/* =================================================
            ADMIN INFORMATION
        ================================================= */}

        {isEditMode && !isEmployee && !isTechnician && (
          <Alert variant="info" className="py-2 small">
            Admin users do not have additional profile fields.
          </Alert>
        )}

        <Form noValidate>
          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}

          <h6
            className="fw-bold text-muted mb-3"
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Account Information
          </h6>

          <Row className="g-3 mb-4">
            {/* Username */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Username <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  isInvalid={!!errors.username}
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className="py-2"
                />

                <Form.Control.Feedback type="invalid">
                  {errors.username}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Email */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Email <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  type="email"
                  isInvalid={!!errors.email}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="py-2"
                />

                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* First Name */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">First Name</Form.Label>

                <Form.Control
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  isInvalid={!!errors.first_name}
                  className="py-2"
                />

                <Form.Control.Feedback type="invalid">
                  {errors.first_name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Last Name */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Last Name</Form.Label>

                <Form.Control
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  isInvalid={!!errors.last_name}
                  className="py-2"
                />

                <Form.Control.Feedback type="invalid">
                  {errors.last_name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Phone */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Phone Number</Form.Label>

                <Form.Control
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="py-2"
                />
              </Form.Group>
            </Col>

            {/* Role */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Role <span className="text-danger">*</span>
                </Form.Label>

                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  isInvalid={!!errors.role}
                  className="py-2"
                >
                  <option value="employee">Employee</option>

                  <option value="technician">Technician</option>
                </Form.Select>

                <Form.Control.Feedback type="invalid">
                  {errors.role}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Password */}
            {!isEditMode && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Password <span className="text-danger">*</span>
                    </Form.Label>

                    <Form.Control
                      type="password"
                      isInvalid={!!errors.password}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="py-2"
                    />

                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Confirm Password */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Confirm Password <span className="text-danger">*</span>
                    </Form.Label>

                    <Form.Control
                      type="password"
                      isInvalid={!!errors.password2}
                      name="password2"
                      value={formData.password2}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className="py-2"
                    />

                    <Form.Control.Feedback type="invalid">
                      {errors.password2}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </>
            )}

            {/* Account Active */}
            {isEditMode && (
              <Col md={6}>
                <Form.Check
                  type="switch"
                  label="Account Active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="mt-2"
                />
              </Col>
            )}
          </Row>

          {/* =================================================
              EMPLOYEE / TECHNICIAN INFORMATION
          ================================================= */}

          {showProfileFields && (
            <>
              <hr />

              <h6
                className="fw-bold text-muted mb-3"
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {isEmployee
                  ? "👤 Employee Information"
                  : "🔧 Technician Information"}
              </h6>

              {profileLoading ? (
                <div className="text-center py-3">
                  <Spinner size="sm" className="me-2" />
                  Loading profile data...
                </div>
              ) : (
                <Row className="g-3 mb-3">
                  {/* =================================================
                      EMPLOYEE ID
                  ================================================= */}

                  {isEmployee && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Employee ID
                        </Form.Label>

                        <Form.Control
                          name="employee_id"
                          value={profileData.employee_id}
                          onChange={handleProfileChange}
                          placeholder="e.g., EMP-001"
                          isInvalid={!!errors.employee_id}
                          className="py-2"
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.employee_id}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  {/* =================================================
                      TECHNICIAN ID
                  ================================================= */}

                  {isTechnician && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Technician ID
                        </Form.Label>

                        <Form.Control
                          name="technician_id"
                          value={profileData.technician_id}
                          onChange={handleProfileChange}
                          placeholder="e.g., TECH-001"
                          isInvalid={!!errors.technician_id}
                          className="py-2"
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.technician_id}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  {/* =================================================
                      DEPARTMENT
                  ================================================= */}

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Department
                      </Form.Label>

                      <Form.Select
                        name="department"
                        value={profileData.department}
                        onChange={handleProfileChange}
                        isInvalid={!!errors.department}
                        disabled={departmentLoading}
                        className="py-2"
                      >
                        <option value="">
                          {departmentLoading
                            ? "Loading departments..."
                            : `Select ${
                                isEmployee ? "Employee" : "Technician"
                              } Department`}
                        </option>

                        {filteredDepartments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                            {String(department.department_type || "")
                              .toLowerCase()
                              .trim() === "both"
                              ? " (Both)"
                              : ""}
                          </option>
                        ))}
                      </Form.Select>

                      <Form.Control.Feedback type="invalid">
                        {errors.department}
                      </Form.Control.Feedback>

                      {/* Department count */}
                      {!departmentLoading && filteredDepartments.length > 0 && (
                        <Form.Text className="text-muted">
                          {filteredDepartments.length} department
                          {filteredDepartments.length !== 1 ? "s" : ""}{" "}
                          available
                        </Form.Text>
                      )}

                      {/* No departments */}
                      {!departmentLoading &&
                        filteredDepartments.length === 0 &&
                        !errors.department && (
                          <div className="mt-2">
                            <Form.Text className="text-warning small d-block">
                              ⚠️ No {isEmployee ? "employee" : "technician"}{" "}
                              departments found.
                            </Form.Text>

                            <Form.Text className="text-muted small d-block">
                              Go to <strong>Departments</strong> → Add New →
                              Select department type as{" "}
                              <strong>
                                {isEmployee ? "Employee" : "Technician"}
                              </strong>{" "}
                              or <strong>Both</strong>.
                            </Form.Text>
                          </div>
                        )}
                    </Form.Group>
                  </Col>

                  {/* =================================================
                      DESIGNATION
                  ================================================= */}

                  {isEmployee && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Designation
                        </Form.Label>

                        <Form.Control
                          name="designation"
                          value={profileData.designation}
                          onChange={handleProfileChange}
                          placeholder="e.g., Software Engineer"
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  )}

                  {/* =================================================
                      SPECIALIZATION
                  ================================================= */}

                  {isTechnician && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Specialization
                        </Form.Label>

                        <Form.Control
                          name="specialization"
                          value={profileData.specialization}
                          onChange={handleProfileChange}
                          placeholder="e.g., Hardware, Networking"
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              )}
            </>
          )}

          {/* =================================================
              NEW USER INFO
          ================================================= */}

          {!isEditMode && showProfileFields && (
            <Alert variant="info" className="py-2 small">
              After creating the user, click <strong>Edit</strong> to fill in{" "}
              {isEmployee ? "employee" : "technician"} details.
            </Alert>
          )}
        </Form>
      </Modal.Body>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} type="button">
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          type="button"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Saving...
            </>
          ) : isEditMode ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserFormModal;
