import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FaBell,
  FaSave,
  FaTimes,
  FaCheckCircle,
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
  },
  {
    key: "ticket_assignment",
    label: "Ticket Assignment",
    desc: "Notify when a ticket is assigned",
  },
  {
    key: "ticket_status_update",
    label: "Ticket Status Updates",
    desc: "Notify on ticket status change",
  },
  {
    key: "comment_notifications",
    label: "Comments",
    desc: "Notify on ticket comments",
  },
  {
    key: "sla_alerts",
    label: "SLA Alerts",
    desc: "Notify when SLA is at risk or breached",
  },
  {
    key: "asset_notifications",
    label: "Asset Notifications",
    desc: "Notify on asset assignment or return",
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
    // Reset on close
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

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header
        closeButton
        className="border-bottom-0 pb-0"
      >
        <Modal.Title className="fw-bold h6">
          <FaBell className="me-2 text-primary" />
          Notification Preferences
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* User info bar */}
        <div
          className="d-flex align-items-center gap-2 mb-3 p-2 rounded"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "#4f46e5",
              fontSize: "0.85rem",
              flexShrink: 0,
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
              {userName || `User #${userId}`}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
              Managing notification settings
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert
            variant="success"
            className="py-2 small d-flex align-items-center"
          >
            <FaCheckCircle className="me-2 flex-shrink-0" />
            {success}
          </Alert>
        )}
        {error && (
          <Alert
            variant="danger"
            className="py-2 small"
            dismissible
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" size="sm" />
            <div className="text-muted small mt-2">Loading preferences...</div>
          </div>
        ) : (
          /* Toggle rows */
          <div>
            {PREF_LABELS.map((item, idx) => (
              <div
                key={item.key}
                className={`d-flex justify-content-between align-items-center py-2 ${
                  idx < PREF_LABELS.length - 1 ? "border-bottom" : ""
                }`}
              >
                <div className="me-3">
                  <div className="fw-medium" style={{ fontSize: "0.88rem" }}>
                    {item.label}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                    {item.desc}
                  </div>
                </div>
                <Form.Check
                  type="switch"
                  id={`admin-pref-${item.key}`}
                  checked={preferences[item.key]}
                  onChange={(e) => handleToggle(item.key, e.target.checked)}
                  disabled={saving}
                  className="flex-shrink-0"
                  style={{ minWidth: 48 }}
                />
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onHide}
          disabled={saving}
        >
          <FaTimes className="me-1" />
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || !hasChanges || loading}
        >
          {saving ? (
            <Spinner size="sm" className="me-1" />
          ) : (
            <FaSave className="me-1" />
          )}
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserPrefModal;