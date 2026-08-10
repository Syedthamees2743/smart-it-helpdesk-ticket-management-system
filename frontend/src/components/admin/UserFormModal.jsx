import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Row, Col } from 'react-bootstrap';

const UserFormModal = ({ show, onHide, onSave, editingUser }) => {
  const isEditMode = !!editingUser;
  
  const [formData, setFormData] = useState({
    username: '', first_name: '', last_name: '', email: '',
    phone_number: '', role: 'employee', password: '', password2: '', is_active: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        phone_number: editingUser.phone_number || '',
        role: editingUser.role,
        password: '', // Don't populate passwords on edit
        password2: '',
        is_active: editingUser.is_active
      });
    } else {
      // Reset form for new user
      setFormData({ username: '', first_name: '', last_name: '', email: '', phone_number: '', role: 'employee', password: '', password2: '', is_active: true });
    }
    setErrors({});
  }, [editingUser, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    // Clear specific field error on change
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.username) tempErrors.username = "Username is required";
    if (!formData.email) tempErrors.email = "Email is required";
    if (!isEditMode && !formData.password) tempErrors.password = "Password is required";
    if (!isEditMode && formData.password !== formData.password2) tempErrors.password2 = "Passwords do not match";
    if (!isEditMode && formData.password.length < 6 && formData.password) tempErrors.password = "Password must be at least 6 characters";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave(formData, isEditMode);
      onHide();
    } catch (err) {
      // Handle backend 400 validation errors
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: "Something went wrong." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit User' : 'Add New User'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errors.general && <div className="alert alert-danger">{errors.general}</div>}
        <Form noValidate>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username *</Form.Label>
                <Form.Control isInvalid={errors.username} name="username" value={formData.username} onChange={handleChange} disabled={isEditMode} />
                <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control type="email" isInvalid={errors.email} name="email" value={formData.email} onChange={handleChange} />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name</Form.Label>
                <Form.Control name="first_name" value={formData.first_name} onChange={handleChange} isInvalid={errors.first_name} />
                <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name</Form.Label>
                <Form.Control name="last_name" value={formData.last_name} onChange={handleChange} isInvalid={errors.last_name} />
                <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Phone Number</Form.Label>
                <Form.Control name="phone_number" value={formData.phone_number} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Role *</Form.Label>
                <Form.Select name="role" value={formData.role} onChange={handleChange} isInvalid={errors.role}>
                  <option value="employee">Employee</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            {/* Password fields only for Add mode */}
            {!isEditMode && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Password *</Form.Label>
                    <Form.Control type="password" isInvalid={errors.password} name="password" value={formData.password} onChange={handleChange} />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirm Password *</Form.Label>
                    <Form.Control type="password" isInvalid={errors.password2} name="password2" value={formData.password2} onChange={handleChange} />
                    <Form.Control.Feedback type="invalid">{errors.password2}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </>
            )}

            {isEditMode && (
              <Col md={6}>
                <Form.Check 
                  type="switch" 
                  label="Account Active" 
                  name="is_active" 
                  checked={formData.is_active} 
                  onChange={handleChange}
                  className="mt-2"
                />
              </Col>
            )}
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <><Spinner size="sm" className="me-2" />Saving...</> : (isEditMode ? 'Update User' : 'Create User')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserFormModal;