import React from "react";

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
    <div className="stat-card">
      <div className="stat-card-content">

        {/* Icon */}
        <div
          className="stat-icon"
          style={{
            backgroundColor: `${selectedColor}12`,
            color: selectedColor,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="stat-info">
          <div className="stat-title">
            {title}
          </div>

          <div className="stat-value">
            {value}
          </div>

          <div className="stat-bottom">
            {trend && (
              <span
                className={`stat-trend ${
                  trendType === "down"
                    ? "stat-trend-down"
                    : "stat-trend-up"
                }`}
              >
                <i
                  className={`bi ${
                    trendType === "down"
                      ? "bi-arrow-down"
                      : "bi-arrow-up"
                  }`}
                />
                {trend}
              </span>
            )}

            {subtitle && (
              <span className="stat-subtitle">
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