import { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../services/ticketService';
import { getCategories } from '../../services/categoryService';

const RaiseComplaint = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        priority: 'medium',
        screenshot: null
    });

    useEffect(() => {
        // FIX: Added page_size: 1000 to get ALL categories
        getCategories({ page_size: 1000 })
            .then(res => setCategories(res.data?.results || res.data || []))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const data = new FormData();
        data.append('category', formData.category);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('priority', formData.priority);
        if (formData.screenshot) data.append('screenshot', formData.screenshot);

        try {
            await createTicket(data);
            navigate('/employee/tickets');
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to raise complaint.";
            setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Raise Complaint</h4>
                <p className="text-muted mb-0">Submit a new IT support request.</p>
            </div>
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Category <span className="text-danger">*</span></Form.Label>
                            <Form.Select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Title <span className="text-danger">*</span></Form.Label>
                            <Form.Control name="title" value={formData.title} onChange={handleChange} placeholder="Brief summary of the issue" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Description <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="textarea" rows={5} name="description" value={formData.description} onChange={handleChange} placeholder="Explain the issue in detail" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Priority</Form.Label>
                            <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Screenshot / Attachment</Form.Label>
                            <Form.Control type="file" name="screenshot" onChange={handleChange} accept="image/*,.pdf" />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? <Spinner size="sm" className="me-2" /> : null}
                                Submit Complaint
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default RaiseComplaint;