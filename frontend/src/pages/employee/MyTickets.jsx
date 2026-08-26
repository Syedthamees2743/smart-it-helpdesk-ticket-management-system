import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Badge,
  Table,
} from "react-bootstrap";
import {
  FaPlus,
  FaTimes,
  FaTicketAlt,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getTickets } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";

import "../../styles/EmployeePages.css";

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const hasActiveFilters =
    search || statusFilter || priorityFilter || categoryFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
  };

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.results || res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchData = async (extraParams = {}) => {
    setLoading(true);
    try {
      const params = {
        search,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        ...extraParams,
      };
      const res = await getTickets(params);
      setTickets(res.data.results || []);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (url) => {
    if (!url) return;
    try {
      const urlObj = new URL(url);
      const page = urlObj.searchParams.get("page");
      if (page) {
        fetchData({ page: parseInt(page) });
      } else {
        fetchData({ page: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const getStatusBadge = (status) => (
    <Badge
      className={`badge-status-${status
        .replace(" ", "_")
        .toLowerCase()} text-capitalize`}
    >
      {status.replace("_", " ")}
    </Badge>
  );

  const getPriorityBadge = (p) => (
    <Badge className={`badge-priority-${p.toLowerCase()}`}>{p}</Badge>
  );

  const getSlaBadge = (sla) =>
    sla === "Breached" ? (
      <Badge bg="danger">Breached</Badge>
    ) : sla === "Met" ? (
      <Badge bg="success">Ok</Badge>
    ) : (
      <Badge bg="warning" text="dark">
        Pending
      </Badge>
    );

  return (
    <div className="emp-page-wrapper">
      {/* HEADER */}
      <div className="emp-page-header mb-4">
        <div className="emp-page-title-row">
          <div className="emp-page-icon-wrap">
            <FaTicketAlt />
          </div>
          <div className="flex-grow-1">
            <h4 className="emp-page-title">My Tickets</h4>
            <p className="emp-page-subtitle">
              Track and manage your IT support requests
            </p>
          </div>
          <Button
            className="emp-btn-submit"
            onClick={() => navigate("/employee/tickets/new")}
          >
            <FaPlus className="me-2" />
            Raise Complaint
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="emp-card mb-3">
        <Card.Body className="p-3">
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <div className="emp-filter-label">
                <FaSearch className="me-1" size={11} />
                Search
              </div>
              <Form.Control
                placeholder="Ticket # or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="emp-form-control"
              />
            </Col>
            <Col md={2}>
              <div className="emp-filter-label">Status</div>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="emp-form-control"
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="emp-filter-label">Priority</div>
              <Form.Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="emp-form-control"
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="emp-filter-label">Category</div>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="emp-form-control"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button
                className="emp-btn-clear"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <FaTimes className="me-1" />
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* TABLE */}
      <Card className="emp-card">
        <Card.Body className="p-0">
          {loading ? (
            <div className="emp-loading-state">
              <Spinner animation="border" />
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="emp-empty-state">
              <FaTicketAlt className="emp-empty-icon" />
              <h5 className="emp-empty-title">
                {hasActiveFilters
                  ? "No tickets match your filters"
                  : "No tickets found"}
              </h5>
              <p className="emp-empty-text">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't raised any support requests yet."}
              </p>
              {hasActiveFilters ? (
                <Button className="emp-btn-clear" onClick={clearFilters}>
                  <FaFilter className="me-1" />
                  Clear Filters
                </Button>
              ) : (
                <Button
                  className="emp-btn-submit"
                  onClick={() => navigate("/employee/tickets/new")}
                >
                  <FaPlus className="me-2" />
                  Raise Complaint
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="emp-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Technician</th>
                      <th>Status</th>
                      <th>SLA</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td className="fw-semibold text-primary">
                          {t.ticket_number}
                        </td>
                        <td>{t.title}</td>
                        <td className="text-muted">
                          {t.category_name || "-"}
                        </td>
                        <td>{getPriorityBadge(t.priority)}</td>
                        <td>{t.technician_name || "Unassigned"}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td>{getSlaBadge(t.sla_status)}</td>
                        <td>
                          <Button
                            size="sm"
                            className="emp-btn-view"
                            onClick={() =>
                              navigate(`/employee/tickets/${t.id}`)
                            }
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div className="emp-pagination">
                <span className="emp-pagination-count">
                  Showing {tickets.length} ticket
                  {tickets.length !== 1 ? "s" : ""}
                </span>
                <div className="emp-pagination-buttons">
                  <Button
                    className="emp-btn-page"
                    disabled={!prevPage}
                    onClick={() => goToPage(prevPage)}
                  >
                    <FaChevronLeft className="me-1" size={10} />
                    Previous
                  </Button>
                  <Button
                    className="emp-btn-page"
                    disabled={!nextPage}
                    onClick={() => goToPage(nextPage)}
                  >
                    Next
                    <FaChevronRight className="ms-1" size={10} />
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

export default MyTickets;