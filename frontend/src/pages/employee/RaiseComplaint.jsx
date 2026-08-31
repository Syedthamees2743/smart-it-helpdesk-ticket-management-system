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
  FaLaptop,
  FaLock,
  FaHeadset,
  FaInfoCircle,
} from "react-icons/fa";

import { createTicket, getMyEligibleAssets } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";
import aiService from "../../services/aiService";

import "../../styles/RaiseComplaint.css";

const RaiseComplaint = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [assets, setAssets] = useState([]);
  const [assetLoading, setAssetLoading] = useState(true);
  const [hasNoAssets, setHasNoAssets] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    asset: "",
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

  /* ── Fetch Employee's Eligible Assets ── */
  useEffect(() => {
    const loadMyAssets = async () => {
      setAssetLoading(true);
      try {
        const res = await getMyEligibleAssets();
        const list = Array.isArray(res.data) ? res.data : [];
        setAssets(list);
        setHasNoAssets(list.length === 0);
      } catch (err) {
        console.error("Failed to load assets:", err);
        setAssets([]);
        setHasNoAssets(true);
      } finally {
        setAssetLoading(false);
      }
    };

    loadMyAssets();
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

    if (!formData.asset) {
      setError("Please select the affected asset for this ticket.");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Please select an issue category.");
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("asset", formData.asset);
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

  /* ── Priority Options ── */
  const priorityOptions = [
    { value: "low", label: "Low", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", desc: "Minor issue, no urgency", sla: "48h SLA" },
    { value: "medium", label: "Medium", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", desc: "Normal priority", sla: "24h SLA" },
    { value: "high", label: "High", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", desc: "Urgent, affects work", sla: "8h SLA" },
    { value: "critical", label: "Critical", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", desc: "System down, immediate", sla: "4h SLA" },
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

  const selectedAsset = formData.asset
    ? assets.find((a) => String(a.id) === String(formData.asset))
    : null;

  /* ═══════════ SKELETON LOADING ═══════════ */
  if (assetLoading || categoryLoading) {
    return (
      <div className="rc-page">
        <div className="rc-header">
          <div className="rc-skeleton rc-skeleton-icon" />
          <div>
            <div className="rc-skeleton rc-skeleton-title" />
            <div className="rc-skeleton rc-skeleton-sub" />
          </div>
        </div>
        <Row className="g-4">
          <Col lg={8}>
            <div className="rc-skeleton rc-skeleton-card">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rc-skeleton rc-skeleton-field" />
              ))}
            </div>
          </Col>
          <Col lg={4}>
            <div className="rc-skeleton rc-skeleton-side" />
          </Col>
        </Row>
      </div>
    );
  }

  /* ═══════════ BLOCKED STATE ═══════════ */
  if (hasNoAssets) {
    return (
      <div className="rc-page">
        <div className="rc-header">
          <div className="rc-header-icon">
            <FaTicketAlt />
          </div>
          <div>
            <h4 className="rc-header-title">Raise Complaint</h4>
            <p className="rc-header-sub">Submit a new IT support request</p>
          </div>
        </div>

        <Card className="rc-card rc-blocked-card">
          <Card.Body className="text-center py-5 px-4">
            <div className="rc-blocked-icon">
              <FaLock />
            </div>

            <h4 className="rc-blocked-title">Ticket Creation Blocked</h4>

            <p className="rc-blocked-text">
              You cannot create a support ticket because no IT asset is
              currently assigned to your account. Please contact the IT Admin
              to get an asset assigned first.
            </p>

            <div className="rc-blocked-info">
              <div className="rc-blocked-info-icon">
                <FaHeadset />
              </div>
              <div className="text-start">
                <div className="rc-blocked-info-title">Need an asset?</div>
                <div className="rc-blocked-info-text">
                  Contact your IT Administrator to request an asset assignment.
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <Button
                variant="light"
                className="rc-btn-outline-pill px-4 py-2"
                onClick={() => navigate("/employee/tickets")}
              >
                View My Tickets
              </Button>
              <Button
                className="rc-btn-primary-pill px-4 py-2"
                onClick={() => navigate("/employee/assets")}
              >
                <FaLaptop className="me-2" /> Check My Assets
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  /* ═══════════ NORMAL FORM ═══════════ */
  return (
    <div className="rc-page">
      {/* ════════════ HEADER ════════════ */}
      <div className="rc-header">
        <div className="rc-header-icon">
          <FaTicketAlt />
        </div>
        <div className="flex-grow-1">
          <h4 className="rc-header-title">Raise Complaint</h4>
          <p className="rc-header-sub">Submit a new IT support request</p>
        </div>
        <Badge pill className="rc-asset-count">
          <FaLaptop /> {assets.length} asset{assets.length !== 1 ? "s" : ""} assigned
        </Badge>
      </div>

      {/* ════════════ ERROR ════════════ */}
      {error && (
        <Alert
          variant="danger"
          className="mb-4 rounded-4 border-0 d-flex align-items-center rc-alert-shake"
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
          <Card className="rc-card">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit} noValidate>

                {/* ═══ AFFECTED ASSET ═══ */}
                <Form.Group className="mb-4 rc-anim" style={{ animationDelay: "0.1s" }}>
                  <Form.Label className="rc-label">
                    <FaLaptop className="rc-label-icon" />
                    Affected Asset <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Select
                    name="asset"
                    value={formData.asset}
                    onChange={handleChange}
                    required
                    className="rc-input"
                  >
                    <option value="">Select the affected asset...</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_code} — {asset.asset_name}
                        {asset.category_name ? ` (${asset.category_name})` : ""}
                      </option>
                    ))}
                  </Form.Select>

                  {selectedAsset && (
                    <div className="rc-asset-selected">
                      <div className="rc-asset-selected-icon">
                        <FaLaptop />
                      </div>
                      <div>
                        <div className="rc-asset-selected-name">
                          {selectedAsset.asset_name}
                        </div>
                        <div className="rc-asset-selected-meta">
                          {selectedAsset.asset_code}
                          {selectedAsset.brand || selectedAsset.model
                            ? ` • ${[selectedAsset.brand, selectedAsset.model]
                                .filter(Boolean)
                                .join(" ")}`
                            : ""}
                          {selectedAsset.category_name
                            ? ` • ${selectedAsset.category_name}`
                            : ""}
                        </div>
                      </div>
                      <span className="rc-asset-selected-check">
                        <FaCheck />
                      </span>
                    </div>
                  )}
                </Form.Group>

                {/* ═══ TITLE ═══ */}
                <Form.Group className="mb-4 rc-anim" style={{ animationDelay: "0.18s" }}>
                  <Form.Label className="rc-label">
                    <FaHeading className="rc-label-icon" />
                    Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of the issue"
                    required
                    maxLength={200}
                    className="rc-input"
                  />
                  <div className="d-flex justify-content-end">
                    <Form.Text className="rc-char-count">
                      {formData.title.length}/200
                    </Form.Text>
                  </div>
                </Form.Group>

                {/* ═══ DESCRIPTION ═══ */}
                <Form.Group className="mb-4 rc-anim" style={{ animationDelay: "0.26s" }}>
                  <Form.Label className="rc-label">
                    <FaAlignLeft className="rc-label-icon" />
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
                    className="rc-input rc-textarea"
                  />
                </Form.Group>

                {/* ═══ AI ANALYZE BAR ═══ */}
                <div className="rc-ai-bar rc-anim" style={{ animationDelay: "0.34s" }}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="rc-ai-bar-icon">
                      <FaMagic />
                    </div>
                    <div>
                      <div className="rc-ai-bar-title">Smart AI Assistant</div>
                      <div className="rc-ai-bar-sub">
                        Auto-detects the right category &amp; priority
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="rc-btn-primary-pill rc-ai-btn"
                    onClick={handleAnalyze}
                    disabled={aiLoading || loading}
                  >
                    {aiLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Analyzing
                        <span className="rc-dots">
                          <span>.</span><span>.</span><span>.</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <FaMagic className="me-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </div>

                {/* ═══ AI ERROR ═══ */}
                {aiError && (
                  <Alert
                    className="py-2 px-3 mb-3 rounded-4 border-0 d-flex align-items-start rc-ai-error"
                    dismissible
                    onClose={() => setAiError("")}
                  >
                    <div className="rc-ai-error-icon">
                      <FaRobot />
                    </div>
                    <div className="rc-ai-error-text">
                      <strong>AI Unavailable</strong>
                      <span className="ms-1">{aiError}</span>
                    </div>
                  </Alert>
                )}

                {/* ═══ AI RESULT ═══ */}
                {aiResult && (
                  <div className="rc-ai-result">
                    {/* AI HEADER */}
                    <div className="rc-ai-result-header">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rc-ai-result-logo">
                          <FaMagic />
                        </div>
                        <div>
                          <div className="rc-ai-result-title">AI Suggestion</div>
                          <div className="rc-ai-result-sub">
                            Smart analysis based on your ticket
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rc-ai-close"
                        onClick={handleDismissAi}
                        title="Dismiss AI suggestion"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>

                    {/* AI CONTENT */}
                    <div className="p-3">
                      {/* Category + Priority */}
                      <Row className="g-3 mb-3">
                        <Col xs={12} sm={6}>
                          <div className="rc-ai-box" style={{ animationDelay: "0.1s" }}>
                            <div className="rc-ai-box-label">Suggested Category</div>
                            {aiResult.suggested_category ? (
                              <Badge pill className="rc-ai-cat-badge">
                                {aiResult.suggested_category}
                              </Badge>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </div>
                        </Col>

                        <Col xs={12} sm={6}>
                          <div className="rc-ai-box" style={{ animationDelay: "0.2s" }}>
                            <div className="rc-ai-box-label">Suggested Priority</div>
                            {aiResult.suggested_priority ? (
                              <Badge
                                pill
                                className="rc-ai-pri-badge"
                                style={{
                                  backgroundColor:
                                    getPriorityColor(aiResult.suggested_priority) + "18",
                                  color: getPriorityColor(aiResult.suggested_priority),
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

                      {/* AI REASON */}
                      {aiResult.reason && (
                        <div className="rc-ai-box rc-ai-reason" style={{ animationDelay: "0.3s" }}>
                          <div className="rc-ai-reason-title">
                            <FaMagic className="rc-ai-reason-icon" />
                            AI Reasoning
                          </div>
                          <div className="rc-ai-reason-text">{aiResult.reason}</div>
                        </div>
                      )}

                      {/* RELATED ARTICLES */}
                      {aiResult.related_faqs && aiResult.related_faqs.length > 0 && (
                        <div className="rc-ai-faqs" style={{ animationDelay: "0.4s" }}>
                          <div className="rc-ai-faqs-title">
                            <div className="rc-ai-faqs-icon">
                              <FaBook />
                            </div>
                            Related Articles
                          </div>

                          <div className="d-flex flex-column gap-1">
                            {aiResult.related_faqs.map((faq, index) => (
                              <div
                                key={faq.id || index}
                                className="rc-faq-item"
                                onClick={() => navigate("/employee/faqs")}
                              >
                                <FaChevronRight className="rc-faq-arrow" />
                                <span>{faq.question}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACTIONS */}
                      <div className="rc-ai-actions" style={{ animationDelay: "0.5s" }}>
                        <Button
                          size="sm"
                          className="rc-btn-primary-pill px-4"
                          onClick={handleAcceptSuggestion}
                        >
                          <FaCheck className="me-1" />
                          Accept Suggestion
                        </Button>

                        <Button
                          size="sm"
                          variant="light"
                          className="rc-btn-outline-pill px-3"
                          onClick={handleDismissAi}
                        >
                          Dismiss
                        </Button>

                        <div className="rc-ai-note">
                          <FaCheck />
                          Verify before submitting
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ CATEGORY ═══ */}
                <Form.Group className="mb-4 rc-anim" style={{ animationDelay: "0.42s" }}>
                  <Form.Label className="rc-label">
                    <FaTag className="rc-label-icon" />
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={categoryLoading}
                    className="rc-input"
                  >
                    <option value="">
                      {categoryLoading ? "Loading categories..." : "Select Category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* ═══ PRIORITY ═══ */}
                <Form.Group className="mb-4 rc-anim" style={{ animationDelay: "0.5s" }}>
                  <Form.Label className="rc-label">
                    <FaFlag className="rc-label-icon" />
                    Priority
                  </Form.Label>

                  <Row className="g-2">
                    {priorityOptions.map((priority) => {
                      const isSelected = formData.priority === priority.value;
                      return (
                        <Col xs={6} md={3} key={priority.value}>
                          <div
                            className={`rc-priority-card ${isSelected ? "rc-priority-selected" : ""}`}
                            style={
                              isSelected
                                ? {
                                    borderColor: priority.color,
                                    backgroundColor: priority.bg,
                                    boxShadow: `0 6px 16px ${priority.color}30`,
                                  }
                                : undefined
                            }
                            onClick={() => handlePrioritySelect(priority.value)}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <span
                                className="rc-priority-label"
                                style={{ color: priority.color }}
                              >
                                {priority.label}
                              </span>
                              {isSelected && (
                                <span
                                  className="rc-priority-check"
                                  style={{ backgroundColor: priority.color }}
                                >
                                  <FaCheck />
                                </span>
                              )}
                            </div>
                            <div className="rc-priority-desc">{priority.desc}</div>
                            <div
                              className="rc-priority-sla"
                              style={{ color: priority.color }}
                            >
                              ⏱ {priority.sla}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Form.Group>

                {/* ═══ FILE UPLOAD ═══ */}
                <Form.Group className="mb-4 rc-anim" style={{ animationDelay: "0.58s" }}>
                  <Form.Label className="rc-label">
                    <FaImage className="rc-label-icon" />
                    Screenshot / Attachment
                    <span className="rc-optional">(optional)</span>
                  </Form.Label>

                  <div
                    className={`rc-upload ${dragOver ? "rc-upload-drag" : ""} ${fileName ? "rc-upload-filled" : ""}`}
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
                        <div className="rc-upload-file-icon">
                          <FaImage />
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="rc-upload-file-name">{fileName}</div>
                          <div className="rc-upload-file-sub">
                            File attached successfully
                          </div>
                        </div>
                        <FaTimesCircle
                          className="rc-upload-remove"
                          onClick={removeFile}
                          title="Remove file"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="rc-upload-cloud">
                          <FaCloudUploadAlt />
                        </div>
                        <div className="rc-upload-title">
                          Click to upload or drag &amp; drop
                        </div>
                        <div className="rc-upload-hint">
                          Images (PNG, JPG) or PDF — Max 5MB
                        </div>
                      </div>
                    )}
                  </div>
                </Form.Group>

                {/* ═══ BUTTONS ═══ */}
                <div className="d-flex justify-content-end gap-2 pt-3 border-top rc-anim" style={{ animationDelay: "0.66s" }}>
                  <Button
                    type="button"
                    variant="light"
                    className="rc-btn-outline-pill px-4 py-2"
                    onClick={() => navigate("/employee/tickets")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rc-submit-btn px-4 py-2"
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

        {/* ════════════ SIDEBAR ════════════ */}
        <Col lg={4}>
          {/* TIPS */}
          <Card className="rc-card rc-tips-card rc-anim" style={{ animationDelay: "0.3s" }}>
            <Card.Body className="p-4">
              <div className="rc-tips-header">
                <div className="rc-tips-icon">
                  <FaLightbulb />
                </div>
                <h6 className="rc-tips-title mb-0">Quick Tips</h6>
              </div>

              <div className="d-flex flex-column gap-1">
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className="rc-tip-item"
                    style={{ animationDelay: `${0.45 + index * 0.09}s` }}
                  >
                    <span className="rc-tip-bullet">{index + 1}</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* HOW IT WORKS */}
          <Card className="rc-card rc-flow-card rc-anim" style={{ animationDelay: "0.55s" }}>
            <Card.Body className="p-4">
              <div className="rc-tips-header">
                <div className="rc-flow-icon">
                  <FaInfoCircle />
                </div>
                <h6 className="rc-tips-title mb-0">What Happens Next</h6>
              </div>

              <div className="rc-flow-steps">
                {[
                  { icon: <FaPaperPlane />, text: "Ticket submitted with auto SLA" },
                  { icon: <FaHeadset />, text: "Admin assigns a technician" },
                  { icon: <FaCheck />, text: "You get email updates at every step" },
                ].map((step, i) => (
                  <div key={i} className="rc-flow-step">
                    <div className="rc-flow-step-icon">{step.icon}</div>
                    <div className="rc-flow-step-text">{step.text}</div>
                    {i < 2 && <div className="rc-flow-line" />}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RaiseComplaint;