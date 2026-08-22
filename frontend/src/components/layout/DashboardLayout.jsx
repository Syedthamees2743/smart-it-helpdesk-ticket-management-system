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

import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaCog,
  FaQuestionCircle,
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

  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login");
    }
  };

  // ==============================
  // MOBILE SIDEBAR
  // ==============================
  const toggleSidebar = () => {
    setShowMobileSidebar((prev) => !prev);
  };

  const closeSidebar = () => {
    setShowMobileSidebar(false);
  };

  return (
    <Container
      fluid
      className="p-0 m-0"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Row
        className="g-0 flex-grow-1"
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
          className="d-md-none"
          style={{
            width: "260px",
            maxWidth: "260px",
          }}
        >
          <Offcanvas.Header
            closeButton
            closeVariant="white"
            className="bg-dark text-white border-0 py-2"
          >
            <Offcanvas.Title className="small">
              IT Service Desk
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body
            className="p-0 bg-dark d-flex flex-column"
            style={{
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
            MAIN CONTENT AREA
            ===================================================== */}
        <Col
          className="d-flex flex-column"
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
            bg="white"
            className="shadow-sm px-3 border-bottom"
            style={{
              height: "68px",
              minHeight: "68px",
              flexShrink: 0,
              zIndex: 1000,
            }}
          >
            {/* Mobile menu button */}
            <Button
              variant="link"
              className="d-md-none p-0 me-3 text-dark"
              onClick={toggleSidebar}
              type="button"
            >
              <FaBars size={24} />
            </Button>

            {/* Right side */}
            <Navbar.Collapse className="justify-content-end w-100">
              <Nav className="align-items-center">

                {/* Notification */}
                <div className="me-3">
                  <NotificationBell />
                </div>

                {/* User Dropdown */}
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    className="text-decoration-none text-dark p-0 d-flex align-items-center"
                    id="dashboard-user-dropdown"
                  >
                    <FaUserCircle
                      size={34}
                      className="me-2 text-secondary"
                    />

                    <div className="text-start d-none d-sm-block">
                      <div
                        className="fw-bold"
                        style={{
                          fontSize: "0.9rem",
                          lineHeight: "1.2",
                        }}
                      >
                        {user?.first_name || ""}{" "}
                        {user?.last_name || ""}
                      </div>

                      <div
                        className="text-muted text-uppercase"
                        style={{
                          fontSize: "0.7rem",
                        }}
                      >
                        {role}
                      </div>
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-sm border-0">

                    {/* Settings */}
                    <Dropdown.Item
                      onClick={() =>
                        navigate(`/${role}/settings`)
                      }
                    >
                      <FaCog className="me-2" />
                      Settings
                    </Dropdown.Item>

                    {/* Help */}
                    <Dropdown.Item
                      onClick={() =>
                        navigate(`/${role}/help`)
                      }
                    >
                      <FaQuestionCircle className="me-2" />
                      Help & Support
                    </Dropdown.Item>

                    <Dropdown.Divider />

                    {/* Logout */}
                    <Dropdown.Item
                      className="text-danger"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="me-2" />
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </Navbar>

          {/* =================================================
              PAGE CONTENT
              ================================================= */}
          <main
            className="main-content bg-light"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
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