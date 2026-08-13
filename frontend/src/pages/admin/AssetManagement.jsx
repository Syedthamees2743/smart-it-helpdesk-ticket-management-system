import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Form,
  InputGroup,
  Badge,
  Spinner,
} from "react-bootstrap";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMonitor,
  FiCheckCircle,
  FiAlertCircle,
  FiTool,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import assetService from "../../services/assetService";
import assetCategoryService from "../../services/assetCategoryService";
import AssetFormModal from "../../components/admin/AssetFormModal";
import AssetActionModal from "../../components/admin/AssetActionModal";

const AssetManagement = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kpis, setKpis] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const hasActiveFilters = filters.search || filters.category || filters.status;

  const clearFilters = () => {
    setFilters({ search: "", category: "", status: "" });
  };

  const [showFormModal, setShowFormModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchKpis();
    fetchCategories();
  }, []);
  useEffect(() => {
    fetchAssets();
  }, [filters]);

  const fetchKpis = async () => {
    try {
      const res = await assetService.getAssets({ page_size: 1000 });
      const allAssets = res.data.results || res.data;
      setKpis({
        total: allAssets.length,
        available: allAssets.filter(
          (a) => a.status?.toLowerCase() === "available",
        ).length,
        assigned: allAssets.filter(
          (a) => a.status?.toLowerCase() === "assigned",
        ).length,
        maintenance: allAssets.filter(
          (a) => a.status?.toLowerCase() === "maintenance",
        ).length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    const res = await assetCategoryService.getCategories({ page_size: 100 });
    setCategories(res.data.results || res.data);
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await assetService.getAssets({ ...filters, page_size: 1000 });
      setAssets(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    if (editAsset) await assetService.updateAsset(editAsset.id, data);
    else await assetService.createAsset(data);
    fetchAssets();
    fetchKpis();
  };

  const openAction = (asset, mode) => {
    setSelectedAsset(asset);
    setActionMode(mode);
    setShowActionModal(true);
  };

  const handleActionSuccess = async (payload, mode) => {
    if (mode === "assign") await assetService.assignAsset(payload);
    else if (mode === "return") await assetService.returnAsset(payload);
    else if (mode === "maintenance")
      await assetService.updateAsset(selectedAsset.id, payload);
    fetchAssets();
    fetchKpis();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await assetService.deleteAsset(id);
      fetchAssets();
      fetchKpis();
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete.");
    }
  };

  const getStatusBadge = (status) => {
    if (!status)
      return <span className="badge bg-light text-dark">Unknown</span>;
    let cls = "badge ";
    const s = status.toLowerCase();
    const displayText =
      status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
    switch (s) {
      case "available":
        cls += "bg-success-subtle text-success";
        break;
      case "assigned":
        cls += "bg-primary-subtle text-primary";
        break;
      case "maintenance":
        cls += "bg-warning-subtle text-warning";
        break;
      case "retired":
        cls += "bg-secondary-subtle text-secondary";
        break;
      default:
        cls += "bg-light text-dark";
    }
    return <span className={cls}>{displayText}</span>;
  };

  const getAssignedName = (asset) => {
    // Matches the exact format we added to the backend serializer
    if (asset.current_assignment?.employee_name)
      return asset.current_assignment.employee_name;
    return "-";
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-1">Asset Management</h4>
          <p className="text-muted mb-0">
            Manage, assign and track organizational IT assets.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditAsset(null);
            setShowFormModal(true);
          }}
        >
          <FiPlus className="me-1" /> Add Asset
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {[
          {
            label: "Total Assets",
            val: kpis.total,
            icon: <FiMonitor />,
            color: "dark",
          },
          {
            label: "Available",
            val: kpis.available,
            icon: <FiCheckCircle />,
            color: "success",
          },
          {
            label: "Assigned",
            val: kpis.assigned,
            icon: <FiAlertCircle />,
            color: "primary",
          },
          {
            label: "Maintenance",
            val: kpis.maintenance,
            icon: <FiTool />,
            color: "warning",
          },
        ].map((kpi, i) => (
          <Col xs={6} md={3} key={i}>
            <Card
              className={`border-0 shadow-sm h-100 border-start border-4 border-${kpi.color}`}
            >
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">{kpi.label}</p>
                  <h4 className="mb-0 fw-bold">{kpi.val}</h4>
                </div>
                <div className={`text-${kpi.color} fs-3 opacity-50`}>
                  {kpi.icon}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="g-2 mb-3 align-items-end">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text>
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by code, name, serial number, brand..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <FiX className="me-1" /> Clear
              </Button>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Code</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <Spinner animation="border" />
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      {hasActiveFilters ? (
                        <>
                          <div>
                            <strong>No assets match your filters.</strong>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mt-2"
                            onClick={clearFilters}
                          >
                            <FiX className="me-1" /> Clear Filters
                          </Button>
                        </>
                      ) : (
                        "No assets found."
                      )}
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="fw-semibold text-nowrap">
                        {asset.asset_code}
                      </td>
                      <td>{asset.asset_name || asset.name}</td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {asset.category_name || "-"}
                        </Badge>
                      </td>
                      <td>{getStatusBadge(asset.status)}</td>
                      <td>{getAssignedName(asset)}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-1 flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() =>
                              navigate(`/admin/assets/${asset.id}`)
                            }
                            title="View"
                          >
                            <FiEye />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              setEditAsset(asset);
                              setShowFormModal(true);
                            }}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Button>
                          {asset.status?.toLowerCase() === "available" && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => openAction(asset, "assign")}
                              title="Assign"
                            >
                              👤
                            </Button>
                          )}
                          {asset.status?.toLowerCase() === "assigned" && (
                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={() => openAction(asset, "return")}
                              title="Return"
                            >
                              ↩️
                            </Button>
                          )}
                          {(asset.status?.toLowerCase() === "available" ||
                            asset.status?.toLowerCase() === "assigned") && (
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => openAction(asset, "maintenance")}
                              title="Maintenance"
                            >
                              🔧
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(asset.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <AssetFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        asset={editAsset}
        onSubmit={handleFormSubmit}
      />
      <AssetActionModal
        show={showActionModal}
        onHide={() => setShowActionModal(false)}
        mode={actionMode}
        asset={selectedAsset}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};

export default AssetManagement;
