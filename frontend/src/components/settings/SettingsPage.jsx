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
} from "react-icons/fa";
import settingsService from "../../services/settingsService";
import profileService from "../../services/profileService";

/* ── Loading Skeleton ── */
const Skeleton = () => (
  <div>
    <div
      className="rounded mb-2"
      style={{ width: "30%", height: 28, backgroundColor: "#e2e8f0" }}
    />
    <div
      className="rounded mb-4"
      style={{ width: "50%", height: 14, backgroundColor: "#e2e8f0" }}
    />
    {[...Array(2)].map((_, i) => (
      <Card className="border-0 shadow-sm mb-3" key={i}>
        <Card.Body className="p-4">
          <div
            className="rounded mb-3"
            style={{ width: "25%", height: 16, backgroundColor: "#e2e8f0" }}
          />
          {[...Array(3)].map((_, j) => (
            <div
              key={j}
              className="d-flex justify-content-between align-items-center mb-3"
            >
              <div
                className="rounded"
                style={{ width: "40%", height: 14, backgroundColor: "#e2e8f0" }}
              />
              <div
                className="rounded"
                style={{ width: 120, height: 20, backgroundColor: "#e2e8f0" }}
              />
            </div>
          ))}
        </Card.Body>
      </Card>
    ))}
  </div>
);

/* ── Preference Toggle Row ── */
const PrefRow = ({
  label,
  description,
  field,
  preferences,
  onChange,
  disabled,
}) => (
  <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
    <div className="me-3">
      <div className="fw-medium" style={{ fontSize: "0.9rem" }}>
        {label}
      </div>
      {description && (
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          {description}
        </div>
      )}
    </div>
    <Form.Check
      type="switch"
      id={`pref-${field}`}
      checked={preferences[field]}
      onChange={(e) => onChange(field, e.target.checked)}
      disabled={disabled}
      className="flex-shrink-0"
      style={{ minWidth: 50 }}
    />
  </div>
);

