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
  Container,
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

      // -----------------------------------------------------
      // Fetch using pagination URL
      // -----------------------------------------------------

      if (url) {
        data = await faqService.getFAQsByUrl(url);

        // Try to keep current page in sync with backend URL
        try {
          const urlObj = new URL(url);

          const page = urlObj.searchParams.get("page");

          if (page) {
            setCurrentPage(parseInt(page, 10));
          }
        } catch (urlError) {
          // Ignore invalid URL parsing errors
        }
      } else {
        // ---------------------------------------------------
        // Fetch using filters
        // ---------------------------------------------------

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

      // -----------------------------------------------------
      // DRF paginated response
      // -----------------------------------------------------

      if (data && typeof data === "object" && "results" in data) {
        setFaqs(Array.isArray(data.results) ? data.results : []);

        setTotalCount(Number(data.count) || 0);

        setNextPage(data.next || null);

        setPrevPage(data.previous || null);
      } else {
        // ---------------------------------------------------
        // Non-paginated response
        // ---------------------------------------------------

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
          "Failed to load FAQs.",
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
  // SEARCH
  // =========================================================

  const handleSearchChange = (value) => {
    setSearch(value);

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // =========================================================
  // CATEGORY FILTER
  // =========================================================

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // =========================================================
  // STATUS FILTER
  // =========================================================

  const handleStatusChange = (value) => {
    setStatusFilter(value);

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // =========================================================
  // ACTIVE FILTER CHECK
  // =========================================================

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
  // OPEN CREATE MODAL
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

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

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

  // =========================================================
  // CLOSE FORM MODAL
  // =========================================================

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

    // -------------------------------------------------------
    // Validation
    // -------------------------------------------------------

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

      // -----------------------------------------------------
      // Update
      // -----------------------------------------------------

      if (editingFAQ) {
        await faqService.updateFAQ(editingFAQ.id, payload);
      }

      // -----------------------------------------------------
      // Create
      // -----------------------------------------------------
      else {
        await faqService.createFAQ(payload);
      }

      // -----------------------------------------------------
      // Close modal
      // -----------------------------------------------------

      setShowFormModal(false);

      setEditingFAQ(null);

      // -----------------------------------------------------
      // Refresh table + KPI
      // -----------------------------------------------------

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
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal = (faq) => {
    setDeletingFAQ(faq);

    setShowDeleteModal(true);
  };

  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const closeDeleteModal = () => {
    if (submitting) {
      return;
    }

    setShowDeleteModal(false);

    setDeletingFAQ(null);
  };

  // =========================================================
  // DELETE FAQ
  // =========================================================

  const handleDelete = async () => {
    if (!deletingFAQ) {
      return;
    }

    setSubmitting(true);

    try {
      await faqService.deleteFAQ(deletingFAQ.id);

      setShowDeleteModal(false);

      setDeletingFAQ(null);

      // -----------------------------------------------------
      // If deleting last item on current page,
      // move to previous page
      // -----------------------------------------------------

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
  // STATUS BADGE
  // =========================================================

  const getStatusBadge = (status) => {
    if (status === "active") {
      return <Badge bg="success">Active</Badge>;
    }

    return <Badge bg="secondary">Inactive</Badge>;
  };

  // =========================================================
  // CATEGORY ICON
  // =========================================================

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

  // =========================================================
  // FORMAT DATE
  // =========================================================

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

  // =========================================================
  // TABLE RANGE
  // =========================================================

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Container fluid className="py-4">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold">FAQ Management</h3>

          <p className="text-muted mb-0">
            Create and manage knowledge base articles
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          <FaPlus className="me-2" />
          Add FAQ
        </Button>
      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Row className="g-3 mb-4">
        {/* Total */}
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#e0e7ff",
                }}
              >
                <FaBook
                  style={{
                    fontSize: "1.3rem",
                    color: "#4f46e5",
                  }}
                />
              </div>

              <div>
                <div className="text-muted small">Total FAQs</div>

                <div className="fw-bold fs-4">
                  {statsLoading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    totalFAQs
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Active */}
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#d1fae5",
                }}
              >
                <FaCheckCircle
                  style={{
                    fontSize: "1.3rem",
                    color: "#10b981",
                  }}
                />
              </div>

              <div>
                <div className="text-muted small">Active</div>

                <div className="fw-bold fs-4">
                  {statsLoading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    activeCount
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Inactive */}
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#fee2e2",
                }}
              >
                <FaTimesCircle
                  style={{
                    fontSize: "1.3rem",
                    color: "#ef4444",
                  }}
                />
              </div>

              <div>
                <div className="text-muted small">Inactive</div>

                <div className="fw-bold fs-4">
                  {statsLoading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    inactiveCount
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Categories */}
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#fef3c7",
                }}
              >
                <FaBook
                  style={{
                    fontSize: "1.3rem",
                    color: "#f59e0b",
                  }}
                />
              </div>

              <div>
                <div className="text-muted small">Categories</div>

                <div className="fw-bold fs-4">
                  {statsLoading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    categoryCount
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* =====================================================
          SEARCH & FILTER
      ===================================================== */}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            {/* Search */}
            <Col md={5}>
              <Form.Label className="small fw-semibold">Search</Form.Label>

              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>

                <Form.Control
                  type="text"
                  placeholder="Search by question or answer..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="border-start-0"
                />

                {search && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleSearchChange("")}
                  >
                    <FiX />
                  </Button>
                )}
              </InputGroup>
            </Col>

            {/* Category */}
            <Col md={3}>
              <Form.Label className="small fw-semibold">Category</Form.Label>

              <Form.Select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
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
              <Form.Label className="small fw-semibold">Status</Form.Label>

              <Form.Select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="">All</option>

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>

            {/* Clear / Count */}
            <Col md={2}>
              {hasActiveFilters ? (
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={clearFilters}
                >
                  <FiX className="me-1" />
                  Clear
                </Button>
              ) : (
                <div className="text-muted small pt-3">
                  <strong>{faqs.length}</strong> of{" "}
                  <strong>{totalCount}</strong>
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
          className="mb-4"
        >
          <FiAlertCircle className="me-2" />
          {error}
        </Alert>
      )}

      {/* =====================================================
          FAQ TABLE
      ===================================================== */}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            // Loading
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />

              <p className="mt-2 text-muted mb-0">Loading FAQs...</p>
            </div>
          ) : faqs.length === 0 ? (
            // Empty
            <div className="text-center py-5">
              <FaBook
                style={{
                  fontSize: "3rem",
                  color: "#d1d5db",
                }}
              />

              <h5 className="mt-3 text-muted">No FAQs Found</h5>

              <p className="text-muted">
                {hasActiveFilters
                  ? "Try adjusting your filters."
                  : 'Click "Add FAQ" to create one.'}
              </p>

              {hasActiveFilters && (
                <Button
                  variant="outline-primary"
                  size="sm"
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
                      <th className="ps-3">Question</th>

                      <th>Category</th>

                      <th>Status</th>

                      <th>Created By</th>

                      <th>Updated</th>

                      <th className="pe-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {faqs.map((faq) => (
                      <tr key={faq.id}>
                        {/* Question */}
                        <td
                          className="ps-3"
                          style={{
                            maxWidth: "300px",
                          }}
                        >
                          <div
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: "1.4",
                            }}
                          >
                            {faq.question}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="me-1">
                            {getCategoryIcon(faq.category)}
                          </span>

                          {faq.category}
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
                        <td className="pe-3">
                          <div className="d-flex justify-content-center gap-1">
                            {/* View */}
                            <Button
                              size="sm"
                              variant="outline-primary"
                              title="View FAQ"
                              onClick={async () => {
                                setViewingFAQ(null); // Clear first
                                setShowViewModal(true); // Show modal
                                try {
                                  const fullData = await faqService.getFAQ(
                                    faq.id,
                                  ); // Fetches with answer
                                  setViewingFAQ(fullData);
                                } catch (err) {
                                  console.error(
                                    "Failed to load FAQ details:",
                                    err,
                                  );
                                }
                              }}
                            >
                              <FaEye />
                            </Button>

                            {/* Edit */}
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              title="Edit FAQ"
                              onClick={() => openEditModal(faq)}
                            >
                              <FaEdit />
                            </Button>

                            {/* Toggle */}
                            <Button
                              size="sm"
                              variant={
                                faq.status === "active"
                                  ? "outline-warning"
                                  : "outline-success"
                              }
                              title={
                                faq.status === "active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              onClick={() => toggleStatus(faq)}
                            >
                              {faq.status === "active" ? (
                                <FaEyeSlash />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </Button>

                            {/* Delete */}
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Delete FAQ"
                              onClick={() => openDeleteModal(faq)}
                            >
                              <FaTrash />
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
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 px-3 pb-3 border-top flex-wrap gap-3">
                  {/* Range */}
                  <div className="text-muted small">
                    Showing <strong>{startItem}</strong> to{" "}
                    <strong>{endItem}</strong> of <strong>{totalCount}</strong>{" "}
                    FAQs
                  </div>

                  {/* Pagination */}
                  <Pagination className="mb-0">
                    {/* First */}
                    <Pagination.First
                      disabled={currentPage === 1}
                      onClick={() => goToPage(1)}
                    />

                    {/* Previous */}
                    <Pagination.Prev
                      disabled={!prevPage}
                      onClick={() => {
                        if (prevPage) {
                          fetchFAQs(prevPage);
                        }
                      }}
                    />

                    {/* Page numbers */}
                    {pageNumbers.map((page) => (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}

                    {/* Ellipsis */}
                    {pageNumbers.length > 0 &&
                      pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <Pagination.Ellipsis disabled />
                      )}

                    {/* Next */}
                    <Pagination.Next
                      disabled={!nextPage}
                      onClick={() => {
                        if (nextPage) {
                          fetchFAQs(nextPage);
                        }
                      }}
                    />

                    {/* Last */}
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

      <Modal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false);
          setViewingFAQ(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title>FAQ Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!viewingFAQ ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted mb-0">Loading FAQ details...</p>
            </div>
          ) : (
            <>
              {/* Category + Status */}
              <div className="mb-3">
                <span className="me-1" style={{ fontSize: "1.2rem" }}>
                  {getCategoryIcon(viewingFAQ.category)}
                </span>
                <Badge bg="secondary">{viewingFAQ.category}</Badge>
                <span className="ms-2">
                  {getStatusBadge(viewingFAQ.status)}
                </span>
              </div>

              {/* Question */}
              <h5 className="fw-bold mb-3">{viewingFAQ.question}</h5>

              {/* Answer */}
              <div
                className="p-3 rounded-3 border bg-light"
                style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}
              >
                {viewingFAQ.answer || "No answer available yet."}
              </div>

              {/* Meta */}
              <div className="d-flex gap-4 mt-3 text-muted small flex-wrap">
                <span>
                  Created by:{" "}
                  <strong>{viewingFAQ.created_by_name || "—"}</strong>
                </span>
                <span>
                  Updated: <strong>{formatDate(viewingFAQ.updated_at)}</strong>
                </span>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title>FAQ Details</Modal.Title>
        </Modal.Header>

        {viewingFAQ && (
          <Modal.Body>
            {/* Category + Status */}
            <div className="mb-3">
              <span
                className="me-1"
                style={{
                  fontSize: "1.2rem",
                }}
              >
                {getCategoryIcon(viewingFAQ.category)}
              </span>

              <Badge bg="secondary">{viewingFAQ.category}</Badge>

              <span className="ms-2">{getStatusBadge(viewingFAQ.status)}</span>
            </div>

            {/* Question */}
            <h5 className="fw-bold mb-3">{viewingFAQ.question}</h5>

            {/* Answer */}
            <div
              className="p-3 rounded-3 border bg-light"
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.7",
              }}
            >
              {viewingFAQ.answer || "No answer available yet."}
            </div>

            {/* Meta */}
            <div className="d-flex gap-4 mt-3 text-muted small flex-wrap">
              <span>
                Created by: <strong>{viewingFAQ.created_by_name || "—"}</strong>
              </span>

              <span>
                Updated: <strong>{formatDate(viewingFAQ.updated_at)}</strong>
              </span>
            </div>
          </Modal.Body>
        )}
      </Modal>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
        <Modal.Header
          closeButton={!submitting}
          className="bg-light border-bottom"
        >
          <Modal.Title>Delete FAQ</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>Are you sure you want to delete this FAQ?</p>

          <div className="p-2 bg-light rounded-3">
            <strong>{deletingFAQ?.question}</strong>
          </div>

          <p className="text-muted small mt-2 mb-0">
            This action cannot be undone.
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={closeDeleteModal}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              "Delete FAQ"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FAQManagement;
