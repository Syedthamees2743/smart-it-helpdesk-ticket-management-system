import { NavLink } from "react-router-dom";
import { Nav } from "react-bootstrap";
import {
  FaTachometerAlt,
  FaUsers,
  FaBuilding,
  FaListAlt,
  FaTicketAlt,
  FaLaptop,
  FaQuestionCircle,
  FaStar,
  FaComments,
  FaUserEdit,
  FaCog,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";
import { FiHelpCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ role, mobile, onClick }) => {
  const { logout } = useAuth();

  const menus = {
    admin: [
      {
        path: "/admin",
        icon: <FaTachometerAlt />,
        label: "Dashboard",
        end: true,
      },
      { path: "/admin/users", icon: <FaUsers />, label: "Users" },
      {
        path: "/admin/departments",
        icon: <FaBuilding />,
        label: "Departments",
      },
      {
        path: "/admin/categories",
        icon: <FaListAlt />,
        label: "Issue Categories",
      },
      { path: "/admin/tickets", icon: <FaTicketAlt />, label: "Tickets" },
      {
        path: "/admin/tickets/:id",
        icon: <FaTicketAlt />,
        label: "Ticket Details",
        hidden: true,
      },
      { path: "/admin/assets", icon: <FaLaptop />, label: "Assets" },
      {
        path: "/admin/asset-categories",
        icon: <FaListAlt />,
        label: "Asset Categories",
      },
      { path: "/admin/faqs", icon: <FaQuestionCircle />, label: "FAQ / KB" },
      { path: "/admin/feedbacks", icon: <FaComments />, label: "Feedback" },
      {
        path: "/admin/notifications",
        icon: <FaBell />,
        label: "Notifications",
      },
      {
        path: "/admin/technician-performance",
        icon: <FaTachometerAlt />,
        label: "Tech Performance",
      },
      { path: "/admin/reports", icon: <FaStar />, label: "Reports" },
    ],
    employee: [
      {
        path: "/employee",
        icon: <FaTachometerAlt />,
        label: "Dashboard",
        end: true,
      },
      {
        path: "/employee/tickets/new",
        icon: <FaTicketAlt />,
        label: "Raise Complaint",
      },
      { path: "/employee/tickets", icon: <FaListAlt />, label: "My Tickets" },
      { path: "/employee/assets", icon: <FaLaptop />, label: "My Assets" },
      {
        path: "/employee/notifications",
        icon: <FaBell />,
        label: "Notifications",
      },
      {
        path: "/employee/faqs",
        icon: <FaQuestionCircle />,
        label: "Knowledge Base",
      },
    ],
    technician: [
      {
        path: "/technician",
        icon: <FaTachometerAlt />,
        label: "Dashboard",
        end: true,
      },
      {
        path: "/technician/tickets",
        icon: <FaTicketAlt />,
        label: "Assigned Tickets",
      },
      {
        path: "/technician/performance",
        icon: <FaTachometerAlt />,
        label: "My Performance",
      },
      {
        path: "/technician/notifications",
        icon: <FaBell />,
        label: "Notifications",
      },
      {
        path: "/technician/faqs",
        icon: <FaQuestionCircle />,
        label: "Knowledge Base",
      },
    ],
  };

  const currentMenu = menus[role] || [];

  const handleClose = () => {
    if (onClick) onClick();
  };

  return (
    <div className="d-flex flex-column h-100 bg-dark">
      {/* ── LOGO — Fixed Top ── */}
      <div
        className="p-3 border-bottom border-secondary text-center"
        style={{ flexShrink: 0 }}
      >
        <h5 className="text-white mb-0 fw-bold">IT Service Desk</h5>
        <small
          className="text-secondary text-uppercase"
          style={{ fontSize: "0.7rem" }}
        >
          Management Portal
        </small>
      </div>

      {/* ── NAV LINKS — Scrollable Middle ── */}
      <div
        className="sidebar-nav-scroll flex-grow-1"
        style={{ minHeight: 0, overflowY: "auto" }}
      >
        <Nav className="flex-column p-2">
          {currentMenu
            .filter((item) => !item.hidden)
            .map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
                onClick={handleClose}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
        </Nav>
      </div>

      {/* ── BOTTOM BAR — Fixed Bottom (Help / Settings / Profile / Logout) ── */}
      <div
        className="border-top border-secondary"
        style={{ flexShrink: 0, backgroundColor: "rgba(0,0,0,0.2)" }}
      >
        <NavLink
          to={`/${role}/help`}
          className={({ isActive }) =>
            `sidebar-link d-block ${isActive ? "active" : ""}`
          }
          onClick={handleClose}
          style={{ borderRadius: 0, paddingLeft: "1.5rem" }}
        >
          <FiHelpCircle /> Help & Support
        </NavLink>
        <NavLink
          to={`/${role}/settings`}
          className={({ isActive }) =>
            `sidebar-link d-block ${isActive ? "active" : ""}`
          }
          onClick={handleClose}
          style={{ borderRadius: 0, paddingLeft: "1.5rem" }}
        >
          <FaCog /> Settings
        </NavLink>
        <NavLink
          to={`/${role}/profile`}
          className={({ isActive }) =>
            `sidebar-link d-block ${isActive ? "active" : ""}`
          }
          onClick={handleClose}
          style={{ borderRadius: 0, paddingLeft: "1.5rem" }}
        >
          <FaUserEdit /> My Profile
        </NavLink>
        <div
          className="sidebar-link d-block"
          style={{
            borderRadius: 0,
            paddingLeft: "1.5rem",
            cursor: "pointer",
            color: "#f87171",
          }}
          onClick={() => {
            logout();
            handleClose();
          }}
        >
          <FaSignOutAlt className="me-2" /> Logout
        </div>
      </div>
    </div>
  );
};

export default Sidebar;