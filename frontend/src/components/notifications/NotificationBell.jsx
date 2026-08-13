import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { Spinner } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import notificationService from "../../services/notificationService";

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const role = user?.role;

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      // Silent fail for background polling
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications({ page_size: 5 });
      setNotifications(data.results || data);
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!dropdownOpen) {
      fetchRecentNotifications();
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
      } catch (err) {
        // Continue navigation even if mark-read fails
      }
    }
    // Navigate to ticket if linked
    if (notif.ticket) {
      setDropdownOpen(false);
      navigate(`/${role}/tickets/${notif.ticket}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // Silent fail
    }
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    navigate(`/${role}/notifications`);
  };

  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className="btn btn-link position-relative p-1 border-0"
        style={{ fontSize: "1.2rem", textDecoration: "none", color: "#374151" }}
        onClick={toggleDropdown}
        style={{ fontSize: "1.2rem", textDecoration: "none" }}
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
            style={{
              backgroundColor: "#ef4444",
              fontSize: "0.65rem",
              minWidth: "18px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="position-absolute end-0 mt-2 shadow-lg border rounded-3 bg-white"
          style={{ width: "360px", zIndex: 1050 }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light rounded-top-3">
            <strong className="small">Notifications</strong>
            <div className="d-flex gap-2 align-items-center">
              {unreadCount > 0 && (
                <span
                  className="text-primary small"
                  style={{ cursor: "pointer", textDecoration: "none" }}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </span>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-4">
                <Spinner size="sm" animation="border" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-3 py-2 border-bottom small ${!notif.is_read ? "bg-light" : ""}`}
                  style={{
                    cursor: notif.ticket ? "pointer" : "default",
                    borderLeft: !notif.is_read
                      ? "3px solid #4f46e5"
                      : "3px solid transparent",
                  }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div
                      className="fw-semibold"
                      style={{ fontSize: "0.8rem", color: "#1f2937" }}
                    >
                      {notif.title}
                    </div>
                    <span
                      className="text-muted"
                      style={{
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                        marginLeft: "8px",
                      }}
                    >
                      {getTimeAgo(notif.created_at)}
                    </span>
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.78rem", marginTop: "2px" }}
                  >
                    {notif.message.length > 80
                      ? notif.message.substring(0, 80) + "..."
                      : notif.message}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="text-center py-2 border-top">
            <span
              className="text-primary small"
              style={{
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: 500,
              }}
              onClick={handleViewAll}
            >
              View All Notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
