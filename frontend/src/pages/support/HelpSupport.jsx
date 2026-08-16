import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Button,
  Accordion,
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
  FaArrowRight,
  FaHeadset,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { FiHelpCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import faqService from "../../services/faqService";

/* ════════════════════════════════════════════════════════════════
   STATIC DATA — System help instructions (not mock DB data)
   ════════════════════════════════════════════════════════════════ */

const QUICK_HELP = [
  {
    id: "tickets",
    title: "Tickets & Complaints",
    description:
      "Learn how to raise, track and manage support tickets.",
    icon: <FaTicketAlt />,
    color: "#4f46e5",
    bgColor: "#e0e7ff",
    keywords: [
      "ticket",
      "complaint",
      "raise",
      "track",
      "manage",
      "support",
      "issue",
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Understand ticket updates and system notifications.",
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
    keywords: [
      "technical",
      "support",
      "help",
      "problem",
      "issue",
      "troubleshoot",
    ],
  },
  {
    id: "account",
    title: "Account & Profile",
    description: "Manage your profile and account settings.",
    icon: <FaUser />,
    color: "#0891b2",
    bgColor: "#cffafe",
    keywords: [
      "account",
      "profile",
      "settings",
      "password",
      "username",
      "email",
    ],
  },
  {
    id: "assets",
    title: "Assets",
    description:
      "Learn how to view and manage assigned IT assets.",
    icon: <FaLaptop />,
    color: "#d97706",
    bgColor: "#fef3c7",
    keywords: [
      "asset",
      "laptop",
      "computer",
      "hardware",
      "device",
      "assign",
      "inventory",
    ],
  },
  {
    id: "ai",
    title: "AI Assistance",
    description:
      "Learn how AI can help analyze complaints and troubleshoot tickets.",
    icon: <FaRobot />,
    color: "#dc2626",
    bgColor: "#fee2e2",
    keywords: [
      "ai",
      "artificial",
      "intelligence",
      "suggest",
      "analyze",
      "automate",
      "smart",
    ],
  },
];

const ROLE_GUIDES = {
  admin: [
    {
      title: "Managing Employees",
      content:
        "Navigate to Users in the sidebar to add, edit, or deactivate employee accounts. Assign roles and departments from the user management page.",
      keywords: ["user", "employee", "add", "edit", "deactivate"],
    },
    {
      title: "Managing Technicians",
      content:
        "Technicians are users with the Technician role. Create them from the Users page and they will appear in ticket assignment dropdowns.",
      keywords: ["technician", "create", "assign", "role"],
    },
    {
      title: "Creating Departments",
      content:
        "Go to Departments to create and manage organizational departments. Employees are associated with departments for ticket routing.",
      keywords: ["department", "create", "organization", "team"],
    },
    {
      title: "Managing Issue Categories",
      content:
        "Issue Categories (Hardware, Software, Network, etc.) help classify tickets. Manage them from the Issue Categories page.",
      keywords: ["category", "issue", "hardware", "software", "classify"],
    },
    {
      title: "Assigning Tickets",
      content:
        "Open a ticket and click Assign to assign it to a technician. You can also bulk-assign or let the system auto-assign.",
      keywords: ["ticket", "assign", "technician", "allocate"],
    },
    {
      title: "Managing Assets",
      content:
        "Use the Assets page to add IT equipment, create asset categories, and assign assets to employees.",
      keywords: ["asset", "manage", "inventory", "equipment", "assign"],
    },
    {
      title: "Viewing Reports",
      content:
        "The Reports page lets you generate PDF reports for tickets, technician performance, SLA compliance, assets, and feedback.",
      keywords: ["report", "pdf", "download", "analytics", "performance"],
    },
    {
      title: "Monitoring SLA",
      content:
        "SLA deadlines are automatically set based on ticket priority. Monitor compliance from the SLA Report or individual ticket views.",
      keywords: ["sla", "deadline", "breach", "compliance", "priority"],
    },
    {
      title: "Using AI Support Insights",
      content:
        "AI-powered suggestions help categorize tickets and recommend priority levels. View AI insights on the ticket creation and detail pages.",
      keywords: ["ai", "suggest", "category", "priority", "insight"],
    },
  ],
  employee: [
    {
      title: "How to Raise a Complaint",
      content:
        'Click "Raise Complaint" in the sidebar. Fill in the title, description, select a category and priority, then submit. You can attach a screenshot for clarity.',
      keywords: ["raise", "complaint", "ticket", "new", "create", "submit", "screenshot"],
    },
    {
      title: "How to Upload Screenshots",
      content:
        "When raising a complaint, use the Screenshot field to attach an image. Supported formats include PNG, JPG, and GIF.",
      keywords: ["screenshot", "image", "attach", "upload", "file"],
    },
    {
      title: "How to Track a Ticket",
      content:
        'Go to "My Tickets" to see all your tickets with their current status, assigned technician, and SLA information.',
      keywords: ["track", "status", "ticket", "view", "list", "progress"],
    },
    {
      title: "How to Add Comments",
      content:
        "Open a ticket and use the comment section to communicate with the assigned technician. Comments help resolve issues faster.",
      keywords: ["comment", "reply", "message", "communicate", "chat"],
    },
    {
      title: "How to Reopen a Ticket",
      content:
        'If your issue persists after resolution, open the ticket and click "Reopen". Provide a reason describing why the issue is not resolved.',
      keywords: ["reopen", "not resolved", "issue", "again"],
    },
    {
      title: "How to Confirm Resolution",
      content:
        "When a technician marks your ticket as resolved, you will be notified. Confirm the resolution to close the ticket, or reopen it if needed.",
      keywords: ["confirm", "resolution", "close", "resolved", "accept"],
    },
    {
      title: "How to Submit Feedback",
      content:
        "After confirming resolution, you can rate the service (1-5 stars) and leave a review to help improve support quality.",
      keywords: ["feedback", "rating", "review", "star", "rate"],
    },
    {
      title: "How to View Assigned Assets",
      content:
        'Go to "My Assets" to see all IT equipment assigned to you, including asset details and status.',
      keywords: ["asset", "assigned", "laptop", "equipment", "view"],
    },
    {
      title: "Using AI Complaint Assistant",
      content:
        "When raising a complaint, the AI assistant can suggest the category and priority based on your description for faster processing.",
      keywords: ["ai", "suggest", "category", "priority", "assistant"],
    },
  ],
  technician: [
    {
      title: "Viewing Assigned Tickets",
      content:
        'Go to "Assigned Tickets" to see all tickets assigned to you. Use filters for status, priority, and category.',
      keywords: ["ticket", "assigned", "view", "list", "filter"],
    },
    {
      title: "Starting Work on a Ticket",
      content:
        'Open an assigned ticket and change the status to "In Progress" to indicate you have started working on it.',
      keywords: ["start", "work", "in progress", "begin", "status"],
    },
    {
      title: "Updating Ticket Status",
      content:
        "Use the status dropdown to move tickets through the workflow: Assigned → In Progress → Resolved → Closed.",
      keywords: ["status", "update", "change", "workflow", "progress"],
    },
    {
      title: "Adding Comments",
      content:
        "Add comments to communicate with the employee, document your troubleshooting steps, or request more information.",
      keywords: ["comment", "note", "communication", "update"],
    },
    {
      title: "Resolving Tickets",
      content:
        'Once the issue is fixed, change the status to "Resolved" and add a resolution note. The employee will be notified to confirm.',
      keywords: ["resolve", "fix", "complete", "solution", "done"],
    },
    {
      title: "Understanding SLA",
      content:
        "Each ticket has an SLA deadline based on priority: Critical (4h), High (8h), Medium (24h), Low (48h). Resolve before the deadline to maintain compliance.",
      keywords: ["sla", "deadline", "time", "breach", "compliance", "priority"],
    },
    {
      title: "Using AI Troubleshooting Assistant",
      content:
        "AI can suggest troubleshooting steps and resolution notes based on the ticket description and category.",
      keywords: ["ai", "troubleshoot", "suggest", "assist", "smart"],
    },
    {
      title: "Viewing Performance",
      content:
        'Go to "My Performance" to see your resolved ticket count, average resolution time, SLA compliance, and feedback ratings.',
      keywords: ["performance", "stats", "resolved", "rating", "metrics"],
    },
  ],
};

const ROLE_TITLES = {
  admin: "Admin Help",
  employee: "Employee Help",
  technician: "Technician Help",
};

/* ════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════ */

const HelpSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = (user?.role || "").toLowerCase();
  const guides = ROLE_GUIDES[role] || [];

  /* ── FAQ state ── */
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState("");

  /* ── Search state ── */
   const [search, setSearch] = useState("");
   const [expandedFAQ, setExpandedFAQ] = useState(null);

  /* ── Fetch FAQs ── */
  const fetchFAQs = async () => {
    setFaqLoading(true);
    setFaqError("");
    try {
      const data = await faqService.getFAQs();
      setFaqs(data.results || data);
    } catch {
      setFaqError("Some help resources could not be loaded.");
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
    return text.toLowerCase().includes(query);
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
    (f) => matchesText(f.question, q) || matchesText(f.answer || "", q)
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

  /* ── Render ── */
  return (
    <Container fluid className="py-4" style={{ maxWidth: "1080px" }}>
      {/* ── HEADER ── */}
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: "64px",
            height: "64px",
            backgroundColor: "#eef2ff",
          }}
        >
          <FiHelpCircle style={{ fontSize: "1.8rem", color: "#4f46e5" }} />
        </div>
        <h3 className="fw-bold mb-1">Help & Support</h3>
        <p className="text-muted mx-auto" style={{ maxWidth: "520px" }}>
          Find answers, learn how to use the system, or get help with your IT
          support requests.
        </p>
      </div>

      {/* ── SEARCH ── */}
      <div className="mb-4" style={{ maxWidth: "560px", margin: "0 auto" }}>
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0">
            <FaSearch className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search help topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-start-0 shadow-sm"
          />
          {search && (
            <Button
              variant="outline-secondary"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <FaTimes />
            </Button>
          )}
        </InputGroup>
      </div>

      {/* ── NO RESULTS ── */}
      {!hasAnyResult && (
        <div className="text-center py-5">
          <FiHelpCircle
            style={{ fontSize: "3rem", color: "#d1d5db" }}
          />
          <h5 className="mt-3 text-muted">No help topics found.</h5>
          <Button
            variant="outline-primary"
            size="sm"
            className="mt-2"
            onClick={() => setSearch("")}
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* ═══════ SECTION 1: QUICK HELP ═══════ */}
      {filteredQuickHelp.length > 0 && (
        <section className="mb-4">
          <h6 className="fw-bold mb-3 text-uppercase small text-muted">
            Quick Help
          </h6>
          <Row className="g-3">
            {filteredQuickHelp.map((item) => (
              <Col md={6} lg={4} key={item.id}>
                <Card
                  className="border-0 shadow-sm h-100"
                  style={{ cursor: "default" }}
                >
                  <Card.Body className="d-flex align-items-start gap-3 p-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: item.bgColor,
                      }}
                    >
                      <span style={{ color: item.color, fontSize: "1.1rem" }}>
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ fontSize: "0.92rem" }}>
                        {item.title}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.82rem", lineHeight: "1.5" }}
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

      {/* ═══════ SECTION 2: ROLE-BASED GUIDES ═══════ */}
      {filteredGuides.length > 0 && (
        <section className="mb-4">
          <h6 className="fw-bold mb-3 text-uppercase small text-muted">
            {ROLE_TITLES[role] || "Help Guides"}
          </h6>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {filteredGuides.map((guide, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-start gap-3 px-3 py-3"
                  style={{
                    borderBottom:
                      idx < filteredGuides.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#e0e7ff",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#4f46e5",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div
                      className="fw-semibold mb-1"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {guide.title}
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.84rem", lineHeight: "1.6" }}
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

      {/* ═══════ SECTION 3: KNOWLEDGE BASE ═══════ */}
      {!q && (
        <section className="mb-4">
          <Card
            className="border-0 shadow-sm"
            style={{
              borderLeft: "4px solid #4f46e5",
            }}
          >
            <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#eef2ff",
                  }}
                >
                  <FaBook style={{ fontSize: "1.2rem", color: "#4f46e5" }} />
                </div>
                <div>
                  <div className="fw-semibold">Knowledge Base</div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.84rem" }}
                  >
                    Browse our knowledge base for detailed answers and
                    troubleshooting information.
                  </div>
                </div>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={goKB}
                className="flex-shrink-0"
              >
                <FaBook className="me-1" /> Browse Knowledge Base
              </Button>
            </Card.Body>
          </Card>
        </section>
      )}

      {/* ═══════ SECTION 4: FAQ ACCORDION ═══════ */}
      <section className="mb-4">
        <h6 className="fw-bold mb-3 text-uppercase small text-muted">
          Frequently Asked Questions
        </h6>

        {faqLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading help resources...</p>
          </div>
        ) : faqError ? (
          <Alert variant="warning">
            {faqError}
            <Button
              variant="link"
              size="sm"
              className="p-0 ms-2"
              onClick={fetchFAQs}
            >
              Try Again
            </Button>
          </Alert>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-5">
            <FaBook style={{ fontSize: "3rem", color: "#d1d5db" }} />
            <h5 className="mt-3 text-muted">
              {q
                ? "No articles match your search"
                : "No knowledge base articles are currently available."}
            </h5>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredFAQs.map((faq) => {
              const isOpen = expandedFAQ === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border rounded-3 shadow-sm overflow-hidden"
                  style={{ transition: "box-shadow 0.15s" }}
                >
                  <div
                    className="d-flex align-items-start gap-3 p-3"
                    style={{
                      cursor: "pointer",
                      backgroundColor: isOpen ? "#f9fafb" : "#fff",
                      borderBottom: isOpen ? "1px solid #e5e7eb" : "none",
                    }}
                    onClick={() =>
                      setExpandedFAQ(isOpen ? null : faq.id)
                    }
                  >
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
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isOpen ? (
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

                  {isOpen && (
                    <div className="px-3 pb-3" style={{ marginLeft: "0px" }}>
                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.88rem",
                          lineHeight: "1.75",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {faq.answer || faq.content || faq.details || faq.description || "No answer available yet."}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════ SECTION 5: SUPPORT ACTIONS ═══════ */}
      {!q && (
        <section className="mb-4">
          <h6 className="fw-bold mb-3 text-uppercase small text-muted">
            Need More Help?
          </h6>
          <Row className="g-3">
            {/* Raise Ticket — Employee only */}
            {role === "employee" && (
              <Col md={4} sm={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-3">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                      style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: "#e0e7ff",
                      }}
                    >
                      <FaTicketAlt
                        style={{ color: "#4f46e5", fontSize: "1.1rem" }}
                      />
                    </div>
                    <div className="fw-semibold small mb-1">
                      Raise a Support Ticket
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={goRaiseTicket}
                    >
                      Raise Complaint
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* Contact IT Support — Admin/Technician */}
            {role !== "employee" && (
              <Col md={4} sm={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-3">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                      style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: "#d1fae5",
                      }}
                    >
                      <FaHeadset
                        style={{ color: "#059669", fontSize: "1.1rem" }}
                      />
                    </div>
                    <div className="fw-semibold small mb-1">
                      Contact IT Support
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                      Please contact your organization&apos;s IT Support team
                      for assistance.
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* Knowledge Base */}
            <Col md={4} sm={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "#ede9fe",
                    }}
                  >
                    <FaBook
                      style={{ color: "#7c3aed", fontSize: "1.1rem" }}
                    />
                  </div>
                  <div className="fw-semibold small mb-1">
                    Knowledge Base
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={goKB}
                  >
                    Browse Knowledge Base
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Notifications */}
            <Col md={4} sm={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "#fef3c7",
                    }}
                  >
                    <FaBell
                      style={{ color: "#d97706", fontSize: "1.1rem" }}
                    />
                  </div>
                  <div className="fw-semibold small mb-1">
                    Notifications
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={goNotifications}
                  >
                    View Notifications
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      )}

      {/* ═══════ SECTION 6: CONTACT SUPPORT ═══════ */}
      {!q && (
        <section className="mb-3">
          <Card
            className="border-0 shadow-sm bg-light"
            style={{ borderLeft: "4px solid #0891b2" }}
          >
            <Card.Body className="d-flex align-items-center gap-3 p-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#cffafe",
                }}
              >
                <FaHeadset style={{ color: "#0891b2", fontSize: "1rem" }} />
              </div>
              <div>
                <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                  Still need help?
                </div>
                <div
                  className="text-muted"
                  style={{ fontSize: "0.84rem" }}
                >
                  Please contact your organization&apos;s IT Support team for
                  assistance with technical issues.
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>
      )}
    </Container>
  );
};

export default HelpSupport;