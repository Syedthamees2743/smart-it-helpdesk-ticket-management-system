import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckDouble } from "react-icons/fa";
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
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        // Continue navigation even if mark-read fails
      }
    }
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
      {/* Bell Button - Fixed duplicate style bug */}
      <button
        className="btn btn-link position-relative p-1 border-0 d-flex align-items-center justify-content-center"
        style={{ 
          width: "40px", 
          height: "40px", 
          borderRadius: "10px", 
          textDecoration: "none", 
          color: "#475569",
          transition: "all 0.2s",
          backgroundColor: dropdownOpen ? "#f1f5f9" : "transparent"
        }}
        onClick={toggleDropdown}
        title="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle"
            style={{
              backgroundColor: "#ef4444",
              fontSize: "0.6rem",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)"
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="position-absolute end-0 mt-2 bg-white overflow-hidden"
          style={{ 
            width: "380px", 
            zIndex: 1050,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
          }}
        >
          {/* Header */}
          <div 
            className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom"
            style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}
          >
            <strong className="text-dark" style={{ fontSize: "0.9rem" }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm p-0 border-0 d-flex align-items-center gap-1"
                style={{ color: "#4f46e5", fontSize: "0.78rem", fontWeight: "600" }}
                onClick={handleMarkAllRead}
              >
                <FaCheckDouble size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-5">
                <Spinner size="sm" animation="border" style={{ color: "#4f46e5" }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 px-4">
                <div className="text-muted mb-2" style={{ fontSize: "2rem", opacity: 0.3 }}>
                  <FaBell />
                </div>
                <div className="text-muted small fw-medium">You're all caught up!</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>No new notifications right now.</div>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div
                  key={notif.id}
                  className="d-flex px-4 py-3"
                  style={{
                    cursor: notif.ticket ? "pointer" : "default",
                    backgroundColor: !notif.is_read ? "#f8faff" : "#ffffff",
                    borderLeft: !notif.is_read ? "4px solid #4f46e5" : "4px solid transparent",
                    borderBottom: index === notifications.length - 1 ? "none" : "1px solid #f1f5f9",
                    transition: "background-color 0.2s ease"
                  }}
                  onClick={() => handleNotificationClick(notif)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notif.is_read ? "#f8fafc" : "#eef2ff"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.is_read ? "#ffffff" : "#f8faff"}
                >
                  {/* Content */}
                  <div className="flex-grow-1 me-3">
                    <div
                      className="mb-1"
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: !notif.is_read ? "700" : "500",
                        color: !notif.is_read ? "#111827" : "#6b7280", // Unread = Pitch Black, Read = Grey
                        lineHeight: "1.3"
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: !notif.is_read ? "#374151" : "#9ca3af", // Unread = Dark Grey, Read = Very Light Grey
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {notif.message}
                    </div>
                  </div>

                  {/* Time Badge */}
                  <div className="flex-shrink-0 text-end" style={{ minWidth: "50px" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#94a3b8",
                        fontWeight: "500",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {getTimeAgo(notif.created_at)}
                    </span>
                    {/* Unread Dot Indicator */}
                    {!notif.is_read && (
                      <div className="mt-2 d-flex justify-content-end">
                        <div style={{ width: 8, height: 8, backgroundColor: "#4f46e5", borderRadius: "50%" }}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div 
              className="text-center py-3 border-top"
              style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9" }}
            >
              <span
                className="fw-semibold"
                style={{
                  cursor: "pointer",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  color: "#4f46e5"
                }}
                onClick={handleViewAll}
              >
                View All Notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;