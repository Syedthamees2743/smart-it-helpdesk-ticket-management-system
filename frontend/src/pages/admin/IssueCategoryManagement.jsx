import { useState, useEffect } from "react";
import { Card, Button, Row, Col, Form, Pagination } from "react-bootstrap";
import { FaPlus, FaSync, FaTimes } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import CategoryTable from "../../components/admin/CategoryTable";
import CategoryFormModal from "../../components/admin/CategoryFormModal";
import ConfirmModal from "../../components/admin/ConfirmModal";

const IssueCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [loading, setLoading] = useState(false);
  // This reads the URL (e.g., ?search=printer) when the page loads
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);

  // Whenever 'search' state changes, update the URL bar too!
  useEffect(() => {
    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }
  }, [search, setSearchParams]);

  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getCategories(params);
      setCategories(res.data.results);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ search });
  }, [search]);

  const handleSave = async (data, isEdit) => {
    if (isEdit) await updateCategory(editingCat.id, data);
    else await createCategory(data);
    fetchData({ search });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteCategory(deleteTarget.id);
      setShowConfirm(false);
      fetchData({ search });
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Cannot delete. Tickets might be using this category.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Issue Categories</h4>
          <p className="text-muted mb-0">
            Manage categories used for IT support tickets.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingCat(null);
            setShowForm(true);
          }}
        >
          <FaPlus className="me-2" /> Add Category
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-2 mb-3 align-items-end">
            <Col md={6}>
              <Form.Control
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setSearch("")}
                disabled={!search}
              >
                <FaTimes className="me-1" /> Clear
              </Button>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => fetchData({ search })}
              >
                <FaSync /> Refresh
              </Button>
            </Col>
          </Row>

          <CategoryTable
            categories={categories}
            loading={loading}
            onEdit={(cat) => {
              setEditingCat(cat);
              setShowForm(true);
            }}
            onDelete={(cat) => {
              setDeleteTarget(cat);
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
                    })
                  }
                />
                <Pagination.Next
                  disabled={!nextPage}
                  onClick={() =>
                    fetchData({
                      page: new URL(nextPage).searchParams.get("page"),
                      search,
                    })
                  }
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <CategoryFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        onSave={handleSave}
        editingCat={editingCat}
      />
      <ConfirmModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Issue Category?"
        message="This action cannot be undone."
        loading={actionLoading}
      />
    </div>
  );
};

export default IssueCategoryManagement;
