import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const RecentTicketsTable = ({
  tickets,
  employeeView = false,
  basePath = "/admin/tickets/",
}) => {
  const navigate = useNavigate();

  /* --------------------------------
     Empty State
  -------------------------------- */
  if (!tickets || tickets.length === 0) {
    return (
      <div className="tickets-empty-state">
        <div className="tickets-empty-icon">
          <i className="bi bi-ticket-perforated"></i>
        </div>

        <h6>No Recent Tickets</h6>

        <p>
          There are no support tickets to display at the moment.
        </p>
      </div>
    );
  }

  /* --------------------------------
     Helpers
  -------------------------------- */

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatPriority = (priority) => {
    if (!priority) return "Normal";

    return (
      priority.charAt(0).toUpperCase() +
      priority.slice(1).toLowerCase()
    );
  };

  const getStatusClass = (status) => {
    if (!status) return "badge-status-default";

    return `badge-status-${status
      .toLowerCase()
      .replaceAll(" ", "_")}`;
  };

  const getPriorityClass = (priority) => {
    if (!priority) return "badge-priority-default";

    return `badge-priority-${priority.toLowerCase()}`;
  };

  const getSlaClass = (sla) => {
    if (!sla) return "sla-normal";

    const value = sla.toLowerCase();

    if (
      value.includes("breach") ||
      value.includes("overdue") ||
      value.includes("expired")
    ) {
      return "sla-breached";
    }

    if (
      value.includes("warning") ||
      value.includes("due")
    ) {
      return "sla-warning";
    }

    return "sla-normal";
  };

  const handleView = (ticketId) => {
    if (!ticketId) return;

    navigate(`${basePath}${ticketId}`);
  };

  return (
    <div className="recent-tickets-wrapper">
      <Table
        hover
        responsive
        className="itsm-table recent-tickets-table align-middle mb-0"
      >
        <thead>
          <tr>
            <th>
              {employeeView ? "Ticket" : "Ticket #"}
            </th>

            {!employeeView && (
              <th>Employee</th>
            )}

            {!employeeView && (
              <th>Category</th>
            )}

            <th>Priority</th>

            {!employeeView && (
              <th>Technician</th>
            )}

            <th>Status</th>

            <th>SLA</th>

            <th>Date</th>

            <th className="text-end">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket, index) => {
            const ticketId =
              ticket.id ||
              ticket.ticket_number ||
              ticket.ticketNumber;

            const title =
              ticket.title ||
              ticket.subject ||
              "Untitled Ticket";

            const employee =
              ticket.employee ||
              ticket.employee_name ||
              "—";

            const category =
              ticket.category ||
              ticket.category_name ||
              "—";

            const technician =
              ticket.tech ||
              ticket.technician ||
              ticket.technician_name ||
              "Unassigned";

            const priority =
              ticket.priority || "normal";

            const status =
              ticket.status || "open";

            const sla =
              ticket.sla ||
              ticket.sla_status ||
              "Normal";

            const date =
              ticket.date ||
              ticket.created_at ||
              "—";

            return (
              <tr key={ticketId || index}>

                {/* Ticket */}
                <td>
                  <div className="ticket-cell">

                    <div className="ticket-icon">
                      <i className="bi bi-ticket-detailed"></i>
                    </div>

                    <div className="ticket-info">

                      <div className="ticket-number">
                        {employeeView
                          ? title
                          : ticketId || "—"}
                      </div>

                      {employeeView && ticketId && (
                        <div className="ticket-reference">
                          #{ticketId}
                        </div>
                      )}

                    </div>
                  </div>
                </td>

                {/* Employee */}
                {!employeeView && (
                  <td>
                    <div className="employee-cell">
                      <div className="employee-avatar">
                        {employee
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span>
                        {employee}
                      </span>
                    </div>
                  </td>
                )}

                {/* Category */}
                {!employeeView && (
                  <td>
                    <span className="category-text">
                      {category}
                    </span>
                  </td>
                )}

                {/* Priority */}
                <td>
                  <Badge
                    className={`ticket-badge ${getPriorityClass(
                      priority
                    )}`}
                  >
                    <span className="badge-dot"></span>
                    {formatPriority(priority)}
                  </Badge>
                </td>

                {/* Technician */}
                {!employeeView && (
                  <td>
                    {technician === "Unassigned" ? (
                      <span className="unassigned-text">
                        <i className="bi bi-person-dash me-1"></i>
                        Unassigned
                      </span>
                    ) : (
                      <div className="technician-cell">
                        <i className="bi bi-person-gear"></i>
                        <span>{technician}</span>
                      </div>
                    )}
                  </td>
                )}

                {/* Status */}
                <td>
                  <Badge
                    className={`ticket-badge ${getStatusClass(
                      status
                    )}`}
                  >
                    {formatStatus(status)}
                  </Badge>
                </td>

                {/* SLA */}
                <td>
                  <span
                    className={`sla-status ${getSlaClass(
                      sla
                    )}`}
                  >
                    <span className="sla-dot"></span>
                    {sla}
                  </span>
                </td>

                {/* Date */}
                <td>
                  <span className="ticket-date">
                    {date}
                  </span>
                </td>

                {/* Action */}
                <td className="text-end">
                  <Button
                    variant="light"
                    size="sm"
                    className="ticket-view-btn"
                    type="button"
                    onClick={() =>
                      handleView(ticketId)
                    }
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