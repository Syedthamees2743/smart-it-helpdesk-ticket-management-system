import { Table, Button, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

const CategoryTable = ({ categories, loading, onEdit, onDelete }) => {
  if (loading) return <div className="text-center py-5"><Spinner animation="border" /><br/><span className="text-muted">Loading categories...</span></div>;
  
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <h5>No issue categories found.</h5>
        <p>Create your first category (e.g., Hardware, Software).</p>
      </div>
    );
  }

  return (
    <Table hover responsive className="align-middle" style={{ fontSize: '0.9rem' }}>
      <thead className="table-light">
        <tr>
          <th>Category Name</th>
          <th>Description</th>
          <th>Created Date</th>
          <th style={{width: '100px'}}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(cat => (
          <tr key={cat.id}>
            <td className="fw-medium">{cat.name}</td>
            <td className="text-muted">{cat.description || '-'}</td>
            <td className="text-muted">{cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '-'}</td>
            <td>
              <div className="d-flex gap-1">
                <Button size="sm" variant="outline-primary" onClick={() => onEdit(cat)} title="Edit"><FaEdit /></Button>
                <Button size="sm" variant="outline-danger" onClick={() => onDelete(cat)} title="Delete"><FaTrash /></Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default CategoryTable;