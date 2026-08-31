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
import '../../styles/AuthPages.css';

const STEPS = [
  { id: 1, title: 'Personal Details', hint: 'Who you are', icon: 'bi-person-badge', fields: ['first_name', 'last_name'] },
  { id: 2, title: 'Account Setup', hint: 'Login credentials', icon: 'bi-shield-lock', fields: ['username', 'email', 'confirm_email'] },
  { id: 3, title: 'Work Details', hint: 'Department & role', icon: 'bi-briefcase', fields: ['phone_number', 'department', 'designation'] }
];

const DESIGNATION_CHIPS = ['Software Engineer', 'QA Engineer', 'Business Analyst', 'Support Executive', 'System Admin', 'Team Lead'];

const focusFirstError = () => {
  requestAnimationFrame(() => {
    const el = document.querySelector('.step-content .is-invalid');
    if (el) el.focus();
  });
};

const EmployeeSignup = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [animateIn, setAnimateIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState('forward');

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
      setDepartmentsError(false);
      const response = await authService.getDepartments();

      let deptList = [];
      if (response?.data && Array.isArray(response.data)) deptList = response.data;
      else if (response?.results && Array.isArray(response.results)) deptList = response.results;
      else if (Array.isArray(response)) deptList = response;

      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setDepartmentsError(true);
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

  const applyChip = (chip) => {
    setFormData(prev => ({ ...prev, designation: prev.designation === chip ? '' : chip }));
    if (fieldErrors.designation) {
      setFieldErrors(prev => ({ ...prev, designation: '' }));
    }
    if (error) setError('');
  };

  const emailsMatch =
    formData.email.trim() !== '' &&
    formData.confirm_email.trim() !== '' &&
    formData.email.toLowerCase() === formData.confirm_email.toLowerCase();

  /* ── Step Validation ── */
  const validateStep = (stepId) => {
    const errors = {};

    if (stepId === 1) {
      if (!formData.first_name.trim()) errors.first_name = 'First name is required';
      if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    }

    if (stepId === 2) {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.confirm_email.trim()) {
        errors.confirm_email = 'Please confirm your email';
      } else if (!emailsMatch) {
        errors.confirm_email = 'Email addresses do not match';
      }
    }

    if (stepId === 3) {
      if (!formData.department) errors.department = 'Department is required';
      if (!formData.designation.trim()) errors.designation = 'Designation is required';
    }

    setFieldErrors(prev => {
      const next = { ...prev };
      STEPS[stepId - 1].fields.forEach(f => delete next[f]);
      return { ...next, ...errors };
    });

    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      focusFirstError();
      return;
    }
    setDirection('forward');
    setCurrentStep(s => Math.min(STEPS.length, s + 1));
  };

  const handleBack = () => {
    setDirection('back');
    setCurrentStep(s => Math.max(1, s - 1));
  };

  const goToStep = (stepId) => {
    if (stepId < currentStep) {
      setDirection('back');
      setCurrentStep(stepId);
    }
  };

  const validateForm = () => validateStep(1) && validateStep(2) && validateStep(3);

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

    if (currentStep < STEPS.length) {
      handleNext();
      return;
    }

    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      focusFirstError();
      return;
    }

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

  /* ── Success Screen ── */
  if (submitted) {
    const selectedDept = departments.find(d => String(d.id) === String(formData.department));

    const summary = [
      { icon: 'bi-person', label: 'Name', value: `${formData.first_name} ${formData.last_name}` },
      { icon: 'bi-at', label: 'Username', value: formData.username },
      { icon: 'bi-envelope', label: 'Email', value: formData.email },
      { icon: 'bi-building', label: 'Department', value: selectedDept?.name || '—' },
      { icon: 'bi-briefcase', label: 'Designation', value: formData.designation }
    ];

    const nextSteps = [
      { state: 'done', icon: 'bi-check', text: 'Request submitted successfully' },
      { state: 'current', icon: 'bi-person-check', text: 'Administrator verifies your details' },
      { state: 'pending', icon: 'bi-key', text: 'Account activated & email sent' }
    ];

    return (
      <div className="auth-page">
        <Container>
          <div className="success-card auth-animate-in">
            <Card className="auth-card">
              <Card.Body className="auth-card-body py-5">
                <div className="status-icon-wrapper success-icon-animate">
                  <div className="status-icon success">
                    <i className="bi bi-person-check"></i>
                  </div>
                </div>

                <div className="status-title">Employee Request Submitted</div>

                <p className="status-description mb-4">
                  Your employee registration request has been submitted successfully.
                </p>

                <div className="user-summary user-summary-animate">
                  {summary.map(item => (
                    <div className="user-summary-item" key={item.label}>
                      <div className="user-summary-label">
                        <i className={`bi ${item.icon} me-2`}></i>{item.label}
                      </div>
                      <div className="user-summary-value">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="next-steps">
                  <div className="next-steps-title">
                    <i className="bi bi-list-check"></i> What happens next
                  </div>
                  {nextSteps.map((step, idx) => (
                    <div className="next-step-item" key={idx}>
                      <div className={`next-step-icon ${step.state}`}>
                        <i className={`bi ${step.icon}`}></i>
                      </div>
                      <div className="next-step-text">{step.text}</div>
                    </div>
                  ))}
                </div>

                <Alert variant="success" className="success-alert-animate">
                  <i className="bi bi-shield-check me-2"></i>
                  Your account is pending administrator approval — typically 1-2 business days.
                </Alert>

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

        {/* Brand Section */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FaHeadset />
          </div>
          <h5>Smart IT Service Desk</h5>
          <p>Enterprise IT Support Platform</p>
        </div>

        <Card className="auth-card">

          <div className="auth-card-header">
            <span className="role-tag role-tag-employee">
              <i className="bi bi-person-workspace"></i>Employee Access
            </span>
            <h2>Employee Registration</h2>
            <p>Create your employee access request to the IT service desk.</p>
          </div>

          <Card.Body className="auth-card-body">

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')} className="alert-animate">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>

              <div className="signup-layout employee-layout">

                {/* ── Vertical Step Rail ── */}
                <aside className="tech-rail">
                  {STEPS.map((step, idx) => (
                    <div
                      key={step.id}
                      className={[
                        'rail-item',
                        currentStep === step.id ? 'active' : '',
                        currentStep > step.id ? 'completed clickable' : ''
                      ].filter(Boolean).join(' ')}
                      onClick={() => goToStep(step.id)}
                    >
                      <div className="rail-marker">
                        <div className="rail-dot">
                          {currentStep > step.id
                            ? <i className="bi bi-check-lg"></i>
                            : <i className={`bi ${step.icon}`}></i>}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`rail-line ${currentStep > step.id ? 'completed' : ''}`}></div>
                        )}
                      </div>
                      <div className="rail-info">
                        <span className="rail-step">Step {step.id}</span>
                        <span className="rail-title">{step.title}</span>
                        <span className="rail-hint">{step.hint}</span>
                      </div>
                    </div>
                  ))}

                  <div className="rail-note">
                    <i className="bi bi-ticket-detailed"></i>
                    <span>Employees can raise, track &amp; follow up IT support tickets.</span>
                  </div>
                </aside>

                {/* ── Step Content ── */}
                <div
                  key={currentStep}
                  className={`step-content ${direction === 'forward' ? 'step-content-forward' : 'step-content-back'}`}
                >

                  {/* STEP 1: Personal */}
                  {currentStep === 1 && (
                    <>
                      <div className="info-banner info-banner-animate">
                        <i className="bi bi-info-circle-fill"></i>
                        <span>
                          Your registration will be reviewed by an administrator before your account is activated.
                        </span>
                      </div>

                      <div className="form-section-title">
                        <i className="bi bi-person-vcard"></i> Personal Information
                      </div>

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
                                autoComplete="given-name"
                                value={formData.first_name}
                                onChange={handleChange}
                                isInvalid={!!fieldErrors.first_name}
                                placeholder="Enter first name"
                                autoFocus
                              />
                              <Form.Control.Feedback type="invalid">
                                {fieldErrors.first_name}
                              </Form.Control.Feedback>
                            </div>
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
                                autoComplete="family-name"
                                value={formData.last_name}
                                onChange={handleChange}
                                isInvalid={!!fieldErrors.last_name}
                                placeholder="Enter last name"
                              />
                              <Form.Control.Feedback type="invalid">
                                {fieldErrors.last_name}
                              </Form.Control.Feedback>
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}

                  {/* STEP 2: Account */}
                  {currentStep === 2 && (
                    <>
                      <div className="form-section-title">
                        <i className="bi bi-shield-lock"></i> Account Information
                      </div>

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
                            autoComplete="username"
                            value={formData.username}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.username}
                            placeholder="Choose a username"
                            autoFocus
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.username}
                          </Form.Control.Feedback>
                        </div>
                        <div className={`field-hint ${formData.username.length >= 3 ? 'hint-valid' : ''}`}>
                          <i className="bi bi-info-circle"></i>
                          At least 3 characters
                          {formData.username.length > 0 && (
                            <span className="char-count">({formData.username.length})</span>
                          )}
                        </div>
                      </Form.Group>

                      <Row>
                        <Col md={6} className="form-col-animate" style={{ animationDelay: '0.05s' }}>
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
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                isInvalid={!!fieldErrors.email}
                                placeholder="name@company.com"
                              />
                              <Form.Control.Feedback type="invalid">
                                {fieldErrors.email}
                              </Form.Control.Feedback>
                            </div>
                          </Form.Group>
                        </Col>

                        <Col md={6} className="form-col-animate" style={{ animationDelay: '0.1s' }}>
                          <Form.Group className="mb-3">
                            <Form.Label className="auth-label">
                              Confirm Email <span className="auth-required">*</span>
                            </Form.Label>
                            <div className="field-icon-wrapper">
                              <i className={`bi ${emailsMatch ? 'bi-envelope-check' : 'bi-envelope'}`}></i>
                              <Form.Control
                                className="auth-input"
                                type="email"
                                name="confirm_email"
                                value={formData.confirm_email}
                                onChange={handleChange}
                                isInvalid={!!fieldErrors.confirm_email}
                                placeholder="Confirm email"
                              />
                              {formData.confirm_email.trim() !== '' && (
                                <span className={`field-match-indicator ${emailsMatch ? 'matched' : 'mismatched'}`}>
                                  <i className={`bi ${emailsMatch ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                                </span>
                              )}
                              <Form.Control.Feedback type="invalid">
                                {fieldErrors.confirm_email}
                              </Form.Control.Feedback>
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}

                  {/* STEP 3: Work */}
                  {currentStep === 3 && (
                    <>
                      <div className="form-section-title">
                        <i className="bi bi-briefcase"></i> Work Information
                      </div>

                      <Row>
                        <Col md={6} className="form-col-animate" style={{ animationDelay: '0.05s' }}>
                          <Form.Group className="mb-3">
                            <Form.Label className="auth-label">Phone Number</Form.Label>
                            <div className="field-icon-wrapper">
                              <i className="bi bi-telephone"></i>
                              <Form.Control
                                className="auth-input"
                                type="tel"
                                name="phone_number"
                                autoComplete="tel"
                                value={formData.phone_number}
                                onChange={handleChange}
                                isInvalid={!!fieldErrors.phone_number}
                                placeholder="+91 XXXXX XXXXX"
                                autoFocus
                              />
                              <Form.Control.Feedback type="invalid">
                                {fieldErrors.phone_number}
                              </Form.Control.Feedback>
                            </div>
                          </Form.Group>
                        </Col>

                        <Col md={6} className="form-col-animate" style={{ animationDelay: '0.1s' }}>
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
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {fieldErrors.department}
                            </Form.Control.Feedback>
                            {departmentsError && (
                              <div className="field-hint hint-error">
                                <i className="bi bi-wifi-off"></i>
                                Failed to load departments.
                                <button type="button" className="retry-link" onClick={fetchDepartments}>
                                  <i className="bi bi-arrow-clockwise"></i> Retry
                                </button>
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-2">
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
                            placeholder="e.g. Software Engineer, Analyst..."
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.designation}
                          </Form.Control.Feedback>
                        </div>
                        <div className="chips-row">
                          {DESIGNATION_CHIPS.map(chip => (
                            <button
                              type="button"
                              key={chip}
                              className={`chip ${formData.designation === chip ? 'chip-active' : ''}`}
                              onClick={() => applyChip(chip)}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </Form.Group>
                    </>
                  )}
                </div>
              </div>

              {/* ── Navigation ── */}
              <div className="step-navigation">
                {currentStep > 1 ? (
                  <Button type="button" className="step-back-btn" onClick={handleBack} disabled={loading}>
                    <i className="bi bi-arrow-left me-2"></i>Back
                  </Button>
                ) : (
                  <Button as={Link} to="/login" className="step-back-btn">
                    Cancel
                  </Button>
                )}

                {currentStep < STEPS.length ? (
                  <Button type="submit" className="auth-submit">
                    Continue <i className="bi bi-arrow-right ms-2"></i>
                  </Button>
                ) : (
                  <Button type="submit" className="auth-submit" disabled={loading || departmentsLoading}>
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
                )}
              </div>

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