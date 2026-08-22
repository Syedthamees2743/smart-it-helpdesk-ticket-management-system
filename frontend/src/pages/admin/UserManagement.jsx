import { useState, useEffect, useContext } from 'react';
import { Card, Button, Row, Col, Pagination } from 'react-bootstrap';
import { FaPlus, FaTimes, FaUsers } from 'react-icons/fa';
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from '../../services/userService';

import UserFilters from '../../components/admin/UserFilters';
import UserTable from '../../components/admin/UserTable';
import UserFormModal from '../../components/admin/UserFormModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import UserPrefModal from '../../components/settings/UserPrefModal';

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);

  // Data States
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
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

  // Notification Preferences Modal State
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [prefTargetUser, setPrefTargetUser] = useState(null);

  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  // Build query params from filters
  const getFilterParams = () => {
    const params = { page_size: 20 };
    if (searchTerm) params.search = searchTerm;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.is_active = statusFilter === 'active' ? 'true' : 'false';
    return params;
  };

  // Fetch Data — now uses backend filtering
  const fetchUsers = async (url) => {
    setLoading(true);
    try {
      let res;
      if (url && typeof url === 'string') {
        res = await getUsers(url);
      } else {
        res = await getUsers(getFilterParams());
      }
      const data = res.data;
      setUsers(data.results || []);
      setTotalCount(data.count || 0);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  // Handlers
  const handleSaveUser = async (formData, isEditMode) => {
    if (isEditMode) {
      const { password, password2, ...updateData } = formData;
      await updateUser(editingUser.id, updateData);
    } else {
      await createUser(formData);
    }
    fetchUsers();
  };

    const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const res = await toggleUserStatus(confirmAction.user.id);
      setShowConfirmModal(false);
      fetchUsers();
      toast.success(res.data?.message || "User status updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await deleteUser(confirmAction.user.id);
      setShowConfirmModal(false);
      fetchUsers();
      toast.success(res.data?.message || "User deleted successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Cannot delete user. They might have related tickets, assets, or feedbacks."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (type, user) => {
    setConfirmAction({ type, user });
    setShowConfirmModal(true);
  };

  // Open notification preferences modal
  const openPrefModal = (user) => {
    setPrefTargetUser(user);
    setShowPrefModal(true);
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
            onClear={clearFilters}
          />

          <UserTable 
            users={users}
            loading={loading}
            currentUser={currentUser}
            onEdit={(user) => { setEditingUser(user); setShowFormModal(true); }}
            onToggleStatus={(user) => openConfirm('toggle', user)}
            onDelete={(user) => openConfirm('delete', user)}
            onManagePrefs={openPrefModal}
            emptyState={
              users.length === 0 && !loading ? (
                <div className="text-center py-4 text-muted">
                  <FaUsers style={{ fontSize: '2rem', color: '#d1d5db' }} />
                  <h5 className="mt-2">
                    {hasActiveFilters ? 'No users match your filters' : 'No users found'}
                  </h5>
                  <p>
                    {hasActiveFilters
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Click "Add User" to create one.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline-primary" size="sm" onClick={clearFilters}>
                      <FaTimes className="me-1" /> Clear Filters
                    </Button>
                  )}
                </div>
              ) : null
            }
          />

          {/* Pagination */}
          {(nextPage || prevPage) && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <div className="text-muted small">
                Showing <strong>{users.length}</strong> of <strong>{totalCount}</strong> users
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev disabled={!prevPage} onClick={() => fetchUsers(prevPage)} />
                <Pagination.Next disabled={!nextPage} onClick={() => fetchUsers(nextPage)} />
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

      {/* Notification Preferences Modal */}
      <UserPrefModal
        show={showPrefModal}
        onHide={() => setShowPrefModal(false)}
        userId={prefTargetUser?.id}
        userName={prefTargetUser ? `${prefTargetUser.first_name} ${prefTargetUser.last_name}` : ''}
      />
    </div>
  );
};

export default UserManagement;