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
  Button,
} from "react-bootstrap";
import {
  FaSearch,
  FaBook,
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
  FaSync,
} from "react-icons/fa";
import { FiAlertCircle, FiX } from "react-icons/fi";
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

const CATEGORY_COLORS = {
  Hardware: "#4f46e5",
  Software: "#7c3aed",
  Network: "#0891b2",
  Account: "#059669",
  Security: "#dc2626",
  Printer: "#d97706",
  General: "#6b7280",
};

const KnowledgeBase = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  // =========================================================
  // FIX: page_size: 1000 - ella FAQs-um varum (pagination limit
  // first 10 mattum kuduthathu, adhanaala categories missing!)
  // status: active - active FAQs mattum employees/technicians-ku
  // =========================================================
    const fetchFAQs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await faqService.getFAQs({
        page_size: 1000,
        status: "active",
      });

      // FIX: data null/undefined ah irundha crash aagathu
      if (!data) {
        setFaqs([]);
        return;
      }

      setFaqs(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("KnowledgeBase fetch error:", err);
      setFaqs([]);
      setError("Unable to load knowledge base. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter((f) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      (f.question || "").toLowerCase().includes(searchLower) ||
      (f.answer || "").toLowerCase().includes(searchLower);
    const matchesCategory =
      categoryFilter === "" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const hasActiveFilters = search || categoryFilter;

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      <Container style={{ maxWidth: "960px" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3"
            style={{ width: "64px", height: "64px", backgroundColor: "#eef2ff" }}
          >
            <FaBook style={{ fontSize: "1.6rem", color: "#4f46e5" }} />
          </div>
          <h4 className="fw-bold mb-1 text-dark">IT Knowledge Base</h4>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Find quick solutions to common IT problems
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-3 position-relative">
          <FaSearch
            className="text-muted position-absolute"
            style={{
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <Form.Control
            placeholder="Search for a question or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shadow-none"
            style={{
              height: "48px",
              paddingLeft: "44px",
              paddingRight: "44px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          />
          {search && (
            <FiX
              className="text-danger position-absolute"
              style={{
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
              onClick={() => setSearch("")}
            />
          )}
        </div>

        {/* Category Pills */}
        <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center">
          <span
            className="px-3 py-1 rounded-pill"
            style={{
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: categoryFilter === "" ? 600 : 400,
              backgroundColor: categoryFilter === "" ? "#4f46e5" : "#f3f4f6",
              color: categoryFilter === "" ? "#fff" : "#374151",
              border: "none",
              transition: "all 0.15s",
            }}
            onClick={() => setCategoryFilter("")}
          >
            All
          </span>
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className="px-3 py-1 rounded-pill"
              style={{
                fontSize: "0.85rem",
                cursor: "pointer",
                fontWeight: categoryFilter === c ? 600 : 400,
                backgroundColor:
                  categoryFilter === c ? CATEGORY_COLORS[c] : "#f3f4f6",
                color: categoryFilter === c ? "#fff" : "#374151",
                border: "none",
                transition: "all 0.15s",
              }}
              onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}
            >
              {CATEGORY_ICONS[c]} {c}
            </span>
          ))}
        </div>

        {/* Results Count + Refresh */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="text-muted small">
            <strong className="text-dark">{filteredFAQs.length}</strong> article
            {filteredFAQs.length !== 1 ? "s" : ""} found
          </div>
          <Button
            variant="light"
            className="border rounded-pill px-3 d-flex align-items-center"
            size="sm"
            onClick={fetchFAQs}
          >
            <FaSync className="me-1" /> Refresh
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading knowledge base...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="rounded-4 border-0">
            <FiAlertCircle className="me-2" />
            {error}
          </Alert>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaQuestionCircle style={{ fontSize: "3rem", color: "#dee2e6" }} />
            <h5 className="mt-3 fw-bold text-dark">
              {hasActiveFilters ? "No articles match your search" : "No articles available yet"}
            </h5>
            <p className="mb-3">
              {hasActiveFilters
                ? "Try different keywords or clear the filter."
                : "Articles will appear here when admins add them."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline-primary"
                size="sm"
                className="rounded-pill px-4"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                }}
              >
                <FiX className="me-1" /> Clear All
              </Button>
            )}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredFAQs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              const catColor = CATEGORY_COLORS[faq.category] || "#6b7280";
              return (
                <div
                  key={faq.id}
                  className="border rounded-4 shadow-sm overflow-hidden bg-white"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  {/* Question Header */}
                  <div
                    className="d-flex align-items-start gap-3 p-3"
                    style={{
                      cursor: "pointer",
                      backgroundColor: isExpanded ? "#f9fafb" : "#fff",
                      borderBottom: isExpanded ? "1px solid #e5e7eb" : "none",
                    }}
                    onClick={() => toggleExpand(faq.id)}
                  >
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: catColor + "15",
                        minWidth: "36px",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>
                        {CATEGORY_ICONS[faq.category]}
                      </span>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div
                        className="fw-semibold"
                        style={{
                          fontSize: "0.92rem",
                          color: "#111827",
                          lineHeight: "1.4",
                        }}
                      >
                        {faq.question}
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0 rounded-pill"
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor: catColor + "15",
                            color: catColor,
                            fontWeight: 500,
                          }}
                        >
                          {faq.category}
                        </span>
                        {faq.updated_at && (
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.72rem" }}
                          >
                            Updated{" "}
                            {new Date(faq.updated_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isExpanded ? (
                        <FaChevronUp
                          style={{ color: "#9ca3af", fontSize: "0.85rem" }}
                        />
                      ) : (
                        <FaChevronDown
                          style={{ color: "#9ca3af", fontSize: "0.85rem" }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Answer Body */}
                  {isExpanded && (
                    <div className="px-3 pb-3" style={{ marginLeft: "48px" }}>
                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.88rem",
                          lineHeight: "1.75",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default KnowledgeBase;