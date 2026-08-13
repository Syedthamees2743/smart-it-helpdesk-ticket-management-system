import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Container,
  Form,
} from 'react-bootstrap';
import {
  FaBell,
  FaCheckDouble,
  FaFilter,
  FaEye,
  FaRegBell,
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

const NotificationCenter = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const role = user?.role;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page_size: 1000 };
      if (filter === 'unread') {
        params.unread = 'true';
      }
      const data = await notificationService.getNotifications(params);
      setNotifications(data.results || data);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      // Silent
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // Silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif);
    }
    if (notif.ticket) {
      navigate(`/${role}/tickets/${notif.ticket}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeBadgeVariant = (type) => {
    const map = {
      ticket_created: 'primary',
      ticket_assigned: 'info',
      ticket_status: 'warning',
      ticket_comment: 'secondary',
      ticket_reopened: 'danger',
      ticket_resolved: 'success',
      ticket_closed: 'dark',
      feedback_received: 'success',
      asset_assigned: 'info',
      asset_returned: 'secondary',
      general: 'secondary',
    };
    return map[type] || 'secondary';
  };

  const getTypeLabel = (type) => {
    const labels = {
      ticket_created: 'Created',
      ticket_assigned: 'Assigned',
      ticket_status: 'Status',
      ticket_comment: 'Comment',
      ticket_reopened: 'Reopened',
      ticket_resolved: 'Resolved',
      ticket_closed: 'Closed',
      feedback_received: 'Feedback',
      asset_assigned: 'Asset',
      asset_returned: 'Asset',
      general: 'General',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold">Notification Center</h3>
          <p className="text-muted mb-0">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Form.Select
            size="sm"
            style={{ width: '150px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </Form.Select>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline-primary"
              disabled={markingAll}
              onClick={handleMarkAllAsRead}
            >
              {markingAll ? <Spinner size="sm" /> : <FaCheckDouble className="me-1" />}
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading notifications...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <FiAlertCircle className="me-2" />
              {error}
            </Alert>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <FaRegBell style={{ fontSize: '3rem', color: '#d1d5db' }} />
              <h5 className="mt-3 text-muted">
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </h5>
              <p className="text-muted">
                {filter === 'unread'
                  ? 'You have read all your notifications.'
                  : 'Notifications will appear here when events happen.'}
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notif, idx) => (
                <div
                  key={notif.id}
                  className={`d-flex align-items-start gap-3 px-3 py-3 ${
                    idx < notifications.length - 1 ? 'border-bottom' : ''
                  } ${!notif.is_read ? 'bg-light' : ''}`}
                  style={{
                    cursor: 'pointer',
                    borderLeft: !notif.is_read ? '4px solid #4f46e5' : '4px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => handleClick(notif)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = notif.is_read ? '#f9fafb' : '#eef2ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = notif.is_read ? '' : '#f8f9fa')}
                >
                  {/* Icon */}
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: notif.is_read ? '#f3f4f6' : '#e0e7ff',
                    }}
                  >
                    <FaBell
                      style={{
                        fontSize: '0.9rem',
                        color: notif.is_read ? '#9ca3af' : '#4f46e5',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                        {notif.title}
                        {!notif.is_read && (
                          <span
                            className="d-inline-block rounded-circle ms-2"
                            style={{ width: '8px', height: '8px', backgroundColor: '#4f46e5' }}
                          />
                        )}
                      </div>
                      <Badge
                        bg={getTypeBadgeVariant(notif.notification_type)}
                        className="flex-shrink-0"
                        style={{ fontSize: '0.65rem' }}
                      >
                        {getTypeLabel(notif.notification_type)}
                      </Badge>
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                      {notif.message}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatDate(notif.created_at)}
                      </span>
                      {notif.ticket && (
                        <span
                          className="d-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem', color: '#4f46e5' }}
                        >
                          <FaEye style={{ fontSize: '0.7rem' }} />
                          {notif.ticket_number || 'View Ticket'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark Read Button */}
                  {!notif.is_read && (
                    <Button
                      variant="link"
                      size="sm"
                      className="flex-shrink-0 p-0 text-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif);
                      }}
                      title="Mark as read"
                    >
                      <FaFilter style={{ fontSize: '0.8rem' }} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NotificationCenter;