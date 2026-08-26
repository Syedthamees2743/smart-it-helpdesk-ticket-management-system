import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../styles/RecentTicketsTable.css"


const RecentTicketsTable = ({
  tickets,
  employeeView = false,
  basePath = "/admin/tickets/",
}) => {
  const navigate = useNavigate();

  /* Empty State */
  if (!tickets || tickets.length === 0) {
    return (
      <div className="rt-empty-state">
        <div className="rt-empty-icon">
          <i className="bi bi-ticket-perforated"></i>
        </div>
        <h6 className="rt-empty-title">No Recent Tickets</h6>
        <p className="rt-empty-text">
          There are no support tickets to display at the moment.
        </p>
      </div>
    );
  }

  /* Helpers */
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatPriority = (priority) => {
    if (!priority) return "Normal";
    return (
      priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    );
  };

  const getStatusClass = (status) => {
    if (!status) return "rt-badge-default";
    return `rt-status-${status.toLowerCase().replaceAll(" ", "_")}`;
  };

  const getPriorityClass = (priority) => {
    if (!priority) return "rt-priority-default";
    return `rt-priority-${priority.toLowerCase()}`;
  };

  const getSlaClass = (sla) => {
    if (!sla) return "rt-sla-normal";
    const value = sla.toLowerCase();
    if (
      value.includes("breach") ||
      value.includes("overdue") ||
      value.includes("expired")
    ) {
      return "rt-sla-breached";
    }
    if (value.includes("warning") || value.includes("due")) {
      return "rt-sla-warning";
    }
    return "rt-sla-normal";
  };

  const getInitials = (name) => {
    if (!name || name === "—") return "?";
    return name.charAt(0).toUpperCase();
  };

  const handleView = (ticketId) => {
    if (!ticketId) return;
    navigate(`${basePath}${ticketId}`);
  };

  return (
    <div className="rt-wrapper">
      <Table
        hover
        responsive
        className="rt-table align-middle mb-0"
      >
        <thead>
          <tr>
            <th>{employeeView ? "Ticket" : "Ticket #"}</th>
            {!employeeView && <th>Employee</th>}
            {!employeeView && <th>Category</th>}
            <th>Priority</th>
            {!employeeView && <th>Technician</th>}
            <th>Status</th>
            <th>SLA</th>
            <th>Date</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket, index) => {
            const ticketId =
              ticket.id || ticket.ticket_number || ticket.ticketNumber;
            const title = ticket.title || ticket.subject || "Untitled Ticket";
            const employee =
              ticket.employee || ticket.employee_name || "—";
            const category =
              ticket.category || ticket.category_name || "—";
            const technician =
              ticket.tech ||
              ticket.technician ||
              ticket.technician_name ||
              "Unassigned";
            const priority = ticket.priority || "normal";
            const status = ticket.status || "open";
            const sla = ticket.sla || ticket.sla_status || "Normal";
            const date = ticket.date || ticket.created_at || "—";

            return (
              <tr key={ticketId || index}>
                {/* Ticket */}
                <td>
                  <div className="rt-ticket-cell">
                    <div className="rt-ticket-icon">
                      <i className="bi bi-ticket-detailed"></i>
                    </div>
                    <div className="rt-ticket-info">
                      <div className="rt-ticket-number">
                        {employeeView ? title : ticketId || "—"}
                      </div>
                      {employeeView && ticketId && (
                        <div className="rt-ticket-ref">#{ticketId}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Employee */}
                {!employeeView && (
                  <td>
                    <div className="rt-employee-cell">
                      <div className="rt-employee-avatar">
                        {getInitials(employee)}
                      </div>
                      <span className="rt-employee-name">{employee}</span>
                    </div>
                  </td>
                )}

                {/* Category */}
                {!employeeView && (
                  <td>
                    <span className="rt-category-text">{category}</span>
                  </td>
                )}

                {/* Priority */}
                <td>
                  <Badge className={`rt-badge ${getPriorityClass(priority)}`}>
                    <span className="rt-badge-dot"></span>
                    {formatPriority(priority)}
                  </Badge>
                </td>

                {/* Technician */}
                {!employeeView && (
                  <td>
                    {technician === "Unassigned" ? (
                      <span className="rt-unassigned">
                        <i className="bi bi-person-dash me-1"></i>
                        Unassigned
                      </span>
                    ) : (
                      <div className="rt-tech-cell">
                        <div className="rt-tech-avatar">
                          {getInitials(technician)}
                        </div>
                        <span>{technician}</span>
                      </div>
                    )}
                  </td>
                )}

                {/* Status */}
                <td>
                  <Badge className={`rt-badge ${getStatusClass(status)}`}>
                    {formatStatus(status)}
                  </Badge>
                </td>

                {/* SLA */}
                <td>
                  <span className={`rt-sla ${getSlaClass(sla)}`}>
                    <span className="rt-sla-dot"></span>
                    {sla}
                  </span>
                </td>

                {/* Date */}
                <td>
                  <span className="rt-date">{date}</span>
                </td>

                {/* Action */}
                <td className="text-end">
                  <Button
                    className="rt-view-btn"
                    onClick={() => handleView(ticketId)}
                    disabled={!ticketId}
                    title="View ticket"
                  >
                    <FaEye />
                    <span>View</span>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default RecentTicketsTable;