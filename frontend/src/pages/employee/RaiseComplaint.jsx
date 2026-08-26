import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Badge,
} from "react-bootstrap";

import { useNavigate } from "react-router-dom";

import {
  FaTicketAlt,
  FaTag,
  FaHeading,
  FaAlignLeft,
  FaFlag,
  FaImage,
  FaPaperPlane,
  FaExclamationTriangle,
  FaMagic,
  FaRobot,
  FaTimes,
  FaCheck,
  FaBook,
  FaLightbulb,
  FaChevronRight,
  FaCloudUploadAlt,
  FaTimesCircle,
} from "react-icons/fa";

import { createTicket } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";
import aiService from "../../services/aiService";

const RaiseComplaint = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    priority: "medium",
    screenshot: null,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");

  /* ── Fetch ALL Categories (pagination loop) ── */
  useEffect(() => {
    const loadAllCategories = async () => {
      setCategoryLoading(true);
      try {
        let allCategories = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const response = await getCategories({ page, page_size: 100 });
          const data = response?.data;

          if (data && Array.isArray(data.results)) {
            allCategories = [...allCategories, ...data.results];
            hasNextPage = data.next ? true : false;
            if (data.next) page += 1;
          } else if (Array.isArray(data)) {
            allCategories = data;
            hasNextPage = false;
          } else {
            hasNextPage = false;
          }
        }

        const uniqueCategories = Array.from(
          new Map(allCategories.map((c) => [c.id, c])).values(),
        );
        uniqueCategories.sort((a, b) => Number(a.id) - Number(b.id));
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories([]);
      } finally {
        setCategoryLoading(false);
      }
    };

    loadAllCategories();
  }, []);

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files[0]) {
      setFileName(files[0].name);
    } else if (name === "screenshot") {
      setFileName("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    if (name === "category" || name === "priority") {
      setAiResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setFormData((prev) => ({ ...prev, screenshot: file }));
    }
  };

  const removeFile = () => {
    setFileName("");
    setFormData((prev) => ({ ...prev, screenshot: null }));
  };

  /* ── AI Analyze ── */
  const handleAnalyze = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setAiError("Please enter both title and description before analyzing.");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const response = await aiService.analyzeComplaint({
        title: formData.title,
        description: formData.description,
      });

      if (response.success && response.data) {
        setAiResult(response.data);
      } else {
        setAiError(
          response.error || "AI analysis failed. Please select manually.",
        );
      }
    } catch (err) {
      if (err.response?.data?.error) {
        const errorMessage = err.response.data.error;
        setAiError(
          typeof errorMessage === "string"
            ? errorMessage
            : "AI analysis failed.",
        );
      } else if (!err.response) {
        setAiError("Network error. Please check your connection.");
      } else {
        setAiError(
          "AI assistance is currently unavailable. You can continue using the system normally.",
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!aiResult) return;

    setFormData((prev) => ({
      ...prev,
      category: aiResult.suggested_category_id || prev.category,
      priority: aiResult.suggested_priority || "medium",
    }));

    setAiResult(null);
    setAiError("");
  };

  const handleDismissAi = () => {
    setAiResult(null);
    setAiError("");
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.category) {
      setError("Please select an issue category.");
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("category", formData.category);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("priority", formData.priority);

    if (formData.screenshot) {
      data.append("screenshot", formData.screenshot);
    }

    try {
      await createTicket(data);
      navigate("/employee/tickets");
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to raise complaint.";

      setError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    } finally {
      setLoading(false);
    }
  };

  /* ── Priority Options (Visual Selector) ── */
  const priorityOptions = [
    {
      value: "low",
      label: "Low",
      color: "#22c55e",
      bg: "#f0fdf4",
      desc: "Minor issue, no urgency",
      sla: "48h SLA",
    },
    {
      value: "medium",
      label: "Medium",
      color: "#3b82f6",
      bg: "#eff6ff",
      desc: "Normal priority",
      sla: "24h SLA",
    },
    {
      value: "high",
      label: "High",
      color: "#f59e0b",
      bg: "#fffbeb",
      desc: "Urgent, affects work",
      sla: "8h SLA",
    },
    {
      value: "critical",
      label: "Critical",
      color: "#dc2626",
      bg: "#fef2f2",
      desc: "System down, immediate",
      sla: "4h SLA",
    },
  ];

  const getPriorityColor = (priority) => {
    const found = priorityOptions.find((option) => option.value === priority);
    return found ? found.color : "#6b7280";
  };

  const handlePrioritySelect = (value) => {
    setFormData((prev) => ({ ...prev, priority: value }));
    setAiResult(null);
  };

  const tips = [
    'Be specific in the title — avoid "Help needed"',
    "Include error messages or codes if any",
    "Mention when the issue started",
    "List steps you've already tried",
    "Attach screenshots if possible",
  ];

  const selectedPriority = priorityOptions.find(
    (p) => p.value === formData.priority,
  );

  return (
    <div
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
      className="py-4 px-3 px-md-4"
    >
      {/* ════════════ HEADER ════════════ */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-4 shadow-sm flex-shrink-0"
          style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          }}
        >
          <FaTicketAlt style={{ fontSize: "1.4rem", color: "white" }} />
        </div>
        <div>
          <h4 className="mb-1 fw-bold text-dark">Raise Complaint</h4>
          <p className="text-muted mb-0">Submit a new IT support request</p>
        </div>
      </div>

      {/* ════════════ ERROR ════════════ */}
      {error && (
        <Alert
          variant="danger"
          className="mb-4 rounded-4 border-0 d-flex align-items-center"
          dismissible
          onClose={() => setError("")}
        >
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          {error}
        </Alert>
      )}

      <Row className="g-4">
        {/* ════════════ MAIN FORM ════════════ */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit} noValidate>
                {/* ── TITLE ── */}
                <Form.Group className="mb-4">
                  <Form.Label
                    className="fw-semibold text-dark mb-1"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <FaHeading
                      className="me-1 text-muted"
                      style={{ fontSize: "0.75rem" }}
                    />
                    Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of the issue"
                    required
                    maxLength={200}
                    className="shadow-none py-2"
                    style={{ borderRadius: "12px", fontSize: "0.92rem" }}
                  />
                  <div className="d-flex justify-content-end">
                    <Form.Text
                      className="text-muted mt-1"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {formData.title.length}/200
                    </Form.Text>
                  </div>
                </Form.Group>

                {/* ── DESCRIPTION ── */}
                <Form.Group className="mb-4">
                  <Form.Label
                    className="fw-semibold text-dark mb-1"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <FaAlignLeft
                      className="me-1 text-muted"
                      style={{ fontSize: "0.75rem" }}
                    />
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Explain the issue in detail — what happened, when it started, any error messages, steps you've already tried..."
                    required
                    className="shadow-none"
                    style={{
                      borderRadius: "12px",
                      fontSize: "0.92rem",
                      resize: "vertical",
                    }}
                  />
                </Form.Group>

                {/* ── AI ANALYZE BAR ── */}
                <div
                  className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 rounded-4 mb-3"
                  style={{
                    backgroundColor: "#f5f3ff",
                    border: "1px dashed #c4b5fd",
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "34px",
                        height: "34px",
                        backgroundColor: "#2563eb",
                      }}
                    >
                      <FaMagic style={{ fontSize: "0.8rem", color: "white" }} />
                    </div>
                    <div>
                      <div
                        className="fw-semibold text-dark"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Smart AI Assistant
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.72rem" }}
                      >
                        Auto-detects the right category & priority
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="rounded-pill px-4 border-0 shadow-sm"
                    style={{
                      backgroundColor: "#2563eb",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                    onClick={handleAnalyze}
                    disabled={aiLoading || loading}
                  >
                    {aiLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FaMagic className="me-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </div>
                {/* ── AI ERROR ── */}
                {aiError && (
                  <Alert
                    className="py-2 px-3 mb-3 rounded-4 border-0 d-flex align-items-start"
                    dismissible
                    onClose={() => setAiError("")}
                    style={{
                      backgroundColor: "#FFF7ED",
                      color: "#9A3412",
                      border: "1px solid #FED7AA",
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 me-2"
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#FFEDD5",
                      }}
                    >
                      <FaRobot
                        style={{
                          fontSize: "0.75rem",
                          color: "#EA580C",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                      <strong>AI Unavailable</strong>
                      <span className="ms-1">{aiError}</span>
                    </div>
                  </Alert>
                )}

                {/* ── AI RESULT ── */}
                {aiResult && (
                  <div
                    className="rounded-4 overflow-hidden mb-4"
                    style={{
                      border: "1px solid #DDD6FE",
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.06)",
                    }}
                  >
                    {/* ── AI HEADER ── */}
                    <div
                      className="d-flex align-items-center justify-content-between px-3 py-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%)",
                        borderBottom: "1px solid #E9E5FF",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {/* AI Icon */}
                        <div
                          className="d-flex align-items-center justify-content-center rounded-3"
                          style={{
                            width: "32px",
                            height: "32px",
                            background:
                              "linear-gradient(135deg, #4F46E5, #7C3AED)",
                            color: "#FFFFFF",
                            boxShadow: "0 3px 8px rgba(79, 70, 229, 0.2)",
                          }}
                        >
                          <FaMagic style={{ fontSize: "0.8rem" }} />
                        </div>

                        <div>
                          <div
                            className="fw-bold text-dark"
                            style={{
                              fontSize: "0.86rem",
                              lineHeight: 1.2,
                            }}
                          >
                            AI Suggestion
                          </div>

                          <div
                            className="text-muted"
                            style={{
                              fontSize: "0.68rem",
                              marginTop: "2px",
                            }}
                          >
                            Smart analysis based on your ticket
                          </div>
                        </div>
                      </div>

                      {/* Close */}
                      <Button
                        variant="light"
                        className="border-0 rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "28px",
                          height: "28px",
                          backgroundColor: "#FFFFFF",
                          color: "#64748B",
                        }}
                        onClick={handleDismissAi}
                        title="Dismiss AI suggestion"
                      >
                        <FaTimes size={10} />
                      </Button>
                    </div>

                    {/* ── AI CONTENT ── */}
                    <div className="p-3">
                      {/* Category + Priority */}
                      <Row className="g-3 mb-3">
                        {/* Category */}
                        <Col xs={12} sm={6}>
                          <div
                            className="rounded-3 p-3 h-100"
                            style={{
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <div
                              className="text-muted mb-2"
                              style={{
                                fontSize: "0.67rem",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                              }}
                            >
                              SUGGESTED CATEGORY
                            </div>

                            {aiResult.suggested_category ? (
                              <Badge
                                pill
                                className="px-3 py-2"
                                style={{
                                  backgroundColor: "#EDE9FE",
                                  color: "#E2E8F0",
                                  fontSize: "0.76rem",
                                  fontWeight: 600,
                                }}
                              >
                                {aiResult.suggested_category}
                              </Badge>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </div>
                        </Col>

                        {/* Priority */}
                        <Col xs={12} sm={6}>
                          <div
                            className="rounded-3 p-3 h-100"
                            style={{
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <div
                              className="text-muted mb-2"
                              style={{
                                fontSize: "0.67rem",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                              }}
                            >
                              SUGGESTED PRIORITY
                            </div>

                            {aiResult.suggested_priority ? (
                              <Badge
                                pill
                                className="px-3 py-2"
                                style={{
                                  backgroundColor:
                                    getPriorityColor(
                                      aiResult.suggested_priority,
                                    ) + "18",
                                  color: getPriorityColor(
                                    aiResult.suggested_priority,
                                  ),
                                  fontSize: "0.76rem",
                                  fontWeight: 700,
                                }}
                              >
                                {aiResult.suggested_priority
                                  .charAt(0)
                                  .toUpperCase() +
                                  aiResult.suggested_priority.slice(1)}
                              </Badge>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </div>
                        </Col>
                      </Row>

                      {/* ── AI REASON ── */}
                      {aiResult.reason && (
                        <div
                          className="rounded-3 p-3 mb-3"
                          style={{
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          <div
                            className="d-flex align-items-center gap-2 mb-1"
                            style={{
                              color: "#475569",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            <FaMagic
                              style={{
                                fontSize: "0.68rem",
                                color: "#6366F1",
                              }}
                            />
                            AI Reasoning
                          </div>

                          <div
                            className="text-muted"
                            style={{
                              fontSize: "0.78rem",
                              lineHeight: 1.55,
                            }}
                          >
                            {aiResult.reason}
                          </div>
                        </div>
                      )}

                      {/* ── RELATED ARTICLES ── */}
                      {aiResult.related_faqs &&
                        aiResult.related_faqs.length > 0 && (
                          <div className="mb-3">
                            <div
                              className="d-flex align-items-center gap-2 mb-2"
                              style={{
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                color: "#1E293B",
                              }}
                            >
                              <div
                                className="d-flex align-items-center justify-content-center rounded-2"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  backgroundColor: "#EFF6FF",
                                }}
                              >
                                <FaBook
                                  style={{
                                    fontSize: "0.65rem",
                                    color: "#2563EB",
                                  }}
                                />
                              </div>
                              Related Articles
                            </div>

                            <div className="d-flex flex-column gap-1">
                              {aiResult.related_faqs.map((faq, index) => (
                                <div
                                  key={faq.id || index}
                                  className="d-flex align-items-center gap-2 rounded-3 px-2 py-2"
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "#2563EB",
                                    backgroundColor: "#F8FAFC",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  onClick={() => navigate("/employee/faqs")}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#EFF6FF";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#F8FAFC";
                                  }}
                                >
                                  <FaChevronRight
                                    style={{
                                      fontSize: "0.55rem",
                                      flexShrink: 0,
                                    }}
                                  />

                                  <span>{faq.question}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* ── ACTIONS ── */}
                      <div
                        className="d-flex align-items-center flex-wrap gap-2 pt-3"
                        style={{
                          borderTop: "1px solid #F1F5F9",
                        }}
                      >
                        {/* Accept */}
                        <Button
                          size="sm"
                          className="rounded-pill px-4 border-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #4F46E5,#2563EB)",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            boxShadow: "0 3px 8px rgba(79, 70, 229, 0.18)",
                          }}
                          onClick={handleAcceptSuggestion}
                        >
                          <FaCheck className="me-1" />
                          Accept Suggestion
                        </Button>

                        {/* Dismiss */}
                        <Button
                          size="sm"
                          variant="light"
                          className="border rounded-pill px-3"
                          style={{
                            fontSize: "0.76rem",
                            fontWeight: 500,
                            color: "#475569",
                            borderColor: "#E2E8F0",
                          }}
                          onClick={handleDismissAi}
                        >
                          Dismiss
                        </Button>

                        {/* Verification text */}
                        <div
                          className="d-flex align-items-center gap-1 ms-auto"
                          style={{
                            fontSize: "0.67rem",
                            color: "#94A3B8",
                          }}
                        >
                          <FaCheck
                            style={{
                              fontSize: "0.55rem",
                              color: "#94A3B8",
                            }}
                          />
                          Verify before submitting
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CATEGORY ── */}
                <Form.Group className="mb-4">
                  <Form.Label
                    className="fw-semibold text-dark mb-1"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <FaTag
                      className="me-1 text-muted"
                      style={{ fontSize: "0.75rem" }}
                    />
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={categoryLoading}
                    className="shadow-none py-2"
                    style={{ borderRadius: "12px", fontSize: "0.92rem" }}
                  >
                    <option value="">
                      {categoryLoading
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* ── PRIORITY (Visual Selector!) ── */}
                <Form.Group className="mb-4">
                  <Form.Label
                    className="fw-semibold text-dark mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <FaFlag
                      className="me-1 text-muted"
                      style={{ fontSize: "0.75rem" }}
                    />
                    Priority
                  </Form.Label>

                  <Row className="g-2">
                    {priorityOptions.map((priority) => {
                      const isSelected = formData.priority === priority.value;
                      return (
                        <Col xs={6} md={3} key={priority.value}>
                          <div
                            className="rounded-4 p-3 h-100"
                            style={{
                              cursor: "pointer",
                              border: isSelected
                                ? `2px solid ${priority.color}`
                                : "1px solid #e2e8f0",
                              backgroundColor: isSelected
                                ? priority.bg
                                : "#ffffff",
                              transition: "all 0.15s",
                              transform: isSelected
                                ? "translateY(-2px)"
                                : "none",
                              boxShadow: isSelected
                                ? `0 4px 12px ${priority.color}25`
                                : "none",
                            }}
                            onClick={() => handlePrioritySelect(priority.value)}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <span
                                className="fw-bold"
                                style={{
                                  color: priority.color,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {priority.label}
                              </span>
                              {isSelected && (
                                <FaCheck
                                  className="rounded-circle"
                                  style={{
                                    backgroundColor: priority.color,
                                    color: "white",
                                    fontSize: "0.6rem",
                                    padding: "2px",
                                  }}
                                />
                              )}
                            </div>
                            <div
                              className="text-muted mt-1"
                              style={{ fontSize: "0.7rem", lineHeight: 1.4 }}
                            >
                              {priority.desc}
                            </div>
                            <div
                              className="mt-2 fw-semibold"
                              style={{
                                fontSize: "0.65rem",
                                color: priority.color,
                              }}
                            >
                              ⏱ {priority.sla}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Form.Group>

                {/* ── FILE UPLOAD (Drag & Drop) ── */}
                <Form.Group className="mb-4">
                  <Form.Label
                    className="fw-semibold text-dark mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <FaImage
                      className="me-1 text-muted"
                      style={{ fontSize: "0.75rem" }}
                    />
                    Screenshot / Attachment
                    <span className="text-muted fw-normal ms-1">
                      (optional)
                    </span>
                  </Form.Label>

                  <div
                    className="rounded-4 position-relative"
                    style={{
                      border: dragOver
                        ? "2px dashed #4f46e5"
                        : fileName
                          ? "2px dashed #22c55e"
                          : "2px dashed #cbd5e1",
                      backgroundColor: dragOver
                        ? "#eef2ff"
                        : fileName
                          ? "#f0fdf4"
                          : "#f8fafc",
                      padding: fileName ? "16px" : "32px 16px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("screenshot-input").click()
                    }
                  >
                    <input
                      id="screenshot-input"
                      type="file"
                      name="screenshot"
                      onChange={handleChange}
                      accept="image/*,.pdf"
                      style={{ display: "none" }}
                    />

                    {fileName ? (
                      <div
                        className="d-flex align-items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "44px",
                            height: "44px",
                            backgroundColor: "#dcfce7",
                          }}
                        >
                          <FaImage
                            style={{ color: "#22c55e", fontSize: "1.1rem" }}
                          />
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div
                            className="fw-semibold text-dark text-truncate"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {fileName}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.72rem" }}
                          >
                            File attached successfully
                          </div>
                        </div>
                        <FaTimesCircle
                          className="text-danger flex-shrink-0"
                          style={{ fontSize: "1.1rem", cursor: "pointer" }}
                          onClick={removeFile}
                          title="Remove file"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <FaCloudUploadAlt
                          style={{
                            fontSize: "2rem",
                            color: dragOver ? "#4f46e5" : "#94a3b8",
                          }}
                        />
                        <div
                          className="fw-semibold text-dark mt-2"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Click to upload or drag & drop
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.72rem" }}
                        >
                          Images (PNG, JPG) or PDF — Max 5MB
                        </div>
                      </div>
                    )}
                  </div>
                </Form.Group>

                {/* ── BUTTONS ── */}
                <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                  <Button
                    type="button"
                    variant="light"
                    className="border rounded-pill px-4 py-2"
                    style={{ fontSize: "0.88rem", fontWeight: 500 }}
                    onClick={() => navigate("/employee/tickets")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-pill px-4 py-2 border-0 shadow-sm"
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    }}
                    disabled={loading || categoryLoading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" />
                        Submit Complaint
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* ════════════ SIDE PANEL ════════════ */}
        <Col lg={4}>
          {/* ── TIPS ── */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#fef3c7",
                  }}
                >
                  <FaLightbulb
                    style={{ fontSize: "0.8rem", color: "#f59e0b" }}
                  />
                </div>
                <h6 className="fw-bold text-dark mb-0">
                  Tips for a Good Ticket
                </h6>
              </div>
              <div className="d-flex flex-column gap-2">
                {tips.map((tip, index) => (
                  <div key={index} className="d-flex align-items-start gap-2">
                    <span
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                      style={{
                        width: "18px",
                        height: "18px",
                        backgroundColor: "#d1fae5",
                        color: "#059669",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                    <span
                      className="text-muted"
                      style={{ fontSize: "0.8rem", lineHeight: 1.5 }}
                    >
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* ── PRIORITY GUIDE ── */}
          <Card
            className="border-0 shadow-sm rounded-4 mb-4"
            style={{
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <Card.Body className="p-4">
              {/* Header */}
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "34px",
                    height: "34px",
                    backgroundColor: "#EFF6FF",
                  }}
                >
                  <FaFlag
                    style={{
                      fontSize: "0.85rem",
                      color: "#2563EB",
                    }}
                  />
                </div>

                <div>
                  <h6
                    className="fw-bold text-dark mb-0"
                    style={{ fontSize: "0.95rem" }}
                  >
                    SLA Response Times
                  </h6>

                  <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                    Response time based on priority
                  </small>
                </div>
              </div>

              {/* Priority Items */}
              <div className="d-flex flex-column gap-2">
                {priorityOptions.map((priority) => {
                  const isSelected = formData.priority === priority.value;

                  return (
                    <div
                      key={priority.value}
                      className="d-flex align-items-center gap-3 rounded-3"
                      style={{
                        padding: "10px",
                        backgroundColor: isSelected ? priority.bg : "#F8FAFC",

                        border: isSelected
                          ? `1px solid ${priority.color}30`
                          : "1px solid transparent",

                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Priority Indicator */}
                      <span
                        className="rounded-circle flex-shrink-0"
                        style={{
                          width: "11px",
                          height: "11px",
                          backgroundColor: priority.color,
                          boxShadow: `0 0 0 3px ${priority.bg}`,
                        }}
                      />

                      {/* Priority Details */}
                      <div className="flex-grow-1">
                        <div
                          className="fw-semibold text-dark"
                          style={{
                            fontSize: "0.82rem",
                            lineHeight: 1.3,
                          }}
                        >
                          {priority.label}
                        </div>

                        <div
                          className="text-muted"
                          style={{
                            fontSize: "0.7rem",
                            marginTop: "2px",
                          }}
                        >
                          {priority.desc}
                        </div>
                      </div>

                      {/* SLA Badge */}
                      <Badge
                        pill
                        style={{
                          backgroundColor: "#2563EB",
                          color: "#FFFFFF",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          padding: "5px 10px",
                          minWidth: "58px",
                          textAlign: "center",
                        }}
                      >
                        {priority.sla}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          {/* ── FAQ CTA ── */}
          <Card
            className="border-0 rounded-4 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #2563eb, 0%,  #3b82f6 60%, #a855f7 100%)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/employee/faqs")}
          >
            <Card.Body className="p-4 text-center text-white position-relative">
              <div
                className="position-absolute rounded-circle"
                style={{
                  width: "120px",
                  height: "120px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  top: "-40px",
                  right: "-30px",
                }}
              />
              <div className="position-relative">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}
                >
                  <FaBook style={{ fontSize: "1.2rem", color: "white" }} />
                </div>
                <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>
                  Check FAQs First
                </div>
                <p
                  className="mb-3"
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Many common issues have instant solutions in our Knowledge
                  Base.
                </p>
                <span
                  className="d-inline-flex align-items-center gap-1 fw-semibold"
                  style={{ fontSize: "0.82rem" }}
                >
                  Browse Knowledge Base
                  <FaChevronRight style={{ fontSize: "0.6rem" }} />
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RaiseComplaint;
