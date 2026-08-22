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

/* =========================================================
   LOADING SKELETON
========================================================= */

const Skeleton = () => (
  <div
    className="p-3 p-md-4 p-xl-5"
    style={{
      backgroundColor: "#f1f5f9",
      minHeight: "100vh",
    }}
  >
    {/* Header Skeleton */}
    <div className="d-flex align-items-center gap-3 mb-4 mb-xl-5">
      <div
        className="rounded-4"
        style={{
          width: 56,
          height: 56,
          backgroundColor: "#e2e8f0",
        }}
      />

      <div>
        <div
          className="rounded mb-2"
          style={{
            width: 170,
            height: 26,
            backgroundColor: "#e2e8f0",
          }}
        />

        <div
          className="rounded"
          style={{
            width: 300,
            height: 13,
            backgroundColor: "#e2e8f0",
          }}
        />
      </div>
    </div>

    {/* Account Skeleton */}
    <Card className="border-0 shadow-sm mb-4 mb-xl-5 rounded-4 overflow-hidden">
      <Card.Body className="p-4 p-xl-5">
        <div
          className="rounded-3 mb-4"
          style={{
            width: 220,
            height: 22,
            backgroundColor: "#e2e8f0",
          }}
        />

        <Row className="g-4">
          {[...Array(4)].map((_, i) => (
            <Col xs={12} sm={6} xl={3} key={i}>
              <div
                className="rounded mb-2"
                style={{
                  width: "45%",
                  height: 11,
                  backgroundColor: "#e2e8f0",
                }}
              />

              <div
                className="rounded-3"
                style={{
                  height: 52,
                  backgroundColor: "#f1f5f9",
                }}
              />
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>

    {/* Bottom Skeleton */}
    <Row className="g-4">
      <Col xl={5}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4 p-xl-5">
            <div
              className="rounded-3 mb-4"
              style={{
                width: 150,
                height: 22,
                backgroundColor: "#e2e8f0",
              }}
            />

            <div
              className="rounded-4"
              style={{
                height: 150,
                backgroundColor: "#f1f5f9",
              }}
            />
          </Card.Body>
        </Card>
      </Col>

      <Col xl={7}>
        <Card className="border-0 shadow-sm rounded-4 h-100">
          <Card.Body className="p-4 p-xl-5">
            <div
              className="rounded-3 mb-4"
              style={{
                width: 240,
                height: 22,
                backgroundColor: "#e2e8f0",
              }}
            />

            <div className="d-flex flex-column gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="d-flex justify-content-between align-items-center p-3 rounded-3"
                  style={{
                    backgroundColor: "#f8fafc",
                    minHeight: 70,
                  }}
                >
                  <div style={{ width: "75%" }}>
                    <div
                      className="rounded mb-2"
                      style={{
                        width: "40%",
                        height: 13,
                        backgroundColor: "#e2e8f0",
                      }}
                    />

                    <div
                      className="rounded"
                      style={{
                        width: "70%",
                        height: 10,
                        backgroundColor: "#f1f5f9",
                      }}
                    />
                  </div>

                  <div
                    className="rounded-pill"
                    style={{
                      width: 42,
                      height: 24,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
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

const SectionHeader = ({
  icon,
  iconBg,
  iconColor,
  title,
  badge,
  description,
}) => (
  <div className="d-flex align-items-start gap-3 mb-4">
    <div
      className="d-flex align-items-center justify-content-center rounded-3 shadow-sm flex-shrink-0"
      style={{
        width: 46,
        height: 46,
        backgroundColor: iconBg || "#e8f0fe",
      }}
    >
      <span
        style={{
          color: iconColor || "#4f46e5",
          fontSize: "1.05rem",
        }}
      >
        {icon}
      </span>
    </div>

    <div className="flex-grow-1">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <h5
          className="mb-0 fw-bolder"
          style={{
            color: "#1f2937",
            fontSize: "1.1rem",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h5>

        {badge && (
          <Badge
            bg="light"
            text="dark"
            className="border px-3 py-1 rounded-pill"
            style={{
              fontSize: "0.7rem",
              fontWeight: "600",
            }}
          >
            {badge}
          </Badge>
        )}
      </div>

      {description && (
        <div
          className="text-muted mt-1"
          style={{
            fontSize: "0.82rem",
          }}
        >
          {description}
        </div>
      )}
    </div>
  </div>
);

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

  /* =========================================================
     FETCH SETTINGS
  ========================================================= */

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

  /* =========================================================
     PREFERENCE CHANGE
  ========================================================= */

  const handlePrefChange = (field, value) => {
    setPreferences((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

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

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await settingsService.updateSettings(preferences);

      if (res.success) {
        setOriginalPreferences({ ...preferences });
        setHasChanges(false);

        setSuccess(
          res.message || "Preferences saved successfully."
        );

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

  /* =========================================================
     RESET
  ========================================================= */

  const handleReset = () => {
    if (originalPreferences) {
      setPreferences({
        ...originalPreferences,
      });

      setHasChanges(false);
      setError("");
    }
  };

  /* =========================================================
     PASSWORD MODAL
  ========================================================= */

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

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const handlePwChange = async () => {
    setPwSaving(true);
    setPwErrors({});
    setPwSuccess("");

    try {
      const res = await profileService.changePassword(pwData);

      setPwSuccess(
        res.message || "Password changed successfully."
      );

      setShowPwModal(false);
    } catch (err) {
      const e = err.response?.data?.error;

      if (e && typeof e === "object") {
        setPwErrors(e);
      } else {
        setPwErrors({
          detail: [
            typeof e === "string"
              ? e
              : "Failed to change password.",
          ],
        });
      }
    } finally {
      setPwSaving(false);
    }
  };

  const pwFieldError = (field) => pwErrors[field]?.[0];

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <Skeleton />;
  }

  const isAdmin = account?.role_key === "admin";

  /* =========================================================
     NOTIFICATION ITEMS
  ========================================================= */

  const notificationItems = [
    {
      key: "email_notifications",
      label: "Email Notifications",
      desc: "Master toggle — disables all email notifications when off",
    },
    {
      key: "ticket_assignment",
      label: "Ticket Assignment",
      desc: "Notify when a ticket is assigned to a technician",
    },
    {
      key: "ticket_status_update",
      label: "Ticket Status Updates",
      desc: "Notify when ticket status changes",
    },
    {
      key: "comment_notifications",
      label: "Comments",
      desc: "Notify when someone comments on a ticket",
    },
    {
      key: "sla_alerts",
      label: "SLA Alerts",
      desc: "Notify when SLA is at risk or breached",
    },
    {
      key: "asset_notifications",
      label: "Asset Notifications",
      desc: "Notify when assets are assigned or returned",
    },
  ];

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div
      className="p-3 p-md-4 p-xl-5"
      style={{
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-4 mb-xl-5">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-4 shadow-sm flex-shrink-0"
            style={{
              width: 58,
              height: 58,
              backgroundColor: "#e8f0fe",
            }}
          >
            <FaCog
              style={{
                fontSize: "1.45rem",
                color: "#1a73e8",
              }}
            />
          </div>

          <div>
            <h3
              className="mb-1 fw-bolder"
              style={{
                color: "#111827",
                letterSpacing: "-0.025em",
              }}
            >
              Settings
            </h3>

            <p
              className="text-muted mb-0"
              style={{
                fontSize: "0.9rem",
              }}
            >
              Manage your account preferences, notifications and security
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
          className="d-flex align-items-center py-3 px-4 mb-4 border-0 rounded-4 shadow-sm"
        >
          <FaCheckCircle className="me-3 flex-shrink-0" />

          <div
            className="fw-medium"
            style={{
              fontSize: "0.9rem",
            }}
          >
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
          <div
            className="fw-medium"
            style={{
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        </Alert>
      )}

      {/* =====================================================
          ACCOUNT INFORMATION
      ===================================================== */}

      <Card className="border-0 shadow-sm mb-4 mb-xl-5 rounded-4 overflow-hidden">
        <Card.Body className="p-4 p-md-4 p-xl-5">
          <SectionHeader
            icon={<FaUser />}
            title="Account Information"
            description="Basic information associated with your Help Desk account"
          />

          {account && (
            <div
              className="rounded-4 p-3 p-md-4 p-xl-4"
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e8edf3",
              }}
            >
              <Row className="g-4">
                {/* Username */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Username
                  </div>

                  <div
                    className="fw-semibold text-dark d-flex align-items-center gap-2 py-3 px-3 rounded-3 bg-white"
                    style={{
                      fontSize: "0.92rem",
                      border: "1px solid #e5e7eb",
                      minHeight: 52,
                    }}
                  >
                    <FaUser
                      className="text-muted"
                      style={{ fontSize: "0.75rem" }}
                    />

                    <span>{account.username}</span>
                  </div>
                </Col>

                {/* Email */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Email Address
                  </div>

                  <div
                    className="text-dark d-flex align-items-center gap-2 py-3 px-3 rounded-3 bg-white"
                    style={{
                      fontSize: "0.92rem",
                      border: "1px solid #e5e7eb",
                      minHeight: 52,
                      wordBreak: "break-all",
                    }}
                  >
                    <FaEnvelope
                      className="text-muted flex-shrink-0"
                      style={{ fontSize: "0.75rem" }}
                    />

                    <span>{account.email}</span>
                  </div>
                </Col>

                {/* Role */}
                <Col xs={12} sm={6} xl={3}>
                  <div
                    className="text-uppercase text-muted fw-bold mb-2"
                    style={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Role
                  </div>

                  <div
                    className="d-flex align-items-center py-3 px-3 rounded-3 bg-white"
                    style={{
                      border: "1px solid #e5e7eb",
                      minHeight: 52,
                    }}
                  >
                    <Badge
                      bg="primary"
                      className="px-3 py-2 rounded-pill"
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        letterSpacing: "0.02em",
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
                    style={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Account Status
                  </div>

                  <div
                    className="py-3 px-3 rounded-3 bg-white d-flex align-items-center gap-2"
                    style={{
                      border: "1px solid #e5e7eb",
                      minHeight: 52,
                      fontSize: "0.9rem",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        backgroundColor: account.is_active
                          ? "#10b981"
                          : "#ef4444",
                        borderRadius: "50%",
                        display: "inline-block",
                        boxShadow: account.is_active
                          ? "0 0 0 3px #d1fae5"
                          : "0 0 0 3px #fee2e2",
                      }}
                    />

                    <span
                      className="fw-semibold"
                      style={{
                        color: account.is_active
                          ? "#065f46"
                          : "#dc2626",
                      }}
                    >
                      {account.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* =====================================================
          SECURITY + NOTIFICATIONS
      ===================================================== */}

      <Row className="g-4 align-items-stretch">
        {/* ===================================================
            SECURITY
        =================================================== */}

        <Col xl={5} lg={12}>
          <Card
            className="border-0 shadow-sm rounded-4 overflow-hidden h-100"
            style={{
              minHeight: "100%",
            }}
          >
            <Card.Body className="p-4 p-md-4 p-xl-5 d-flex flex-column">
              <SectionHeader
                icon={<FaLock />}
                iconBg="#fef2f2"
                iconColor="#dc2626"
                title="Security"
                description="Keep your account secure by updating your password regularly"
              />

              <div
                className="rounded-4 p-4 p-xl-5 flex-grow-1 d-flex flex-column justify-content-center"
                style={{
                  backgroundColor: "#fffbfb",
                  border: "1px dashed #fca5a5",
                  minHeight: 220,
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: "#fee2e2",
                      flexShrink: 0,
                    }}
                  >
                    <FaShieldAlt
                      style={{
                        color: "#dc2626",
                        fontSize: "1.15rem",
                      }}
                    />
                  </div>

                  <div>
                    <div
                      className="fw-bold text-dark"
                      style={{
                        fontSize: "1rem",
                      }}
                    >
                      Password Security
                    </div>

                    <div
                      className="text-muted mt-1"
                      style={{
                        fontSize: "0.8rem",
                      }}
                    >
                      Your password protects access to your account
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-3 p-3 mb-4"
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #f3d4d4",
                  }}
                >
                  <div
                    className="text-uppercase text-muted fw-bold mb-1"
                    style={{
                      fontSize: "0.68rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Last Password Change
                  </div>

                  <div
                    className="fw-semibold text-dark"
                    style={{
                      fontSize: "0.92rem",
                    }}
                  >
                    {account?.password_updated_at
                      ? new Date(
                          account.password_updated_at
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never changed"}
                  </div>
                </div>

                <Button
                  variant="outline-danger"
                  onClick={openPwModal}
                  className="d-flex align-items-center justify-content-center gap-2 rounded-pill px-4 py-2 w-100"
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: "600",
                  }}
                >
                  <FaLock
                    style={{
                      fontSize: "0.75rem",
                    }}
                  />

                  Change Password
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        <Col xl={7} lg={12}>
          {isAdmin ? (
            <Card
              className="border-0 shadow-sm rounded-4 overflow-hidden h-100"
            >
              <Card.Body className="p-4 p-md-4 p-xl-5 d-flex flex-column">
                <SectionHeader
                  icon={<FaBell />}
                  iconBg="#eef2ff"
                  iconColor="#4f46e5"
                  title="Notification Preferences"
                  badge="Admin"
                  description="Control which system events should generate email notifications"
                />

                <div className="d-flex flex-column gap-3 flex-grow-1">
                  {notificationItems.map((item) => (
                    <div
                      key={item.key}
                      className="d-flex justify-content-between align-items-center rounded-4 p-3 p-md-3"
                      style={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #eef0f3",
                        minHeight: 70,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          paddingRight: "1rem",
                        }}
                      >
                        <div
                          className="fw-semibold text-dark"
                          style={{
                            fontSize: "0.9rem",
                          }}
                        >
                          {item.label}
                        </div>

                        <div
                          className="text-muted mt-1"
                          style={{
                            fontSize: "0.78rem",
                            lineHeight: "1.45",
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>

                      <Form.Check
                        type="switch"
                        id={`pref-${item.key}`}
                        checked={preferences[item.key]}
                        onChange={(e) =>
                          handlePrefChange(
                            item.key,
                            e.target.checked
                          )
                        }
                        disabled={saving}
                        style={{
                          minWidth: 52,
                          cursor: saving
                            ? "not-allowed"
                            : "pointer",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Save / Reset */}
                <div
                  className="d-flex justify-content-end gap-2 mt-4 pt-4"
                  style={{
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <Button
                    variant="light"
                    onClick={handleReset}
                    disabled={saving || !hasChanges}
                    className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 border"
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: "500",
                    }}
                  >
                    <FaUndo
                      style={{
                        fontSize: "0.72rem",
                      }}
                    />

                    Discard
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 border-0 shadow-sm"
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: "600",
                      backgroundColor: !hasChanges
                        ? "#94a3b8"
                        : "#4f46e5",
                    }}
                  >
                    {saving ? (
                      <Spinner
                        size="sm"
                        className="me-1"
                      />
                    ) : (
                      <FaSave
                        style={{
                          fontSize: "0.72rem",
                        }}
                      />
                    )}

                    {hasChanges
                      ? "Save Changes"
                      : "Saved"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            /* =================================================
               NON ADMIN
            ================================================= */

            <div
              className="d-flex flex-column justify-content-center rounded-4 shadow-sm h-100 p-4 p-xl-5"
              style={{
                backgroundColor: "#f0f9ff",
                minHeight: 350,
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-4 mb-4"
                style={{
                  width: 58,
                  height: 58,
                  backgroundColor: "#dbeafe",
                }}
              >
                <FaInfoCircle
                  style={{
                    fontSize: "1.4rem",
                    color: "#2563eb",
                  }}
                />
              </div>

              <div
                className="fw-bold text-dark mb-2"
                style={{
                  fontSize: "1.05rem",
                }}
              >
                Notification Settings
              </div>

              <div
                className="text-muted"
                style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.7",
                  maxWidth: 600,
                }}
              >
                Notification preferences are managed by your
                IT administrator. If you need to adjust your
                notification settings, please contact your
                system administrator.
              </div>

              <div
                className="mt-4 p-3 rounded-3"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #dbeafe",
                }}
              >
                <div
                  className="fw-semibold text-primary"
                  style={{
                    fontSize: "0.85rem",
                  }}
                >
                  Information
                </div>

                <div
                  className="text-muted mt-1"
                  style={{
                    fontSize: "0.8rem",
                  }}
                >
                  Your administrator controls system-wide
                  notification preferences.
                </div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* =====================================================
          PASSWORD MODAL
      ===================================================== */}

      <Modal
        show={showPwModal}
        onHide={() => setShowPwModal(false)}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg rounded-4"
        size="md"
      >
        <div
          className="p-4 p-md-5"
          style={{
            background: "white",
            borderRadius: "1rem",
          }}
        >
          {/* Modal Header */}
          <Modal.Header
            closeButton
            className="border-0 pb-0 px-0 pt-0"
          >
            <Modal.Title
              className="fw-bold d-flex align-items-center gap-2"
              style={{
                fontSize: "1.1rem",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-danger bg-opacity-10"
                style={{
                  width: 38,
                  height: 38,
                }}
              >
                <FaLock
                  className="text-danger"
                  style={{
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              Change Password
            </Modal.Title>
          </Modal.Header>

          {/* Modal Body */}
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
                {Object.entries(pwErrors).map(
                  ([field, msgs]) => (
                    <div
                      key={field}
                      className="mb-0"
                    >
                      {Array.isArray(msgs)
                        ? msgs.map((msg) => (
                            <div
                              key={field + msg}
                            >
                              {msg}
                            </div>
                          ))
                        : (
                            <div>{msgs}</div>
                          )}
                    </div>
                  )
                )}
              </Alert>
            )}

            <Form noValidate>
              {/* Current Password */}
              <Form.Group className="mb-4">
                <Form.Label
                  className="fw-semibold text-dark"
                  style={{
                    fontSize: "0.85rem",
                  }}
                >
                  Current Password{" "}
                  <span className="text-danger">
                    *
                  </span>
                </Form.Label>

                <Form.Control
                  type="password"
                  value={
                    pwData.current_password
                  }
                  onChange={(e) =>
                    setPwData({
                      ...pwData,
                      current_password:
                        e.target.value,
                    })
                  }
                  isInvalid={!!pwFieldError(
                    "current_password"
                  )}
                  className="py-2 rounded-3"
                  placeholder="Enter current password"
                  style={{
                    fontSize: "0.9rem",
                    border: "1px solid #e5e7eb",
                  }}
                />

                <Form.Control.Feedback
                  type="invalid"
                  className="ps-2"
                >
                  {pwFieldError(
                    "current_password"
                  )}
                </Form.Control.Feedback>
              </Form.Group>

              {/* New Password */}
              <Form.Group className="mb-4">
                <Form.Label
                  className="fw-semibold text-dark"
                  style={{
                    fontSize: "0.85rem",
                  }}
                >
                  New Password{" "}
                  <span className="text-danger">
                    *
                  </span>
                </Form.Label>

                <Form.Control
                  type="password"
                  value={pwData.new_password}
                  onChange={(e) =>
                    setPwData({
                      ...pwData,
                      new_password:
                        e.target.value,
                    })
                  }
                  isInvalid={!!pwFieldError(
                    "new_password"
                  )}
                  className="py-2 rounded-3"
                  placeholder="Min 8 characters"
                  style={{
                    fontSize: "0.9rem",
                    border: "1px solid #e5e7eb",
                  }}
                />

                <Form.Control.Feedback
                  type="invalid"
                  className="ps-2"
                >
                  {pwFieldError(
                    "new_password"
                  )}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group>
                <Form.Label
                  className="fw-semibold text-dark"
                  style={{
                    fontSize: "0.85rem",
                  }}
                >
                  Confirm New Password{" "}
                  <span className="text-danger">
                    *
                  </span>
                </Form.Label>

                <Form.Control
                  type="password"
                  value={
                    pwData.confirm_password
                  }
                  onChange={(e) =>
                    setPwData({
                      ...pwData,
                      confirm_password:
                        e.target.value,
                    })
                  }
                  isInvalid={!!pwFieldError(
                    "confirm_password"
                  )}
                  className="py-2 rounded-3"
                  placeholder="Re-enter new password"
                  style={{
                    fontSize: "0.9rem",
                    border: "1px solid #e5e7eb",
                  }}
                />

                <Form.Control.Feedback
                  type="invalid"
                  className="ps-2"
                >
                  {pwFieldError(
                    "confirm_password"
                  )}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          </Modal.Body>

          {/* Modal Footer */}
          <Modal.Footer
            className="border-0 pt-0 px-0"
          >
            <Button
              variant="light"
              onClick={() =>
                setShowPwModal(false)
              }
              className="rounded-pill px-4 py-2 border"
              style={{
                fontSize: "0.88rem",
                fontWeight: "500",
              }}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={handlePwChange}
              disabled={pwSaving}
              className="rounded-pill px-4 py-2 border-0 shadow-sm"
              style={{
                fontSize: "0.88rem",
                fontWeight: "600",
                backgroundColor: "#dc2626",
              }}
            >
              {pwSaving && (
                <Spinner
                  size="sm"
                  className="me-2"
                />
              )}

              Update Password
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;