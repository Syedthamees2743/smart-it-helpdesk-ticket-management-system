import { useState, useEffect } from "react";
import { Card, Button, Row, Col, Form, Pagination } from "react-bootstrap";
import { FaPlus, FaSearch, FaSync, FaTimes } from "react-icons/fa";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../services/departmentService";
import DepartmentTable from "../../components/admin/DepartmentTable";
import DepartmentFormModal from "../../components/admin/DepartmentFormModal";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { useSearchParams } from "react-router-dom";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (search) {
      setSearchParams({ search: search, status: statusFilter });
    } else if (statusFilter) {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [search, statusFilter, setSearchParams]);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", dept: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getDepartments(params);
      setDepartments(res.data.results);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever search or filter changes
  useEffect(() => {
    let params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    fetchData(params);
  }, [search, statusFilter]);

  const handleSave = async (data, isEdit) => {
    if (isEdit) await updateDepartment(editingDept.id, data);
    else await createDepartment(data);
    let params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    fetchData(params); // Refresh with current filters
  };

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const newStatus =
        confirmAction.dept.status === "active" ? "inactive" : "active";
      await updateDepartment(confirmAction.dept.id, { status: newStatus });
      setShowConfirm(false);
      let params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      fetchData(params);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteDepartment(confirmAction.dept.id);
      setShowConfirm(false);
      let params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      fetchData(params);
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Cannot delete. It might be assigned to users or tickets.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getPageUrl = (url) =>
    url ? url.replace(import.meta.env.VITE_API_BASE_URL, "") : null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Department Management</h4>
          <p className="text-muted mb-0">
            Manage organizational departments and their status.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingDept(null);
            setShowForm(true);
          }}
        >
          <FaPlus className="me-2" /> Add Department
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {/* Filters */}
          <Row className="g-2 mb-3 align-items-end">
            <Col md={5}>
              <Form.Control
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
                disabled={!search && !statusFilter}
              >
                <FaTimes className="me-1" /> Clear
              </Button>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => fetchData({ search, status: statusFilter })}
              >
                <FaSync /> Refresh
              </Button>
            </Col>
          </Row>

          <DepartmentTable
            departments={departments}
            loading={loading}
            onEdit={(dept) => {
              setEditingDept(dept);
              setShowForm(true);
            }}
            onToggleStatus={(dept) => {
              setConfirmAction({ type: "toggle", dept });
              setShowConfirm(true);
            }}
            onDelete={(dept) => {
              setConfirmAction({ type: "delete", dept });
              setShowConfirm(true);
            }}
          />

          {(nextPage || prevPage) && (
            <div className="d-flex justify-content-end mt-3 pt-3 border-top">
              <Pagination>
                <Pagination.Prev
                  disabled={!prevPage}
                  onClick={() =>
                    fetchData({
                      page: new URL(prevPage).searchParams.get("page"),
                      search,
                      status: statusFilter,
                    })
                  }
                />
                <Pagination.Next
                  disabled={!nextPage}
                  onClick={() =>
                    fetchData({
                      page: new URL(nextPage).searchParams.get("page"),
                      search,
                      status: statusFilter,
                    })
                  }
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <DepartmentFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        onSave={handleSave}
        editingDept={editingDept}
      />
      <ConfirmModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={
          confirmAction.type === "delete" ? handleDelete : handleToggleStatus
        }
        title={
          confirmAction.type === "delete"
            ? "Delete Department?"
            : `Deactivate ${confirmAction.dept?.name}?`
        }
        message={
          confirmAction.type === "delete"
            ? "This action cannot be undone."
            : "They will not be available for new tickets."
        }
        loading={actionLoading}
      />
    </div>
  );
};

export default DepartmentManagement;
