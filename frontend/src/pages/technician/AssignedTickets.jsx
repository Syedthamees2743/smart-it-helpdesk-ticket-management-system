import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTickets, getCategories } from '../../services/ticketService';

const AssignedTickets = () => {
    const navigate = useNavigate();
    
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        getCategories().then(res => setCategories(res.data.results || res.data)).catch(()=>{});
    }, []);

    // Fetch tickets (Django automatically filters by logged-in technician)
    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const res = await getTickets(params);
            setTickets(res.data.results);
            setNextPage(res.data.next);
            setPrevPage(res.data.previous);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    // Re-fetch when filters change
    useEffect(() => {
        fetchData({ search, status: statusFilter, priority: priorityFilter, category: categoryFilter });
    }, [search, statusFilter, priorityFilter, categoryFilter]);

    const getStatusBadge = (s) => <Badge className={`badge-status-${s.replace(' ', '_').toLowerCase()} text-capitalize`}>{s.replace('_', ' ')}</Badge>;
    const getPriorityBadge = (p) => <Badge className={`badge-priority-${p.toLowerCase()}`}>{p}</Badge>;
    const getSlaBadge = (sla) => sla === 'Breached' ? <Badge bg="danger">Breached</Badge> : sla === 'Met' ? <Badge bg="success">Ok</Badge> : <Badge bg="warning" text="dark">Pending</Badge>;

    return (
        <div>
            <div className="mb-4">
                <h4 className="fw-bold mb-1">My Assigned Tickets</h4>
                <p className="text-muted mb-0">View and manage tickets assigned to you.</p>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-2 mb-3">
                        <Col md={4}>
                            <Form.Control placeholder="Search by title or ticket number..." value={search} onChange={e => setSearch(e.target.value)} />
                        </Col>
                        <Col md={2}>
                            <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="">All Status</option>
                                <option value="assigned">Assigned</option>
                                <option value="reopened">Reopened</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                <option value="">Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                <option value="">Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md="auto">
                            <Button variant="outline-primary" size="sm" onClick={() => fetchData({search, status: statusFilter})}>
                                <FaSync className="me-1" /> Refresh
                            </Button>
                        </Col>
                    </Row>

                    {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : 
                    tickets.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <h5>No tickets assigned</h5>
                            <p>You currently have no support tickets assigned to you.</p>
                        </div>
                    ) : (
                        <Table hover responsive className="align-middle" style={{fontSize: '0.9rem'}}>
                            <thead className="table-light">
                                <tr>
                                    <th>Ticket #</th>
                                    <th>Employee</th>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>SLA</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td className="fw-medium">{t.ticket_number}</td>
                                        <td>{t.employee_name || '-'}</td>
                                        <td>{t.title}</td>
                                        <td>{getPriorityBadge(t.priority)}</td>
                                        <td>{getStatusBadge(t.status)}</td>
                                        <td>{getSlaBadge(t.sla_status)}</td>
                                        <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/technician/tickets/${t.id}`)}>
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default AssignedTickets;