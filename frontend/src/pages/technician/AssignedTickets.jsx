import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { FaTimes, FaTicketAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../../services/ticketService';
import { getCategories } from '../../services/categoryService';

const AssignedTickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const hasActiveFilters = search || statusFilter || priorityFilter || categoryFilter;

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPriorityFilter('');
        setCategoryFilter('');
    };

    useEffect(() => {
        getCategories().then(res => setCategories(res.data.results || res.data)).catch(() => {});
    }, []);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const res = await getTickets(params);
            setTickets(res.data.results);
            setNextPage(res.data.next);
            setPrevPage(res.data.previous);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData({ search, status: statusFilter, priority: priorityFilter, category: categoryFilter });
    }, [search, statusFilter, priorityFilter, categoryFilter]);

    const getStatusBadge = (s) => <Badge className={`badge-status-${s.replace(' ', '_').toLowerCase()} text-capitalize`}>{s.replace('_', ' ')}</Badge>;
    const getPriorityBadge = (p) => <Badge className={`badge-priority-${p.toLowerCase()}`}>{p}</Badge>;
    const getSlaBadge = (sla) => sla === 'Breached' ? <Badge bg="danger">Breached</Badge> : sla === 'Met' ? <Badge bg="success">Ok</Badge> : <Badge bg="warning" text="dark">Pending</Badge>;

    const empLabel = (t) => {
        const id = t.employee_id ? ` · ${t.employee_id}` : "";
        const dept = t.employee_department ? ` · ${t.employee_department}` : "";
        const sub = [id, dept].filter(Boolean).join("");
        return (
          <div>
            <div>{t.employee_name || '-'}</div>
            {sub && <div className="text-muted" style={{ fontSize: "0.72rem", lineHeight: 1.2 }}>{sub}</div>}
          </div>
        );
    };

    return (
        <div>
            <div className="mb-4">
                <h4 className="fw-bold mb-1">My Assigned Tickets</h4>
                <p className="text-muted mb-0">View and manage tickets assigned to you.</p>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-2 mb-3 align-items-end">
                        <Col md={4}>
                            <Form.Control placeholder="Search by ticket #, title, or employee..." value={search} onChange={e => setSearch(e.target.value)} />
                        </Col>
                        <Col md={2}>
                            <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="">All Status</option>
                                <option value="assigned">Assigned</option>
                                <option value="reopened">Reopened</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                <option value="">All Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md="auto">
                            <Button variant="outline-secondary" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                                <FaTimes className="me-1" /> Clear
                            </Button>
                        </Col>
                    </Row>

                    {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> :
                    tickets.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <FaTicketAlt style={{ fontSize: '2.5rem', color: '#d1d5db' }} />
                            <h5 className="mt-3">{hasActiveFilters ? 'No tickets match your filters' : 'No tickets assigned'}</h5>
                            <p>{hasActiveFilters ? 'Try adjusting your search or filter criteria.' : 'You currently have no support tickets assigned to you.'}</p>
                            {hasActiveFilters && (
                                <Button variant="outline-primary" size="sm" onClick={clearFilters}>
                                    <FaTimes className="me-1" /> Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table hover responsive className="align-middle" style={{ fontSize: '0.9rem' }}>
                            <thead className="table-light">
                                <tr>
                                    <th>Ticket #</th><th>Employee</th><th>Title</th><th>Priority</th><th>Status</th><th>SLA</th><th>Created</th><th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td className="fw-medium">{t.ticket_number}</td>
                                        <td style={{ minWidth: "140px" }}>{empLabel(t)}</td>
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