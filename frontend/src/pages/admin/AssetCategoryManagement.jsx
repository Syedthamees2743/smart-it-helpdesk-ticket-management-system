import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Form,
  InputGroup,
  Modal,
  Spinner,
  Alert,
  Pagination,
} from "react-bootstrap";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import assetCategoryService from "../../services/assetCategoryService";

const AssetCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // ⭐ Pagination States
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, [search, currentPage]);

  const fetchCategories = async (url = null) => {
    setLoading(true);
    try {
      let res;
      if (url) {
        // Extract page number from URL for direct page navigation
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get("page");
        if (page) setCurrentPage(parseInt(page));
        res = await assetCategoryService.getCategoriesByUrl(url);
      } else {
        const params = { page: currentPage, page_size: 10 };
        if (search) params.search = search;
        res = await assetCategoryService.getCategories(params);
      }
      
      const data = res.data;
      // Handle paginated response
      if (data.results !== undefined) {
        setCategories(data.results);
        setTotalCount(data.count);
        setNextPage(data.next);
        setPrevPage(data.previous);
      } else {
        // Handle non-paginated response (fallback)
        setCategories(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
        setNextPage(null);
        setPrevPage(null);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const openAdd = () => {
    setEditItem(null);
    setFormData({ name: "", description: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      if (editItem) {
        await assetCategoryService.updateCategory(editItem.id, formData);
      } else {
        await assetCategoryService.createCategory(formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || "Failed to save.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? This cannot be undone.")) return;
    try {
      await assetCategoryService.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete category. It may have assets assigned.");
    }
  };

  // ⭐ Calculate total pages
  const totalPages = Math.ceil(totalCount / 10);

  // ⭐ Build page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Asset Categories</h4>
          <p className="text-muted mb-0">Manage IT asset categories.</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <FiPlus className="me-1" /> Add Category
        </Button>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          {/* Search */}
          <div className="d-flex align-items-center gap-2 mb-3" style={{ maxWidth: "500px" }}>
            <InputGroup>
              <InputGroup.Text>
                <FiSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search categories..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </InputGroup>
            {search && (
              <Button variant="outline-secondary" size="sm" onClick={handleClearSearch}>
                <FiX className="me-1" /> Clear
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="table-responsive">
            <Table hover className="align-middle" style={{ fontSize: "0.9rem" }}>
              <thead className="bg-light">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <Spinner animation="border" className="me-2" />
                      <span className="text-muted">Loading...</span>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-5">
                      {search ? "No categories match your search." : "No categories found. Click 'Add Category' to create one."}
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="fw-semibold">{cat.name}</td>
                      <td className="text-muted" style={{ maxWidth: "400px" }}>
                        {cat.description 
                          ? (cat.description.length > 60 
                              ? cat.description.substring(0, 60) + "..." 
                              : cat.description) 
                          : "—"}
                      </td>
                      <td className="text-muted">
                        {cat.created_at 
                          ? new Date(cat.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1"
                          onClick={() => openEdit(cat)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(cat.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* ⭐ Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <div className="text-muted small">
                Showing <strong>{(currentPage - 1) * 10 + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * 10, totalCount)}</strong> of{" "}
                <strong>{totalCount}</strong> categories
              </div>
              <Pagination className="mb-0">
                <Pagination.First
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(1); }}
                />
                <Pagination.Prev
                  disabled={!prevPage}
                  onClick={() => fetchCategories(prevPage)}
                />
                
                {getPageNumbers().map((page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                ))}
                
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                  <Pagination.Ellipsis disabled />
                )}
                
                <Pagination.Next
                  disabled={!nextPage}
                  onClick={() => fetchCategories(nextPage)}
                />
                <Pagination.Last
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? "Edit" : "Add"} Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Laptop, Desktop, Printer"
                required
                className="py-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category"
                className="py-2"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>
                {actionLoading ? <Spinner size="sm" className="me-1" /> : null}
                {actionLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AssetCategoryManagement;