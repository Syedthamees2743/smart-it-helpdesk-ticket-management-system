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
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaChevronRight,
} from "react-icons/fa";

import { FiHelpCircle } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ role, mobile, onClick }) => {
  const { user, logout } = useAuth();

  const menus = {
    admin: [
      { path: "/admin", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
      { path: "/admin/users", icon: <FaUsers />, label: "Users" },
      { path: "/admin/pending-requests", icon: <FiHelpCircle />, label: "Pending Requests" },
      { path: "/admin/departments", icon: <FaBuilding />, label: "Departments" },
      { path: "/admin/categories", icon: <FaListAlt />, label: "Issue Categories" },
      { path: "/admin/tickets", icon: <FaTicketAlt />, label: "Tickets" },
      { path: "/admin/assets", icon: <FaLaptop />, label: "Assets" },
      { path: "/admin/asset-categories", icon: <FaListAlt />, label: "Asset Categories" },
      { path: "/admin/faqs", icon: <FaQuestionCircle />, label: "FAQ / KB" },
      { path: "/admin/feedbacks", icon: <FaComments />, label: "Feedback" },
      { path: "/admin/notifications", icon: <FaBell />, label: "Notifications" },
      { path: "/admin/technician-performance", icon: <FaTachometerAlt />, label: "Tech Performance" },
      { path: "/admin/reports", icon: <FaStar />, label: "Reports" },
    ],
    employee: [
      { path: "/employee", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
      { path: "/employee/tickets/new", icon: <FaTicketAlt />, label: "Raise Complaint" },
      { path: "/employee/tickets", icon: <FaListAlt />, label: "My Tickets" },
      { path: "/employee/assets", icon: <FaLaptop />, label: "My Assets" },
      { path: "/employee/notifications", icon: <FaBell />, label: "Notifications" },
      { path: "/employee/faqs", icon: <FaQuestionCircle />, label: "Knowledge Base" },
    ],
    technician: [
      { path: "/technician", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
      { path: "/technician/tickets", icon: <FaTicketAlt />, label: "Assigned Tickets" },
      { path: "/technician/performance", icon: <FaTachometerAlt />, label: "My Performance" },
      { path: "/technician/notifications", icon: <FaBell />, label: "Notifications" },
      { path: "/technician/faqs", icon: <FaQuestionCircle />, label: "Knowledge Base" },
    ],
  };

  const currentMenu = menus[role] || [];

  const handleClose = () => {
    if (onClick) onClick();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    handleClose();
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || "";
    const last = user?.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getRoleLabel = () => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <aside className="sidebar-wrapper sidebar-anim">
      {/* BRAND */}
      <div className="sidebar-brand brand-anim">
        <div className="sidebar-brand-icon">
          <span>IT</span>
        </div>
        <div className="sidebar-brand-text">
          <h5>ServiceDesk</h5>
          <span>IT Support System</span>
        </div>
      </div>

      {/* MAIN NAVIGATION */}
      <div className="sidebar-content">
        <div className="sidebar-section-title section-anim">MAIN MENU</div>
        <div className="sidebar-nav-scroll">
          <Nav className="flex-column">
            {currentMenu
              .filter((item) => !item.hidden)
              .map((item, index) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar-link link-anim ${isActive ? "active" : ""}`
                  }
                  style={{ animationDelay: `${0.05 * index + 0.2}s` }}
                  onClick={handleClose}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span className="sidebar-link-text">{item.label}</span>
                  <span className="sidebar-link-arrow">
                    <FaChevronRight />
                  </span>
                </NavLink>
              ))}
          </Nav>
        </div>
      </div>

      {/* USER MINI PROFILE */}
      <div className="sidebar-profile-card profile-anim">
        <div className="sidebar-avatar">{getInitials()}</div>
        <div className="sidebar-profile-details">
          <div className="sidebar-profile-name">
            {user?.first_name || user?.last_name
              ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
              : user?.username || "User"}
          </div>
          <div className="sidebar-profile-role">
            <span className="sidebar-status-dot"></span>
            {getRoleLabel()}
          </div>
        </div>
      </div>

      {/* BOTTOM AREA */}
      <div className="sidebar-bottom">
        <div className="sidebar-section-title section-anim">ACCOUNT</div>

        <NavLink
          to={`/${role}/profile`}
          className={({ isActive }) =>
            `sidebar-link link-anim ${isActive ? "active" : ""}`
          }
          style={{ animationDelay: "0.5s" }}
          onClick={handleClose}
        >
          <span className="sidebar-link-icon"><FaUserCircle /></span>
          <span className="sidebar-link-text">My Profile</span>
          <span className="sidebar-link-arrow"><FaChevronRight /></span>
        </NavLink>

        <NavLink
          to={`/${role}/help`}
          className={({ isActive }) =>
            `sidebar-link link-anim ${isActive ? "active" : ""}`
          }
          style={{ animationDelay: "0.55s" }}
          onClick={handleClose}
        >
          <span className="sidebar-link-icon"><FiHelpCircle /></span>
          <span className="sidebar-link-text">Help & Support</span>
          <span className="sidebar-link-arrow"><FaChevronRight /></span>
        </NavLink>

        <NavLink
          to={`/${role}/settings`}
          className={({ isActive }) =>
            `sidebar-link link-anim ${isActive ? "active" : ""}`
          }
          style={{ animationDelay: "0.6s" }}
          onClick={handleClose}
        >
          <span className="sidebar-link-icon"><FaCog /></span>
          <span className="sidebar-link-text">Settings</span>
          <span className="sidebar-link-arrow"><FaChevronRight /></span>
        </NavLink>

        <button
          type="button"
          className="sidebar-logout link-anim"
          style={{ animationDelay: "0.65s" }}
          onClick={handleLogout}
        >
          <span className="sidebar-link-icon"><FaSignOutAlt /></span>
          <span className="sidebar-link-text">Sign out</span>
          <span className="sidebar-link-arrow"><FaChevronRight /></span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;