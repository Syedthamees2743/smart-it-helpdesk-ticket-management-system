import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Container,
  Accordion,
} from "react-bootstrap";
import { FaSearch, FaBook } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
import faqService from "../../services/faqService";

const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Account",
  "Security",
  "Printer",
  "General",
];

const CATEGORY_ICONS = {
  Hardware: "🖥️",
  Software: "💿",
  Network: "🌐",
  Account: "🔐",
  Security: "🛡️",
  Printer: "🖨️",
  General: "📋",
};

const KnowledgeBase = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await faqService.getFAQs();
      setFaqs(data.results || data);
    } catch (err) {
      setError("Unable to load knowledge base.");
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter((f) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      f.question.toLowerCase().includes(searchLower) ||
      (f.answer || "").toLowerCase().includes(searchLower);
    const matchesCategory =
      categoryFilter === "" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped = {};
  filteredFAQs.forEach((f) => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="mb-1 fw-bold">📚 IT Knowledge Base</h3>
        <p className="text-muted mb-0">
          Find quick solutions to common IT problems
        </p>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={7}>
              <Form.Label className="small fw-semibold">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by question or answer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Category</Form.Label>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_ICONS[c]} {c}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="text-muted small">
                <strong>{filteredFAQs.length}</strong> article
                {filteredFAQs.length !== 1 ? "s" : ""} found
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading knowledge base...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
      ) : filteredFAQs.length === 0 ? (
        <div className="text-center py-5">
          <FaBook style={{ fontSize: "3rem", color: "#d1d5db" }} />
          <h5 className="mt-3 text-muted">
            {search || categoryFilter
              ? "No FAQs match your search"
              : "No knowledge base articles found"}
          </h5>
          <p className="text-muted">
            {search || categoryFilter
              ? "Try different keywords or category."
              : "Articles will appear here when admins add them."}
          </p>
        </div>
      ) : (
        <Row className="g-4">
          {sortedCategories.map((cat) => (
            <Col lg={6} key={cat}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light border-bottom d-flex align-items-center gap-2">
                  <span style={{ fontSize: "1.2rem" }}>
                    {CATEGORY_ICONS[cat]}
                  </span>
                  <span className="fw-bold mb-0">{cat}</span>
                  <Badge bg="secondary" pill className="ms-auto">
                    {grouped[cat].length}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  <Accordion flush>
                    {grouped[cat].map((faq, idx) => (
                      <Accordion.Item key={faq.id} eventKey={`${cat}-${idx}`}>
                        <Accordion.Header
                          className="px-3 py-2"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {faq.question}
                        </Accordion.Header>
                        <Accordion.Body
                          className="px-3 pb-3 text-muted"
                          style={{
                            lineHeight: "1.7",
                            fontSize: "0.88rem",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {faq.answer}
                          <div className="mt-2 pt-2 border-top">
                            <small>
                              Updated:{" "}
                              {faq.updated_at
                                ? new Date(faq.updated_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )
                                : "—"}
                            </small>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default KnowledgeBase;