/* ── Main Component ── */
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

  // Password modal state
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
        const e = err.response.data.error;
        setError(typeof e === "string" ? e : "Failed to load settings.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Handle Preference Toggle ── */
  const handlePrefChange = (field, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [field]: value };
      if (originalPreferences) {
        const changed = Object.keys(updated).some(
          (k) => updated[k] !== originalPreferences[k]
        );
        setHasChanges(changed);
      }
      return updated;
    });
  };

  /* ── Save Preferences ── */
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await settingsService.updateSettings(preferences);
      if (res.success) {
        setOriginalPreferences({ ...preferences });
        setHasChanges(false);
        setSuccess(res.message || "Notification preferences saved successfully.");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to save settings.");
      }
    } catch (err) {
      if (err.response?.data?.error) {
        const e = err.response.data.error;
        setError(typeof e === "string" ? e : "Failed to save settings.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset to Original ── */
  const handleReset = () => {
    if (originalPreferences) {
      setPreferences({ ...originalPreferences });
      setHasChanges(false);
      setError("");
    }
  };

  /* ── Password Change ── */
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
    } catch (err) {
      const e = err.response?.data?.error;
      if (e && typeof e === "object") {
        setPwErrors(e);
      } else {
        setPwErrors({
          detail: [
            typeof e === "string" ? e : "Failed to change password.",
          ],
        });
      }
    } finally {
      setPwSaving(false);
    }
  };

  const pwFieldError = (field) => pwErrors[field]?.[0];

  /* ── Render ── */
  if (loading) return <Skeleton />;

  const isAdmin = account?.role_key === "admin";

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">
          <FaCog className="me-2 text-primary" />
          Settings
        </h4>
        <p className="text-muted mb-0">Manage your account preferences.</p>
      </div>

      {/* Global Alerts */}
      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
          className="d-flex align-items-center py-2"
        >
          <FaCheckCircle className="me-2 flex-shrink-0" />
          <div>{success}</div>
        </Alert>
      )}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="d-flex align-items-center py-2"
        >
          <div>{error}</div>
        </Alert>
      )}

      <Row className="g-4">
        <Col xl={8} lg={10}>
          {/* ═══════ ACCOUNT ═══════ */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom pt-3 pb-0">
              <h6 className="fw-bold mb-0">
                <FaUser className="me-2 text-primary" />
                Account
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              {account && (
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="text-muted small fw-semibold mb-1">
                      Username
                    </div>
                    <div className="fw-medium py-2 px-3 rounded bg-light">
                      {account.username}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-muted small fw-semibold mb-1">
                      <FaEnvelope className="me-1" />
                      Email
                    </div>
                    <div className="fw-medium py-2 px-3 rounded bg-light">
                      {account.email}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-muted small fw-semibold mb-1">
                      <FaShieldAlt className="me-1" />
                      Role
                    </div>
                    <div className="py-2 px-3 rounded bg-light">
                      <Badge bg="primary" className="px-3 py-1">
                        {account.role}
                      </Badge>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-muted small fw-semibold mb-1">
                      Account Status
                    </div>
                    <div className="py-2 px-3 rounded bg-light">
                      <Badge
                        bg={account.is_active ? "success" : "danger"}
                        className="px-3 py-1"
                      >
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* ═══════ SECURITY ═══════ */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom pt-3 pb-0">
              <h6 className="fw-bold mb-0">
                <FaLock className="me-2 text-primary" />
                Security
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="fw-medium">Password</div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Change your account password
                  </div>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={openPwModal}
                >
                  <FaLock className="me-1" />
                  Change Password
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* ═══════ NOTIFICATIONS — ADMIN ONLY ═══════ */}
          {isAdmin && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom pt-3 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0">
                    <FaBell className="me-2 text-primary" />
                    Notification Preferences
                  </h6>
                  <Badge bg="light" text="dark" className="px-2 py-1" style={{ fontSize: "0.7rem" }}>
                    Admin Only
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <PrefRow
                  label="Email Notifications"
                  description="Master toggle — disables all email notifications when off"
                  field="email_notifications"
                  preferences={preferences}
                  onChange={handlePrefChange}
                  disabled={saving}
                />
                <PrefRow
                  label="Ticket Assignment"
                  description="Notify when a ticket is assigned to a technician"
                  field="ticket_assignment"
                  preferences={preferences}
                  onChange={handlePrefChange}
                  disabled={saving}
                />
                <PrefRow
                  label="Ticket Status Updates"
                  description="Notify when a ticket status changes"
                  field="ticket_status_update"
                  preferences={preferences}
                  onChange={handlePrefChange}
                  disabled={saving}
                />
                <PrefRow
                  label="Comments"
                  description="Notify when someone comments on a ticket"
                  field="comment_notifications"
                  preferences={preferences}
                  onChange={handlePrefChange}
                  disabled={saving}
                />
                <PrefRow
                  label="SLA Alerts"
                  description="Notify when SLA is at risk or breached"
                  field="sla_alerts"
                  preferences={preferences}
                  onChange={handlePrefChange}
                  disabled={saving}
                />
                <PrefRow
                  label="Asset Notifications"
                  description="Notify when assets are assigned or returned"
                  field="asset_notifications"
                  preferences={preferences}
                  onChange={handlePrefChange}
                  disabled={saving}
                />

                {/* Save / Reset — no border on last row */}
                <div className="pt-3">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleReset}
                      disabled={saving || !hasChanges}
                    >
                      <FaUndo className="me-1" />
                      Reset
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                    >
                      {saving ? (
                        <Spinner size="sm" className="me-1" />
                      ) : (
                        <FaSave className="me-1" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* ═══════ NON-ADMIN: INFO BANNER ═══════ */}
          {!isAdmin && (
            <Card
              className="border-0 mb-4"
              style={{ backgroundColor: "#f0f9ff", borderLeft: "4px solid #3b82f6" }}
            >
              <Card.Body className="py-3 px-4 d-flex align-items-start gap-3">
                <FaInfoCircle
                  className="text-primary flex-shrink-0 mt-1"
                  size={18}
                />
                <div>
                  <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                    Notification Settings
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.83rem" }}>
                    Notification preferences are managed by your IT administrator.
                    If you need to adjust notification settings, please contact your
                    system admin.
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* ═══════ PASSWORD MODAL ═══════ */}
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
          {pwFieldError("detail") && (
            <Alert
              variant="danger"
              className="py-2 small"
              dismissible
              onClose={() => setPwErrors({})}
            >
              {pwFieldError("detail")}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Current Password</Form.Label>
            <Form.Control
              type="password"
              value={pwData.current_password}
              onChange={(e) =>
                setPwData({ ...pwData, current_password: e.target.value })
              }
              isInvalid={!!pwFieldError("current_password")}
              className="py-2"
              placeholder="Enter current password"
            />
            <Form.Control.Feedback type="invalid">
              {pwFieldError("current_password")}
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
              isInvalid={!!pwFieldError("new_password")}
              className="py-2"
              placeholder="Enter new password"
            />
            <Form.Control.Feedback type="invalid">
              {pwFieldError("new_password")}
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
              isInvalid={!!pwFieldError("confirm_password")}
              className="py-2"
              placeholder="Confirm new password"
            />
            <Form.Control.Feedback type="invalid">
              {pwFieldError("confirm_password")}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowPwModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePwChange}
            disabled={pwSaving}
          >
            {pwSaving ? <Spinner size="sm" className="me-1" /> : null}
            Change Password
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SettingsPage;