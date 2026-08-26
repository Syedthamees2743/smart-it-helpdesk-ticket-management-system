import { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Spinner, Badge, Table, InputGroup } from "react-bootstrap";
import { FaSync, FaChevronLeft, FaChevronRight, FaTimes, FaTicketAlt, FaSearch, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getTickets } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";

const PAGE_SIZE = 5;

const TicketManagement = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data?.results || res.data || []))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, totalCount);

  const hasActiveFilters = search || statusFilter || priorityFilter || categoryFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
  };

  const getParams = () => ({
    search,
    status: statusFilter,
    priority: priorityFilter,
    category: categoryFilter,
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
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchData(page, getParams());
  };

  const getStatusBadge = (s) => {
    const status = s.replace("_", " ");
    let bg = "secondary";
    if (s === "open") bg = "info";
    else if (s === "assigned") bg = "primary";
    else if (s === "in_progress") bg = "warning";
    else if (s === "resolved") bg = "success";
    else if (s === "reopened") bg = "danger";
    else if (s === "closed") bg = "dark";
    return <Badge bg={bg} className="text-capitalize" pill>{status}</Badge>;
  };

  const getPriorityBadge = (p) => {
    let bg = "secondary";
    if (p === "low") bg = "info";
    else if (p === "medium") bg = "warning";
    else if (p === "high") bg = "danger";
    else if (p === "critical") bg = "danger";
    return <Badge bg={bg} className="text-capitalize" pill>{p}</Badge>;
  };

  const techLabel = (t) => {
    if (!t.technician_name || t.technician_name === "None") return <span className="text-muted fst-italic">Unassigned</span>;
    const id = t.technician_id ? ` (${t.technician_id})` : "";
    const dept = t.technician_department ? ` - ${t.technician_department}` : "";
    return (
      <div>
        <div className="fw-medium">{t.technician_name}</div>
        <div className="text-muted" style={{ fontSize: "0.72rem", lineHeight: 1.2 }}>{id}{dept}</div>
      </div>
    );
  };

  const empLabel = (t) => {
    const id = t.employee_id ? ` (${t.employee_id})` : "";
    const dept = t.employee_department ? ` - ${t.employee_department}` : "";
    return (
      <div>
        <div className="fw-medium">{t.employee_name || "-"}</div>
        <div className="text-muted" style={{ fontSize: "0.72rem", lineHeight: 1.2 }}>{id}{dept}</div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark">Ticket Management</h4>
        <p className="text-muted mb-0">Monitor and manage all organizational support requests.</p>
      </div>

      {/* Filter & Search Card */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center mb-3">
            <FaFilter className="me-2 text-primary" />
            <h6 className="mb-0 fw-bold text-dark">Filters & Search</h6>
          </div>

          <Row className="g-3 align-items-end">
            <Col md={6} lg={4}>
              <Form.Label className="small fw-semibold text-muted mb-1">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch size={14} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by ticket #, title..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border-start-0 shadow-none"
                  style={{ paddingLeft: "0" }}
                />
                {search && (
                  <InputGroup.Text className="bg-light border-start-0" style={{ cursor: "pointer" }} onClick={() => setSearch("")}>
                    <FaTimes size={14} className="text-danger" />
                  </InputGroup.Text>
                )}
              </InputGroup>
            </Col>
            
            <Col md={6} lg={2}>
              <Form.Label className="small fw-semibold text-muted mb-1">Status</Form.Label>
              <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="shadow-none">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="reopened">Reopened</option>
                <option value="closed">Closed</option>
              </Form.Select>
            </Col>
            
            <Col md={6} lg={2}>
              <Form.Label className="small fw-semibold text-muted mb-1">Priority</Form.Label>
              <Form.Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="shadow-none">
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Col>
            
            <Col md={6} lg={2}>
              <Form.Label className="small fw-semibold text-muted mb-1">Category</Form.Label>
              <Form.Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="shadow-none">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Col>
            
            <Col md={12} lg={2} className="d-flex gap-2 justify-content-lg-end">
              <Button variant="outline-secondary" className="d-flex align-items-center px-3" onClick={clearFilters} disabled={!hasActiveFilters}>
                <FaTimes className="me-1" /> Clear
              </Button>
              <Button variant="primary" className="d-flex align-items-center px-3" onClick={() => fetchData(currentPage, getParams())}>
                <FaSync />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table Card */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted mb-0">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div className="d-flex justify-content-center mb-3">
                <FaTicketAlt style={{ fontSize: '3rem', color: '#dee2e6' }} />
              </div>
              <h5 className="fw-bold text-dark">
                {hasActiveFilters ? 'No tickets match your filters' : 'No tickets found'}
              </h5>
              <p className="mb-3">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Tickets will appear here when employees raise requests.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline-primary" size="sm" className="rounded-pill px-4" onClick={clearFilters}>
                  <FaTimes className="me-1" /> Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover responsive className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: "120px", paddingLeft: "20px" }}>Ticket #</th>
                      <th style={{ width: "180px" }}>Employee</th>
                      <th>Title</th>
                      <th style={{ width: "100px" }}>Priority</th>
                      <th style={{ width: "180px" }}>Technician</th>
                      <th style={{ width: "120px" }}>Status</th>
                      <th style={{ width: "100px" }} className="text-center">SLA</th>
                      <th style={{ width: "120px" }}>Created</th>
                      <th style={{ width: "80px" }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                        <td className="fw-bold text-primary" style={{ paddingLeft: "20px" }}>{t.ticket_number}</td>
                        <td>{empLabel(t)}</td>
                        <td className="fw-medium text-dark">{t.title}</td>
                        <td>{getPriorityBadge(t.priority)}</td>
                        <td>{techLabel(t)}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td className="text-center">
                          {t.sla_status === "Breached"
                            ? <Badge bg="danger" pill>Breached</Badge>
                            : <Badge bg="success" pill>Ok</Badge>
                          }
                        </td>
                        <td className="text-muted small">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="light" className="border" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted small">
                  Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{totalCount}</strong> tickets
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button variant="light" className="border d-flex align-items-center" size="sm" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                    <FaChevronLeft className="me-1" /> Prev
                  </Button>
                  <div className="d-flex align-items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={page === currentPage ? "primary" : "light"} className={`border ${page === currentPage ? 'text-white' : ''}`} size="sm" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => goToPage(page)}>
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button variant="light" className="border d-flex align-items-center" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => goToPage(currentPage + 1)}>
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