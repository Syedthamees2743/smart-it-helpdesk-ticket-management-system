import { useState, useEffect } from "react";
import { Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import { createTicket } from '../../services/ticketService'
import { getTickets } from "../../services/ticketService";
import { getCategories } from "../../services/categoryService";
const RaiseComplaint = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    priority: "medium",
    screenshot: null,
  });
  const [fileInfo, setFileInfo] = useState(null); // Holds name/size for UI

  // Fetch categories for dropdown
  useEffect(() => {
    getCategories()
      .then((res) => {
        // Handle Django pagination (res.data.results) OR normal array (res.data)
        const data = res.data.results ? res.data.results : res.data;
        setCategories(data);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "screenshot" && files && files[0]) {
      setFormData({ ...formData, screenshot: files[0] });
      setFileInfo({
        name: files[0].name,
        size: (files[0].size / 1024 / 1024).toFixed(2) + " MB",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const clearFile = () => {
    setFormData({ ...formData, screenshot: null });
    setFileInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.category || !formData.title || !formData.description) {
      return setError("Category, Title, and Description are required.");
    }

    setLoading(true);
    try {
      // MUST use FormData for file uploads!
      const data = new FormData();
      data.append("category", formData.category);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("priority", formData.priority);
      if (formData.screenshot) data.append("screenshot", formData.screenshot);

      const res = await createTicket(data);
      setSuccess(
        `Ticket created successfully! Ticket Number: ${res.data.ticket_number}`,
      );

      // Redirect after short delay so user sees the success message
      setTimeout(() => navigate("/employee/tickets"), 2000);
    } catch (err) {
      console.log("FULL ERROR OBJECT:", err);
      console.log("ERROR RESPONSE DATA:", err.response?.data);

      // Try to extract the exact error from Django
      let errorMsg = "Failed to create ticket.";

      if (err.response && err.response.data) {
        const errors = err.response.data;

        // If it's a dictionary with specific field errors
        if (typeof errors === "object" && !Array.isArray(errors)) {
          const firstErrorKey = Object.keys(errors)[0];
          errorMsg = errors[firstErrorKey];
          if (Array.isArray(errorMsg)) {
            errorMsg = errorMsg[0];
          }
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-1">Raise Complaint</h4>
      <p className="text-muted mb-4">Submit a new IT support request.</p>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                isInvalid={error.toLowerCase().includes("category")}
              >
                <option value="">Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Laptop screen is broken"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Explain the issue in detail..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority *</Form.Label>
              <Form.Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Screenshot / Attachment</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="file"
                  name="screenshot"
                  onChange={handleChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="w-75"
                />
                {fileInfo && (
                  <div className="ms-3 d-flex align-items-center">
                    <span className="text-muted me-2">
                      {fileInfo.name} ({fileInfo.size})
                    </span>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={clearFile}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                )}
              </div>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" /> Submitting...
                </>
              ) : (
                "Submit Complaint"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RaiseComplaint;
