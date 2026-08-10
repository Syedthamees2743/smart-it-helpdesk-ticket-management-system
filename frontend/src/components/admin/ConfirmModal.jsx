import { Modal, Button, Spinner } from 'react-bootstrap';

const ConfirmModal = ({ show, onHide, onConfirm, title, message, loading }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* FIX: Check if message is a string or a React component */}
        {typeof message === 'string' ? (
          <p className="mb-0">{message}</p>
        ) : (
          message
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Confirm'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;