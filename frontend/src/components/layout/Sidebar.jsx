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

  // =========================================================
  // MENU
  // =========================================================

  const menus = {
    admin: [
      {
        path: "/admin",
        icon: <FaTachometerAlt />,
        label: "Dashboard",
        end: true,
      },

      {
        path: "/admin/users",
        icon: <FaUsers />,
        label: "Users",
      },

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

      {
        path: "/admin/tickets",
        icon: <FaTicketAlt />,
        label: "Tickets",
      },

      {
        path: "/admin/tickets/:id",
        icon: <FaTicketAlt />,
        label: "Ticket Details",
        hidden: true,
      },

      {
        path: "/admin/assets",
        icon: <FaLaptop />,
        label: "Assets",
      },

      {
        path: "/admin/asset-categories",
        icon: <FaListAlt />,
        label: "Asset Categories",
      },

      {
        path: "/admin/faqs",
        icon: <FaQuestionCircle />,
        label: "FAQ / KB",
      },

      {
        path: "/admin/feedbacks",
        icon: <FaComments />,
        label: "Feedback",
      },

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

      {
        path: "/admin/reports",
        icon: <FaStar />,
        label: "Reports",
      },
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

      {
        path: "/employee/tickets",
        icon: <FaListAlt />,
        label: "My Tickets",
      },

      {
        path: "/employee/assets",
        icon: <FaLaptop />,
        label: "My Assets",
      },

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

  // =========================================================
  // CLOSE MOBILE SIDEBAR
  // =========================================================

  const handleClose = () => {
    if (onClick) {
      onClick();
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    handleClose();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="sidebar-wrapper">

      {/* =====================================================
          LOGO
          ===================================================== */}
      <div className="sidebar-logo">
        <h5>IT Service Desk</h5>

        <small>
          MANAGEMENT PORTAL
        </small>
      </div>

      {/* =====================================================
          MAIN NAVIGATION
          ===================================================== */}
      <div className="sidebar-nav-scroll">

        <Nav className="flex-column p-2">

          {currentMenu
            .filter((item) => !item.hidden)
            .map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
                onClick={handleClose}
              >
                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </NavLink>
            ))}

        </Nav>
      </div>

      {/* =====================================================
          BOTTOM MENU
          ===================================================== */}
      <div className="sidebar-bottom">

        {/* Help */}
        <NavLink
          to={`/${role}/help`}
          className={({ isActive }) =>
            `sidebar-link bottom-link ${
              isActive ? "active" : ""
            }`
          }
          onClick={handleClose}
        >
          <FiHelpCircle />
          <span>Help & Support</span>
        </NavLink>

        {/* Settings */}
        <NavLink
          to={`/${role}/settings`}
          className={({ isActive }) =>
            `sidebar-link bottom-link ${
              isActive ? "active" : ""
            }`
          }
          onClick={handleClose}
        >
          <FaCog />
          <span>Settings</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to={`/${role}/profile`}
          className={({ isActive }) =>
            `sidebar-link bottom-link ${
              isActive ? "active" : ""
            }`
          }
          onClick={handleClose}
        >
          <FaUserEdit />
          <span>My Profile</span>
        </NavLink>

        {/* Logout */}
        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </div>
    </div>
  );
};

export default Sidebar;