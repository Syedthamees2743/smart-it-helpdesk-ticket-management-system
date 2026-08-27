import React from 'react';

const ReopenReasonBanner = ({ ticket }) => {
  if (!ticket?.reopen_reason) return null;

  const isActive = ticket.status === 'reopened';

  return (
    <div className={`reopen-banner ${isActive ? 'reopen-banner-active' : 'reopen-banner-history'}`}>
      <div className="reopen-banner-icon">
        <i className="bi bi-arrow-counterclockwise"></i>
      </div>

      <div className="reopen-banner-body">
        <div className="reopen-banner-title">
          {isActive ? 'Ticket Reopened by Employee' : 'Reopen History'}
          <span className="reopen-banner-meta">
            {ticket.employee_name ? ` • ${ticket.employee_name}` : ''}
          </span>
        </div>
        <div className="reopen-banner-reason">
          <span className="reopen-reason-label">Reason:</span> {ticket.reopen_reason}
        </div>
      </div>

      {isActive && (
        <span className="reopen-banner-badge">
          <i className="bi bi-exclamation-circle me-1"></i>Needs Attention
        </span>
      )}
    </div>
  );
};

export default ReopenReasonBanner;