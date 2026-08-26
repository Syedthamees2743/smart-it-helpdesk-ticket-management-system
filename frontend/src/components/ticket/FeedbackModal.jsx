import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaRegStar, FaCheckCircle } from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';
import feedbackService from '../../services/feedbackService';

const FeedbackModal = ({ show, onHide, ticket }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);

  // When modal opens, check if feedback already exists
  useEffect(() => {
    if (show && ticket) {
      setError('');
      setSuccess('');
      setRating(0);
      setHoverRating(0);
      setReview('');
      setExistingFeedback(null);
      checkExistingFeedback();
    }
  }, [show, ticket]);

  const checkExistingFeedback = async () => {
    setLoading(true);
    try {
      const data = await feedbackService.getFeedbackList();
      const results = data.results || data;
      // Match feedback to this ticket by ticket_number
      const found = results.find(
        (f) =>
          f.ticket_number === ticket.ticket_number ||
          (f.ticket_number && f.ticket_number.includes(ticket.ticket_number))
      );
      if (found) {
        setExistingFeedback(found);
      }
    } catch (err) {
      // Silent fail — just show the form
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating before submitting.');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await feedbackService.createFeedback({
        ticket: ticket.id,
        rating: rating,
        review: review.trim() || null,
      });
      setSuccess('Thank you! Your feedback has been submitted successfully.');
      setRating(0);
      setReview('');
      // Re-check to switch to "already submitted" view
      setTimeout(() => checkExistingFeedback(), 1000);
    } catch (err) {
      // Parse our custom backend error format
      const errorMsg = err.response?.data?.error;
      if (Array.isArray(errorMsg)) {
        setError(errorMsg[0]);
      } else if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else if (typeof errorMsg === 'object' && errorMsg !== null) {
        const firstKey = Object.keys(errorMsg)[0];
        if (Array.isArray(errorMsg[firstKey])) {
          setError(errorMsg[firstKey][0]);
        } else {
          setError(errorMsg[firstKey]);
        }
      } else {
        setError(
          err.response?.data?.detail ||
          'Failed to submit feedback. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render 5 interactive or read-only stars
  const renderStars = (interactive = true) => {
    const stars = [];
    const activeRating = interactive
      ? hoverRating || rating
      : existingFeedback?.rating || 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fontSize: '2rem',
            color: i <= activeRating ? '#f59e0b' : '#d1d5db',
            transition: 'transform 0.15s ease, color 0.15s ease',
            marginRight: '8px',
            display: 'inline-block',
          }}
          onClick={() => interactive && setRating(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onMouseDown={(e) => interactive && e.preventDefault()} // Prevent text selection highlight
        >
          {i <= activeRating ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return stars;
  };

  const getRatingLabel = (r) => {
    const labels = {
      1: 'Very Poor',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent',
    };
    return labels[r] || '';
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="bg-light border-bottom-0 pt-4 px-4">
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-dark">
          <FiMessageSquare className="text-primary" />
          Share Your Feedback
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Checking feedback status...</p>
          </div>
        ) : existingFeedback ? (
          /* ===== ALREADY SUBMITTED VIEW ===== */
          <div className="text-center py-4">
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: '#d1fae5', 
              color: '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem auto',
              fontSize: '1.8rem'
            }}>
              <FaCheckCircle />
            </div>
            <h4 className="fw-bold text-dark mb-1">Feedback Submitted</h4>
            <p className="text-muted mb-4">
              You have already submitted feedback for this ticket.
            </p>
            <div className="bg-light rounded-4 p-4 text-start border">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <span className="fw-bold text-dark">Your Rating:</span>
                <div className="d-flex align-items-center">
                  {renderStars(false)}
                </div>
              </div>
              {existingFeedback.review ? (
                <div>
                  <span className="fw-bold text-dark d-block mb-1">Your Review:</span>
                  <p className="mb-0 text-muted" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                    "{existingFeedback.review}"
                  </p>
                </div>
              ) : (
                <p className="text-muted mb-0 fst-italic">No written review provided.</p>
              )}
            </div>
          </div>
        ) : (
          /* ===== FEEDBACK FORM ===== */
          <>
            {error && <Alert variant="danger" className="rounded-3 border-0">{error}</Alert>}
            {success && <Alert variant="success" className="rounded-3 border-0">{success}</Alert>}

            <div className="text-center mb-4 py-4 bg-light rounded-4 border">
              <p className="text-muted mb-3">
                How would you rate the support for ticket{' '}
                <strong className="text-dark">{ticket?.ticket_number}</strong>?
              </p>
              <div className="d-flex justify-content-center align-items-center mb-3">
                {renderStars(true)}
              </div>
              <div style={{ minHeight: '24px' }}>
                {(hoverRating || rating) > 0 && (
                  <span className="badge bg-primary text-white px-3 py-2 rounded-pill fw-semibold">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                )}
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-dark">
                  Write a Review{' '}
                  <span className="text-muted fw-normal">(optional)</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Share your experience with the support provided..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  maxLength={1000}
                  className="shadow-none"
                  style={{ borderRadius: '12px', resize: 'none' }}
                />
                <div className="d-flex justify-content-end">
                  <Form.Text className="text-muted mt-2">
                    {review.length}/1000 characters
                  </Form.Text>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="light"
                  className="border px-4 rounded-pill"
                  onClick={onHide}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="px-4 rounded-pill"
                  disabled={submitting || rating === 0}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default FeedbackModal;