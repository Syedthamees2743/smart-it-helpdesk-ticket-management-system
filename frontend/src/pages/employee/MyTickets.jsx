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
import { FaPlus, FaTimes, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getTickets } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";

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
      .catch((err) => {});
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
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const getStatusBadge = (status) => (
    <Badge
      className={`badge-status-${status.replace(" ", "_").toLowerCase()} text-capitalize`}
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">My Tickets</h4>
          <p className="text-muted mb-0">
            Track and manage your IT support requests.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/employee/tickets/new")}
        >
          <FaPlus className="me-2" /> Raise Complaint
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-2 mb-3 align-items-end">
            <Col md={4}>
              <Form.Control
                placeholder="Search by ticket # or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <FaTimes className="me-1" /> Clear
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaTicketAlt style={{ fontSize: "2.5rem", color: "#d1d5db" }} />
              <h5 className="mt-3">
                {hasActiveFilters
                  ? "No tickets match your filters"
                  : "No tickets found"}
              </h5>
              <p>
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't raised any support requests yet."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={clearFilters}
                >
                  <FaTimes className="me-1" /> Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table
                  hover
                  className="align-middle mb-0"
                  style={{ fontSize: "0.9rem" }}
                >
                  <thead className="table-light">
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
                        <td className="fw-medium">{t.ticket_number}</td>
                        <td>{t.title}</td>
                        <td className="text-muted">{t.category_name || "-"}</td>
                        <td>{getPriorityBadge(t.priority)}</td>
                        <td>{t.technician_name || "Unassigned"}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td>{getSlaBadge(t.sla_status)}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            type="button"
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
              <div className="d-flex justify-content-between align-items-center pt-3 mt-3 border-top">
                <span className="text-muted small mb-0">
                  Showing {tickets.length} ticket
                  {tickets.length !== 1 ? "s" : ""}
                </span>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2 rounded-pill px-3"
                    disabled={!prevPage}
                    onClick={() => goToPage(prevPage)}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill px-3"
                    disabled={!nextPage}
                    onClick={() => goToPage(nextPage)}
                  >
                    Next →
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
