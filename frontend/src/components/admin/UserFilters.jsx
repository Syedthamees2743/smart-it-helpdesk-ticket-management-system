import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaBuilding, FaSync, FaUserTag, FaToggleOn } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

const UserFilters = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
  // NEW PROPS
  departmentFilter,
  onDepartmentChange,
  departments,
  onRefresh,
  onClear,
}) => {
  const hasFilters = searchTerm || roleFilter || statusFilter || departmentFilter;

  return (
    <Row className="g-3 align-items-end mb-4">
      {/* Search */}
      <Col md={4}>
        <Form.Label className="small fw-semibold text-muted mb-1">Search</Form.Label>
        <Form.Group className="position-relative">
          <FaSearch
            className="text-muted position-absolute"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
          />
          <Form.Control
            placeholder="Search by name, username, email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="shadow-none ps-4 pe-4"
            style={{ borderRadius: "10px" }}
          />
          {searchTerm && (
            <FiX
              className="text-danger position-absolute"
              style={{ right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "0.9rem" }}
              onClick={() => onSearchChange('')}
            />
          )}
        </Form.Group>
      </Col>

      {/* Role */}
      <Col md={2}>
        <Form.Label className="small fw-semibold text-muted mb-1">Role</Form.Label>
        <Form.Select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="shadow-none"
          style={{ borderRadius: "10px" }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
          <option value="technician">Technician</option>
        </Form.Select>
      </Col>

      {/* =========================================================
          NEW: DEPARTMENT FILTER
      ========================================================== */}
      <Col md={2}>
        <Form.Label className="small fw-semibold text-muted mb-1">
          <FaBuilding className="me-1" style={{ fontSize: "0.75rem" }} />
          Department
        </Form.Label>
        <Form.Select
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="shadow-none"
          style={{ borderRadius: "10px" }}
        >
          <option value="">All Departments</option>
          {(departments || []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Form.Select>
      </Col>

      {/* Status */}
      <Col md={2}>
        <Form.Label className="small fw-semibold text-muted mb-1">Status</Form.Label>
        <Form.Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="shadow-none"
          style={{ borderRadius: "10px" }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </Col>

      {/* Clear + Refresh */}
      <Col md={2} className="d-flex gap-2 justify-content-md-end">
        <Button
          variant="light"
          className="border rounded-pill px-3 d-flex align-items-center"
          onClick={onClear}
          disabled={!hasFilters}
        >
          <FiX className="me-1" /> Clear
        </Button>
        <Button
          variant="primary"
          className="rounded-pill px-3 d-flex align-items-center"
          onClick={onRefresh}
        >
          <FaSync />
        </Button>
      </Col>
    </Row>
  );
};

export default UserFilters;