import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeadset } from 'react-icons/fa';
import authService from '../../services/authService';
import './AuthPages.css';

const EmployeeSignup = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [animateIn, setAnimateIn] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    confirm_email: '',
    phone_number: '',
    department: '',
    designation: ''
  });

  useEffect(() => {
    fetchDepartments();
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const response = await authService.getDepartments();

      let deptList = [];
      if (response?.data && Array.isArray(response.data)) {
        deptList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        deptList = response.results;
      } else if (Array.isArray(response)) {
        deptList = response;
      }

      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.confirm_email.trim()) {
      errors.confirm_email = 'Please confirm your email';
    } else if (formData.email.toLowerCase() !== formData.confirm_email.toLowerCase()) {
      errors.confirm_email = 'Email addresses do not match';
    }

    if (!formData.department) errors.department = 'Department is required';
    if (!formData.designation.trim()) errors.designation = 'Designation is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getErrorString = (val) => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : String(v)).join(', ');
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).map(getErrorString).join(', ');
    }
    return String(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) return;

    const submitData = {
      username: formData.username.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone_number: formData.phone_number.trim(),
      department: parseInt(formData.department),
      designation: formData.designation.trim()
    };

    setLoading(true);

    try {
      await authService.employeeSignup(submitData);
      setSubmitted(true);
    } catch (err) {
      setFieldErrors({});
      setError('');

      let data = err.response?.data;
      if (data?.success === false && data.error) data = data.error;

      if (!data) {
        setError('Network error. Please check your connection and try again.');
      } else if (typeof data === 'string') {
        setError(data);
      } else if (data.detail && typeof data.detail === 'string') {
        setError(data.detail);
      } else if (data.error && typeof data.error === 'string') {
        setError(data.error);
      } else if (data.error && typeof data.error === 'object') {
        const errorStr = Object.values(data.error)
          .map(v => typeof v === 'string' ? v : JSON.stringify(v))
          .join(', ');
        setError(errorStr || 'An error occurred. Please try again.');
      } else {
        const fieldNames = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'department', 'designation'];
        let hasFieldError = false;
        const newFieldErrors = {};

        fieldNames.forEach(field => {
          if (data[field]) {
            hasFieldError = true;
            newFieldErrors[field] = getErrorString(data[field]);
          }
        });

        if (Object.keys(newFieldErrors).length > 0) setFieldErrors(newFieldErrors);
        if (data.non_field_errors) {
          setError(getErrorString(data.non_field_errors));
          hasFieldError = true;
        }

        if (!hasFieldError) {
          const allErrors = [];
          Object.entries(data).forEach(([key, val]) => {
            if (key === 'success') return;
            if (Array.isArray(val)) val.forEach(v => { if (typeof v === 'string') allErrors.push(v); });
            else if (typeof val === 'string') allErrors.push(val);
          });
          setError(allErrors.length > 0 ? allErrors.join(', ') : 'Please check the form for errors.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <Container>
          <div className="success-card auth-animate-in">
            <Card className="auth-card">
              <Card.Body className="auth-card-body py-5">
                <div className="status-icon-wrapper success-icon-animate">
                  <div className="status-icon success">
                    <i className="bi bi-check-lg"></i>
                  </div>
                </div>

                <div className="status-title">Registration Submitted</div>

                <p className="status-description mb-4">
                  Your employee registration request has been submitted successfully.
                </p>

                <Alert variant="success" className="success-alert-animate">
                  <i className="bi bi-shield-check me-2"></i>
                  Your account is pending administrator approval. You will receive an email once your request has been reviewed.
                </Alert>

                <p className="text-muted small mb-4">
                  This typically takes 1-2 business days.
                </p>

                <Button as={Link} to="/login" className="auth-submit">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Go to Login
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className={`auth-wrapper ${animateIn ? 'auth-animate-in' : ''}`}>

        {/* Brand Section - Same Square Icon as Login */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FaHeadset />
          </div>
          <h5>Smart IT Service Desk</h5>
          <p>Enterprise IT Support Platform</p>
        </div>

        <Card className="auth-card">

          <div className="auth-card-header">
            <h2>Employee Registration</h2>
            <p>Create your employee access request to the IT service desk.</p>
          </div>

          <Card.Body className="auth-card-body">

            <div className="info-banner info-banner-animate">
              <i className="bi bi-info-circle-fill"></i>
              <span>
                Your registration will be reviewed by an administrator before your account is activated.
              </span>
            </div>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')} className="alert-animate">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>

              <div className="form-section-title">Personal Information</div>

              <Row>
                <Col md={6} className="form-col-animate" style={{ animationDelay: '0.05s' }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="auth-label">
                      First Name <span className="auth-required">*</span>
                    </Form.Label>
                    <div className="field-icon-wrapper">
                      <i className="bi bi-person"></i>
                      <Form.Control
                        className="auth-input"
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.first_name}
                        placeholder="Enter first name"
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.first_name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} className="form-col-animate" style={{ animationDelay: '0.1s' }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="auth-label">
                      Last Name <span className="auth-required">*</span>
                    </Form.Label>
                    <div className="field-icon-wrapper">
                      <i className="bi bi-person"></i>
                      <Form.Control
                        className="auth-input"
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.last_name}
                        placeholder="Enter last name"
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.last_name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="form-section-title mt-3">Account Information</div>

              <div className="form-col-animate" style={{ animationDelay: '0.15s' }}>
                <Form.Group className="mb-3">
                  <Form.Label className="auth-label">
                    Username <span className="auth-required">*</span>
                  </Form.Label>
                  <div className="field-icon-wrapper">
                    <i className="bi bi-at"></i>
                    <Form.Control
                      className="auth-input"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.username}
                      placeholder="Choose a username"
                    />
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.username}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <Row>
                <Col md={6} className="form-col-animate" style={{ animationDelay: '0.2s' }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="auth-label">
                      Email <span className="auth-required">*</span>
                    </Form.Label>
                    <div className="field-icon-wrapper">
                      <i className="bi bi-envelope"></i>
                      <Form.Control
                        className="auth-input"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.email}
                        placeholder="name@company.com"
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} className="form-col-animate" style={{ animationDelay: '0.25s' }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="auth-label">
                      Confirm Email <span className="auth-required">*</span>
                    </Form.Label>
                    <div className="field-icon-wrapper">
                      <i className="bi bi-envelope-check"></i>
                      <Form.Control
                        className="auth-input"
                        type="email"
                        name="confirm_email"
                        value={formData.confirm_email}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.confirm_email}
                        placeholder="Confirm email"
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.confirm_email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="form-section-title mt-3">Work Information</div>

              <Row>
                <Col md={6} className="form-col-animate" style={{ animationDelay: '0.3s' }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="auth-label">Phone Number</Form.Label>
                    <div className="field-icon-wrapper">
                      <i className="bi bi-telephone"></i>
                      <Form.Control
                        className="auth-input"
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.phone_number}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.phone_number}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} className="form-col-animate" style={{ animationDelay: '0.35s' }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="auth-label">
                      Department <span className="auth-required">*</span>
                    </Form.Label>
                    <Form.Select
                      className="auth-select"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.department}
                      disabled={departmentsLoading}
                    >
                      <option value="">
                        {departmentsLoading ? 'Loading departments...' : 'Select Department'}
                      </option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.department}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="form-col-animate" style={{ animationDelay: '0.4s' }}>
                <Form.Group className="mb-4">
                  <Form.Label className="auth-label">
                    Designation <span className="auth-required">*</span>
                  </Form.Label>
                  <div className="field-icon-wrapper">
                    <i className="bi bi-briefcase"></i>
                    <Form.Control
                      className="auth-input"
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.designation}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.designation}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <Button
                type="submit"
                className="auth-submit"
                disabled={loading || departmentsLoading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submit Registration Request
                  </>
                )}
              </Button>

            </Form>

            <div className="auth-footer">
              <div className="mb-2">
                Already have an account?{' '}
                <Link to="/login">Login here</Link>
              </div>
              <small>
                Are you a technician?{' '}
                <Link to="/technician/signup">Register as Technician</Link>
              </small>
            </div>

          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeSignup;