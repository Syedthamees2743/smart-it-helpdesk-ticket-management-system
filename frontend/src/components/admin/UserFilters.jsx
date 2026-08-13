import { Row, Col, Form, Button } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';

const UserFilters = ({ searchTerm, onSearchChange, roleFilter, onRoleChange, statusFilter, onStatusChange, onRefresh, onClear }) => {
  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  return (
    <Row className="g-2 mb-3 align-items-end">
      <Col md={4}>
        <Form.Control 
          type="text" 
          placeholder="Search by name, email, username..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Col>
      <Col md={2}>
        <Form.Select value={roleFilter} onChange={(e) => onRoleChange(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
          <option value="technician">Technician</option>
        </Form.Select>
      </Col>
      <Col md={2}>
        <Form.Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </Col>
      <Col md="auto" className="ms-auto d-flex gap-2">
        <Button variant="outline-secondary" size="sm" onClick={onClear} disabled={!hasActiveFilters}>
          <FaTimes className="me-1" /> Clear
        </Button>
        <Button variant="outline-primary" size="sm" onClick={onRefresh}>
          <FaSearch className="me-1" /> Refresh
        </Button>
      </Col>
    </Row>
  );
};

export default UserFilters;