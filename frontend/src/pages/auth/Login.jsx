import { useState, useRef } from 'react';
import {
  Form,
  Button,
  InputGroup,
  Alert,
  Spinner
} from 'react-bootstrap';

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaHeadset,
  FaCheckCircle,
  FaShieldAlt,
  FaServer,
  FaExclamationTriangle
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import '../../styles/login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent double submission
  const isSubmitting = useRef(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { username, password } = formData;

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any event bubbling

    // Prevent double click
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    setError('');

    if (!username || !password) {
      setError('Please enter your username and password.');
      isSubmitting.current = false;
      return;
    }

    setLoading(true);

    try {
      await login(username, password);

      const currentUser = JSON.parse(localStorage.getItem('user'));

      if (currentUser?.role) {
        navigate(`/${currentUser.role}`);
      } else {
        setError('User role not found. Please contact administrator.');
      }
    } catch (err) {
      // Better error extraction
      let errorMsg = 'Invalid username or password. Please try again.';
      
      if (err?.response?.data) {
        const data = err.response.data;
        if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.non_field_errors) {
          errorMsg = Array.isArray(data.non_field_errors) 
            ? data.non_field_errors[0] 
            : data.non_field_errors;
        } else if (data.error) {
          errorMsg = data.error;
        }
      } else if (err?.detail) {
        errorMsg = err.detail;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
      // Delay before allowing next submission
      setTimeout(() => {
        isSubmitting.current = false;
      }, 500);
    }
  };

  return (
    <div className="itsm-login-page">
      {/* Background - Floating Orbs */}
      <div className="login-background">
        <div className="floating-orb orb-one"></div>
        <div className="floating-orb orb-two"></div>
        <div className="floating-orb orb-three"></div>
        <div className="floating-orb orb-four"></div>
      </div>

      <div className="login-container">
        {/* DESKTOP BRAND SECTION */}
        <div className="login-brand-section">
          <div className="brand-content">
            <div className="brand-logo">
              <FaHeadset />
            </div>
            <h1>
              Smart IT
              <span>Service Desk</span>
            </h1>
            <p className="brand-description">
              A centralized platform for managing IT support,
              service requests and technical issues.
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <FaCheckCircle />
                <span>Smart Ticket Management</span>
              </div>
              <div className="feature-item">
                <FaCheckCircle />
                <span>Faster Issue Resolution</span>
              </div>
              <div className="feature-item">
                <FaCheckCircle />
                <span>SLA & Performance Monitoring</span>
              </div>
              <div className="feature-item">
                <FaCheckCircle />
                <span>Centralized IT Support</span>
              </div>
            </div>
          </div>
          <div className="brand-footer">
            IT Service Management Platform
          </div>
        </div>

        {/* MOBILE BRAND SECTION */}
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

        {/* LOGIN FORM */}
        <div className="login-form-section">
          <div className={`login-card ${error ? 'shake-error' : ''}`}>
            <div className="login-header">
              <div className="mobile-logo">
                <FaHeadset />
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to access your service desk</p>
            </div>

            {/* Error - NO auto dismiss, stays until user closes or types */}
            {error && (
              <div className="login-error-box">
                <div className="error-icon-wrap">
                  <FaExclamationTriangle />
                </div>
                <div className="error-text-content">
                  {error}
                </div>
                <button 
                  type="button"
                  className="error-dismiss-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setError('');
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <Form onSubmit={onSubmit} noValidate>
              {/* Username */}
              <Form.Group className={`login-form-group ${error ? 'has-error' : ''}`}>
                <Form.Label>Username</Form.Label>
                <InputGroup className={`login-input-group ${error ? 'input-error-state' : ''}`}>
                  <InputGroup.Text>
                    <FaUser />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="username"
                    value={username}
                    onChange={onChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                    autoFocus
                  />
                </InputGroup>
              </Form.Group>

              {/* Password */}
              <Form.Group className={`login-form-group ${error ? 'has-error' : ''}`}>
                <Form.Label>Password</Form.Label>
                <InputGroup className={`login-input-group ${error ? 'input-error-state' : ''}`}>
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
              </Form.Group>

              {/* Login button */}
              <Button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Form>

            {/* Security */}
            <div className="login-security">
              <FaShieldAlt />
              <span>Secure organizational access</span>
            </div>

            {/* System status */}
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