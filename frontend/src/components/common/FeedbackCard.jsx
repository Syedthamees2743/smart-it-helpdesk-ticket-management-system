import React from "react";
import { FaStar, FaQuoteLeft, FaUserCircle } from "react-icons/fa";
import "../../styles/FeedbackCard.css";

/* ── Rating-based themes ── */
const THEMES = {
  good: {
    label: "Excellent Service",
    bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    border: "#bbf7d0",
    iconBg: "linear-gradient(135deg, #16a34a, #22c55e)",
    accent: "#15803d",
  },
  ok: {
    label: "Average Service",
    bg: "linear-gradient(135deg, #fffbeb, #fef3c7)",
    border: "#fde68a",
    iconBg: "linear-gradient(135deg, #d97706, #f59e0b)",
    accent: "#b45309",
  },
  poor: {
    label: "Needs Improvement",
    bg: "linear-gradient(135deg, #fef2f2, #fee2e2)",
    border: "#fecaca",
    iconBg: "linear-gradient(135deg, #dc2626, #ef4444)",
    accent: "#b91c1c",
  },
};

const RATING_TEXT = ["Very Poor", "Poor", "Average", "Good", "Excellent"];

const Stars = ({ rating }) => (
  <div className="fb-stars">
    {[1, 2, 3, 4, 5].map((i) => (
      <FaStar
        key={i}
        style={{ color: i <= rating ? "#f59e0b" : "#e2e8f0" }}
      />
    ))}
  </div>
);

const FeedbackCard = ({ feedback, title = "Employee Feedback" }) => {
  if (!feedback) return null;

  const rating = Number(feedback.rating) || 0;
  const theme = rating >= 4 ? THEMES.good : rating === 3 ? THEMES.ok : THEMES.poor;

  // Model field: 'review'
  const review = feedback.review || feedback.comment;
  const employeeName = feedback.employee_name || "Employee";
  const createdAt = feedback.created_at
    ? new Date(feedback.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="fb-card" style={{ background: theme.bg, borderColor: theme.border }}>
      {/* ── Header ── */}
      <div className="fb-header">
        <div className="fb-header-icon" style={{ background: theme.iconBg }}>
          <FaQuoteLeft />
        </div>
        <div className="flex-grow-1">
          <div className="fb-title">{title}</div>
          <div className="fb-sub" style={{ color: theme.accent }}>
            {theme.label}
          </div>
        </div>
        <div className="fb-score" style={{ color: theme.accent }}>
          {rating}<span className="fb-score-max">/5</span>
        </div>
      </div>

      {/* ── Stars ── */}
      <div className="fb-stars-row">
        <Stars rating={rating} />
        <span className="fb-rating-text" style={{ color: theme.accent }}>
          {RATING_TEXT[rating - 1] || "—"}
        </span>
      </div>

      {/* ── Review ── */}
      {review && (
        <div className="fb-review">
          <p className="mb-0">"{review}"</p>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="fb-footer">
        <div className="fb-employee">
          <FaUserCircle className="fb-employee-icon" />
          <span className="fb-employee-name">{employeeName}</span>
        </div>
        {createdAt && <span className="fb-date">{createdAt}</span>}
      </div>
    </div>
  );
};

export default FeedbackCard;