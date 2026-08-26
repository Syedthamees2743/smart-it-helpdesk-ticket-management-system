import { useState, useEffect, useContext } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlus, FaTimes, FaUsers } from 'react-icons/fa';
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from '../../services/userService';
import { getDepartments } from '../../services/departmentService';

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

  // =========================================================
  // NEW: Department Filter States
  // =========================================================
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', user: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Notification Preferences Modal State
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [prefTargetUser, setPrefTargetUser] = useState(null);

  const hasActiveFilters = searchTerm || roleFilter || statusFilter || departmentFilter;

  // =========================================================
  // NEW: Fetch departments for dropdown
  // =========================================================
  useEffect(() => {
    getDepartments({ page_size: 100 })
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.results || []);
        setDepartments(list);
      })
      .catch(() => {});
  }, []);

  // Build query params from filters — department-um add pannirukken
  const getFilterParams = () => {
    const params = { page_size: 20 };
    if (searchTerm) params.search = searchTerm;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.is_active = statusFilter === 'active' ? 'true' : 'false';
    if (departmentFilter) params.department = departmentFilter; // NEW
    return params;
  };

  // Fetch Data — backend filtering
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

  // Re-fetch when filters change — departmentFilter-um dependency-la add pannirukken
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter, departmentFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setDepartmentFilter(''); // NEW
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

  const openPrefModal = (user) => {
    setPrefTargetUser(user);
    setShowPrefModal(true);
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">User Management</h4>
          <p className="text-muted mb-0">Manage employees, technicians and administrators.</p>
        </div>
        <Button
          variant="primary"
          className="rounded-pill px-4 d-flex align-items-center shadow-sm"
          onClick={() => { setEditingUser(null); setShowFormModal(true); }}
        >
          <FaPlus className="me-2" /> Add User
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          {/* =====================================================
              FILTERS (with Department)
          ===================================================== */}

          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            departmentFilter={departmentFilter}       // NEW
            onDepartmentChange={setDepartmentFilter}   // NEW
            departments={departments}                  // NEW
            onRefresh={() => fetchUsers()}
            onClear={clearFilters}
          />

          {/* =====================================================
              TABLE
          ===================================================== */}

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
                <div className="text-center py-5 text-muted">
                  <FaUsers style={{ fontSize: '2.5rem', color: '#dee2e6' }} />
                  <h5 className="mt-3 fw-bold text-dark">
                    {hasActiveFilters ? 'No users match your filters' : 'No users found'}
                  </h5>
                  <p className="mb-3">
                    {hasActiveFilters
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Click "Add User" to create one.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-4" onClick={clearFilters}>
                      <FaTimes className="me-1" /> Clear All Filters
                    </Button>
                  )}
                </div>
              ) : null
            }
          />

          {/* =====================================================
              PAGINATION
          ===================================================== */}

          {(nextPage || prevPage) && (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top flex-wrap gap-3">
              <div className="text-muted small">
                Showing <strong className="text-dark">{users.length}</strong> of{' '}
                <strong className="text-dark">{totalCount}</strong> users
              </div>
              <div className="d-flex align-items-center gap-1">
                <Button
                  variant="light"
                  className="border"
                  size="sm"
                  style={{ width: "80px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  disabled={!prevPage}
                  onClick={() => fetchUsers(prevPage)}
                >
                  ‹ Prev
                </Button>
                <Button
                  variant="light"
                  className="border"
                  size="sm"
                  style={{ width: "80px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  disabled={!nextPage}
                  onClick={() => fetchUsers(nextPage)}
                >
                  Next ›
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* =====================================================
          MODALS
      ===================================================== */}

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