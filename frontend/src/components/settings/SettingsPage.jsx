import { useState, useEffect } from "react";
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
  FaShieldAlt,
  FaLock,
  FaCog,
  FaBell,
  FaSave,
  FaUndo,
  FaCheckCircle,
  FaInfoCircle,
  FaCalendarAlt,
  FaEnvelopeOpenText,
  FaUserPlus,
  FaSyncAlt,
  FaComment,
  FaLaptop,
} from "react-icons/fa";

import settingsService from "../../services/settingsService";
import profileService from "../../services/profileService";

/* =========================================================
   LOADING SKELETON
========================================================= */

const Skeleton = () => (
  <div className="p-3 p-md-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
    <div className="d-flex align-items-center gap-3 mb-4">
      <div className="rounded-4" style={{ width: 56, height: 56, backgroundColor: "#e2e8f0" }} />
      <div>
        <div className="rounded mb-2" style={{ width: 170, height: 26, backgroundColor: "#e2e8f0" }} />
        <div className="rounded" style={{ width: 300, height: 13, backgroundColor: "#e2e8f0" }} />
      </div>
    </div>

    <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
      <Card.Body className="p-4">
        <div className="rounded-3 mb-4" style={{ width: 220, height: 22, backgroundColor: "#e2e8f0" }} />
        <Row className="g-4">
          {[...Array(4)].map((_, i) => (
            <Col xs={12} sm={6} xl={3} key={i}>
              <div className="rounded mb-2" style={{ width: "45%", height: 11, backgroundColor: "#e2e8f0" }} />
              <div className="rounded-4" style={{ height: 52, backgroundColor: "#f1f5f9" }} />
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>

    <Row className="g-4">
      <Col xl={5}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4">
            <div className="rounded-3 mb-4" style={{ width: 150, height: 22, backgroundColor: "#e2e8f0" }} />
            <div className="rounded-4" style={{ height: 200, backgroundColor: "#f1f5f9" }} />
          </Card.Body>
        </Card>
      </Col>
      <Col xl={7}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4">
            <div className="rounded-3 mb-4" style={{ width: 240, height: 22, backgroundColor: "#e2e8f0" }} />
            <div className="d-flex flex-column gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="d-flex justify-content-between align-items-center p-3 rounded-4"
                  style={{ backgroundColor: "#f8fafc", minHeight: 70 }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3" style={{ width: 38, height: 38, backgroundColor: "#e2e8f0" }} />
                    <div>
                      <div className="rounded mb-2" style={{ width: 120, height: 13, backgroundColor: "#e2e8f0" }} />
                      <div className="rounded" style={{ width: 180, height: 10, backgroundColor: "#f1f5f9" }} />
                    </div>
                  </div>
                  <div className="rounded-pill" style={{ width: 42, height: 24, backgroundColor: "#e2e8f0" }} />
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
);

/* =========================================================
   SECTION HEADER
========================================================= */

const SectionHeader = ({ icon, iconBg, iconColor, title, badge, description }) => (
  <div className="d-flex align-items-start gap-3 mb-4">
    <div
      className="d-flex align-items-center justify-content-center rounded-4 shadow-sm flex-shrink-0"
      style={{ width: 46, height: 46, backgroundColor: iconBg || "#e0e7ff" }}
    >
      <span style={{ color: iconColor || "#4f46e5", fontSize: "1.05rem" }}>{icon}</span>
    </div>
    <div className="flex-grow-1">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.1rem" }}>
          {title}
        </h5>
        {badge && (
          <Badge
            bg="light"
            text="dark"
            pill
            className="border px-3 py-1"
            style={{ fontSize: "0.7rem", fontWeight: 600 }}
          >
            {badge}
          </Badge>
        )}
      </div>
      {description && (
        <div className="text-muted mt-1" style={{ fontSize: "0.82rem" }}>
          {description}
        </div>
      )}
    </div>
  </div>
);

/* =========================================================
   NOTIFICATION ITEMS (with icons)
========================================================= */

const notificationItems = [
  {
    key: "email_notifications",
    label: "Email Notifications",
    desc: "Master toggle — disables all email notifications when off",
    icon: <FaEnvelopeOpenText />,
    color: "#382eec",
    bgColor: "#e0e7ff",
    isMaster: true,
  },
  {
    key: "ticket_assignment",
    label: "Ticket Assignment",
    desc: "Notify when a ticket is assigned to a technician",
    icon: <FaUserPlus />,
    color: "#059669",
    bgColor: "#d1fae5",
  },
  {
    key: "ticket_status_update",
    label: "Ticket Status Updates",
    desc: "Notify when ticket status changes",
    icon: <FaSyncAlt />,
    color: "#0891b2",
    bgColor: "#cffafe",
  },
  {
    key: "comment_notifications",
    label: "Comments",
    desc: "Notify when someone comments on a ticket",
    icon: <FaComment />,
    color: "#d97706",
    bgColor: "#fef3c7",
  },
  {
    key: "sla_alerts",
    label: "SLA Alerts",
    desc: "Notify when SLA is at risk or breached",
    icon: <FaShieldAlt />,
    color: "#dc2626",
    bgColor: "#fee2e2",
  },
  {
    key: "asset_notifications",
    label: "Asset Notifications",
    desc: "Notify when assets are assigned or returned",
    icon: <FaLaptop />,
    color: "#7c3aed",
    bgColor: "#ede9fe",
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

const SettingsPage = () => {
  const [account, setAccount] = useState(null);

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    ticket_assignment: true,
    ticket_status_update: true,
    comment_notifications: true,
    sla_alerts: true,
    asset_notifications: true,
  });

  const [originalPreferences, setOriginalPreferences] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [showPwModal, setShowPwModal] = useState(false);

  const [pwData, setPwData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");

  /* ── Fetch Settings ── */
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await settingsService.getSettings();

      if (res.success && res.data) {
        setAccount(res.data.account);

        const prefs = res.data.preferences;

        setPreferences(prefs);
        setOriginalPreferences({ ...prefs });
        setHasChanges(false);
      } else {
        setError(res.error || "Failed to load settings.");
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(
          typeof err.response.data.error === "string"
            ? err.response.data.error
            : "Failed to load settings."
        );
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Preference Change ── */
  const handlePrefChange = (field, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [field]: value };

      if (originalPreferences) {
        setHasChanges(
          Object.keys(updated).some(
            (key) => updated[key] !== originalPreferences[key]
          )
        );
      }

      return updated;
    });
  };

  /* ── Save Settings ── */
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await settingsService.updateSettings(preferences);

      if (res.success) {
        setOriginalPreferences({ ...preferences });
        setHasChanges(false);
        setSuccess(res.message || "Preferences saved successfully.");

        setTimeout(() => {
          setSuccess("");
        }, 4000);
      } else {
        setError(res.error || "Failed to save settings.");
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(
          typeof err.response.data.error === "string"
            ? err.response.data.error
            : "Failed to save settings."
        );
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    if (originalPreferences) {
      setPreferences({ ...originalPreferences });
      setHasChanges(false);
      setError("");
    }
  };

  /* ── Password Modal ── */
  const openPwModal = () => {
    setPwData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setPwErrors({});
    setPwSuccess("");
    setShowPwModal(true);
  };

  const handlePwChange = async () => {
    setPwSaving(true);
    setPwErrors({});
    setPwSuccess("");

    try {
      const res = await profileService.changePassword(pwData);
      setPwSuccess(res.message || "Password changed successfully.");
      setShowPwModal(false);

      // Success toast style feedback
      setSuccess("Password changed successfully.");
      setTimeout(() => setSuccess(""), 4000);
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

  const pwFieldError = (field) => pwErrors[field]?.[0];

  if (loading) {
    return <Skeleton />;
  }

  const isAdmin = account?.role_key === "admin";
  const masterOff = !preferences.email_notifications;

  return (
    <div
      className="py-4 px-3 px-md-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* ════════════ PAGE HEADER ════════════ */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-4 shadow-sm flex-shrink-0"
            style={{
              width: 58,
              height: 58,
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            }}
          >
            <FaCog style={{ fontSize: "1.45rem", color: "white" }} />
          </div>
          <div>
            <h4 className="mb-1 fw-bold text-dark">Settings</h4>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Manage your account preferences, notifications and security
            </p>
          </div>
        </div>
      </div>

      {/* ════════════ ALERTS ════════════ */}
      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
          className="d-flex align-items-center py-3 px-4 mb-4 border-0 rounded-4 shadow-sm"
        >
          <FaCheckCircle className="me-3 flex-shrink-0" />
          <div className="fw-medium" style={{ fontSize: "0.9rem" }}>
            {success}
          </div>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="mb-4 py-3 px-4 border-0 rounded-4 shadow-sm"
        >
          <div className="fw-medium" style={{ fontSize: "0.9rem" }}>
            {error}
          </div>
        </Alert>
      )}

      {/* ════════════ ACCOUNT INFORMATION ════════════ */}
      <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
        <Card.Body className="p-4">
          <SectionHeader
            icon={<FaUser />}
            title="Account Information"
            description="Basic information associated with your Help Desk account"
          />

          {account && (
            <div
              className="rounded-4 p-4"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <Row className="g-3">
                {/* Username */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                  >
                    Username
                  </div>
                  <div
                    className="fw-semibold text-dark d-flex align-items-center gap-2 p-3 rounded-4 bg-white"
                    style={{ fontSize: "0.9rem", border: "1px solid #e5e7eb", minHeight: 52 }}
                  >
                    <FaUser className="text-muted flex-shrink-0" style={{ fontSize: "0.75rem" }} />
                    <span className="text-truncate">{account.username}</span>
                  </div>
                </Col>

                {/* Email */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                  >
                    Email Address
                  </div>
                  <div
                    className="text-dark d-flex align-items-center gap-2 p-3 rounded-4 bg-white"
                    style={{ fontSize: "0.9rem", border: "1px solid #e5e7eb", minHeight: 52, wordBreak: "break-all" }}
                  >
                    <FaEnvelope className="text-muted flex-shrink-0" style={{ fontSize: "0.75rem" }} />
                    <span>{account.email}</span>
                  </div>
                </Col>

                {/* Role */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                  >
                    Role
                  </div>
                  <div
                    className="d-flex align-items-center p-3 rounded-4 bg-white"
                    style={{ border: "1px solid #e5e7eb", minHeight: 52 }}
                  >
                    <Badge
                      pill
                      className="px-3 py-2"
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                      }}
                    >
                      {account.role}
                    </Badge>
                  </div>
                </Col>

                {/* Status */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                  >
                    Account Status
                  </div>
                  <div
                    className="p-3 rounded-4 bg-white d-flex align-items-center gap-2"
                    style={{ border: "1px solid #e5e7eb", minHeight: 52 }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: account.is_active ? "#10b981" : "#ef4444",
                        borderRadius: "50%",
                        display: "inline-block",
                        flexShrink: 0,
                        boxShadow: account.is_active ? "0 0 0 3px #d1fae5" : "0 0 0 3px #fee2e2",
                      }}
                    />
                    <span
                      className="fw-semibold"
                      style={{ fontSize: "0.88rem", color: account.is_active ? "#065f46" : "#dc2626" }}
                    >
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ════════════ SECURITY + NOTIFICATIONS ════════════ */}
      <Row className="g-4 align-items-stretch">
        {/* ── SECURITY ── */}
        <Col xl={5} lg={12}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <Card.Body className="p-4 d-flex flex-column">
              <SectionHeader
                icon={<FaLock />}
                iconBg="#fee2e2"
                iconColor="#dc2626"
                title="Security"
                description="Keep your account secure by updating your password regularly"
              />

              <div
                className="rounded-4 p-4 flex-grow-1 d-flex flex-column justify-content-center"
                style={{
                  background: "linear-gradient(160deg, #fff5f5 0%, #fef2f2 100%)",
                  border: "1px dashed #fca5a5",
                  minHeight: 240,
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-4 flex-shrink-0"
                    style={{ width: 52, height: 52, backgroundColor: "#fee2e2" }}
                  >
                    <FaShieldAlt style={{ color: "#dc2626", fontSize: "1.25rem" }} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: "1rem" }}>
                      Password Security
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: "0.8rem" }}>
                      Your password protects access to your account
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-4 p-3 mb-4"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #fecaca" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaCalendarAlt className="text-muted" style={{ fontSize: "0.75rem" }} />
                    <div
                      className="text-uppercase text-muted fw-bold"
                      style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
                    >
                      Last Password Change
                    </div>
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "0.92rem" }}>
                    {account?.password_updated_at
                      ? new Date(account.password_updated_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never changed"}
                  </div>
                </div>

                <Button
                  variant="danger"
                  onClick={openPwModal}
                  className="d-flex align-items-center justify-content-center gap-2 rounded-pill px-4 py-2 w-100 shadow-sm"
                  style={{ fontSize: "0.88rem", fontWeight: 600 }}
                >
                  <FaLock style={{ fontSize: "0.75rem" }} />
                  Change Password
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── NOTIFICATIONS ── */}
        <Col xl={7} lg={12}>
          {isAdmin ? (
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <Card.Body className="p-4 d-flex flex-column">
                <SectionHeader
                  icon={<FaBell />}
                  iconBg="#e0e7ff"
                  iconColor="#4f46e5"
                  title="Notification Preferences"
                  badge="Admin"
                  description="Control which system events should generate email notifications"
                />

                <div className="d-flex flex-column gap-2 flex-grow-1">
                  {notificationItems.map((item) => {
                    const isDimmed = item.isMaster ? false : masterOff;
                    return (
                      <div
                        key={item.key}
                        className="d-flex justify-content-between align-items-center p-3 rounded-4"
                        style={{
                          backgroundColor: item.isMaster ? "#faf5ff" : "#f8fafc",
                          border: `1px solid ${item.isMaster ? "#ddd6fe" : "#e2e8f0"}`,
                          opacity: isDimmed ? 0.55 : 1,
                          transition: "opacity 0.2s",
                        }}
                      >
                        <div className="d-flex align-items-center gap-3 me-3" style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: "38px", height: "38px", backgroundColor: item.bgColor }}
                          >
                            <span style={{ color: item.color, fontSize: "0.9rem" }}>{item.icon}</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold text-dark d-flex align-items-center gap-2"
                              style={{ fontSize: "0.88rem" }}
                            >
                              {item.label}
                              {item.isMaster && (
                                <span
                                  className="badge rounded-pill px-2"
                                  style={{
                                    backgroundColor: "#ede9fe",
                                    color: "#7c3aed",
                                    fontSize: "0.6rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  MASTER
                                </span>
                              )}
                            </div>
                            <div className="text-muted mt-0.5" style={{ fontSize: "0.76rem", lineHeight: 1.4 }}>
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <Form.Check
                          type="switch"
                          id={`pref-${item.key}`}
                          checked={preferences[item.key]}
                          onChange={(e) => handlePrefChange(item.key, e.target.checked)}
                          disabled={saving || isDimmed}
                          className="flex-shrink-0"
                          style={{ minWidth: 52, cursor: saving ? "not-allowed" : "pointer" }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Save / Reset */}
                <div className="d-flex justify-content-end gap-2 mt-4 pt-4 border-top">
                  <Button
                    variant="light"
                    onClick={handleReset}
                    disabled={saving || !hasChanges}
                    className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 border"
                    style={{ fontSize: "0.86rem", fontWeight: 500 }}
                  >
                    <FaUndo style={{ fontSize: "0.72rem" }} />
                    Discard
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 border-0 shadow-sm"
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      backgroundColor: !hasChanges ? "#94a3b8" : "#4f46e5",
                    }}
                  >
                    {saving ? (
                      <Spinner size="sm" className="me-1" />
                    ) : (
                      <FaSave style={{ fontSize: "0.72rem" }} />
                    )}
                    {hasChanges ? "Save Changes" : "Saved"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            /* ── NON ADMIN ── */
            <div
              className="d-flex flex-column justify-content-center rounded-4 shadow-sm h-100 p-4"
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
                minHeight: 350,
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-4 mb-4"
                style={{ width: 58, height: 58, backgroundColor: "#dbeafe" }}
              >
                <FaInfoCircle style={{ fontSize: "1.4rem", color: "#2563eb" }} />
              </div>

              <div className="fw-bold text-dark mb-2" style={{ fontSize: "1.05rem" }}>
                Notification Settings
              </div>

              <div className="text-muted" style={{ fontSize: "0.9rem", lineHeight: 1.7, maxWidth: 600 }}>
                Notification preferences are managed by your IT administrator. If
                you need to adjust your notification settings, please contact your
                system administrator.
              </div>

              <div
                className="mt-4 p-3 rounded-4"
                style={{ backgroundColor: "#ffffff", border: "1px solid #dbeafe" }}
              >
                <div className="fw-semibold text-primary" style={{ fontSize: "0.85rem" }}>
                  Information
                </div>
                <div className="text-muted mt-1" style={{ fontSize: "0.8rem" }}>
                  Your administrator controls system-wide notification preferences.
                </div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* ════════════ PASSWORD MODAL ════════════ */}
      <Modal
        show={showPwModal}
        onHide={() => setShowPwModal(false)}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg rounded-4"
        size="md"
      >
        <div className="p-4" style={{ background: "white", borderRadius: "1rem" }}>
          {/* Header */}
          <Modal.Header closeButton className="border-0 pb-0 px-0 pt-0">
            <Modal.Title
              className="fw-bold d-flex align-items-center gap-2 text-dark"
              style={{ fontSize: "1.05rem" }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-4"
                style={{ width: 38, height: 38, backgroundColor: "#fee2e2" }}
              >
                <FaLock className="text-danger" style={{ fontSize: "0.9rem" }} />
              </div>
              Change Password
            </Modal.Title>
          </Modal.Header>

          {/* Body */}
          <Modal.Body className="px-0 py-4">
            {pwSuccess && (
              <Alert
                variant="success"
                className="py-2 px-3 small d-flex align-items-center border-0 rounded-3"
              >
                <FaCheckCircle className="me-2 flex-shrink-0" />
                {pwSuccess}
              </Alert>
            )}

            {Object.keys(pwErrors).length > 0 && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setPwErrors({})}
                className="py-2 px-3 small border-0 rounded-3"
              >
                {Object.entries(pwErrors).map(([field, msgs]) => (
                  <div key={field} className="mb-0">
                    {Array.isArray(msgs)
                      ? msgs.map((msg) => <div key={field + msg}>{msg}</div>)
                      : <div>{msgs}</div>}
                  </div>
                ))}
              </Alert>
            )}

            <Form noValidate>
              {/* Current Password */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
                  Current Password <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="password"
                  value={pwData.current_password}
                  onChange={(e) => setPwData({ ...pwData, current_password: e.target.value })}
                  isInvalid={!!pwFieldError("current_password")}
                  className="py-2 shadow-none"
                  placeholder="Enter current password"
                  style={{ borderRadius: "12px", fontSize: "0.9rem" }}
                />
                <Form.Control.Feedback type="invalid" className="ps-2">
                  {pwFieldError("current_password")}
                </Form.Control.Feedback>
              </Form.Group>

              {/* New Password */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
                  New Password <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="password"
                  value={pwData.new_password}
                  onChange={(e) => setPwData({ ...pwData, new_password: e.target.value })}
                  isInvalid={!!pwFieldError("new_password")}
                  className="py-2 shadow-none"
                  placeholder="Min 8 characters"
                  style={{ borderRadius: "12px", fontSize: "0.9rem" }}
                />
                <Form.Control.Feedback type="invalid" className="ps-2">
                  {pwFieldError("new_password")}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group>
                <Form.Label className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
                  Confirm New Password <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="password"
                  value={pwData.confirm_password}
                  onChange={(e) => setPwData({ ...pwData, confirm_password: e.target.value })}
                  isInvalid={!!pwFieldError("confirm_password")}
                  className="py-2 shadow-none"
                  placeholder="Re-enter new password"
                  style={{ borderRadius: "12px", fontSize: "0.9rem" }}
                />
                <Form.Control.Feedback type="invalid" className="ps-2">
                  {pwFieldError("confirm_password")}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          </Modal.Body>

          {/* Footer */}
          <Modal.Footer className="border-0 pt-0 px-0">
            <Button
              variant="light"
              onClick={() => setShowPwModal(false)}
              className="rounded-pill px-4 py-2 border"
              style={{ fontSize: "0.88rem", fontWeight: 500 }}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={handlePwChange}
              disabled={pwSaving}
              className="rounded-pill px-4 py-2 border-0 shadow-sm"
              style={{ fontSize: "0.88rem", fontWeight: 600 }}
            >
              {pwSaving && <Spinner size="sm" className="me-2" />}
              Update Password
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;