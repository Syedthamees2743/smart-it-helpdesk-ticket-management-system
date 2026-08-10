import { useState, useEffect, useContext } from 'react';
import { Card, Button, Row, Col, Pagination } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from '../../services/userService';

import UserFilters from '../../components/admin/UserFilters';
import UserTable from '../../components/admin/UserTable';
import UserFormModal from '../../components/admin/UserFormModal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);

  // Data States
  const [users, setUsers] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', user: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Data Function
  const fetchUsers = async (url) => {
    setLoading(true);
    try {
      const res = await getUsers(url);
      setUsers(res.data.results);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Client-side Filtering (Applies to the currently loaded page)
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || 
      user.username.toLowerCase().includes(term) ||
      user.first_name.toLowerCase().includes(term) ||
      user.last_name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term);
    
    const matchRole = !roleFilter || user.role === roleFilter;
    const matchStatus = !statusFilter || 
      (statusFilter === 'active' && user.is_active) || 
      (statusFilter === 'inactive' && !user.is_active);

    return matchSearch && matchRole && matchStatus;
  });

  // Handlers
  const handleSaveUser = async (formData, isEditMode) => {
    if (isEditMode) {
      const { password, password2, ...updateData } = formData; // Strip passwords from update
      await updateUser(editingUser.id, updateData);
    } else {
      await createUser(formData);
    }
    fetchUsers(); // Refresh list
  };

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      await toggleUserStatus(confirmAction.user.id);
      setShowConfirmModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to change status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteUser(confirmAction.user.id);
      setShowConfirmModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete user. They might have related tickets/assets.");
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (type, user) => {
    setConfirmAction({ type, user });
    setShowConfirmModal(true);
  };

  // Pagination URL helper (converts relative /api/auth/users/?page=2 to absolute if needed, though Axios usually handles this)
  const getPageUrl = (url) => {
    if (!url) return null;
    // Ensure we don't double-prefix the base URL if DRF returns absolute URLs
    return url.replace(import.meta.env.VITE_API_BASE_URL, '');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">User Management</h4>
          <p className="text-muted mb-0">Manage employees, technicians and administrators.</p>
        </div>
        <Button variant="primary" onClick={() => { setEditingUser(null); setShowFormModal(true); }}>
          <FaPlus className="me-2" /> Add User
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <UserFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onRefresh={() => fetchUsers()}
          />

          <UserTable 
            users={filteredUsers}
            loading={loading}
            currentUser={currentUser}
            onEdit={(user) => { setEditingUser(user); setShowFormModal(true); }}
            onToggleStatus={(user) => openConfirm('toggle', user)}
            onDelete={(user) => openConfirm('delete', user)}
          />

          {/* Pagination */}
          {(nextPage || prevPage) && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <div className="text-muted small">Showing {filteredUsers.length} of {users.length} on this page</div>
              <Pagination className="mb-0">
                <Pagination.Prev disabled={!prevPage} onClick={() => fetchUsers(getPageUrl(prevPage))} />
                <Pagination.Next disabled={!nextPage} onClick={() => fetchUsers(getPageUrl(nextPage))} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <UserFormModal 
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      <ConfirmModal 
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmAction.type === 'delete' ? handleDelete : handleToggleStatus}
        title={confirmAction.type === 'delete' ? 'Delete User' : `Deactivate ${confirmAction.user?.first_name}?`}
        message={
          confirmAction.type === 'delete' 
            ? `Are you sure you want to delete ${confirmAction.user?.username}? This action cannot be undone.`
            : `Are you sure you want to deactivate ${confirmAction.user?.username}? They will not be able to log in.`
        }
        loading={actionLoading}
      />
    </div>
  );
};

export default UserManagement;