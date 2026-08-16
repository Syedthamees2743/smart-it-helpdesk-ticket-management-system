import { Table, Button, Badge } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const RecentTicketsTable = ({
  tickets,
  employeeView = false,
  basePath = "/admin/tickets/",
}) => {
  const navigate = useNavigate();

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        No recent tickets found.
      </div>
    );
  }

  return (
    <Table hover responsive className="itsm-table align-middle mb-0">
      <thead>
        <tr>
          <th>{employeeView ? "Title" : "Ticket #"}</th>
          {!employeeView && <th>Employee</th>}
          {!employeeView && <th>Category</th>}
          <th>Priority</th>
          {!employeeView && <th>Technician</th>}
          <th>Status</th>
          <th>SLA</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t, idx) => (
          <tr key={idx}>
            <td className="fw-medium">{employeeView ? t.title : t.id}</td>
            {!employeeView && <td>{t.employee}</td>}
            {!employeeView && <td>{t.category}</td>}
            <td>
              <Badge className={`badge-priority-${t.priority.toLowerCase()}`}>
                {t.priority}
              </Badge>
            </td>
            {!employeeView && <td className="text-muted">{t.tech}</td>}
            <td>
              <Badge
                className={`badge-status-${t.status.toLowerCase().replace(" ", "_")}`}
              >
                {t.status}
              </Badge>
            </td>
            <td>
              <span
                className={`fw-bold ${t.sla === "Breached" ? "text-danger" : "text-success"}`}
              >
                {t.sla}
              </span>
            </td>
            <td className="text-muted">{t.date}</td>
            <td>
              {/* FIXED: Properly navigates using the ticket's real ID */}
              <Button
                variant="outline-primary"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`${basePath}${t.id}`);
                }}
              >
                <FaEye className="me-1" />
                View
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default RecentTicketsTable;
