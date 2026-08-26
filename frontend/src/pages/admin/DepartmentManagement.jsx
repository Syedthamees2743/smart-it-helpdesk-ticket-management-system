import { useState, useEffect } from "react";
import { Card, Button, Row, Col, Form } from "react-bootstrap";
import { FaPlus, FaSearch, FaSync } from "react-icons/fa";
import { FiX } from "react-icons/fi";
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

// =========================================================
// ORU PAGE-LA 10 ITEMS
// =========================================================
const PAGE_SIZE = 10;

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================================================
  // PAGINATION STATES
  // =========================================================
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", dept: null });
  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // SINGLE USEEFFECT - Ella changes-um ingey handle aagum
  // =========================================================
  useEffect(() => {
    // URL sync
    if (search) {
      setSearchParams({ search: search, status: statusFilter });
    } else if (statusFilter) {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }

    // Fetch
    const params = { page: currentPage, page_size: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    fetchData(params);
  }, [currentPage, search, statusFilter]);

  const fetchData = async (params) => {
    setLoading(true);
    try {
      const res = await getDepartments(params);
      setDepartments(res.data.results || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PAGINATION HELPERS
  // =========================================================
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= 0) return pages;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    // useEffect automatic ah fetch pannum
  };

  // Search/filter change panna page-1 ku reset
  const handleSearchChange = (value) => {
    setSearch(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  // Current filters oda params (save/delete apram refresh panna)
  const getFilterParams = (page = currentPage) => {
    const params = { page, page_size: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    return params;
  };

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  const hasActiveFilters = search || statusFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    if (currentPage !== 1) setCurrentPage(1);
  };

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleSave = async (data, isEdit) => {
    if (isEdit) await updateDepartment(editingDept.id, data);
    else await createDepartment(data);
    fetchData(getFilterParams());
  };

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const newStatus =
        confirmAction.dept.status === "active" ? "inactive" : "active";
      await updateDepartment(confirmAction.dept.id, { status: newStatus });
      setShowConfirm(false);
      fetchData(getFilterParams());
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

      // Page-la last item-a delete pannaa, previous page-ku po
      if (departments.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1); // useEffect fetch pannum
      } else {
        fetchData(getFilterParams());
      }
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Cannot delete. It might be assigned to users or tickets.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }} className="py-4 px-3 px-md-4">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Department Management</h4>
          <p className="text-muted mb-0">
            Manage organizational departments and their status.
          </p>
        </div>
        <Button
          variant="primary"
          className="rounded-pill px-4 d-flex align-items-center shadow-sm"
          onClick={() => {
            setEditingDept(null);
            setShowForm(true);
          }}
        >
          <FaPlus className="me-2" /> Add Department
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          {/* =====================================================
              FILTERS
          ===================================================== */}

          <Row className="g-3 align-items-end mb-4">
            <Col md={5}>
              <Form.Label className="small fw-semibold text-muted mb-1">
                Search
              </Form.Label>
              <Form.Group className="position-relative">
                <FaSearch
                  className="text-muted position-absolute"
                  style={{
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.85rem",
                  }}
                />
                <Form.Control
                  placeholder="Search departments..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="shadow-none ps-4 pe-4"
                  style={{ borderRadius: "10px" }}
                />
                {search && (
                  <FiX
                    className="text-danger position-absolute"
                    style={{
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                    onClick={() => handleSearchChange("")}
                  />
                )}
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Label className="small fw-semibold text-muted mb-1">
                Status
              </Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="shadow-none"
                style={{ borderRadius: "10px" }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>

            <Col md={4} className="d-flex gap-2 justify-content-md-end">
              <Button
                variant="light"
                className="border rounded-pill px-4 d-flex align-items-center"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <FiX className="me-1" /> Clear
              </Button>
              <Button
                variant="primary"
                className="rounded-pill px-4 d-flex align-items-center"
                onClick={() => fetchData(getFilterParams())}
              >
                <FaSync /> Refresh
              </Button>
            </Col>
          </Row>

          {/* =====================================================
              TABLE
          ===================================================== */}

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

          {/* =====================================================
              PAGINATION
          ===================================================== */}

          {totalCount > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top flex-wrap gap-3">
              <div className="text-muted small">
                Showing <strong className="text-dark">{startItem}</strong> to{" "}
                <strong className="text-dark">{endItem}</strong> of{" "}
                <strong className="text-dark">{totalCount}</strong> departments
              </div>

              {totalPages > 1 && (
                <div className="d-flex align-items-center gap-1">
                  <Button
                    variant="light"
                    className="border"
                    size="sm"
                    style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    disabled={currentPage === 1}
                    onClick={() => goToPage(1)}
                    title="First Page"
                  >
                    «
                  </Button>
                  <Button
                    variant="light"
                    className="border"
                    size="sm"
                    style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                    title="Previous Page"
                  >
                    ‹
                  </Button>

                  {pageNumbers.map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "primary" : "light"}
                      className={`border ${page === currentPage ? "text-white" : ""}`}
                      size="sm"
                      style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="light"
                    className="border"
                    size="sm"
                    style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    title="Next Page"
                  >
                    ›
                  </Button>
                  <Button
                    variant="light"
                    className="border"
                    size="sm"
                    style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(totalPages)}
                    title="Last Page"
                  >
                    »
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* =====================================================
          MODALS
      ===================================================== */}

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