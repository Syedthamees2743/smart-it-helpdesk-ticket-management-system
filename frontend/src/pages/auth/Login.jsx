import { useState, useRef } from "react";
import { Form, Button, InputGroup, Spinner } from "react-bootstrap";

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaHeadset,
  FaCheckCircle,
  FaShieldAlt,
  FaServer,
  FaExclamationTriangle,
  FaUserPlus,
  FaUserCog,
  FaArrowRight,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import "../../styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const isSubmitting = useRef(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { username, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting.current) return;
    isSubmitting.current = true;

    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      isSubmitting.current = false;
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (currentUser?.role) {
        navigate(`/${currentUser.role}`);
      } else {
        setError("User role not found. Please contact administrator.");
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.non_field_errors) {
        const field_errors = err.response.data.non_field_errors;
        if (Array.isArray(field_errors)) {
          setError(field_errors.join(", "));
        } else {
          setError(String(field_errors));
        }
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        isSubmitting.current = false;
      }, 500);
    }
  };

  return (
    <div className="itsm-login-page">
      {/* Background Image Layer */}
      <div className="login-bg-image"></div>
      <div className="login-bg-overlay"></div>

      {/* Floating Orbs */}
      <div className="login-orbs">
        <div className="login-orb orb-1"></div>
        <div className="login-orb orb-2"></div>
        <div className="login-orb orb-3"></div>
      </div>

      <div className="login-container">
        {/* Desktop Brand Section */}
        <div className="login-brand-section">
          <div className="brand-content">
            <div className="brand-logo">
              <FaHeadset />
              <span className="brand-logo-badge">IT</span>
            </div>

            <h1 className="brand-title">
              Smart IT
              <span>Service Desk</span>
            </h1>

            <p className="brand-description">
              A centralized platform for managing IT support, service
              requests and technical issues across your organization.
            </p>

            <div className="feature-list">
              {[
                {
                  icon: <FaCheckCircle />,
                  title: "Smart Ticket Management",
                  desc: "Automated routing and prioritization",
                },
                {
                  icon: <FaCheckCircle />,
                  title: "Faster Issue Resolution",
                  desc: "Streamlined workflows and escalations",
                },
                {
                  icon: <FaCheckCircle />,
                  title: "SLA & Performance Monitoring",
                  desc: "Real-time tracking and reporting",
                },
                {
                  icon: <FaCheckCircle />,
                  title: "Centralized IT Support",
                  desc: "Single pane of glass for all requests",
                },
              ].map((feature, index) => (
                <div
                  className="feature-item"
                  key={index}
                  style={{ animationDelay: `${0.4 + index * 0.12}s` }}
                >
                  <div className="feature-icon-wrap">{feature.icon}</div>
                  <div className="feature-text">
                    <strong>{feature.title}</strong>
                    <small>{feature.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="brand-footer">
            <div className="brand-footer-line"></div>
            <span>IT Service Management Platform</span>
          </div>
        </div>

        {/* Mobile Brand Section */}
        <div className="mobile-brand-section">
          <div className="mobile-brand-logo">
            <FaHeadset />
          </div>
          <h1>
            Smart IT <span>Service Desk</span>
          </h1>
          <p>IT Support Management Platform</p>

          <div className="mobile-features">
            <div className="mobile-feature">
              <FaCheckCircle />
              <span>Smart Ticketing</span>
            </div>
            <div className="mobile-feature">
              <FaCheckCircle />
              <span>Faster Resolution</span>
            </div>
            <div className="mobile-feature">
              <FaCheckCircle />
              <span>SLA Monitoring</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="login-form-section">
          <div className={`login-card ${error ? "shake-error" : ""}`}>
            <div className="login-card-glow"></div>

            <div className="login-header">
              <div className="mobile-logo">
                <FaHeadset />
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to access your service desk</p>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error-box">
                <div className="error-icon-wrap">
                  <FaExclamationTriangle />
                </div>
                <div className="error-text-content">{error}</div>
                <button
                  type="button"
                  className="error-dismiss-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setError("");
                  }}
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            <Form onSubmit={onSubmit} noValidate>
              {/* Username */}
              <Form.Group
                className={`login-form-group ${error ? "has-error" : ""}`}
              >
                <Form.Label>Username</Form.Label>
                <InputGroup
                  className={`login-input-group ${
                    error ? "input-error-state" : ""
                  } ${focusedField === "username" ? "input-focused" : ""}`}
                >
                  <InputGroup.Text>
                    <FaUser />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="username"
                    value={username}
                    onChange={onChange}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                    autoFocus
                  />
                </InputGroup>
              </Form.Group>

              {/* Password */}
              <Form.Group
                className={`login-form-group ${error ? "has-error" : ""}`}
              >
                <Form.Label>Password</Form.Label>
                <InputGroup
                  className={`login-input-group ${
                    error ? "input-error-state" : ""
                  } ${focusedField === "password" ? "input-focused" : ""}`}
                >
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={onChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
              </Form.Group>

              {/* Login Button */}
              <Button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FaArrowRight className="ms-2 btn-arrow" />
                  </>
                )}
              </Button>
            </Form>

            {/* Security Badge */}
            <div className="login-security">
              <FaShieldAlt />
              <span>Secure organizational access</span>
            </div>

            {/* Signup Section */}
            <div className="login-signup-section">
              <div className="signup-divider">
                <span>New to Service Desk?</span>
              </div>
              <div className="signup-buttons">
                <Link
                  to="/employee/signup"
                  className="signup-link-btn employee-signup-btn"
                >
                  <FaUserPlus />
                  <span>Join as Employee</span>
                </Link>
                <Link
                  to="/technician/signup"
                  className="signup-link-btn technician-signup-btn"
                >
                  <FaUserCog />
                  <span>Join as Technician</span>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="system-status">
              <span className="status-dot"></span>
              <FaServer />
              <span>Service Desk Portal</span>
              <span className="status-text">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="login-copyright">
        © {new Date().getFullYear()} Smart IT Service Desk
      </div>
    </div>
  );
};

export default Login;