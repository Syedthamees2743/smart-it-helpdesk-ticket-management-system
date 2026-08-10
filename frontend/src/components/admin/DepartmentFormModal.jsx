import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';

const DepartmentFormModal = ({ show, onHide, onSave, editingDept }) => {
  const isEditMode = !!editingDept;
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingDept) {
      setFormData({ name: editingDept.name, description: editingDept.description || '', status: editingDept.status });
    } else {
      setFormData({ name: '', description: '', status: 'active' });
    }
    setErrors({});
  }, [editingDept, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setErrors({ name: "Department name is required" });
    
    setLoading(true);
    try {
      await onSave(formData, isEditMode);
      onHide();
    } catch (err) {
      setErrors(err.response?.data || { general: "Failed to save department." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Modal.Header closeButton><Modal.Title>{isEditMode ? 'Edit Department' : 'Add Department'}</Modal.Title></Modal.Header>
      <Modal.Body>
        {errors.general && <div className="alert alert-danger">{errors.general}</div>}
        <Form noValidate>
          <Form.Group className="mb-3">
            <Form.Label>Department Name *</Form.Label>
            <Form.Control isInvalid={errors.name} value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: null})}} placeholder="e.g., Information Technology" />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Brief description of this department" />
          </Form.Group>
          {isEditMode && (
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? <Spinner size="sm"/> : (isEditMode ? 'Update' : 'Create')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DepartmentFormModal;