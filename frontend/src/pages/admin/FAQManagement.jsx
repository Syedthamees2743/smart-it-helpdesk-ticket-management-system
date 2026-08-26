import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Modal,
  Pagination,
} from "react-bootstrap";

import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaBook,
  FaCheckCircle,
  FaTimesCircle,
  FaLayerGroup,
  FaExclamationTriangle,
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

const PAGE_SIZE = 10;

const FAQManagement = () => {
  // =========================================================
  // FAQ DATA
  // =========================================================

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // =========================================================
  // PAGINATION
  // =========================================================

  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // KPI DATA
  // =========================================================

  const [allFAQs, setAllFAQs] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // =========================================================
  // MODAL STATES
  // =========================================================

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [deletingFAQ, setDeletingFAQ] = useState(null);
  const [viewingFAQ, setViewingFAQ] = useState(null);

  // =========================================================
  // FORM STATES
  // =========================================================

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");
  const [faqStatus, setFaqStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // =========================================================
  // FETCH FAQs
  // =========================================================

  useEffect(() => {
    fetchFAQs();
  }, [currentPage, search, categoryFilter, statusFilter]);

  const fetchFAQs = async (url = null) => {
    setLoading(true);
    setError("");

    try {
      let data;

      if (url) {
        data = await faqService.getFAQsByUrl(url);

        try {
          const urlObj = new URL(url);
          const page = urlObj.searchParams.get("page");
          if (page) {
            setCurrentPage(parseInt(page, 10));
          }
        } catch (urlError) {}
      } else {
        const params = {
          page: currentPage,
          page_size: PAGE_SIZE,
        };

        if (search.trim()) {
          params.search = search.trim();
        }
        if (categoryFilter) {
          params.category = categoryFilter;
        }
        if (statusFilter) {
          params.status = statusFilter;
        }

        data = await faqService.getFAQs(params);
      }

      if (data && typeof data === "object" && "results" in data) {
        setFaqs(Array.isArray(data.results) ? data.results : []);
        setTotalCount(Number(data.count) || 0);
        setNextPage(data.next || null);
        setPrevPage(data.previous || null);
      } else {
        const faqList = Array.isArray(data) ? data : [];
        setFaqs(faqList);
        setTotalCount(faqList.length);
        setNextPage(null);
        setPrevPage(null);
      }
    } catch (err) {
      console.error("FAQ fetch error:", err);
      setFaqs([]);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to load FAQs."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH ALL FAQs FOR KPI
  // =========================================================

  useEffect(() => {
    fetchAllFAQs();
  }, []);

  const fetchAllFAQs = async () => {
    setStatsLoading(true);

    try {
      const data = await faqService.getFAQs({
        page_size: 1000,
      });

      const faqList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setAllFAQs(faqList);
    } catch (err) {
      console.error("Failed to fetch FAQs for KPI:", err);
      setAllFAQs([]);
    } finally {
      setStatsLoading(false);
    }
  };

  // =========================================================
  // REFRESH DATA
  // =========================================================

  const refreshFAQs = async () => {
    await fetchFAQs();
    await fetchAllFAQs();
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
  };

  // =========================================================
  // SEARCH / FILTER HANDLERS
  // =========================================================

  const handleSearchChange = (value) => {
    setSearch(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "" || statusFilter !== "";

  // =========================================================
  // KPI CALCULATIONS
  // =========================================================

  const totalFAQs = allFAQs.length;
  const activeCount = allFAQs.filter((faq) => faq.status === "active").length;
  const inactiveCount = allFAQs.filter(
    (faq) => faq.status === "inactive",
  ).length;
  const categoryCount = new Set(
    allFAQs.map((faq) => faq.category).filter(Boolean),
  ).size;

  // =========================================================
  // TOTAL PAGES
  // =========================================================

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= 0) {
      return pages;
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // =========================================================
  // MODAL HANDLERS
  // =========================================================

  const openCreateModal = () => {
    setEditingFAQ(null);
    setQuestion("");
    setAnswer("");
    setCategory("General");
    setFaqStatus("active");
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = async (faq) => {
    setEditingFAQ(faq);
    setFormError("");
    setSubmitting(false);

    try {
      const data = await faqService.getFAQ(faq.id);

      setQuestion(data?.question || "");
      setAnswer(data?.answer || "");
      setCategory(data?.category || "General");
      setFaqStatus(data?.status || "active");

      setShowFormModal(true);
    } catch (err) {
      console.error("Failed to load FAQ details:", err);
      setError("Failed to load FAQ details.");
    }
  };

  const closeFormModal = () => {
    if (submitting) {
      return;
    }
    setShowFormModal(false);
    setEditingFAQ(null);
    setFormError("");
  };

  // =========================================================
  // HANDLE FORM SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    if (!trimmedQuestion) {
      setFormError("Question is required.");
      return;
    }

    if (trimmedQuestion.length > 500) {
      setFormError("Question cannot be more than 500 characters.");
      return;
    }

    if (!trimmedAnswer) {
      setFormError("Answer is required.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        question: trimmedQuestion,
        answer: trimmedAnswer,
        category,
        status: faqStatus,
      };

      if (editingFAQ) {
        await faqService.updateFAQ(editingFAQ.id, payload);
      } else {
        await faqService.createFAQ(payload);
      }

      setShowFormModal(false);
      setEditingFAQ(null);
      await refreshFAQs();
    } catch (err) {
      console.error("Failed to save FAQ:", err);

      const responseData = err?.response?.data;
      let errorMessage = "Failed to save FAQ. Please try again.";

      if (typeof responseData?.error === "string") {
        errorMessage = responseData.error;
      } else if (Array.isArray(responseData?.error)) {
        errorMessage = responseData.error[0];
      } else if (responseData && typeof responseData === "object") {
        const firstKey = Object.keys(responseData)[0];
        if (firstKey) {
          const value = responseData[firstKey];
          if (Array.isArray(value)) {
            errorMessage = value[0];
          } else if (typeof value === "string") {
            errorMessage = value;
          }
        }
      }

      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE HANDLERS
  // =========================================================

  const openDeleteModal = (faq) => {
    setDeletingFAQ(faq);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (submitting) {
      return;
    }
    setShowDeleteModal(false);
    setDeletingFAQ(null);
  };

  const handleDelete = async () => {
    if (!deletingFAQ) {
      return;
    }

    setSubmitting(true);

    try {
      await faqService.deleteFAQ(deletingFAQ.id);

      setShowDeleteModal(false);
      setDeletingFAQ(null);

      if (faqs.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        await refreshFAQs();
      }
    } catch (err) {
      console.error("Failed to delete FAQ:", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to delete FAQ.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // TOGGLE STATUS
  // =========================================================

  const toggleStatus = async (faq) => {
    const newStatus = faq.status === "active" ? "inactive" : "active";

    try {
      await faqService.updateFAQ(faq.id, {
        status: newStatus,
      });

      await refreshFAQs();
    } catch (err) {
      console.error("Failed to update FAQ status:", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to update FAQ status.",
      );
    }
  };

  // =========================================================
  // UI HELPERS
  // =========================================================

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <Badge bg="success" pill className="px-3 py-2">
          <FaCheckCircle className="me-1" style={{ fontSize: "0.7rem" }} />
          Active
        </Badge>
      );
    }
    return (
      <Badge bg="secondary" pill className="px-3 py-2">
        <FaTimesCircle className="me-1" style={{ fontSize: "0.7rem" }} />
        Inactive
      </Badge>
    );
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      Hardware: "🖥️",
      Software: "💿",
      Network: "🌐",
      Account: "🔐",
      Security: "🛡️",
      Printer: "🖨️",
      General: "📋",
    };
    return icons[cat] || "📋";
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  // =========================================================
  // KPI CARD COMPONENT
  // =========================================================

  const KPICard = ({ icon, iconColor, bgColor, label, value }) => (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Body className="d-flex align-items-center p-4">
        <div
          className="rounded-4 d-flex align-items-center justify-content-center me-3"
          style={{
            width: "52px",
            height: "52px",
            backgroundColor: bgColor,
          }}
        >
          {icon}
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fw-bold fs-4 text-dark">
            {statsLoading ? <Spinner size="sm" animation="border" /> : value}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 fw-bold text-dark">FAQ Management</h4>
          <p className="text-muted mb-0">
            Create and manage knowledge base articles
          </p>
        </div>

        <Button
          variant="primary"
          className="rounded-pill px-4 d-flex align-items-center shadow-sm"
          onClick={openCreateModal}
        >
          <FaPlus className="me-2" />
          Add FAQ
        </Button>
      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Row className="g-3 mb-4">
        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={<FaBook style={{ fontSize: "1.4rem", color: "#4f46e5" }} />}
            bgColor="#e0e7ff"
            label="Total FAQs"
            value={totalFAQs}
          />
        </Col>

        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={
              <FaCheckCircle style={{ fontSize: "1.4rem", color: "#10b981" }} />
            }
            bgColor="#d1fae5"
            label="Active"
            value={activeCount}
          />
        </Col>

        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={
              <FaTimesCircle style={{ fontSize: "1.4rem", color: "#ef4444" }} />
            }
            bgColor="#fee2e2"
            label="Inactive"
            value={inactiveCount}
          />
        </Col>

        <Col xl={3} md={6} sm={6}>
          <KPICard
            icon={
              <FaLayerGroup style={{ fontSize: "1.4rem", color: "#f59e0b" }} />
            }
            bgColor="#fef3c7"
            label="Categories"
            value={categoryCount}
          />
        </Col>
      </Row>

      {/* =====================================================
          SEARCH & FILTER
      ===================================================== */}

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            {/* Search */}
            <Col md={5}>
              <Form.Label className="small fw-semibold text-muted mb-1">
                Search
              </Form.Label>

              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0 rounded-start-3">
                  <FaSearch size={14} className="text-muted" />
                </InputGroup.Text>

                <Form.Control
                  type="text"
                  placeholder="Search by question or answer..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="border-start-0 border-end-0 shadow-none"
                  style={{ paddingLeft: "0" }}
                />

                {search && (
                  <InputGroup.Text
                    className="bg-light border-start-0 rounded-end-3"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSearchChange("")}
                  >
                    <FiX size={14} className="text-danger" />
                  </InputGroup.Text>
                )}
              </InputGroup>
            </Col>

            {/* Category */}
            <Col md={3}>
              <Form.Label className="small fw-semibold text-muted mb-1">
                Category
              </Form.Label>

              <Form.Select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="shadow-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {cat}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Status */}
            <Col md={2}>
              <Form.Label className="small fw-semibold text-muted mb-1">
                Status
              </Form.Label>

              <Form.Select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="shadow-none"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>

            {/* Clear / Count */}
            <Col md={2} className="d-flex justify-content-md-end">
              {hasActiveFilters ? (
                <Button
                  variant="light"
                  className="border rounded-pill px-4 w-100 d-flex align-items-center justify-content-center"
                  onClick={clearFilters}
                >
                  <FiX className="me-1" /> Clear
                </Button>
              ) : (
                <div className="text-muted small pt-2">
                  <strong className="text-dark">{faqs.length}</strong> of{" "}
                  <strong className="text-dark">{totalCount}</strong>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="mb-4 rounded-4 border-0"
        >
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
      )}

      {/* =====================================================
          FAQ TABLE
      ===================================================== */}

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted mb-0">Loading FAQs...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaBook style={{ fontSize: "3rem", color: "#dee2e6" }} />
              <h5 className="mt-3 fw-bold text-dark">No FAQs Found</h5>
              <p className="mb-3">
                {hasActiveFilters
                  ? "Try adjusting your filters."
                  : 'Click "Add FAQ" to create one.'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="rounded-pill px-4"
                  onClick={clearFilters}
                >
                  <FiX className="me-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ paddingLeft: "24px", minWidth: "300px" }}>
                        Question
                      </th>
                      <th style={{ width: "130px" }}>Category</th>
                      <th style={{ width: "110px" }}>Status</th>
                      <th style={{ width: "140px" }}>Created By</th>
                      <th style={{ width: "110px" }}>Updated</th>
                      <th
                        className="pe-4 text-center"
                        style={{ width: "200px" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {faqs.map((faq) => (
                      <tr key={faq.id}>
                        {/* Question */}
                        <td
                          className="ps-3 fw-medium text-dark"
                          style={{
                            paddingLeft: "24px",
                            maxWidth: "300px",
                          }}
                        >
                          <div
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: "1.5",
                            }}
                          >
                            {faq.question}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <Badge
                            bg="light"
                            text="dark"
                            pill
                            className="border px-3 py-2"
                          >
                            <span className="me-1">
                              {getCategoryIcon(faq.category)}
                            </span>
                            {faq.category}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td>{getStatusBadge(faq.status)}</td>

                        {/* Created By */}
                        <td className="text-muted small">
                          {faq.created_by_name || "—"}
                        </td>

                        {/* Updated */}
                        <td className="text-muted small">
                          {formatDate(faq.updated_at)}
                        </td>

                        {/* Actions */}
                        <td
                          className="pe-4"
                          style={{ paddingRight: "24px" }}
                        >
                          <div className="d-flex justify-content-center gap-1">
                            {/* View */}
                            <Button
                              size="sm"
                              variant="light"
                              className="border"
                              style={{ width: "34px", height: "34px" }}
                              title="View FAQ"
                              onClick={async () => {
                                setViewingFAQ(null);
                                setShowViewModal(true);
                                try {
                                  const fullData = await faqService.getFAQ(
                                    faq.id,
                                  );
                                  setViewingFAQ(fullData);
                                } catch (err) {
                                  console.error(
                                    "Failed to load FAQ details:",
                                    err,
                                  );
                                }
                              }}
                            >
                              <FaEye
                                style={{ color: "#3b82f6", fontSize: "0.8rem" }}
                              />
                            </Button>

                            {/* Edit */}
                            <Button
                              size="sm"
                              variant="light"
                              className="border"
                              style={{ width: "34px", height: "34px" }}
                              title="Edit FAQ"
                              onClick={() => openEditModal(faq)}
                            >
                              <FaEdit
                                style={{ color: "#64748b", fontSize: "0.8rem" }}
                              />
                            </Button>

                            {/* Toggle */}
                            <Button
                              size="sm"
                              variant="light"
                              className="border"
                              style={{ width: "34px", height: "34px" }}
                              title={
                                faq.status === "active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              onClick={() => toggleStatus(faq)}
                            >
                              {faq.status === "active" ? (
                                <FaEyeSlash
                                  style={{
                                    color: "#f59e0b",
                                    fontSize: "0.8rem",
                                  }}
                                />
                              ) : (
                                <FaCheckCircle
                                  style={{
                                    color: "#10b981",
                                    fontSize: "0.8rem",
                                  }}
                                />
                              )}
                            </Button>

                            {/* Delete */}
                            <Button
                              size="sm"
                              variant="light"
                              className="border"
                              style={{ width: "34px", height: "34px" }}
                              title="Delete FAQ"
                              onClick={() => openDeleteModal(faq)}
                            >
                              <FaTrash
                                style={{ color: "#ef4444", fontSize: "0.8rem" }}
                              />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* =================================================
                  PAGINATION
              ================================================= */}

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-4 border-top flex-wrap gap-3">
                  {/* Range */}
                  <div className="text-muted small">
                    Showing <strong className="text-dark">{startItem}</strong> to{" "}
                    <strong className="text-dark">{endItem}</strong> of{" "}
                    <strong className="text-dark">{totalCount}</strong> FAQs
                  </div>

                  {/* Pagination */}
                  <Pagination className="mb-0">
                    <Pagination.First
                      disabled={currentPage === 1}
                      onClick={() => goToPage(1)}
                    />

                    <Pagination.Prev
                      disabled={!prevPage}
                      onClick={() => {
                        if (prevPage) {
                          fetchFAQs(prevPage);
                        }
                      }}
                    />

                    {pageNumbers.map((page) => (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}

                    {pageNumbers.length > 0 &&
                      pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <Pagination.Ellipsis disabled />
                      )}

                    <Pagination.Next
                      disabled={!nextPage}
                      onClick={() => {
                        if (nextPage) {
                          fetchFAQs(nextPage);
                        }
                      }}
                    />

                    <Pagination.Last
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(totalPages)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      <Modal show={showFormModal} onHide={closeFormModal} centered size="lg">
        <Modal.Header
          closeButton={!submitting}
          className="border-bottom-0 pt-4 px-4"
        >
          <Modal.Title className="fw-bold text-dark">
            {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4">
          {formError && (
            <Alert
              variant="danger"
              onClose={() => setFormError("")}
              dismissible
              className="mb-3 rounded-3 border-0"
            >
              {formError}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Question */}
            <Form.Group className="mb-4">
              <Form.Label className="small fw-semibold text-dark">
                Question <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter FAQ question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={submitting}
                maxLength={500}
                className="shadow-none"
                style={{ borderRadius: "12px", resize: "none" }}
              />
              <div className="d-flex justify-content-end">
                <Form.Text className="text-muted mt-1">
                  {question.length}/500 characters
                </Form.Text>
              </div>
            </Form.Group>

            {/* Answer */}
            <Form.Group className="mb-4">
              <Form.Label className="small fw-semibold text-dark">
                Answer <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Enter FAQ answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
                className="shadow-none"
                style={{ borderRadius: "12px", resize: "none" }}
              />
            </Form.Group>

            {/* Category & Status */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">
                    Category
                  </Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting}
                    className="shadow-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryIcon(cat)} {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">
                    Status
                  </Form.Label>
                  <Form.Select
                    value={faqStatus}
                    onChange={(e) => setFaqStatus(e.target.value)}
                    disabled={submitting}
                    className="shadow-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-top-0 px-4 pb-4">
          <Button
            variant="light"
            className="border rounded-pill px-4"
            onClick={closeFormModal}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            className="rounded-pill px-4"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Saving...
              </>
            ) : editingFAQ ? (
              "Update FAQ"
            ) : (
              "Create FAQ"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      <Modal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false);
          setViewingFAQ(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          className="border-bottom-0 pt-4 px-4"
        >
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <FaBook className="text-primary" />
            FAQ Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 pb-4">
          {!viewingFAQ ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted mb-0">Loading FAQ details...</p>
            </div>
          ) : (
            <>
              {/* Category + Status */}
              <div className="mb-4 d-flex align-items-center gap-2 flex-wrap">
                <Badge
                  bg="light"
                  text="dark"
                  pill
                  className="border px-3 py-2"
                >
                  <span className="me-1" style={{ fontSize: "1rem" }}>
                    {getCategoryIcon(viewingFAQ.category)}
                  </span>
                  {viewingFAQ.category}
                </Badge>
                {getStatusBadge(viewingFAQ.status)}
              </div>

              {/* Question */}
              <h5 className="fw-bold mb-3 text-dark">
                {viewingFAQ.question}
              </h5>

              {/* Answer */}
              <div
                className="p-4 rounded-4 border bg-light"
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.8",
                  fontSize: "0.95rem",
                  color: "#475569",
                }}
              >
                {viewingFAQ.answer || "No answer available yet."}
              </div>

              {/* Meta */}
              <div className="d-flex gap-4 mt-4 pt-3 border-top text-muted small flex-wrap">
                <span>
                  Created by:{" "}
                  <strong className="text-dark">
                    {viewingFAQ.created_by_name || "—"}
                  </strong>
                </span>
                <span>
                  Updated:{" "}
                  <strong className="text-dark">
                    {formatDate(viewingFAQ.updated_at)}
                  </strong>
                </span>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
        <Modal.Body className="p-4 text-center">
          {/* Warning Icon */}
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#ef4444",
              fontSize: "1.8rem",
            }}
          >
            <FaExclamationTriangle />
          </div>

          <h5 className="fw-bold text-dark mb-2">Delete FAQ?</h5>

          <p className="text-muted mb-3">
            Are you sure you want to delete this FAQ? This action cannot be
            undone.
          </p>

          <div className="p-3 bg-light rounded-4 border text-start mb-4">
            <div
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              {deletingFAQ?.question}
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="light"
              className="border rounded-pill px-4"
              onClick={closeDeleteModal}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              className="rounded-pill px-4"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Deleting...
                </>
              ) : (
                <>
                  <FaTrash className="me-1" />
                  Delete FAQ
                </>
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default FAQManagement;