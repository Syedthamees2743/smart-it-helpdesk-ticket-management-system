import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../services/api";

const PendingRequests = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectUser, setRejectUser] = useState(null);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/auth/users/pending/");

      if (res.data && res.data.success) {
        setPendingUsers(res.data.data || []);
      } else {
        setPendingUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch pending users:", err);
      setError(
        "Failed to load pending requests. Please refresh the page."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // =========================
  // APPROVE USER
  // =========================
  const handleApprove = async (user) => {
    if (!user?.id) {
      toast.error("Invalid user.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to approve ${user.first_name} ${user.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(user.id);

    try {
      const res = await api.post(`/auth/users/${user.id}/approve/`);

      if (res.data && res.data.success) {
        toast.success(
          res.data.message || "User approved successfully."
        );

        await fetchPendingUsers();
      } else {
        toast.error(
          res.data?.error || "Failed to approve. Please try again."
        );
      }
    } catch (err) {
      console.error("Approve user error:", err);

      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to approve user. Please try again.";

      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================
  // OPEN REJECT MODAL
  // =========================
  const handleReject = (user) => {
    setRejectUser(user);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // =========================
  // CONFIRM REJECTION
  // =========================
  const confirmReject = async () => {
    if (!rejectUser?.id) {
      toast.error("Invalid user.");
      return;
    }

    setActionLoading(rejectUser.id);

    try {
      const res = await api.post(
        `/auth/users/${rejectUser.id}/reject/`,
        {
          reason: rejectReason.trim() || null,
        }
      );

      if (res.data && res.data.success) {
        toast.success(
          res.data.message || "User rejected successfully."
        );

        setShowRejectModal(false);
        setRejectUser(null);
        setRejectReason("");

        await fetchPendingUsers();
      } else {
        toast.error(
          res.data?.error || "Failed to reject. Please try again."
        );
      }
    } catch (err) {
      console.error("Reject user error:", err);

      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to reject user. Please try again.";

      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================
  // CLOSE REJECT MODAL
  // =========================
  const closeRejectModal = () => {
    if (actionLoading) {
      return;
    }

    setShowRejectModal(false);
    setRejectUser(null);
    setRejectReason("");
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />

        <span className="text-muted mt-2 d-block">
          Loading pending requests...
        </span>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <Alert
        variant="danger"
        dismissible
        onClose={() => setError(null)}
      >
        {error}
      </Alert>
    );
  }

  // =========================
  // NO PENDING USERS
  // =========================
  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <h5>No pending requests</h5>

        <p className="mb-0">
          There are no pending account requests at this time.
        </p>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================
  return (
    <>
      <div className="mt-4">
        <h5 className="fw-bold mb-3">
          Pending Account Requests

          <Badge bg="warning" className="ms-2">
            {pendingUsers.length}
          </Badge>
        </h5>

        <Table
          hover
          responsive
          className="align-middle"
          style={{ fontSize: "0.9rem" }}
        >
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Employee ID / Tech ID</th>
              <th>Department</th>
              <th>Role</th>
              <th>Submitted</th>
              <th style={{ width: "180px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.id}>
                {/* NAME */}
                <td>
                  <div className="fw-medium">
                    {user.first_name} {user.last_name}
                  </div>

                  {user.email && (
                    <small className="text-muted">
                      {user.email}
                    </small>
                  )}
                </td>

                {/* USERNAME */}
                <td>{user.username || "—"}</td>

                {/* ID */}
                <td>
                  {user.employee_id ||
                    user.technician_id ||
                    "—"}
                </td>

                {/* DEPARTMENT */}
                <td>
                  {user.employee_department ||
                    user.technician_department ||
                    "—"}
                </td>

                {/* ROLE */}
                <td>
                  <Badge
                    bg="warning"
                    text="dark"
                    className="text-uppercase"
                  >
                    {user.role || "—"}
                  </Badge>
                </td>

                {/* SUBMITTED DATE */}
                <td className="text-muted">
                  {user.submitted_at
                    ? new Date(
                        user.submitted_at
                      ).toLocaleDateString()
                    : "—"}
                </td>

                {/* ACTIONS */}
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    {/* APPROVE */}
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleApprove(user)}
                      disabled={actionLoading === user.id}
                      title="Approve"
                    >
                      {actionLoading === user.id ? (
                        <Spinner
                          size="sm"
                          animation="border"
                        />
                      ) : (
                        <FaCheckCircle />
                      )}
                    </Button>

                    {/* REJECT */}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(user)}
                      disabled={actionLoading === user.id}
                      title="Reject"
                    >
                      <FaTimesCircle />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* =========================
          REJECT MODAL
          ========================= */}
      <Modal
        show={showRejectModal}
        onHide={closeRejectModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Reject User</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="text-muted mb-3">
            Are you sure you want to reject{" "}
            <strong>
              {rejectUser?.first_name}{" "}
              {rejectUser?.last_name}
            </strong>
            ?
          </p>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Rejection Reason (optional)
            </Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Explain why the request was rejected..."
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(e.target.value)
              }
              className="py-2"
            />
          </Form.Group>

          {rejectUser && (
            <Alert variant="warning" className="mb-0">
              <FaExclamationTriangle className="me-2 text-warning" />

              This action cannot be undone.
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeRejectModal}
            disabled={!!actionLoading}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={confirmReject}
            disabled={!!actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner
                  size="sm"
                  animation="border"
                  className="me-2"
                />

                Rejecting...
              </>
            ) : (
              <>
                <FaTimesCircle className="me-2" />

                Reject
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PendingRequests;