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

/* ── Skeleton (Premium Layout) ── */
const Skeleton = () => (
  <div className="p-3 p-md-4" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
    <div className="d-flex align-items-center gap-3 mb-4">
      <div className="rounded-2" style={{ width: 40, height: 40, backgroundColor: "#e2e8f0" }} />
      <div>
        <div className="rounded mb-1" style={{ width: 120, height: 18, backgroundColor: "#e2e8f0" }} />
        <div className="rounded" style={{ width: 180, height: 10, backgroundColor: "#e2e8f0" }} />
      </div>
    </div>
    <Row className="g-4">
      <Col xl={4} lg={5}>
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #f1f5f9" }}>
          <div style={{ height: 100, backgroundColor: "#e2e8f0" }} />
          <Card.Body className="text-center pb-4 pt-0">
            <div className="rounded-circle mx-auto mt-n6 mb-3 shadow" style={{ width: 110, height: 110, backgroundColor: "#cbd5e1", border: "4px solid #fff" }} />
            <div className="rounded mx-auto mb-2" style={{ width: "50%", height: 16, backgroundColor: "#e2e8f0" }} />
            <div className="rounded mx-auto" style={{ width: "30%", height: 10, backgroundColor: "#e2e8f0" }} />
          </Card.Body>
        </Card>
      </Col>
      <Col xl={8} lg={7}>
        <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: "#fff", border: "1px solid #f1f5f9" }}>
          <Card.Body className="p-4">
            <div className="d-flex flex-column gap-4">
              {[...Array(3)].map((_, i) => (
                <Row key={i} className="g-4">
                  <Col md={6}><div className="rounded-3" style={{ width: "100%", height: 44, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }} /></Col>
                  <Col md={6}><div className="rounded-3" style={{ width: "100%", height: 44, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }} /></Col>
                </Row>
              ))}
            </div>
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

  useEffect(() => { fetchProfile(); }, [role]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const promises = [profileService.getOwnProfile()];
      if (role === "employee") promises.push(profileService.getEmployeeProfile());
      if (role === "technician") promises.push(profileService.getTechnicianProfile());

      const results = await Promise.allSettled(promises);

      if (results[0].status === "fulfilled") {
        const userData = results[0].value.data;
        setProfile(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone_number: userData.phone_number || "",
        });
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, ...userData }));
      } else {
        setError("Failed to load profile.");
      }

      if (results[1]?.status === "fulfilled") {
        const raw = results[1].value;
        if (Array.isArray(raw)) setRoleProfile(raw[0] || null);
        else if (raw?.results) setRoleProfile(raw.results[0] || null);
        else setRoleProfile(raw);
      }
    } catch (err) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => { setFieldErrors({}); setEditing(true); };

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
    setSaving(true); setFieldErrors(""); setSuccess("");
    try {
      const res = await profileService.updateOwnProfile(formData);
      setProfile(res.data);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...res.data }));
      setEditing(false);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const e = err.response?.data?.error;
      if (e && typeof e === "object") setFieldErrors(e);
      else setFieldErrors({ detail: [typeof e === "string" ? e : "Failed to update profile."] });
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    
    setUploading(true); setError("");
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

  const openPwModal = () => {
    setPwData({ current_password: "", new_password: "", confirm_password: "" });
    setPwErrors({}); setPwSuccess(""); setShowPwModal(true);
  };

  const handlePwChange = async () => {
    setPwSaving(true); setPwErrors({}); setPwSuccess("");
    try {
      await profileService.changePassword(pwData);
      setPwSuccess("Password changed successfully.");
      setShowPwModal(false);
    } catch (err) {
      const e = err.response?.data?.error;
      if (e && typeof e === "object") setPwErrors(e);
      else setPwErrors({ detail: [typeof e === "string" ? e : "Failed to change password."] });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) return <Skeleton />;
  if (error && !profile) {
    return (
      <div className="p-4">
        <h4 className="fw-bold mb-3">Profile</h4>
        <Alert variant="danger" className="border-0 rounded-3 shadow-sm">{error}</Alert>
        <Button variant="primary" onClick={fetchProfile} className="rounded-pill px-4 shadow-sm border-0">Retry</Button>
      </div>
    );
  }
  if (!profile) return null;

  const imageUrl = getImageUrl(profile.profile_image);
  const roleInfo = ROLE_LABELS[profile.role] || ROLE_LABELS[role];
  const fe = (field) => fieldErrors[field]?.[0];

  // Reusable style for read-only data fields to look like structured metadata
  const readOnlyFieldStyle = {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    color: "#0f172a",
    fontWeight: "500",
    fontSize: "0.92rem"
  };

  return (
    <div className="p-3 p-md-4" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 44, height: 44, backgroundColor: "#0f172a" }}>
            <FaUser style={{ fontSize: "1rem", color: "#fff" }} />
          </div>
          <div>
            <h4 className="mb-0 fw-bolder" style={{ color: "#0f172a", letterSpacing: "-0.03em", fontSize: "1.3rem" }}>Profile</h4>
            <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>View and manage your personal account details</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-4" style={{ maxWidth: '600px' }}>
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess("")} className="border-0 rounded-3 shadow-sm d-flex align-items-center py-2 px-3">
            <div className="bg-success bg-opacity-10 rounded-circle p-1 me-3"><FaSave size={12} className="text-success" /></div>
            <span className="fw-medium" style={{fontSize: "0.88rem"}}>{success}</span>
          </Alert>
        )}
        {error && profile && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="border-0 rounded-3 shadow-sm">{error}</Alert>
        )}
      </div>

      <Row className="g-4">
        {/* ── Left: Identity Card ── */}
        <Col xl={4} lg={5}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
            {/* Dark Corporate Banner */}
            <div style={{ height: 100, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }} className="position-relative">
              <div className="position-absolute top-0 end-0 p-3 opacity-50">
                <FaShieldAlt size={24} color="#fff" />
              </div>
            </div>
            
            <Card.Body className="text-center pb-4 pt-0">
              {/* Avatar with Ring */}
              <div className="position-relative d-inline-block mt-n6 mb-3">
                <div className="rounded-circle shadow-lg" style={{ 
                    width: 112, height: 112, 
                    border: "4px solid #0f172a", 
                    backgroundColor: "#fff", 
                    padding: 3,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="Profile" className="rounded-circle w-100 h-100" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="rounded-circle w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f1f5f9" }}>
                      <FaUserCircle style={{ fontSize: 70, color: "#94a3b8" }} />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleImageClick}
                  className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow border border-2 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, padding: 0, borderColor: "#fff" }}
                  disabled={uploading}
                  type="button"
                >
                  {uploading ? <Spinner size="sm" /> : <FaCamera size={12} color="#0f172a" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              <h5 className="fw-bolder mb-1" style={{ color: "#0f172a", fontSize: "1.15rem" }}>
                {profile.first_name} {profile.last_name}
              </h5>
              <p className="text-muted mb-3" style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>
                @{profile.username}
              </p>
              
              <div className="d-inline-block px-3 py-1 rounded-pill mb-4" style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                <span className="fw-semibold" style={{ fontSize: "0.8rem", color: "#334155" }}>{roleInfo.label}</span>
              </div>

              {/* Meta Grid */}
              <div className="text-start mt-3 pt-3 border-top" style={{ borderColor: "#f1f5f9 !important" }}>
                <Row className="g-3">
                  <Col xs={6}>
                    <div className="p-2 rounded-3" style={{ backgroundColor: "#f8fafc" }}>
                      <div className="text-uppercase d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>
                        <FaShieldAlt size={9} /> Status
                      </div>
                      <Badge bg={profile.is_active ? "success" : "danger"} pill className="px-2 py-1" style={{ fontSize: "0.72rem", fontWeight: "600" }}>
                        {profile.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-2 rounded-3" style={{ backgroundColor: "#f8fafc" }}>
                      <div className="text-uppercase d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>
                        <FaCalendar size={9} /> Joined
                      </div>
                      <div className="fw-semibold text-truncate" style={{ fontSize: "0.82rem", color: "#334155" }}>
                        {formatDate(profile.created_at)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Right: Data & Configuration ── */}
        <Col xl={8} lg={7}>
          {/* Personal Information */}
          <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ border: "1px solid #f1f5f9" }}>
            <Card.Header className="bg-white border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-uppercase" style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "800", letterSpacing: "0.08em" }}>
                Personal Information
              </h6>
              {!editing ? (
                <Button variant="light" size="sm" onClick={handleEdit} type="button" className="rounded-pill px-3 border shadow-sm" style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a" }}>
                  <FaEdit className="me-1" size={11} /> Edit
                </Button>
              ) : (
                <div className="d-flex gap-2">
                  <Button variant="dark" size="sm" onClick={handleSave} disabled={saving} type="button" className="rounded-pill px-3 border-0 shadow-sm" style={{ fontSize: "0.82rem", fontWeight: "600" }}>
                    {saving ? <Spinner size="sm" className="me-1" /> : <FaSave className="me-1" size={11} />} Save
                  </Button>
                  <Button variant="light" size="sm" onClick={handleCancel} type="button" className="rounded-pill px-3 border" style={{ fontSize: "0.82rem" }}>
                    Cancel
                  </Button>
                </div>
              )}
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {fe("detail") && <Alert variant="danger" className="py-2 small border-0 rounded-3 shadow-sm">{fe("detail")}</Alert>}
              <Row className="g-3 mt-1">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-uppercase mb-2" style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>First Name</Form.Label>
                    <Form.Control
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={!editing}
                      isInvalid={!!fe("first_name")}
                      className="py-2 rounded-3"
                      style={!editing ? readOnlyFieldStyle : { fontSize: "0.92rem" }}
                    />
                    <Form.Control.Feedback type="invalid">{fe("first_name")}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-uppercase mb-2" style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>Last Name</Form.Label>
                    <Form.Control
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={!editing}
                      isInvalid={!!fe("last_name")}
                      className="py-2 rounded-3"
                      style={!editing ? readOnlyFieldStyle : { fontSize: "0.92rem" }}
                    />
                    <Form.Control.Feedback type="invalid">{fe("last_name")}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-uppercase mb-2" style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editing}
                      isInvalid={!!fe("email")}
                      className="py-2 rounded-3"
                      style={!editing ? readOnlyFieldStyle : { fontSize: "0.92rem" }}
                    />
                    <Form.Control.Feedback type="invalid">{fe("email")}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-uppercase mb-2" style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>Phone Number</Form.Label>
                    <Form.Control
                      value={formData.phone_number || ""}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      disabled={!editing}
                      isInvalid={!!fe("phone_number")}
                      className="py-2 rounded-3"
                      placeholder="Not provided"
                      style={!editing ? readOnlyFieldStyle : { fontSize: "0.92rem" }}
                    />
                    <Form.Control.Feedback type="invalid">{fe("phone_number")}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
                {/* System Fields (Strictly Read-Only styling) */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-uppercase mb-2" style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>Username</Form.Label>
                    <div className="py-2 px-3 rounded-3 d-flex align-items-center" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", height: "38px", fontSize: "0.92rem", color: "#64748b" }}>
                      {profile.username}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="text-uppercase mb-2" style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.05em" }}>System Role</Form.Label>
                    <div className="py-2 px-3 rounded-3 d-flex align-items-center" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", height: "38px" }}>
                       <Badge bg={roleInfo.color} pill className="px-2 py-1" style={{ fontSize: "0.75rem", fontWeight: "600" }}>{roleInfo.label}</Badge>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Role Specific Metadata */}
          {role === "employee" && roleProfile && (
            <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ border: "1px solid #f1f5f9" }}>
              <Card.Header className="bg-white border-0 pt-4 pb-2 px-4">
                <h6 className="mb-0 text-uppercase" style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "800", letterSpacing: "0.08em" }}>Employee Metadata</h6>
              </Card.Header>
              <Card.Body className="p-4 pt-2">
                <Row className="g-3">
                  {[
                    { icon: <FaIdBadge size={13} />, label: "Employee ID", val: roleProfile.employee_id || "—" },
                    { icon: <FaBuilding size={13} />, label: "Department", val: roleProfile.department_name || "Unassigned" },
                    { icon: <FaBriefcase size={13} />, label: "Designation", val: roleProfile.designation || "—" },
                  ].map((item, idx) => (
                    <Col key={idx}>
                      <div className="p-3 rounded-3 h-100" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                        <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          {item.icon} {item.label}
                        </div>
                        <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>{item.val}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {role === "technician" && roleProfile && (
            <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ border: "1px solid #f1f5f9" }}>
              <Card.Header className="bg-white border-0 pt-4 pb-2 px-4">
                <h6 className="mb-0 text-uppercase" style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "800", letterSpacing: "0.08em" }}>Technician Metadata</h6>
              </Card.Header>
              <Card.Body className="p-4 pt-2">
                <Row className="g-3">
                  {[
                    { icon: <FaIdBadge size={13} />, label: "Technician ID", val: roleProfile.technician_id || "—" },
                    { icon: <FaBuilding size={13} />, label: "Department", val: roleProfile.department_name || "Unassigned" },
                    { icon: <FaCog size={13} />, label: "Specialization", val: roleProfile.specialization || "—" },
                  ].map((item, idx) => (
                    <Col key={idx}>
                      <div className="p-3 rounded-3 h-100" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                        <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          {item.icon} {item.label}
                        </div>
                        <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>{item.val}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Security Zone */}
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
            <Card.Header className="bg-white border-0 pt-4 pb-2 px-4">
              <h6 className="mb-0 text-uppercase" style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "800", letterSpacing: "0.08em" }}>Security</h6>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 border" style={{ borderColor: "#fecaca", backgroundColor: "#fff5f5" }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 40, height: 40, backgroundColor: "#fee2e2" }}>
                    <FaLock className="text-danger" size={15} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: "0.9rem" }}>Password Authentication</div>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>Manage credentials used to access your account</div>
                  </div>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={openPwModal}
                  type="button"
                  className="rounded-pill px-3"
                  style={{ fontWeight: "600", fontSize: "0.82rem" }}
                >
                  Update
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Password Modal (Strict Corporate Style) ── */}
      <Modal show={showPwModal} onHide={() => setShowPwModal(false)} centered contentClassName="border-0 shadow-lg">
        <div className="p-4 p-md-5 rounded-4" style={{ background: "#fff" }}>
          <Modal.Header closeButton className="border-0 pb-0 px-0 pt-0">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: "1rem", color: "#0f172a" }}>
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 34, height: 34, backgroundColor: "#fee2e2" }}>
                <FaLock className="text-danger" size={14} />
              </div>
              Update Password
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-0 py-4">
            {pwSuccess && (
              <Alert variant="success" className="py-2 small border-0 rounded-3 d-flex align-items-center">
                <FaSave className="me-2 text-success" />{pwSuccess}
              </Alert>
            )}
            {pwErrors.detail && (
              <Alert variant="danger" className="py-2 small border-0 rounded-3" onClick={() => setPwErrors({})} dismissible>
                {pwErrors.detail[0]}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-dark" style={{ fontSize: "0.82rem" }}>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={pwData.current_password}
                onChange={(e) => setPwData({ ...pwData, current_password: e.target.value })}
                isInvalid={!!pwErrors.current_password}
                className="py-2 rounded-3"
                placeholder="Enter current password"
                style={{ border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
              />
              <Form.Control.Feedback type="invalid">{pwErrors.current_password?.[0]}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-dark" style={{ fontSize: "0.82rem" }}>New Password</Form.Label>
              <Form.Control
                type="password"
                value={pwData.new_password}
                onChange={(e) => setPwData({ ...pwData, new_password: e.target.value })}
                isInvalid={!!pwErrors.new_password}
                className="py-2 rounded-3"
                placeholder="Enter new password"
                style={{ border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
              />
              <Form.Control.Feedback type="invalid">{pwErrors.new_password?.[0]}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold text-dark" style={{ fontSize: "0.82rem" }}>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={pwData.confirm_password}
                onChange={(e) => setPwData({ ...pwData, confirm_password: e.target.value })}
                isInvalid={!!pwErrors.confirm_password}
                className="py-2 rounded-3"
                placeholder="Confirm new password"
                style={{ border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
              />
              <Form.Control.Feedback type="invalid">{pwErrors.confirm_password?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-0">
            <Button variant="light" size="sm" onClick={() => setShowPwModal(false)} type="button" className="rounded-pill px-3 border" style={{ fontWeight: "500" }}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handlePwChange} disabled={pwSaving} type="button" className="rounded-pill px-4 border-0 shadow-sm" style={{ fontWeight: "600" }}>
              {pwSaving ? <Spinner size="sm" className="me-2" /> : null}Update Password
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfile;