import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaBell,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaEnvelope,
  FaUserPlus,
  FaSyncAlt,
  FaComment,
  FaShieldAlt,
  FaLaptop,
} from "react-icons/fa";
import settingsService from "../../services/settingsService";

const DEFAULT_PREFS = {
  email_notifications: true,
  ticket_assignment: true,
  ticket_status_update: true,
  comment_notifications: true,
  sla_alerts: true,
  asset_notifications: true,
};

const PREF_LABELS = [
  {
    key: "email_notifications",
    label: "Email Notifications",
    desc: "Master toggle — disables all emails when off",
    icon: <FaEnvelope />,
    color: "#4f46e5",
    bgColor: "#e0e7ff",
    isMaster: true,
  },
  {
    key: "ticket_assignment",
    label: "Ticket Assignment",
    desc: "Notify when a ticket is assigned",
    icon: <FaUserPlus />,
    color: "#059669",
    bgColor: "#d1fae5",
  },
  {
    key: "ticket_status_update",
    label: "Ticket Status Updates",
    desc: "Notify on ticket status change",
    icon: <FaSyncAlt />,
    color: "#0891b2",
    bgColor: "#cffafe",
  },
  {
    key: "comment_notifications",
    label: "Comments",
    desc: "Notify on ticket comments",
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
    desc: "Notify on asset assignment or return",
    icon: <FaLaptop />,
    color: "#7c3aed",
    bgColor: "#ede9fe",
  },
];

const UserPrefModal = ({ show, onHide, userId, userName, onSaved }) => {
  const [preferences, setPreferences] = useState({ ...DEFAULT_PREFS });
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch when modal opens
  useEffect(() => {
    if (show && userId) {
      fetchPrefs();
    }
    if (!show) {
      setPreferences({ ...DEFAULT_PREFS });
      setOriginal(null);
      setError("");
      setSuccess("");
      setHasChanges(false);
    }
  }, [show, userId]);

  const fetchPrefs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await settingsService.getAdminUserPreferences(userId);
      if (res.success && res.data) {
        const prefs = res.data.preferences;
        setPreferences(prefs);
        setOriginal({ ...prefs });
        setHasChanges(false);
      } else {
        setError(res.error || "Failed to load preferences.");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You do not have permission to manage preferences.");
      } else if (err.response?.status === 404) {
        setError("User not found.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      if (original) {
        setHasChanges(
          Object.keys(updated).some((k) => updated[k] !== original[k])
        );
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await settingsService.updateAdminUserPreferences(
        userId,
        preferences
      );
      if (res.success) {
        setOriginal({ ...preferences });
        setHasChanges(false);
        setSuccess(res.message || "Preferences updated.");
        if (onSaved) onSaved();
        setTimeout(() => {
          setSuccess("");
          onHide();
        }, 1200);
      } else {
        setError(res.error || "Failed to save.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Master toggle off irundha ella rows-um dim aagum
  const masterOff = !preferences.email_notifications;

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      {/* ════════════ HEADER ════════════ */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ backgroundColor: "#f5f3ff", borderBottom: "1px solid #ddd6fe" }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-4 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px", backgroundColor: "#8b5cf6" }}
            >
              <FaBell style={{ fontSize: "0.95rem", color: "white" }} />
            </div>
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: "0.98rem" }}>
                Notification Preferences
              </div>
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                Manage notification settings
              </div>
            </div>
          </div>
          <Button
            variant="light"
            className="border rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "30px", height: "30px" }}
            onClick={onHide}
            disabled={saving}
          >
            <FaTimes size={12} />
          </Button>
        </div>
      </div>

      <Modal.Body className="p-4">
        {/* User info bar */}
        <div
          className="d-flex align-items-center gap-3 mb-4 p-3 rounded-4 border"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
            style={{
              width: 42,
              height: 42,
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              fontSize: "0.95rem",
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>
              {userName || `User #${userId}`}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
              {hasChanges ? "Unsaved changes" : "All changes saved"}
            </div>
          </div>
          {hasChanges && (
            <span
              className="ms-auto badge rounded-pill px-3 py-2"
              style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "0.68rem" }}
            >
              Modified
            </span>
          )}
        </div>

        {/* Alerts */}
        {success && (
          <Alert variant="success" className="py-2 small d-flex align-items-center rounded-3 border-0">
            <FaCheckCircle className="me-2 flex-shrink-0" />
            {success}
          </Alert>
        )}
        {error && (
          <Alert
            variant="danger"
            className="py-2 small rounded-3 border-0"
            dismissible
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="sm" />
            <div className="text-muted small mt-2">Loading preferences...</div>
          </div>
        ) : (
          /* Toggle rows with icons */
          <div className="d-flex flex-column gap-2">
            {PREF_LABELS.map((item) => {
              const isDimmed = item.isMaster ? false : masterOff;
              return (
                <div
                  key={item.key}
                  className="d-flex justify-content-between align-items-center p-3 rounded-4 border"
                  style={{
                    backgroundColor: item.isMaster ? "#faf5ff" : "#f8fafc",
                    borderColor: item.isMaster ? "#ddd6fe" : "#e2e8f0",
                    opacity: isDimmed ? 0.55 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div className="d-flex align-items-center gap-3 me-3" style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "38px",
                        height: "38px",
                        backgroundColor: item.bgColor,
                      }}
                    >
                      <span style={{ color: item.color, fontSize: "0.9rem" }}>
                        {item.icon}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="fw-semibold text-dark d-flex align-items-center gap-2"
                        style={{ fontSize: "0.86rem" }}
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
                      <div
                        className="text-muted mt-0.5"
                        style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <Form.Check
                    type="switch"
                    id={`admin-pref-${item.key}`}
                    checked={preferences[item.key]}
                    onChange={(e) => handleToggle(item.key, e.target.checked)}
                    disabled={saving || isDimmed}
                    className="flex-shrink-0"
                    style={{ minWidth: 48 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top-0 px-4 pb-4">
        <Button
          variant="light"
          className="border rounded-pill px-4"
          onClick={onHide}
          disabled={saving}
        >
          <FaTimes className="me-1" /> Cancel
        </Button>
        <Button
          variant="primary"
          className="rounded-pill px-4"
          onClick={handleSave}
          disabled={saving || !hasChanges || loading}
        >
          {saving ? (
            <Spinner size="sm" className="me-1" />
          ) : (
            <FaSave className="me-1" />
          )}
          {hasChanges ? "Save Changes" : "Saved"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserPrefModal;