import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../../services/ticketService';
import { getCategories } from '../../services/categoryService';
import api from '../../services/api';

const TicketManagement = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [techFilter, setTechFilter] = useState('');

    useEffect(() => {
        getCategories()
            .then(res => setCategories(Array.isArray(res.data.results) ? res.data.results : Array.isArray(res.data) ? res.data : []))
            .catch(() => setCategories([]));
        api.get('/auth/users/', { params: { role: 'technician' } })
            .then(res => setTechnicians(Array.isArray(res.data.results) ? res.data.results : Array.isArray(res.data) ? res.data : []))
            .catch(() => setTechnicians([]));
    }, []);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const res = await getTickets(params);
            setTickets(Array.isArray(res.data.results) ? res.data.results : []);
            setNextPage(res.data.next);
            setPrevPage(res.data.previous);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData({ search, status: statusFilter, priority: priorityFilter, category: categoryFilter, assigned_technician: techFilter });
    }, [search, statusFilter, priorityFilter, categoryFilter, techFilter]);

    const getStatusBadge = (s) => <Badge className={`badge-status-${s.replace(' ', '_').toLowerCase()} text-capitalize`}>{s.replace('_',' ')}</Badge>;
    const getPriorityBadge = (p) => <Badge className={`badge-priority-${p.toLowerCase()}`}>{p}</Badge>;

    return (
        <div>
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Ticket Management</h4>
                <p className="text-muted mb-0">Monitor and manage all organizational support requests.</p>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-2 mb-3">
                        <Col md={3}><Form.Control placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></Col>
                        <Col md={2}><Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">Status</option><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="reopened">Reopened</option><option value="closed">Closed</option></Form.Select></Col>
                        <Col md={2}><Form.Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="">Priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Form.Select></Col>
                        <Col md={2}><Form.Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="">Category</option>{categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Col>
                        <Col md={2}><Form.Select value={techFilter} onChange={e => setTechFilter(e.target.value)}><option value="">Technician</option>{technicians.map(t=> <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</Form.Select></Col>
                        <Col md="auto"><Button variant="outline-primary" size="sm" onClick={() => fetchData({search, status: statusFilter})}><FaSync /></Button></Col>
                    </Row>

                    {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
                        <Table hover responsive className="align-middle" style={{fontSize:'0.85rem'}}>
                            <thead className="table-light"><tr><th>Ticket #</th><th>Employee</th><th>Title</th><th>Priority</th><th>Technician</th><th>Status</th><th>SLA</th><th>Created</th><th>Action</th></tr></thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td className="fw-medium">{t.ticket_number}</td>
                                        <td>{t.employee_name || '-'}</td>
                                        <td>{t.title}</td>
                                        <td>{getPriorityBadge(t.priority)}</td>
                                        <td>{t.technician_name || 'Unassigned'}</td>
                                        <td>{getStatusBadge(t.status)}</td>
                                        <td>{t.sla_status === 'Breached' ? <Badge bg="danger">Breached</Badge> : <Badge bg="success">Ok</Badge>}</td>
                                        <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td><Button size="sm" variant="outline-primary" onClick={() => navigate(`/admin/tickets/${t.id}`)}>View</Button></td>
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

export default TicketManagement;