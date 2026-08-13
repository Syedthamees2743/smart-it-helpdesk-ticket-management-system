import { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Spinner, Badge, Table } from "react-bootstrap";
import { FaSync, FaChevronLeft, FaChevronRight, FaTimes, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getTickets } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";
import api from "../../services/api";

const PAGE_SIZE = 5;

const TicketManagement = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data?.results || res.data || [])).catch(() => {});
    api.get("/auth/users/", { params: { role: "technician" } }).then((res) => setTechnicians(res.data?.results || res.data || [])).catch(() => {});
    api.get("/departments/departments/", { params: { page_size: 100 } }).then((res) => setDepartments(res.data?.results || res.data || [])).catch(() => {});
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, totalCount);

  const hasActiveFilters = search || statusFilter || priorityFilter || categoryFilter || deptFilter || techFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setDeptFilter("");
    setTechFilter("");
  };

  const getParams = () => ({
    search,
    status: statusFilter,
    priority: priorityFilter,
    category: categoryFilter,
    department: deptFilter,
    assigned_technician: techFilter,
  });

  const fetchData = async (page = 1, params = {}) => {
    setLoading(true);
    try {
      const res = await getTickets({ ...params, page: page, page_size: PAGE_SIZE });
      const data = res.data;
      if (data && Array.isArray(data.results)) {
        setTickets(data.results);
        setTotalCount(data.count || 0);
      } else if (Array.isArray(data)) {
        setTickets(data);
        setTotalCount(data.length);
      } else {
        setTickets([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch tickets error:", err);
      setTickets([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1, getParams());
  }, [search, statusFilter, priorityFilter, categoryFilter, deptFilter, techFilter]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchData(page, getParams());
  };

  const getStatusBadge = (s) => (
    <Badge className={`badge-status-${s.replace(" ", "_").toLowerCase()} text-capitalize`}>
      {s.replace("_", " ")}
    </Badge>
  );
  const getPriorityBadge = (p) => (
    <Badge className={`badge-priority-${p.toLowerCase()}`}>{p}</Badge>
  );

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Ticket Management</h4>
        <p className="text-muted mb-0">Monitor and manage all organizational support requests.</p>
      </div>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {/* Row 1: Main filters */}
          <Row className="g-2 mb-2">
            <Col md={4}>
              <Form.Control
                placeholder="Search by ticket #, title, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="reopened">Reopened</option>
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
            <Col md={2}>
              <Form.Select value={techFilter} onChange={e => setTechFilter(e.target.value)}>
                <option value="">All Technicians</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </Form.Select>
            </Col>
          </Row>

          {/* Row 2: Department + Actions */}
          <Row className="g-2 mb-3 align-items-end">
            <Col md={3}>
              <Form.Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="outline-secondary" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                <FaTimes className="me-1" /> Clear Filters
              </Button>
            </Col>
            <Col md="auto">
              <Button variant="outline-primary" size="sm" onClick={() => fetchData(currentPage, getParams())}>
                <FaSync />
              </Button>
            </Col>
            <Col className="text-end">
              <div className="text-muted small">
                Showing <strong>{showingFrom}</strong>–<strong>{showingTo}</strong> of <strong>{totalCount}</strong>
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaTicketAlt style={{ fontSize: '2.5rem', color: '#d1d5db' }} />
              <h5 className="mt-3">
                {hasActiveFilters ? 'No tickets match your filters' : 'No tickets yet'}
              </h5>
              <p>
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Tickets will appear here when employees raise requests.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline-primary" size="sm" onClick={clearFilters}>
                  <FaTimes className="me-1" /> Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table hover responsive className="align-middle" style={{ fontSize: "0.85rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Ticket #</th>
                    <th>Employee</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-medium">{t.ticket_number}</td>
                      <td>{t.employee_name || "-"}</td>
                      <td>{t.title}</td>
                      <td>{getPriorityBadge(t.priority)}</td>
                      <td>{t.technician_name || "Unassigned"}</td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td>
                        {t.sla_status === "Breached"
                          ? <Badge bg="danger">Breached</Badge>
                          : <Badge bg="success">Ok</Badge>
                        }
                      </td>
                      <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                <div className="text-muted small">
                  Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{totalCount}</strong> tickets
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                    <FaChevronLeft className="me-1" /> Previous
                  </Button>
                  <div className="d-flex align-items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={page === currentPage ? "primary" : "outline-secondary"} size="sm" style={{ minWidth: '36px' }} onClick={() => goToPage(page)}>
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => goToPage(currentPage + 1)}>
                    Next <FaChevronRight className="ms-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TicketManagement;