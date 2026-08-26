import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaTicketAlt,
  FaBell,
  FaLaptop,
  FaUser,
  FaRobot,
  FaBook,
  FaHeadset,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaQuestionCircle,
  FaLifeRing,
} from "react-icons/fa";
import { FiHelpCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import faqService from "../../services/faqService";

/* ════════════════════════════════════════════════════════════════
   CATEGORY COLORS & ICONS (KnowledgeBase maari same)
   ════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════
   STATIC DATA — System help instructions
   ════════════════════════════════════════════════════════════════ */

const QUICK_HELP = [
  {
    id: "tickets",
    title: "Tickets & Complaints",
    description: "Learn how to raise, track and manage support tickets.",
    icon: <FaTicketAlt />,
    color: "#4f46e5",
    bgColor: "#e0e7ff",
    keywords: ["ticket", "complaint", "raise", "track", "manage", "support", "issue"],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Understand ticket updates and system notifications.",
    icon: <FaBell />,
    color: "#059669",
    bgColor: "#d1fae5",
    keywords: ["notification", "alert", "update", "bell", "email"],
  },
  {
    id: "it-support",
    title: "IT Support",
    description: "Get help with common technical issues.",
    icon: <FaHeadset />,
    color: "#7c3aed",
    bgColor: "#ede9fe",
    keywords: ["technical", "support", "help", "problem", "issue", "troubleshoot"],
  },
  {
    id: "account",
    title: "Account & Profile",
    description: "Manage your profile and account settings.",
    icon: <FaUser />,
    color: "#0891b2",
    bgColor: "#cffafe",
    keywords: ["account", "profile", "settings", "password", "username", "email"],
  },
  {
    id: "assets",
    title: "Assets",
    description: "Learn how to view and manage assigned IT assets.",
    icon: <FaLaptop />,
    color: "#d97706",
    bgColor: "#fef3c7",
    keywords: ["asset", "laptop", "computer", "hardware", "device", "assign", "inventory"],
  },
  {
    id: "ai",
    title: "AI Assistance",
    description: "Learn how AI can help analyze complaints and troubleshoot tickets.",
    icon: <FaRobot />,
    color: "#dc2626",
    bgColor: "#fee2e2",
    keywords: ["ai", "artificial", "intelligence", "suggest", "analyze", "automate", "smart"],
  },
];

const ROLE_GUIDES = {
  admin: [
    {
      title: "Managing Employees",
      content: "Navigate to Users in the sidebar to add, edit, or deactivate employee accounts. Assign roles and departments from the user management page.",
      keywords: ["user", "employee", "add", "edit", "deactivate"],
    },
    {
      title: "Managing Technicians",
      content: "Technicians are users with the Technician role. Create them from the Users page and they will appear in ticket assignment dropdowns.",
      keywords: ["technician", "create", "assign", "role"],
    },
    {
      title: "Creating Departments",
      content: "Go to Departments to create and manage organizational departments. Employees are associated with departments for ticket routing.",
      keywords: ["department", "create", "organization", "team"],
    },
    {
      title: "Managing Issue Categories",
      content: "Issue Categories (Hardware, Software, Network, etc.) help classify tickets. Manage them from the Issue Categories page.",
      keywords: ["category", "issue", "hardware", "software", "classify"],
    },
    {
      title: "Assigning Tickets",
      content: "Open a ticket and click Assign to assign it to a technician. You can also bulk-assign or let the system auto-assign.",
      keywords: ["ticket", "assign", "technician", "allocate"],
    },
    {
      title: "Managing Assets",
      content: "Use the Assets page to add IT equipment, create asset categories, and assign assets to employees.",
      keywords: ["asset", "manage", "inventory", "equipment", "assign"],
    },
    {
      title: "Viewing Reports",
      content: "The Reports page lets you generate PDF reports for tickets, technician performance, SLA compliance, assets, and feedback.",
      keywords: ["report", "pdf", "download", "analytics", "performance"],
    },
    {
      title: "Monitoring SLA",
      content: "SLA deadlines are automatically set based on ticket priority. Monitor compliance from the SLA Report or individual ticket views.",
      keywords: ["sla", "deadline", "breach", "compliance", "priority"],
    },
    {
      title: "Using AI Support Insights",
      content: "AI-powered suggestions help categorize tickets and recommend priority levels. View AI insights on the ticket creation and detail pages.",
      keywords: ["ai", "suggest", "category", "priority", "insight"],
    },
  ],
  employee: [
    {
      title: "How to Raise a Complaint",
      content: 'Click "Raise Complaint" in the sidebar. Fill in the title, description, select a category and priority, then submit. You can attach a screenshot for clarity.',
      keywords: ["raise", "complaint", "ticket", "new", "create", "submit", "screenshot"],
    },
    {
      title: "How to Upload Screenshots",
      content: "When raising a complaint, use the Screenshot field to attach an image. Supported formats include PNG, JPG, and GIF.",
      keywords: ["screenshot", "image", "attach", "upload", "file"],
    },
    {
      title: "How to Track a Ticket",
      content: 'Go to "My Tickets" to see all your tickets with their current status, assigned technician, and SLA information.',
      keywords: ["track", "status", "ticket", "view", "list", "progress"],
    },
    {
      title: "How to Add Comments",
      content: "Open a ticket and use the comment section to communicate with the assigned technician. Comments help resolve issues faster.",
      keywords: ["comment", "reply", "message", "communicate", "chat"],
    },
    {
      title: "How to Reopen a Ticket",
      content: 'If your issue persists after resolution, open the ticket and click "Reopen". Provide a reason describing why the issue is not resolved.',
      keywords: ["reopen", "not resolved", "issue", "again"],
    },
    {
      title: "How to Confirm Resolution",
      content: "When a technician marks your ticket as resolved, you will be notified. Confirm the resolution to close the ticket, or reopen it if needed.",
      keywords: ["confirm", "resolution", "close", "resolved", "accept"],
    },
    {
      title: "How to Submit Feedback",
      content: "After confirming resolution, you can rate the service (1-5 stars) and leave a review to help improve support quality.",
      keywords: ["feedback", "rating", "review", "star", "rate"],
    },
    {
      title: "How to View Assigned Assets",
      content: 'Go to "My Assets" to see all IT equipment assigned to you, including asset details and status.',
      keywords: ["asset", "assigned", "laptop", "equipment", "view"],
    },
    {
      title: "Using AI Complaint Assistant",
      content: "When raising a complaint, the AI assistant can suggest the category and priority based on your description for faster processing.",
      keywords: ["ai", "suggest", "category", "priority", "assistant"],
    },
  ],
  technician: [
    {
      title: "Viewing Assigned Tickets",
      content: 'Go to "Assigned Tickets" to see all tickets assigned to you. Use filters for status, priority, and category.',
      keywords: ["ticket", "assigned", "view", "list", "filter"],
    },
    {
      title: "Starting Work on a Ticket",
      content: 'Open an assigned ticket and change the status to "In Progress" to indicate you have started working on it.',
      keywords: ["start", "work", "in progress", "begin", "status"],
    },
    {
      title: "Updating Ticket Status",
      content: "Use the status dropdown to move tickets through the workflow: Assigned → In Progress → Resolved → Closed.",
      keywords: ["status", "update", "change", "workflow", "progress"],
    },
    {
      title: "Adding Comments",
      content: "Add comments to communicate with the employee, document your troubleshooting steps, or request more information.",
      keywords: ["comment", "note", "communication", "update"],
    },
    {
      title: "Resolving Tickets",
      content: 'Once the issue is fixed, change the status to "Resolved" and add a resolution note. The employee will be notified to confirm.',
      keywords: ["resolve", "fix", "complete", "solution", "done"],
    },
    {
      title: "Understanding SLA",
      content: "Each ticket has an SLA deadline based on priority: Critical (4h), High (8h), Medium (24h), Low (48h). Resolve before the deadline to maintain compliance.",
      keywords: ["sla", "deadline", "time", "breach", "compliance", "priority"],
    },
    {
      title: "Using AI Troubleshooting Assistant",
      content: "AI can suggest troubleshooting steps and resolution notes based on the ticket description and category.",
      keywords: ["ai", "troubleshoot", "suggest", "assist", "smart"],
    },
    {
      title: "Viewing Performance",
      content: 'Go to "My Performance" to see your resolved ticket count, average resolution time, SLA compliance, and feedback ratings.',
      keywords: ["performance", "stats", "resolved", "rating", "metrics"],
    },
  ],
};

const ROLE_TITLES = {
  admin: "Admin Guide",
  employee: "Employee Guide",
  technician: "Technician Guide",
};

const ROLE_COLORS = {
  admin: "#4f46e5",
  employee: "#059669",
  technician: "#d97706",
};

/* ════════════════════════════════════════════════════════════════
   SECTION HEADER COMPONENT
   ════════════════════════════════════════════════════════════════ */

const SectionHeader = ({ icon, iconBg, title, count }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <div
      className="rounded-4 d-flex align-items-center justify-content-center"
      style={{ width: "32px", height: "32px", backgroundColor: iconBg }}
    >
      {icon}
    </div>
    <h6 className="fw-bold text-dark mb-0">{title}</h6>
    {count !== undefined && count > 0 && (
      <span
        className="badge rounded-pill text-white"
        style={{ fontSize: "0.65rem", backgroundColor: "#64748b" }}
      >
        {count}
      </span>
    )}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════ */

const HelpSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = (user?.role || "").toLowerCase();
  const guides = ROLE_GUIDES[role] || [];
  const roleColor = ROLE_COLORS[role] || "#4f46e5";

  /* ── FAQ state ── */
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState("");

  /* ── Search state ── */
  const [search, setSearch] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  /* ── Fetch FAQs (FIX: page_size + status active) ── */
  const fetchFAQs = async () => {
    setFaqLoading(true);
    setFaqError("");
    try {
      const data = await faqService.getFAQs({
        page_size: 1000,
        status: "active",
      });

      if (!data) {
        setFaqs([]);
        return;
      }

      setFaqs(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("HelpSupport FAQ fetch error:", err);
      setFaqs([]);
      setFaqError("Some help resources could not be loaded. Please check if the server is running.");
    } finally {
      setFaqLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  /* ── Search logic ── */
  const q = search.toLowerCase().trim();

  const matchesText = (text, query) => {
    if (!query) return true;
    return (text || "").toLowerCase().includes(query);
  };

  const matchesKeywords = (keywords, query) => {
    if (!query) return true;
    return (keywords || []).some((k) => k.includes(query));
  };

  const filteredQuickHelp = QUICK_HELP.filter(
    (item) =>
      matchesText(item.title, q) ||
      matchesText(item.description, q) ||
      matchesKeywords(item.keywords, q)
  );

  const filteredGuides = guides.filter(
    (g) =>
      matchesText(g.title, q) ||
      matchesText(g.content, q) ||
      matchesKeywords(g.keywords, q)
  );

  const filteredFAQs = faqs.filter(
    (f) => matchesText(f.question, q) || matchesText(f.answer, q)
  );

  const hasAnyResult =
    !q ||
    filteredQuickHelp.length > 0 ||
    filteredGuides.length > 0 ||
    filteredFAQs.length > 0;

  /* ── Navigation helpers ── */
  const goKB = () => navigate(`/${role}/faqs`);
  const goNotifications = () => navigate(`/${role}/notifications`);
  const goRaiseTicket = () => navigate("/employee/tickets/new");

  const userName = user?.first_name || user?.username || "there";

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      <Container style={{ maxWidth: "1000px" }}>
        {/* ════════════ HERO HEADER ════════════ */}
        <Card
          className="border-0 rounded-4 mb-4 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)",
          }}
        >
          <Card.Body className="p-4 p-md-5 text-center text-white position-relative">
            {/* Decorative circles */}
            <div
              className="position-absolute rounded-circle"
              style={{
                width: "200px",
                height: "200px",
                backgroundColor: "rgba(255,255,255,0.08)",
                top: "-80px",
                right: "-40px",
              }}
            />
            <div
              className="position-absolute rounded-circle"
              style={{
                width: "120px",
                height: "120px",
                backgroundColor: "rgba(255,255,255,0.06)",
                bottom: "-50px",
                left: "-20px",
              }}
            />

            <div className="position-relative">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: "72px",
                  height: "72px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  border: "2px solid rgba(255,255,255,0.35)",
                }}
              >
                <FaLifeRing style={{ fontSize: "2rem", color: "white" }} />
              </div>
              <h3 className="fw-bold mb-2">Help & Support Center</h3>
              <p
                className="mb-4 mx-auto"
                style={{ maxWidth: "520px", color: "rgba(255,255,255,0.9)", fontSize: "0.95rem" }}
              >
                Hi {userName}! Find answers, learn how to use the system, or get
                help with your IT support requests.
              </p>

              {/* Search inside hero */}
              <div className="position-relative mx-auto" style={{ maxWidth: "520px" }}>
                <FaSearch
                  className="position-absolute"
                  style={{
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <Form.Control
                  placeholder="Search help topics, guides, FAQs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shadow-none"
                  style={{
                    height: "50px",
                    paddingLeft: "44px",
                    paddingRight: "48px",
                    borderRadius: "25px",
                    border: "none",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    fontSize: "0.95rem",
                  }}
                />
                {search && (
                  <FaTimes
                    className="position-absolute"
                    style={{
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                    onClick={() => setSearch("")}
                  />
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ════════════ NO RESULTS ════════════ */}
        {!hasAnyResult && (
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="text-center py-5">
              <FiHelpCircle style={{ fontSize: "3rem", color: "#dee2e6" }} />
              <h5 className="mt-3 fw-bold text-dark">No Help Topics Found</h5>
              <p className="text-muted mb-3">
                We couldn't find anything matching "{search}". Try different keywords.
              </p>
              <Button
                variant="outline-primary"
                size="sm"
                className="rounded-pill px-4"
                onClick={() => setSearch("")}
              >
                <FaTimes className="me-1" /> Clear Search
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* ════════════ SECTION 1: QUICK HELP ════════════ */}
        {filteredQuickHelp.length > 0 && (
          <section className="mb-4">
            <SectionHeader
              icon={<FaQuestionCircle style={{ fontSize: "0.85rem", color: "#4f46e5" }} />}
              iconBg="#e0e7ff"
              title="Quick Help"
              count={filteredQuickHelp.length}
            />
            <Row className="g-3">
              {filteredQuickHelp.map((item) => (
                <Col md={6} lg={4} key={item.id}>
                  <Card
                    className="border-0 shadow-sm rounded-4 h-100"
                    style={{ cursor: "default", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
                    <Card.Body className="d-flex align-items-start gap-3 p-4">
                      <div
                        className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "48px",
                          height: "48px",
                          backgroundColor: item.bgColor,
                        }}
                      >
                        <span style={{ color: item.color, fontSize: "1.2rem" }}>
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "0.94rem" }}>
                          {item.title}
                        </div>
                        <div
                          className="text-muted mt-1"
                          style={{ fontSize: "0.82rem", lineHeight: "1.6" }}
                        >
                          {item.description}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* ════════════ SECTION 2: ROLE-BASED GUIDES ════════════ */}
        {filteredGuides.length > 0 && (
          <section className="mb-4">
            <SectionHeader
              icon={<FaClipboardList style={{ fontSize: "0.85rem", color: roleColor }} />}
              iconBg={`${roleColor}18`}
              title={ROLE_TITLES[role] || "Help Guides"}
              count={filteredGuides.length}
            />
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-0">
                {filteredGuides.map((guide, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-start gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        idx < filteredGuides.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                      transition: "background 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                      style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: `${roleColor}18`,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: roleColor,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="fw-semibold text-dark mb-1" style={{ fontSize: "0.9rem" }}>
                        {guide.title}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.84rem", lineHeight: "1.7" }}
                      >
                        {guide.content}
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </section>
        )}

        {/* ════════════ SECTION 3: FAQ ACCORDION ════════════ */}
        <section className="mb-4">
          <SectionHeader
            icon={<FaBook style={{ fontSize: "0.85rem", color: "#f59e0b" }} />}
            iconBg="#fef3c7"
            title="Frequently Asked Questions"
            count={filteredFAQs.length}
          />

          {faqLoading ? (
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted mb-0">Loading help resources...</p>
              </Card.Body>
            </Card>
          ) : faqError ? (
            <Alert variant="warning" className="rounded-4 border-0 d-flex align-items-center">
              <div className="flex-grow-1">{faqError}</div>
              <Button variant="light" className="border rounded-pill px-3" size="sm" onClick={fetchFAQs}>
                Try Again
              </Button>
            </Alert>
          ) : filteredFAQs.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="text-center py-5">
                <FaBook style={{ fontSize: "2.5rem", color: "#dee2e6" }} />
                <h5 className="mt-3 fw-bold text-dark">
                  {q ? "No articles match your search" : "No Articles Available Yet"}
                </h5>
                <p className="text-muted mb-0">
                  {q
                    ? "Try different keywords."
                    : "Articles will appear here when admins add them."}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredFAQs.map((faq) => {
                const isOpen = expandedFAQ === faq.id;
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
                        backgroundColor: isOpen ? "#f9fafb" : "#fff",
                        borderBottom: isOpen ? "1px solid #e5e7eb" : "none",
                      }}
                      onClick={() => setExpandedFAQ(isOpen ? null : faq.id)}
                    >
                      {/* Category Icon Square */}
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "38px",
                          height: "38px",
                          backgroundColor: catColor + "15",
                          minWidth: "38px",
                        }}
                      >
                        <span style={{ fontSize: "1rem" }}>
                          {CATEGORY_ICONS[faq.category] || "📋"}
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
                        <span
                          className="px-2 py-0 rounded-pill d-inline-block mt-1"
                          style={{
                            fontSize: "0.68rem",
                            backgroundColor: catColor + "15",
                            color: catColor,
                            fontWeight: 500,
                          }}
                        >
                          {faq.category}
                        </span>
                      </div>

                      <div className="flex-shrink-0 mt-1">
                        {isOpen ? (
                          <FaChevronUp style={{ color: "#9ca3af", fontSize: "0.85rem" }} />
                        ) : (
                          <FaChevronDown style={{ color: "#9ca3af", fontSize: "0.85rem" }} />
                        )}
                      </div>
                    </div>

                    {/* Answer Body */}
                    {isOpen && (
                      <div className="px-3 pb-3" style={{ marginLeft: "50px" }}>
                        <div
                          className="text-muted"
                          style={{
                            fontSize: "0.88rem",
                            lineHeight: "1.75",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {faq.answer || "No answer available yet."}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ════════════ SECTION 4: SUPPORT ACTIONS ════════════ */}
        {!q && (
          <section className="mb-4">
            <SectionHeader
              icon={<FaLifeRing style={{ fontSize: "0.85rem", color: "#10b981" }} />}
              iconBg="#d1fae5"
              title="Need More Help?"
            />
            <Row className="g-3">
              {/* Raise Ticket — Employee only */}
              {role === "employee" && (
                <Col md={4} sm={6}>
                  <Card
                    className="border-0 shadow-sm rounded-4 h-100"
                    style={{ cursor: "pointer", transition: "transform 0.15s" }}
                    onClick={goRaiseTicket}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <Card.Body className="text-center p-4">
                      <div
                        className="rounded-4 d-inline-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: "52px",
                          height: "52px",
                          backgroundColor: "#e0e7ff",
                        }}
                      >
                        <FaTicketAlt style={{ color: "#4f46e5", fontSize: "1.3rem" }} />
                      </div>
                      <div className="fw-semibold text-dark mb-2" style={{ fontSize: "0.92rem" }}>
                        Raise a Support Ticket
                      </div>
                      <div className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                        Can't find an answer? Create a ticket.
                      </div>
                      <Button variant="primary" size="sm" className="rounded-pill px-4">
                        Raise Complaint
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              )}

              {/* Knowledge Base */}
              <Col md={4} sm={6}>
                <Card
                  className="border-0 shadow-sm rounded-4 h-100"
                  style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  onClick={goKB}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <Card.Body className="text-center p-4">
                    <div
                      className="rounded-4 d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "52px",
                        height: "52px",
                        backgroundColor: "#ede9fe",
                      }}
                    >
                      <FaBook style={{ color: "#7c3aed", fontSize: "1.3rem" }} />
                    </div>
                    <div className="fw-semibold text-dark mb-2" style={{ fontSize: "0.92rem" }}>
                      Knowledge Base
                    </div>
                    <div className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                      Browse detailed solutions and guides.
                    </div>
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-4">
                      Browse KB
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              {/* Notifications */}
              <Col md={4} sm={6}>
                <Card
                  className="border-0 shadow-sm rounded-4 h-100"
                  style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  onClick={goNotifications}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <Card.Body className="text-center p-4">
                    <div
                      className="rounded-4 d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "52px",
                        height: "52px",
                        backgroundColor: "#fef3c7",
                      }}
                    >
                      <FaBell style={{ color: "#d97706", fontSize: "1.3rem" }} />
                    </div>
                    <div className="fw-semibold text-dark mb-2" style={{ fontSize: "0.92rem" }}>
                      Notifications
                    </div>
                    <div className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                      Check your latest ticket updates.
                    </div>
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-4">
                      View Notifications
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </section>
        )}

        {/* ════════════ SECTION 5: CONTACT SUPPORT BANNER ════════════ */}
        {!q && (
          <section>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <div
                className="d-flex align-items-center gap-3 p-4 flex-wrap"
                style={{ background: "linear-gradient(135deg, #cffafe 0%, #e0f2fe 100%)" }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#0891b2",
                    color: "white",
                  }}
                >
                  <FaHeadset style={{ fontSize: "1.2rem" }} />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                    Still need help?
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.84rem" }}>
                    Please contact your organization&apos;s IT Support team for
                    assistance with technical issues.
                  </div>
                </div>
                {role === "employee" && (
                  <Button
                    variant="primary"
                    className="rounded-pill px-4 d-flex align-items-center flex-shrink-0"
                    onClick={goRaiseTicket}
                  >
                    <FaTicketAlt className="me-2" /> Create Ticket
                  </Button>
                )}
              </div>
            </Card>
          </section>
        )}
      </Container>
    </div>
  );
};

export default HelpSupport;