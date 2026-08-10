import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';

const CategoryFormModal = ({ show, onHide, onSave, editingCat }) => {
  const isEditMode = !!editingCat;
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(editingCat ? { name: editingCat.name, description: editingCat.description || '' } : { name: '', description: '' });
    setErrors({});
  }, [editingCat, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setErrors({ name: "Category name is required" });
    
    setLoading(true);
    try {
      await onSave(formData, isEditMode);
      onHide();
    } catch (err) {
      setErrors(err.response?.data || { general: "Failed to save category." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Modal.Header closeButton><Modal.Title>{isEditMode ? 'Edit Category' : 'Add Issue Category'}</Modal.Title></Modal.Header>
      <Modal.Body>
        {errors.general && <div className="alert alert-danger">{errors.general}</div>}
        <Form noValidate>
          <Form.Group className="mb-3">
            <Form.Label>Category Name *</Form.Label>
            <Form.Control isInvalid={errors.name} value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: null})}} placeholder="e.g., Hardware, Software, Network" />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? <Spinner size="sm"/> : (isEditMode ? 'Update' : 'Create')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CategoryFormModal;