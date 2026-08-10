import { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaTicketAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaStar, FaClock, FaListAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTechnicianDashboard } from '../../services/technicianService';

const TechnicianDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await getTechnicianDashboard();
                setData(res.data);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" size="lg" />
                    <p className="mt-3 text-muted">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-5 text-danger">Failed to load dashboard data.</div>;
    }

    const { tickets, performance } = data;

    return (
        <div>
            {/* Header */}
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Technician Dashboard</h4>
                <p className="text-muted mb-0">Manage your assigned IT support requests.</p>
            </div>

            {/* KPI Cards */}
            <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="me-3 p-2 bg-primary bg-opacity-10 rounded-circle">
                                <FaListAlt size={24} className="text-primary" />
                            </div>
                            <div>
                                <div className="text-muted small">Assigned</div>
                                <div className="fw-bold fs-4">{tickets.assigned_to_me || 0}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="me-3 p-2 bg-warning bg-opacity-10 rounded-circle">
                                <FaClock size={24} className="text-warning" />
                            </div>
                            <div>
                                <div className="text-muted small">In Progress</div>
                                <div className="fw-bold fs-4">{tickets.in_progress || 0}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="me-3 p-2 bg-success bg-opacity-10 rounded-circle">
                                <FaCheckCircle size={24} className="text-success" />
                            </div>
                            <div>
                                <div className="text-muted small">Resolved</div>
                                <div className="fw-bold fs-4">{tickets.resolved || 0}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 border-start border-4 border-danger">
                        <Card.Body className="d-flex align-items-center">
                            <div className="me-3 p-2 bg-danger bg-opacity-10 rounded-circle">
                                <FaExclamationTriangle size={24} className="text-danger" />
                            </div>
                            <div>
                                <div className="text-muted small">SLA Breached</div>
                                <div className="fw-bold fs-4 text-danger">{tickets.sla_breached || 0}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Performance Metrics */}
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3"><FaStar className="me-2 text-warning" />My Performance</h6>
                            <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                                <span className="text-muted">Tickets Resolved:</span>
                                <span className="fw-bold">{performance?.resolved_count || 0}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                                <span className="text-muted">Average Rating:</span>
                                <span className="fw-bold text-warning">{performance?.avg_rating || 0.0} / 5.0 ⭐</span>
                            </div>
                            <div className="d-flex justify-content-between p-2 bg-light rounded">
                                <span className="text-muted">SLA Performance:</span>
                                <span className={`fw-bold ${performance?.sla_performance_pct < 90 ? 'text-danger' : 'text-success'}`}>
                                    {performance?.sla_performance_pct || 100}%
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Quick Actions */}
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <h6 className="fw-bold border-bottom pb-2 mb-3">Quick Actions</h6>
                            <div className="d-grid gap-2">
                                <button onClick={() => navigate('/technician/tickets?status=assigned')} className="btn btn-outline-primary text-start">
                                    <FaListAlt className="me-2" /> View Pending Tickets
                                </button>
                                <button onClick={() => navigate('/technician/tickets?status=in_progress')} className="btn btn-outline-warning text-start">
                                    <FaClock className="me-2" /> View In-Progress
                                </button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TechnicianDashboard;