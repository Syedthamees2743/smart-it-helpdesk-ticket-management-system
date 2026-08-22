import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';

const DepartmentFormModal = ({ show, onHide, onSave, editingDept }) => {
  const isEditMode = !!editingDept;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_type: 'both',
    status: 'active'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingDept) {
      setFormData({
        name: editingDept.name,
        description: editingDept.description || '',
        department_type: editingDept.department_type || 'both',
        status: editingDept.status
      });
    } else {
      setFormData({
        name: '',
        description: '',
        department_type: 'both',
        status: 'active'
      });
    }
    setErrors({});
  }, [editingDept, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    let tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Department name is required";
    
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData, isEditMode);
      onHide();
    } catch (err) {
      const errData = err.response?.data;
      if (errData) {
        setErrors(errData);
      } else {
        setErrors({ general: "Failed to save department." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="md">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? 'Edit Department' : 'Add New Department'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errors.general && (
          <Alert variant="danger" dismissible onClose={() => setErrors({...errors, general: null})}>
            {errors.general}
          </Alert>
        )}

        <Form noValidate onSubmit={handleSubmit}>
          {/* Department Name */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Department Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              isInvalid={!!errors.name}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Information Technology"
              className="py-2"
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Department Type - NEW */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Assign To <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="type-employee"
                label={
                  <span>
                    <i className="bi bi-person-badge me-1"></i> Employee
                  </span>
                }
                name="department_type"
                value="employee"
                checked={formData.department_type === 'employee'}
                onChange={(e) => handleChange('department_type', e.target.value)}
                className="text-capitalize"
              />
              <Form.Check
                type="radio"
                id="type-technician"
                label={
                  <span>
                    <i className="bi bi-wrench me-1"></i> Technician
                  </span>
                }
                name="department_type"
                value="technician"
                checked={formData.department_type === 'technician'}
                onChange={(e) => handleChange('department_type', e.target.value)}
                className="text-capitalize"
              />
              <Form.Check
                type="radio"
                id="type-both"
                label={
                  <span>
                    <i className="bi bi-people me-1"></i> Both
                  </span>
                }
                name="department_type"
                value="both"
                checked={formData.department_type === 'both'}
                onChange={(e) => handleChange('department_type', e.target.value)}
                className="text-capitalize"
              />
            </div>
            {errors.department_type && (
              <div className="text-danger small mt-1">{errors.department_type}</div>
            )}
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this department"
              className="py-2"
            />
          </Form.Group>

          {/* Status - Only in Edit Mode */}
          {isEditMode && (
            <Form.Group>
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <><Spinner size="sm" className="me-2" />Saving...</>
          ) : isEditMode ? (
            'Update Department'
          ) : (
            'Create Department'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DepartmentFormModal;