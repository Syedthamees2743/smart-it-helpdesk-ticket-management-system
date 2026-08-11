import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaRegStar } from 'react-icons/fa';
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
      setTimeout(() => checkExistingFeedback(), 500);
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
            transition: 'color 0.15s ease',
            marginRight: '4px',
          }}
          onClick={() => interactive && setRating(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
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
      <Modal.Header closeButton className="bg-light border-bottom">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FiMessageSquare className="text-primary" />
          Share Your Feedback
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Checking feedback status...</p>
          </div>
        ) : existingFeedback ? (
          /* ===== ALREADY SUBMITTED VIEW ===== */
          <div className="text-center py-3">
            <div className="mb-3">
              <span style={{ fontSize: '2.5rem', color: '#10b981' }}>
                <FaStar />
              </span>
              <h4 className="mt-2 text-success">Feedback Submitted</h4>
              <p className="text-muted">
                You have already submitted feedback for this ticket.
              </p>
            </div>
            <div className="bg-light rounded-3 p-3 text-start">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="fw-semibold">Your Rating:</span>
                <span className="d-flex align-items-center">
                  {renderStars(false)}
                </span>
                <span className="text-muted small">
                  ({getRatingLabel(existingFeedback.rating)})
                </span>
              </div>
              {existingFeedback.review && (
                <div>
                  <span className="fw-semibold">Your Review:</span>
                  <p className="mt-1 mb-0 text-muted">{existingFeedback.review}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== FEEDBACK FORM ===== */
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="text-center mb-3">
              <p className="text-muted mb-2">
                How would you rate the support for ticket{' '}
                <strong>{ticket?.ticket_number}</strong>?
              </p>
              <div className="d-flex justify-content-center align-items-center">
                {renderStars(true)}
                {(hoverRating || rating) > 0 && (
                  <span className="ms-2 text-muted small">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                )}
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Write a Review{' '}
                  <span className="text-muted">(optional)</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Share your experience with the support provided..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  maxLength={1000}
                />
                <Form.Text className="text-muted">
                  {review.length}/1000 characters
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={onHide}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
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