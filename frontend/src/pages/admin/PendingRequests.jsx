import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import authService from '../../services/authService';

const PendingRequests = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authService.getPendingUsers();
            setUsers(response.data || response.results || response || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch pending requests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleApprove = async (user) => {
        if (!window.confirm(`Approve ${user.first_name} ${user.last_name}?`)) return;
        
        setActionLoading(true);
        try {
            const response = await authService.approveUser(user.id);
            setSuccess(response.message || `${user.first_name} ${user.last_name} approved. Activation email sent.`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectClick = (user) => {
        setSelectedUser(user);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedUser) return;
        
        setActionLoading(true);
        try {
            const response = await authService.rejectUser(selectedUser.id, rejectReason);
            setShowRejectModal(false);
            setSuccess(response.message || `${selectedUser.first_name} ${selectedUser.last_name} rejected.`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject user');
        } finally {
            setActionLoading(false);
        }
    };

    const getIdentifier = (user) => user.employee_id || user.technician_id || '-';

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <h3 className="mb-1">Pending Account Requests</h3>
                    <p className="text-muted">Review and approve or reject registration requests</p>
                </Col>
            </Row>
            
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
            
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            <Card>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading pending requests...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#ccc' }}></i>
                            <p className="mt-3 text-muted">No pending requests</p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Role</th>
                                    <th>Submitted</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" 
                                                     style={{ width: '36px', height: '36px' }}>
                                                    <span className="text-primary fw-bold small">
                                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">{user.first_name} {user.last_name}</div>
                                                    <small className="text-muted">@{user.username}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><code>{getIdentifier(user)}</code></td>
                                        <td>{user.email}</td>
                                        <td>{user.department_name || '-'}</td>
                                        <td>
                                            <Badge bg={user.role === 'employee' ? 'info' : 'warning'} text={user.role === 'technician' ? 'dark' : ''}>
                                                {user.role_display || user.role}
                                            </Badge>
                                        </td>
                                        <td><small>{user.submitted_at}</small></td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline-success"
                                                    onClick={() => handleApprove(user)}
                                                    disabled={actionLoading}
                                                >
                                                    <i className="bi bi-check-lg me-1"></i>Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleRejectClick(user)}
                                                    disabled={actionLoading}
                                                >
                                                    <i className="bi bi-x-lg me-1"></i>Reject
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
                {users.length > 0 && (
                    <Card.Footer className="bg-light">
                        <small className="text-muted">Showing {users.length} pending request{users.length !== 1 ? 's' : ''}</small>
                    </Card.Footer>
                )}
            </Card>
            
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>Reject Account Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <>
                            <Alert variant="warning">
                                Reject <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
                            </Alert>
                            <Form.Group>
                                <Form.Label>Rejection Reason (Optional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Reason will be sent to the user via email"
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleRejectConfirm} disabled={actionLoading}>
                        {actionLoading ? (
                            <><Spinner animation="border" size="sm" className="me-2" />Rejecting...</>
                        ) : (
                            'Confirm Rejection'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default PendingRequests;