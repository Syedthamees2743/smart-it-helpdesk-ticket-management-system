import React from "react";
import "../../styles/StatCard.css"

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  color = "primary",
  trend,
  trendType = "up",
}) => {
  const colorMap = {
    primary: "#2563eb",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#0891b2",
    secondary: "#64748b",
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div
      className="stat-card-pro"
      style={{ "--card-color": selectedColor }}
    >
      {/* Decorative top bar */}
      <div className="stat-card-pro-bar" />

      <div className="stat-card-pro-body">
        {/* Icon */}
        <div className="stat-card-pro-icon">{icon}</div>

        {/* Content */}
        <div className="stat-card-pro-info">
          <div className="stat-card-pro-label">{title}</div>
          <div className="stat-card-pro-value">{value}</div>

          <div className="stat-card-pro-bottom">
            {trend && (
              <span
                className={`stat-card-pro-trend ${
                  trendType === "down"
                    ? "trend-down"
                    : "trend-up"
                }`}
              >
                <i
                  className={`bi ${
                    trendType === "down"
                      ? "bi-arrow-down-short"
                      : "bi-arrow-up-short"
                  }`}
                />
                {trend}
              </span>
            )}

            {subtitle && (
              <span className="stat-card-pro-subtitle">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;