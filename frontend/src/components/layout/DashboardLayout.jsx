import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  Offcanvas,
  Button,
  Dropdown,
} from "react-bootstrap";

import { Outlet, useNavigate } from "react-router-dom";

import {
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaCog,
  FaQuestionCircle,
  FaChevronDown,
  FaUser,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import NotificationBell from "../notifications/NotificationBell";

import "./Sidebar.css";

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // =========================================================
  // USER NAME
  // =========================================================

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    user?.username ||
    "User";

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = () => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";

    return (
      `${first}${last}`.toUpperCase() ||
      user?.username?.charAt(0)?.toUpperCase() ||
      "U"
    );
  };

  // =========================================================
  // ROLE LABEL
  // =========================================================

  const roleLabel =
    role?.charAt(0).toUpperCase() +
      role?.slice(1).toLowerCase() || "User";

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login");
    }
  };

  // =========================================================
  // MOBILE SIDEBAR
  // =========================================================

  const toggleSidebar = () => {
    setShowMobileSidebar((prev) => !prev);
  };

  const closeSidebar = () => {
    setShowMobileSidebar(false);
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goToProfile = () => {
    navigate(`/${role}/profile`);
  };

  const goToSettings = () => {
    navigate(`/${role}/settings`);
  };

  const goToHelp = () => {
    navigate(`/${role}/help`);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <Container
      fluid
      className="p-0 m-0 dashboard-layout"
      style={{
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        background: "#f8fafc",
      }}
    >
      <Row
        className="g-0 w-100"
        style={{
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

        <Col
          md="auto"
          className="d-none d-md-block p-0"
          style={{
            width: "260px",
            height: "100vh",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "260px",
              height: "100vh",
            }}
          >
            <Sidebar role={role} />
          </div>
        </Col>

        {/* =====================================================
            MOBILE SIDEBAR
        ===================================================== */}

        <Offcanvas
          show={showMobileSidebar}
          onHide={closeSidebar}
          placement="start"
          className="d-md-none mobile-sidebar"
          style={{
            width: "280px",
            maxWidth: "85vw",
          }}
        >
          <Offcanvas.Header
            closeButton
            closeVariant="white"
            className="mobile-sidebar-header"
          >
            <Offcanvas.Title className="fw-bold">
              <div className="d-flex align-items-center gap-2">
                <div className="mobile-logo">IT</div>

                <div>
                  <div style={{ fontSize: "0.95rem" }}>
                    ServiceDesk
                  </div>

                  <small
                    style={{
                      opacity: 0.7,
                      fontSize: "0.7rem",
                    }}
                  >
                    IT Support System
                  </small>
                </div>
              </div>
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body
            className="p-0"
            style={{
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            <Sidebar
              role={role}
              mobile={true}
              onClick={closeSidebar}
            />
          </Offcanvas.Body>
        </Offcanvas>

        {/* =====================================================
            MAIN AREA
        ===================================================== */}

        <Col
          className="d-flex flex-column p-0"
          style={{
            height: "100vh",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* =================================================
              TOP NAVBAR
          ================================================= */}

          <Navbar
            className="dashboard-navbar px-3 px-md-4"
            style={{
              height: "76px",
              minHeight: "76px",
              flexShrink: 0,
              background: "#ffffff",
              borderBottom: "1px solid #e5e7eb",
              zIndex: 1000,
            }}
          >
            {/* Mobile menu */}

            <Button
              variant="light"
              className="mobile-menu-button d-md-none me-3"
              onClick={toggleSidebar}
              type="button"
              aria-label="Open menu"
            >
              <FaBars size={20} />
            </Button>

            {/* Desktop spacer */}

            <div className="d-none d-md-block flex-grow-1">
              <div className="topbar-system-name">
                Smart IT Service Desk
              </div>

              <div className="topbar-system-subtitle">
                IT Support Management System
              </div>
            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <Nav className="align-items-center ms-auto">

              {/* Notification */}

              <div className="notification-wrapper me-2 me-md-3">
                <NotificationBell />
              </div>

              {/* Divider */}

              <div className="topbar-divider d-none d-sm-block" />

              {/* User Dropdown */}

              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="link"
                  className="user-dropdown-toggle text-decoration-none"
                  id="dashboard-user-dropdown"
                >
                  {/* Avatar */}

                  <div className="topbar-avatar">
                    {getInitials()}
                  </div>

                  {/* User information */}

                  <div className="user-dropdown-info d-none d-sm-block">
                    <div className="user-dropdown-name">
                      {fullName}
                    </div>

                    <div className="user-dropdown-role">
                      {roleLabel}
                    </div>
                  </div>

                  <FaChevronDown
                    className="user-dropdown-arrow d-none d-sm-block"
                    size={11}
                  />
                </Dropdown.Toggle>

                {/* =================================================
                    DROPDOWN MENU
                ================================================= */}

                <Dropdown.Menu
                  className="user-dropdown-menu shadow-lg border-0"
                >
                  {/* Profile header */}

                  <div className="dropdown-user-header">
                    <div className="dropdown-avatar">
                      {getInitials()}
                    </div>

                    <div className="overflow-hidden">
                      <div className="fw-bold text-dark text-truncate">
                        {fullName}
                      </div>

                      <div className="text-muted small text-truncate">
                        {user?.email || "No email"}
                      </div>

                      <span className="user-role-badge">
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  <Dropdown.Divider />

                  {/* Profile */}

                  <Dropdown.Item onClick={goToProfile}>
                    <FaUser className="dropdown-icon" />
                    <span>My Profile</span>
                  </Dropdown.Item>

                  {/* Settings */}

                  <Dropdown.Item onClick={goToSettings}>
                    <FaCog className="dropdown-icon" />
                    <span>Settings</span>
                  </Dropdown.Item>

                  {/* Help */}

                  <Dropdown.Item onClick={goToHelp}>
                    <FaQuestionCircle className="dropdown-icon" />
                    <span>Help & Support</span>
                  </Dropdown.Item>

                  <Dropdown.Divider />

                  {/* Logout */}

                  <Dropdown.Item
                    className="logout-dropdown-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="dropdown-icon" />
                    <span>Sign out</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar>

          {/* =================================================
              PAGE CONTENT
          ================================================= */}

          <main
            className="main-content"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              background: "#f8fafc",
            }}
          >
            <Outlet />
          </main>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            style={{
              flexShrink: 0,
              background: "#ffffff",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <Footer />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardLayout;