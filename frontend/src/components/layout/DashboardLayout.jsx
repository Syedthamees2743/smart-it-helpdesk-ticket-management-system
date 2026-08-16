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
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleSidebar = () => setShowMobileSidebar(!showMobileSidebar);
  const closeSidebar = () => setShowMobileSidebar(false);

  return (
    <Container
      fluid
      className="p-0 m-0"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Row className="g-0 flex-grow-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Col md="auto" className="d-none d-md-block p-0">
          <div style={{ width: "260px" }} className="h-100">
            <Sidebar role={role} />
          </div>
        </Col>

        {/* Mobile Sidebar (Offcanvas) */}
        <Offcanvas
          show={showMobileSidebar}
          onHide={closeSidebar}
          className="d-md-none"
          style={{ maxWidth: "260px" }}
        >
          <Offcanvas.Header
            closeButton
            closeVariant="white"
            className="bg-dark text-white border-0 py-2"
          >
            <Offcanvas.Title className="small">IT Service Desk</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body
            className="p-0 bg-dark d-flex flex-column"
            style={{ overflow: "hidden" }}
          >
            <Sidebar role={role} mobile={true} onClick={closeSidebar} />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content Wrapper */}
        <Col className="d-flex flex-column flex-grow-1 overflow-hidden">
          {/* Top Navbar */}
          <Navbar
            bg="white"
            className="shadow-sm px-3 border-bottom"
            style={{ height: "56px" }}
          >
            <Button
              variant="link"
              className="d-md-none p-0 me-3 text-dark"
              onClick={toggleSidebar}
            >
              <FaBars size={24} />
            </Button>

            <Navbar.Collapse className="justify-content-end w-100">
              <Nav className="align-items-center">
                <div className="me-3">
                  <NotificationBell />
                </div>

                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    className="text-decoration-none text-dark p-0 d-flex align-items-center"
                    id="dropdown-basic"
                  >
                    <FaUserCircle size={32} className="me-2 text-secondary" />
                    <div className="text-start d-none d-sm-block">
                      <div
                        className="fw-bold"
                        style={{ fontSize: "0.9rem", lineHeight: "1.2" }}
                      >
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div
                        className="text-muted text-uppercase"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {role}
                      </div>
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-sm border-0">
                    <Dropdown.Item onClick={() => navigate(`/${role}/settings`)}>
                      <FaCog className="me-2" /> Settings
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate(`/${role}/help`)}>
                      <FaQuestionCircle className="me-2" /> Help & Support
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      className="text-danger"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="me-2" /> Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </Navbar>

          {/* Page Content */}
          <main className="main-content bg-light">
            <Outlet />
          </main>

          {/* Footer */}
          <Footer />
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardLayout;