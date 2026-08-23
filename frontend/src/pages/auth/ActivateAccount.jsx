import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
  Row,
  Col,
  Badge
} from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import {
  FaHeadset,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaCheckCircle,
  FaUser,
  FaAt,
  FaIdBadge,
  FaServer,
  FaExclamationTriangle,
  FaCheck
} from 'react-icons/fa';
import authService from '../../services/authService';
import '../../styles/login.css';

const ActivateAccount = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [checks, setChecks] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    validateToken();
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await authService.validateActivationToken(token);
      setUserInfo(response.data);
    } catch (err) {
      setTokenError(
        err.response?.data?.detail ||
        'Invalid or expired activation link.'
      );
    } finally {
      setLoading(false);
    }
  };

  const checkPassword = (pwd) => {
    setChecks({
      minLength: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd)
    });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    checkPassword(value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handlePassword2Change = (e) => {
    setPassword2(e.target.value);
    if (fieldErrors.password2) {
      setFieldErrors(prev => ({ ...prev, password2: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!password) {
      errors.password = 'Password is required';
    } else if (!Object.values(checks).every(Boolean)) {
      errors.password = 'Password does not meet all requirements';
    }
    if (!password2) {
      errors.password2 = 'Please confirm your password';
    } else if (password !== password2) {
      errors.password2 = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await authService.activateAccount(token, { password, password2 });
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.detail) {
        setTokenError(data.detail);
      } else if (data) {
        setFieldErrors(data);
      } else {
        setTokenError('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const allChecksPass = Object.values(checks).every(Boolean);
  const completedChecks = Object.values(checks).filter(Boolean).length;
  const passwordStrength = allChecksPass ? 100 : (completedChecks / 4) * 100;

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="itsm-login-page">
        <div className="login-background">
          <div className="floating-orb orb-one"></div>
          <div className="floating-orb orb-two"></div>
          <div className="floating-orb orb-three"></div>
          <div className="floating-orb orb-four"></div>
        </div>

        <div className="login-container">
          <div className="login-form-section">
            <div className="login-card activation-loading-card">
              <div className="activation-loading-content">
                <div className="activation-loader-ring">
                  <Spinner animation="border" variant="primary" />
                </div>
                <h3 className="mt-4 mb-2">Verifying Activation Link</h3>
                <p className="text-muted mb-0">Please wait while we validate your request...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== TOKEN ERROR STATE ====================
  if (tokenError) {
    return (
      <div className="itsm-login-page">
        <div className="login-background">
          <div className="floating-orb orb-one"></div>
          <div className="floating-orb orb-two"></div>
          <div className="floating-orb orb-three"></div>
          <div className="floating-orb orb-four"></div>
        </div>

        <div className="login-container">
          <div className="login-form-section">
            <div className={`login-card ${animateIn ? 'animate-in' : ''}`}>
              <div className="login-header">
                <div className="mobile-logo error-logo-icon">
                  <FaExclamationTriangle />
                </div>
                <h2>Activation Failed</h2>
                <p>We couldn't validate your activation link</p>
              </div>

              <div className="login-error-box">
                <div className="error-icon-wrap">
                  <FaExclamationTriangle />
                </div>
                <div className="error-text-content">
                  {tokenError}
                </div>
              </div>

              <div className="activation-help-section">
                <div className="help-item">
                  <FaExclamationTriangle className="help-icon" />
                  <div>
                    <strong>Link Expired?</strong>
                    <p>Activation links are valid for 24 hours. Contact your administrator for a new link.</p>
                  </div>
                </div>
                <div className="help-item">
                  <FaShieldAlt className="help-icon" />
                  <div>
                    <strong>Already Activated?</strong>
                    <p>If you've already set your password, try logging in directly.</p>
                  </div>
                </div>
              </div>

              <div className="activation-error-actions">
                <Button as={Link} to="/login" className="login-submit-btn w-100">
                  <FaServer className="me-2" />
                  Go to Login
                </Button>
              </div>

              <div className="system-status mt-4">
                <span className="status-dot"></span>
                <FaServer />
                <span>Service Desk Portal</span>
                <span className="status-text">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== SUCCESS STATE ====================
  if (success) {
    return (
      <div className="itsm-login-page">
        <div className="login-background">
          <div className="floating-orb orb-one"></div>
          <div className="floating-orb orb-two"></div>
          <div className="floating-orb orb-three"></div>
          <div className="floating-orb orb-four"></div>
        </div>

        <div className="login-container">
          <div className="login-form-section">
            <div className={`login-card ${animateIn ? 'animate-in' : ''}`}>
              <div className="login-header">
                <div className="mobile-logo success-logo-icon">
                  <FaCheck />
                </div>
                <h2>Account Activated!</h2>
                <p>Your account is ready to use</p>
              </div>

              <div className="success-box">
                <div className="success-icon-wrap">
                  <FaCheckCircle />
                </div>
                <div className="success-text-content">
                  <strong>Password Created Successfully</strong>
                  <p>Your account has been securely activated and is now ready for use.</p>
                </div>
              </div>

              <div className="activation-success-info">
                <div className="success-info-item">
                  <FaShieldAlt className="info-icon" />
                  <span>Your credentials are encrypted and secure</span>
                </div>
                <div className="success-info-item">
                  <FaCheckCircle className="info-icon" />
                  <span>Full access to IT Service Desk granted</span>
                </div>
                <div className="success-info-item">
                  <FaServer className="info-icon" />
                  <span>You can now submit and track support tickets</span>
                </div>
              </div>

              <Button as={Link} to="/login" className="login-submit-btn w-100 mt-4">
                <FaServer className="me-2" />
                Continue to Login
              </Button>

              <div className="system-status mt-4">
                <span className="status-dot"></span>
                <FaServer />
                <span>Service Desk Portal</span>
                <span className="status-text">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN FORM STATE ====================
  return (
    <div className="itsm-login-page">
      {/* Background */}
      <div className="login-background">
        <div className="floating-orb orb-one"></div>
        <div className="floating-orb orb-two"></div>
        <div className="floating-orb orb-three"></div>
        <div className="floating-orb orb-four"></div>
      </div>

      <div className="login-container">

        {/* Desktop Brand Section */}
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
              Complete your account setup to start using
              the IT service management platform.
            </p>

            <div className="feature-list">
              {[
                { icon: <FaShieldAlt />, title: 'Secure Activation', desc: 'Create a strong password to protect your account' },
                { icon: <FaCheckCircle />, title: 'Instant Access', desc: 'Start submitting tickets immediately after activation' },
                { icon: <FaServer />, title: 'Full Platform Access', desc: 'All features unlocked for your role' },
                { icon: <FaShieldAlt />, title: 'Enterprise Security', desc: 'Your data is protected with industry standards' },
              ].map((feature, index) => (
                <div
                  className="feature-item"
                  key={index}
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  {feature.icon}
                  <div>
                    <strong>{feature.title}</strong>
                    <small>{feature.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="brand-footer">
            Secure Account Activation
          </div>
        </div>

        {/* Mobile Brand Section */}
        <div className="mobile-brand-section">
          <div className="mobile-brand-logo">
            <FaHeadset />
          </div>
          <h1>Smart IT <span>Service Desk</span></h1>
          <p>Secure Account Activation</p>
        </div>

        {/* Activation Form Section */}
        <div className="login-form-section">
          <div className={`login-card ${animateIn ? 'animate-in' : ''}`}>

            <div className="login-header">
              <div className="mobile-logo">
                <FaHeadset />
              </div>
              <h2>Activate Account</h2>
              <p>Create your password to get started</p>
            </div>

            {/* User Info Card */}
            {userInfo && (
              <div className="activation-user-card">
                <div className="activation-user-avatar">
                  {userInfo.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="activation-user-details">
                  <h6 className="mb-0">{userInfo.full_name}</h6>
                  <div className="activation-user-meta">
                    <span className="meta-item">
                      <FaAt className="meta-icon" />
                      {userInfo.username}
                    </span>
                    <Badge className="activation-role-badge" bg="primary">
                      {userInfo.role}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <Form onSubmit={handleSubmit} noValidate>

              {/* Password Field */}
              <Form.Group className={`login-form-group ${fieldErrors.password ? 'has-error' : ''}`}>
                <Form.Label>Create Password</Form.Label>
                <InputGroup
                  className={`login-input-group ${fieldErrors.password ? 'input-error-state' : ''} ${focusedField === 'password' ? 'input-focused' : ''}`}
                >
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter a strong password"
                    autoComplete="new-password"
                    disabled={submitting}
                    autoFocus
                    isInvalid={!!fieldErrors.password}
                  />
                  <Button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
                {fieldErrors.password && (
                  <div className="login-field-error">
                    <FaExclamationTriangle className="me-1" />
                    {fieldErrors.password}
                  </div>
                )}
              </Form.Group>

              {/* Password Strength Meter */}
              {password && (
                <div className="password-strength-section">
                  <div className="strength-meter-header">
                    <span className="strength-label">Password Strength</span>
                    <span className={`strength-text ${
                      passwordStrength === 100 ? 'strength-strong' :
                      passwordStrength >= 50 ? 'strength-medium' : 'strength-weak'
                    }`}>
                      {passwordStrength === 100 ? 'Strong' :
                       passwordStrength >= 50 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <div className="strength-meter-track">
                    <div
                      className={`strength-meter-fill ${
                        passwordStrength === 100 ? 'fill-strong' :
                        passwordStrength >= 50 ? 'fill-medium' : 'fill-weak'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className={`password-requirements-box ${allChecksPass ? 'all-valid' : ''}`}>
                <div className="requirements-header">
                  <FaShieldAlt className="me-2" />
                  Password Requirements
                </div>
                <div className="requirements-grid">
                  {[
                    { key: 'minLength', label: '8+ characters' },
                    { key: 'uppercase', label: 'Uppercase letter' },
                    { key: 'lowercase', label: 'Lowercase letter' },
                    { key: 'number', label: 'Number' },
                  ].map((rule) => (
                    <div
                      key={rule.key}
                      className={`requirement-item ${checks[rule.key] ? 'req-valid' : 'req-invalid'}`}
                    >
                      <span className="req-icon">
                        {checks[rule.key] ? <FaCheck /> : <span className="req-dot"></span>}
                      </span>
                      <span className="req-label">{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password Field */}
              <Form.Group className={`login-form-group ${fieldErrors.password2 ? 'has-error' : ''}`}>
                <Form.Label>Confirm Password</Form.Label>
                <InputGroup
                  className={`login-input-group ${fieldErrors.password2 ? 'input-error-state' : ''} ${focusedField === 'password2' ? 'input-focused' : ''}`}
                >
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword2 ? 'text' : 'password'}
                    value={password2}
                    onChange={handlePassword2Change}
                    onFocus={() => setFocusedField('password2')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={submitting}
                    isInvalid={!!fieldErrors.password2}
                  />
                  <Button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword2(!showPassword2)}
                    disabled={submitting}
                    aria-label={showPassword2 ? 'Hide password' : 'Show password'}
                  >
                    {showPassword2 ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
                {fieldErrors.password2 && (
                  <div className="login-field-error">
                    <FaExclamationTriangle className="me-1" />
                    {fieldErrors.password2}
                  </div>
                )}
              </Form.Group>

              {/* Submit Button */}
              <Button
                type="submit"
                className="login-submit-btn"
                disabled={submitting || !allChecksPass || !password2}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Activating Account...
                  </>
                ) : (
                  <>
                    <FaShieldAlt className="me-2" />
                    Activate Account
                  </>
                )}
              </Button>

            </Form>

            {/* Security Badge */}
            <div className="login-security">
              <FaShieldAlt />
              <span>256-bit encrypted password protection</span>
            </div>

            {/* Footer Links */}
            <div className="activation-footer-links">
              <Link to="/login" className="back-to-login">
                <span className="back-arrow">←</span>
                Back to Login
              </Link>
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

export default ActivateAccount;