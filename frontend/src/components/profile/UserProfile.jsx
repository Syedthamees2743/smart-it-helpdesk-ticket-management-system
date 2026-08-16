import { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
} from "react-bootstrap";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaShieldAlt,
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaLock,
  FaIdBadge,
  FaBuilding,
  FaBriefcase,
  FaCog,
  FaUserCircle,
} from "react-icons/fa";
import profileService from "../../services/profileService";

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `http://127.0.0.1:8000${image}`;
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ROLE_LABELS = {
  admin: { label: "Administrator", color: "primary" },
  employee: { label: "Employee", color: "info" },
  technician: { label: "Technician", color: "success" },
};

/* ── Skeleton ── */
const Skeleton = () => (
  <div>
    <div
      className="rounded mb-2"
      style={{ width: "35%", height: 28, backgroundColor: "#e2e8f0" }}
    />
    <div
      className="rounded mb-4"
      style={{ width: "55%", height: 14, backgroundColor: "#e2e8f0" }}
    />
    <Row className="g-4">
      <Col lg={4}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <div
              className="rounded-circle mx-auto mb-3"
              style={{ width: 120, height: 120, backgroundColor: "#e2e8f0" }}
            />
            <div
              className="rounded mx-auto"
              style={{ width: "60%", height: 16, backgroundColor: "#e2e8f0" }}
            />
          </Card.Body>
        </Card>
      </Col>
      <Col lg={8}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            {[...Array(5)].map((_, i) => (
              <Row key={i} className="mb-3">
                <Col md={6}>
                  <div
                    className="rounded mb-1"
                    style={{
                      width: "30%",
                      height: 10,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
                  <div
                    className="rounded"
                    style={{
                      width: "80%",
                      height: 20,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
                </Col>
                <Col md={6}>
                  <div
                    className="rounded mb-1"
                    style={{
                      width: "30%",
                      height: 10,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
                  <div
                    className="rounded"
                    style={{
                      width: "80%",
                      height: 20,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
                </Col>
              </Row>
            ))}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
);

/* ── Main Component ── */
const UserProfile = ({ role }) => {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const [uploading, setUploading] = useState(false);

  const [showPwModal, setShowPwModal] = useState(false);
  const [pwData, setPwData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");

  /* ── Fetch ── */
  useEffect(() => {
    fetchProfile();
  }, [role]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const promises = [profileService.getOwnProfile()];
      if (role === "employee")
        promises.push(profileService.getEmployeeProfile());
      if (role === "technician")
        promises.push(profileService.getTechnicianProfile());

      const results = await Promise.allSettled(promises);

      // User profile (always first)
      if (results[0].status === "fulfilled") {
        const userData = results[0].value.data;
        setProfile(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone_number: userData.phone_number || "",
        });
        // FIX: Update localStorage so navbar shows fresh data
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, ...userData }),
        );
      } else {
        setError("Failed to load profile.");
      }

       // Role profile (second, optional) — ViewSet returns list, extract first item
      if (results[1]?.status === "fulfilled") {
        const raw = results[1].value;
        if (Array.isArray(raw)) {
          setRoleProfile(raw[0] || null);
        } else if (raw?.results) {
          setRoleProfile(raw.results[0] || null);
        } else {
          setRoleProfile(raw);
        }
      }
    } catch (err) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Edit / Save ── */
  const handleEdit = () => {
    setFieldErrors({});
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
      });
    }
    setFieldErrors({});
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors("");
    setSuccess("");
    try {
      const res = await profileService.updateOwnProfile(formData);
      setProfile(res.data);
      // Update localStorage for navbar
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...res.data }));
      setEditing(false);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const e = err.response?.data?.error;
      if (e && typeof e === "object") {
        setFieldErrors(e);
      } else {
        setFieldErrors({
          detail: [typeof e === "string" ? e : "Failed to update profile."],
        });
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Image Upload ── */
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("profile_image", file);
    try {
      const res = await profileService.updateProfileImage(fd);
      setProfile(res.data);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...res.data }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Password Change ── */
  const openPwModal = () => {
    setPwData({ current_password: "", new_password: "", confirm_password: "" });
    setPwErrors({});
    setPwSuccess("");
    setShowPwModal(true);
  };

  const handlePwChange = async () => {
    setPwSaving(true);
    setPwErrors({});
    setPwSuccess("");
    try {
      await profileService.changePassword(pwData);
      setPwSuccess("Password changed successfully.");
      setShowPwModal(false);
    } catch (err) {
      const e = err.response?.data?.error;
      if (e && typeof e === "object") {
        setPwErrors(e);
      } else {
        setPwErrors({
          detail: [typeof e === "string" ? e : "Failed to change password."],
        });
      }
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Render ── */
  if (loading) return <Skeleton />;
  if (error && !profile) {
    return (
      <div>
        <h4 className="fw-bold mb-3">Profile</h4>
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={fetchProfile}>
          Retry
        </Button>
      </div>
    );
  }
  if (!profile) return null;

  const imageUrl = getImageUrl(profile.profile_image);
  const roleInfo = ROLE_LABELS[profile.role] || ROLE_LABELS[role];

  // Field error helper
  const fe = (field) => fieldErrors[field]?.[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">
          <FaUser className="me-2 text-primary" />
          Profile
        </h4>
        <p className="text-muted mb-0">Manage your account information.</p>
      </div>

      {/* Success */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {/* Error */}
      {error && profile && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="g-4">
        {/* ── Left: Image Card ── */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-4">
              <div className="position-relative d-inline-block mb-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      border: "4px solid #e2e8f0",
                    }}
                  />
                ) : (
                  <FaUserCircle style={{ fontSize: 120, color: "#cbd5e1" }} />
                )}
                <button
                  onClick={handleImageClick}
                  className="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle shadow-sm"
                  style={{ width: 36, height: 36, padding: 0 }}
                  disabled={uploading}
                  type="button"
                >
                  {uploading ? <Spinner size="sm" /> : <FaCamera size={14} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
              <h5 className="fw-bold mb-1">
                {profile.first_name} {profile.last_name}
              </h5>
              <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>
                @{profile.username}
              </p>
              <Badge bg={roleInfo.color} className="px-3 py-1 mb-2">
                {roleInfo.label}
              </Badge>
              <div className="mt-3 pt-3 border-top">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">
                    <FaShieldAlt className="me-1" />
                    Status
                  </span>
                  <Badge bg={profile.is_active ? "success" : "danger"}>
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">
                    <FaCalendar className="me-1" />
                    Joined
                  </span>
                  <span className="small fw-medium">
                    {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Right: Form + Info ── */}
        <Col lg={8}>
          {/* Personal Information */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom pt-3 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <FaUser className="me-2 text-primary" />
                Personal Information
              </h6>
              {!editing ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleEdit}
                  type="button"
                >
                  <FaEdit className="me-1" />
                  Edit
                </Button>
              ) : (
                <div>
                  <Button
                    variant="success"
                    size="sm"
                    className="me-1"
                    onClick={handleSave}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? (
                      <Spinner size="sm" className="me-1" />
                    ) : (
                      <FaSave className="me-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleCancel}
                    type="button"
                  >
                    <FaTimes className="me-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </Card.Header>
            <Card.Body className="p-4">
              {fe("detail") && (
                <Alert variant="danger" className="py-2 small">
                  {fe("detail")}
                </Alert>
              )}
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaUser className="me-1" />
                      First Name
                    </Form.Label>
                    <Form.Control
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      disabled={!editing}
                      isInvalid={!!fe("first_name")}
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">
                      {fe("first_name")}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaUser className="me-1" />
                      Last Name
                    </Form.Label>
                    <Form.Control
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      disabled={!editing}
                      isInvalid={!!fe("last_name")}
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">
                      {fe("last_name")}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaEnvelope className="me-1" />
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={!editing}
                      isInvalid={!!fe("email")}
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">
                      {fe("email")}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaPhone className="me-1" />
                      Phone Number
                    </Form.Label>
                    <Form.Control
                      value={formData.phone_number || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value,
                        })
                      }
                      disabled={!editing}
                      isInvalid={!!fe("phone_number")}
                      className="py-2"
                      placeholder="Not provided"
                    />
                    <Form.Control.Feedback type="invalid">
                      {fe("phone_number")}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-muted small fw-semibold">
                      Username
                    </Form.Label>
                    <Form.Control
                      value={profile.username}
                      disabled
                      className="py-2 bg-light"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-muted small fw-semibold">
                      Role
                    </Form.Label>
                    <Form.Control
                      value={roleInfo.label}
                      disabled
                      className="py-2 bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Role-Specific Info */}
          {role === "employee" && roleProfile && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <FaIdBadge className="me-2 text-primary" />
                  Employee Information
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaIdBadge className="me-1" />
                      Employee ID
                    </Form.Label>
                    <div className="fw-medium py-2">
                      {roleProfile.employee_id || "—"}
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaBuilding className="me-1" />
                      Department
                    </Form.Label>
                    <div className="fw-medium py-2">
                      {roleProfile.department_name || "Not Assigned"}
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaBriefcase className="me-1" />
                      Designation
                    </Form.Label>
                    <div className="fw-medium py-2">
                      {roleProfile.designation || "—"}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {role === "technician" && roleProfile && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <FaIdBadge className="me-2 text-primary" />
                  Technician Information
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaIdBadge className="me-1" />
                      Technician ID
                    </Form.Label>
                    <div className="fw-medium py-2">
                      {roleProfile.technician_id || "—"}
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaBuilding className="me-1" />
                      Department
                    </Form.Label>
                    <div className="fw-medium py-2">
                      {roleProfile.department_name || "Not Assigned"}
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="text-muted small fw-semibold">
                      <FaCog className="me-1" />
                      Specialization
                    </Form.Label>
                    <div className="fw-medium py-2">
                      {roleProfile.specialization || "—"}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Security */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom pt-3 pb-0">
              <h6 className="fw-bold mb-0">
                <FaLock className="me-2 text-primary" />
                Security
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-medium">Password</div>
                  <div className="text-muted small">
                    Change your account password
                  </div>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={openPwModal}
                  type="button"
                >
                  <FaLock className="me-1" />
                  Change Password
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Password Modal ── */}
      <Modal show={showPwModal} onHide={() => setShowPwModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold h6">
            <FaLock className="me-2 text-primary" />
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pwSuccess && (
            <Alert variant="success" className="py-2 small">
              {pwSuccess}
            </Alert>
          )}
          {fe("detail") && (
            <Alert
              variant="danger"
              className="py-2 small"
              onClick={() => setPwErrors({})}
              dismissible
            >
              {fe("detail")}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">
              Current Password
            </Form.Label>
            <Form.Control
              type="password"
              value={pwData.current_password}
              onChange={(e) =>
                setPwData({ ...pwData, current_password: e.target.value })
              }
              isInvalid={!!pwErrors.current_password}
              className="py-2"
              placeholder="Enter current password"
            />
            <Form.Control.Feedback type="invalid">
              {pwErrors.current_password?.[0]}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">New Password</Form.Label>
            <Form.Control
              type="password"
              value={pwData.new_password}
              onChange={(e) =>
                setPwData({ ...pwData, new_password: e.target.value })
              }
              isInvalid={!!pwErrors.new_password}
              className="py-2"
              placeholder="Enter new password"
            />
            <Form.Control.Feedback type="invalid">
              {pwErrors.new_password?.[0]}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-semibold small">
              Confirm New Password
            </Form.Label>
            <Form.Control
              type="password"
              value={pwData.confirm_password}
              onChange={(e) =>
                setPwData({ ...pwData, confirm_password: e.target.value })
              }
              isInvalid={!!pwErrors.confirm_password}
              className="py-2"
              placeholder="Confirm new password"
            />
            <Form.Control.Feedback type="invalid">
              {pwErrors.confirm_password?.[0]}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowPwModal(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePwChange}
            disabled={pwSaving}
            type="button"
          >
            {pwSaving ? <Spinner size="sm" className="me-1" /> : null}Change Password
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserProfile;
