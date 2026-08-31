import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckDouble, FaRegBell } from "react-icons/fa";
import { Spinner } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import notificationService from "../../services/notificationService";
import "../../styles/NotificationBell.css";

const getNotifMeta = (notif) => {
  const text = `${notif.title || ""} ${notif.message || ""}`.toLowerCase();

  if (
    text.includes("resolved") ||
    text.includes("closed") ||
    text.includes("completed")
  ) {
    return { symbol: "\u2713", color: "#16a34a", bg: "#f0fdf4" };
  }
  if (
    text.includes("in progress") ||
    text.includes("working") ||
    text.includes("picked up")
  ) {
    return { symbol: "\u21BB", color: "#d97706", bg: "#fffbeb" };
  }
  if (text.includes("assigned")) {
    return { symbol: "\u2192", color: "#7c3aed", bg: "#f5f3ff" };
  }
  if (
    text.includes("created") ||
    text.includes("new") ||
    text.includes("submitted") ||
    text.includes("raised")
  ) {
    return { symbol: "!", color: "#2563eb", bg: "#eff6ff" };
  }
  if (
    text.includes("rejected") ||
    text.includes("failed") ||
    text.includes("error")
  ) {
    return { symbol: "\u2715", color: "#dc2626", bg: "#fef2f2" };
  }
  if (text.includes("comment") || text.includes("reply")) {
    return { symbol: "\u275D", color: "#0891b2", bg: "#ecfeff" };
  }

  return { symbol: "\u2022", color: "#64748b", bg: "#f8fafc" };
};

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const role = user?.role;

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);

  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);

  /* ---- Fetch helpers ---- */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      /* silent */
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications({
        page_size: 5,
      });
      setNotifications(data.results || data);
    } catch (err) {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- Poll unread count ---- */
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /* ---- Bell ring on new count ---- */
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current >= 0) {
      setBellRinging(true);
      const timer = setTimeout(() => setBellRinging(false), 700);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  /* ---- Click outside ---- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---- Escape to close ---- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && dropdownOpen) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  /* ---- Actions ---- */
  const toggleDropdown = () => {
    if (!dropdownOpen) {
      fetchRecentNotifications();
    }
    setDropdownOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, is_read: true } : n
          )
        );
      } catch (err) {
        /* silent */
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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      /* silent */
    }
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    navigate(`/${role}/notifications`);
  };

  /* ---- Time formatter ---- */
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={`notif-bell ${dropdownOpen ? "notif-bell--active" : ""} ${
          bellRinging ? "notif-bell--ring" : ""
        }`}
        onClick={toggleDropdown}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <span className="notif-bell__icon">
          <FaBell />
        </span>
        {unreadCount > 0 && (
          <span key={unreadCount} className="notif-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <div
        className={`notif-dropdown ${dropdownOpen ? "notif-dropdown--open" : ""}`}
        role="menu"
        aria-label="Notification list"
      >
        {/* Header */}
        <div className="notif-dropdown__header">
          <div className="notif-dropdown__title-group">
            <h6 className="notif-dropdown__title">Notifications</h6>
            {unreadCount > 0 && (
              <span className="notif-dropdown__count">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="notif-dropdown__mark-all"
              onClick={handleMarkAllRead}
              type="button"
            >
              <FaCheckDouble size={11} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="notif-dropdown__list">
          {loading ? (
            <div className="notif-dropdown__loading">
              <Spinner
                size="sm"
                animation="border"
                style={{ color: "#3b82f6" }}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-dropdown__empty">
              <div className="notif-dropdown__empty-icon">
                <FaRegBell />
              </div>
              <div className="notif-dropdown__empty-title">
                You're all caught up!
              </div>
              <div className="notif-dropdown__empty-sub">
                No new notifications right now.
                <br />
                We'll let you know when something arrives.
              </div>
            </div>
          ) : (
            notifications.map((notif, index) => {
              const meta = getNotifMeta(notif);
              const isClickable = !!notif.ticket;

              return (
                <div
                  key={notif.id}
                  className={`notif-item ${
                    !notif.is_read ? "notif-item--unread" : "notif-item--read"
                  } ${isClickable ? "notif-item--clickable" : ""}`}
                  style={{ animationDelay: `${index * 0.04}s` }}
                  onClick={() => handleNotificationClick(notif)}
                  role={isClickable ? "menuitem" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isClickable)
                      handleNotificationClick(notif);
                  }}
                >
                  {/* Type Icon */}
                  <div
                    className="notif-item__type"
                    style={{
                      color: meta.color,
                      backgroundColor: meta.bg,
                    }}
                  >
                    {meta.symbol}
                  </div>

                  {/* Body */}
                  <div className="notif-item__body">
                    <div className="notif-item__row">
                      <span className="notif-item__title">
                        {notif.title}
                      </span>
                      <span className="notif-item__time">
                        {getTimeAgo(notif.created_at)}
                      </span>
                    </div>
                    <div className="notif-item__message">
                      {notif.message}
                    </div>
                  </div>

                  {/* Unread Dot */}
                  {!notif.is_read && <div className="notif-item__dot" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notif-dropdown__footer">
            <button
              className="notif-dropdown__view-all"
              onClick={handleViewAll}
              type="button"
            >
              View All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationBell;