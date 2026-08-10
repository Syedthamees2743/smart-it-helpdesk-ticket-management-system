import { Table, Button, Badge, Spinner } from 'react-bootstrap';
import { FaEdit, FaBan, FaCheckCircle, FaTrash } from 'react-icons/fa';

const DepartmentTable = ({ departments, loading, onEdit, onToggleStatus, onDelete }) => {
  if (loading) return <div className="text-center py-5"><Spinner animation="border" /> <br/><span className="text-muted">Loading departments...</span></div>;
  
  if (!departments || departments.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <h5>No departments found.</h5>
        <p>Create your first department to get started.</p>
      </div>
    );
  }

  return (
    <Table hover responsive className="align-middle" style={{ fontSize: '0.9rem' }}>
      <thead className="table-light">
        <tr>
          <th>Department Name</th>
          <th>Description</th>
          <th>Status</th>
          <th>Created Date</th>
          <th style={{width: '150px'}}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {departments.map(dept => (
          <tr key={dept.id}>
            <td className="fw-medium">{dept.name}</td>
            <td className="text-muted">{dept.description ? (dept.description.length > 50 ? dept.description.substring(0, 50) + '...' : dept.description) : '-'}</td>
            <td>
              <Badge bg={dept.status === 'active' ? 'success' : 'secondary'} className="text-capitalize">
                {dept.status}
              </Badge>
            </td>
            <td className="text-muted">{new Date(dept.created_at).toLocaleDateString()}</td>
            <td>
              <div className="d-flex gap-1">
                <Button size="sm" variant="outline-primary" onClick={() => onEdit(dept)} title="Edit"><FaEdit /></Button>
                <Button 
                  size="sm" 
                  variant={dept.status === 'active' ? "outline-warning" : "outline-success"} 
                  onClick={() => onToggleStatus(dept)}
                  title={dept.status === 'active' ? "Deactivate" : "Activate"}
                >
                  {dept.status === 'active' ? <FaBan /> : <FaCheckCircle />}
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => onDelete(dept)} title="Delete"><FaTrash /></Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DepartmentTable;