import { Table, Button, Badge, Spinner, Image } from 'react-bootstrap';
import { FaEdit, FaBan, FaCheckCircle, FaTrash, FaBell } from 'react-icons/fa';

const UserTable = ({ users, loading, onEdit, onToggleStatus, onDelete, onManagePrefs, currentUser, emptyState }) => {
  
  const getRoleBadge = (role) => {
    const variant = role === 'admin' ? 'dark' : role === 'technician' ? 'info' : 'primary';
    return <Badge bg={variant} className="text-uppercase">{role}</Badge>;
  };

  const getIdentitySubtext = (user) => {
    if (user.role === 'employee') {
      const id = user.employee_id ? user.employee_id : "";
      const dept = user.employee_department ? user.employee_department : "";
      const sub = [id, dept].filter(Boolean).join(" - ");
      if (!sub) return null;
      return (
        <div className="text-muted" style={{ fontSize: "0.72rem", lineHeight: 1.2 }}>
          {sub}
        </div>
      );
    }
    if (user.role === 'technician') {
      const id = user.technician_id ? user.technician_id : "";
      const dept = user.technician_department ? user.technician_department : "";
      const sub = [id, dept].filter(Boolean).join(" - ");
      if (!sub) return null;
      return (
        <div className="text-muted" style={{ fontSize: "0.72rem", lineHeight: 1.2 }}>
          {sub}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" /> <br />
        <span className="text-muted mt-2 d-block">Loading users...</span>
      </div>
    );
  }

  if (!users || users.length === 0) {
    if (emptyState) {
      return <div className="py-4">{emptyState}</div>;
    }
    return (
      <div className="text-center py-5 text-muted">
        <h5>No users found</h5>
        <p>Try changing your search or filters.</p>
      </div>
    );
  }

  return (
    <Table hover responsive className="align-middle" style={{ fontSize: '0.9rem' }}>
      <thead className="table-light">
        <tr>
          <th>User</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Role</th>
          <th>Department</th>
          <th>Status</th>
          <th>Created</th>
          <th style={{ width: '185px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>
              <div className="d-flex align-items-center">
                {user.profile_image ? (
                  <Image src={user.profile_image} roundedCircle width={35} height={35} className="me-2 object-fit-cover" />
                ) : (
                  <span className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center me-2" style={{width:'35px', height:'35px', fontSize:'14px', fontWeight:'bold'}}>
                    {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                  </span>
                )}
                <div>
                  <div className="fw-medium">
                    {user.first_name} {user.last_name}
                    {getIdentitySubtext(user)}
                  </div>
                  <small className="text-muted">@{user.username}</small>
                </div>
              </div>
            </td>
            <td>{user.email}</td>
            <td>{user.phone_number || '-'}</td>
            <td>{getRoleBadge(user.role)}</td>
            <td>
              {user.employee_department || user.technician_department || (
                <span className="text-muted">—</span>
              )}
            </td>
            <td>
              <Badge bg={user.is_active ? 'success' : 'secondary'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </td>
            <td className="text-muted">{new Date(user.created_at || user.date_joined).toLocaleDateString()}</td>
            <td>
              {currentUser?.id === user.id ? (
                <Badge bg="secondary">You</Badge>
              ) : (
                <div className="d-flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline-primary" onClick={() => onEdit(user)} title="Edit"><FaEdit /></Button>
                  <Button 
                    size="sm" 
                    variant="outline-secondary"
                    onClick={() => onManagePrefs(user)}
                    title="Notification Preferences"
                  >
                    <FaBell />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={user.is_active ? "outline-warning" : "outline-success"} 
                    onClick={() => onToggleStatus(user)}
                    title={user.is_active ? "Deactivate" : "Activate"}
                  >
                    {user.is_active ? <FaBan /> : <FaCheckCircle />}
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => onDelete(user)} title="Delete"><FaTrash /></Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserTable;