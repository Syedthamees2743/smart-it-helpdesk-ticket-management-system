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
  FiUser,
  FiHash,
  FiBriefcase,
  FiRefreshCw,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import assetService from "../../services/assetService";
import assetCategoryService from "../../services/assetCategoryService";

import AssetFormModal from "../../components/admin/AssetFormModal";
import AssetActionModal from "../../components/admin/AssetActionModal";


const AssetManagement = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

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
  const [refreshing, setRefreshing] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);


  // =========================================================
  // FILTER CHECK
  // =========================================================

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.status;


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchCategories();
    fetchAssets();
    fetchKpis();
  }, []);


  // =========================================================
  // FETCH ASSETS WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    fetchAssets();
  }, [filters]);


  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  const fetchCategories = async () => {
    try {
      const res = await assetCategoryService.getCategories({
        page_size: 100,
      });

      setCategories(
        res.data?.results || res.data || []
      );
    } catch (error) {
      console.error(
        "Failed to load asset categories:",
        error
      );
    }
  };


  // =========================================================
  // FETCH ASSETS
  // =========================================================

  const fetchAssets = async () => {
    setLoading(true);

    try {
      const res = await assetService.getAssets({
        ...filters,
        page_size: 1000,
      });

      const data =
        res.data?.results || res.data || [];

      setAssets(data);
    } catch (error) {
      console.error(
        "Failed to load assets:",
        error
      );

      setAssets([]);
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // FETCH KPI DATA
  // =========================================================

  const fetchKpis = async () => {
    try {
      const res = await assetService.getAssets({
        page_size: 1000,
      });

      const allAssets =
        res.data?.results || res.data || [];

      setKpis({
        total: allAssets.length,

        available: allAssets.filter(
          (asset) =>
            asset.status?.toLowerCase() ===
            "available"
        ).length,

        assigned: allAssets.filter(
          (asset) =>
            asset.status?.toLowerCase() ===
            "assigned"
        ).length,

        maintenance: allAssets.filter(
          (asset) =>
            asset.status?.toLowerCase() ===
            "maintenance"
        ).length,
      });
    } catch (error) {
      console.error(
        "Failed to load asset KPIs:",
        error
      );
    }
  };


  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchAssets(),
        fetchKpis(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };


  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      status: "",
    });
  };


  // =========================================================
  // ADD / EDIT ASSET
  // =========================================================

  const handleFormSubmit = async (data) => {
    try {
      if (editAsset) {
        await assetService.updateAsset(
          editAsset.id,
          data
        );
      } else {
        await assetService.createAsset(data);
      }

      setShowFormModal(false);
      setEditAsset(null);

      await fetchAssets();
      await fetchKpis();

    } catch (error) {
      console.error(
        "Asset save failed:",
        error
      );

      throw error;
    }
  };


  // =========================================================
  // OPEN ACTION MODAL
  // =========================================================

  const openAction = (asset, mode) => {
    setSelectedAsset(asset);
    setActionMode(mode);
    setShowActionModal(true);
  };


  // =========================================================
  // ASSIGN / RETURN / MAINTENANCE
  // =========================================================

  const handleActionSuccess = async (
    payload,
    mode
  ) => {
    try {
      if (mode === "assign") {
        await assetService.assignAsset(payload);
      }

      else if (mode === "return") {
        await assetService.returnAsset(payload);
      }

      else if (mode === "maintenance") {
        await assetService.updateAsset(
          selectedAsset.id,
          payload
        );
      }

      setShowActionModal(false);
      setSelectedAsset(null);

      await fetchAssets();
      await fetchKpis();

    } catch (error) {
      console.error(
        "Asset action failed:",
        error
      );

      throw error;
    }
  };


  // =========================================================
  // DELETE ASSET
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this asset?"
    );

    if (!confirmed) return;

    try {
      await assetService.deleteAsset(id);

      await fetchAssets();
      await fetchKpis();

    } catch (error) {
      console.error(
        "Delete asset failed:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Cannot delete this asset."
      );
    }
  };


  // =========================================================
  // STATUS BADGE
  // =========================================================

  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="light" text="dark">
          Unknown
        </Badge>
      );
    }

    const value = status.toLowerCase();

    const label =
      status.charAt(0).toUpperCase() +
      status.slice(1).replace("_", " ");

    if (value === "available") {
      return (
        <Badge
          bg="success"
          className="px-2 py-1"
        >
          Available
        </Badge>
      );
    }

    if (value === "assigned") {
      return (
        <Badge
          bg="primary"
          className="px-2 py-1"
        >
          Assigned
        </Badge>
      );
    }

    if (value === "maintenance") {
      return (
        <Badge
          bg="warning"
          text="dark"
          className="px-2 py-1"
        >
          Maintenance
        </Badge>
      );
    }

    if (value === "retired") {
      return (
        <Badge
          bg="secondary"
          className="px-2 py-1"
        >
          Retired
        </Badge>
      );
    }

    return (
      <Badge bg="light" text="dark">
        {label}
      </Badge>
    );
  };


  // =========================================================
  // ASSIGNMENT DATA
  // =========================================================

  const getAssignment = (asset) => {
    return asset.current_assignment || null;
  };


  // =========================================================
  // EMPLOYEE DISPLAY
  // =========================================================

  const getEmployeeName = (asset) => {
    const assignment =
      getAssignment(asset);

    if (!assignment?.employee_name) {
      return (
        <span className="text-muted">
          Unassigned
        </span>
      );
    }

    return (
      <div className="d-flex align-items-center gap-2">

        <div
          className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
          style={{
            width: "34px",
            height: "34px",
            flexShrink: 0,
          }}
        >
          <FiUser size={16} />
        </div>

        <div>
          <div className="fw-semibold">
            {assignment.employee_name}
          </div>

          <small className="text-muted">
            Employee
          </small>
        </div>

      </div>
    );
  };


  // =========================================================
  // EMPLOYEE ID
  // =========================================================

  const getEmployeeId = (asset) => {
    const assignment =
      getAssignment(asset);

    if (!assignment?.employee_id) {
      return (
        <span className="text-muted">
          —
        </span>
      );
    }

    return (
      <span className="fw-medium text-dark">
        {assignment.employee_id}
      </span>
    );
  };


  // =========================================================
  // DEPARTMENT
  // =========================================================

  const getDepartment = (asset) => {
    const assignment =
      getAssignment(asset);

    if (!assignment?.employee_department) {
      return (
        <span className="text-muted">
          —
        </span>
      );
    }

    return (
      <Badge
        bg="light"
        text="dark"
        className="border px-2 py-1"
      >
        <FiBriefcase
          size={12}
          className="me-1"
        />

        {assignment.employee_department}
      </Badge>
    );
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

        <div>

          <div className="d-flex align-items-center gap-2 mb-1">

            <div
              className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center"
              style={{
                width: "38px",
                height: "38px",
              }}
            >
              <FiMonitor size={20} />
            </div>

            <h4 className="mb-0 fw-bold">
              Asset Management
            </h4>

          </div>

          <p className="text-muted mb-0">
            Manage, assign and track organizational
            IT assets.
          </p>

        </div>


        <div className="d-flex gap-2">

          <Button
            variant="outline-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw
              className={
                refreshing
                  ? "spin-animation me-1"
                  : "me-1"
              }
            />

            Refresh
          </Button>


          <Button
            variant="primary"
            onClick={() => {
              setEditAsset(null);
              setShowFormModal(true);
            }}
          >
            <FiPlus className="me-1" />

            Add Asset
          </Button>

        </div>

      </div>


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Row className="g-3 mb-4">

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted small mb-1">
                    Total Assets
                  </div>

                  <h4 className="fw-bold mb-0">
                    {kpis.total}
                  </h4>

                </div>

                <div className="text-primary fs-3 opacity-50">
                  <FiMonitor />
                </div>

              </div>

            </Card.Body>

          </Card>
        </Col>


        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted small mb-1">
                    Available
                  </div>

                  <h4 className="fw-bold mb-0">
                    {kpis.available}
                  </h4>

                </div>

                <div className="text-success fs-3 opacity-50">
                  <FiCheckCircle />
                </div>

              </div>

            </Card.Body>

          </Card>
        </Col>


        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted small mb-1">
                    Assigned
                  </div>

                  <h4 className="fw-bold mb-0">
                    {kpis.assigned}
                  </h4>

                </div>

                <div className="text-primary fs-3 opacity-50">
                  <FiAlertCircle />
                </div>

              </div>

            </Card.Body>

          </Card>
        </Col>


        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">

            <Card.Body>

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted small mb-1">
                    Maintenance
                  </div>

                  <h4 className="fw-bold mb-0">
                    {kpis.maintenance}
                  </h4>

                </div>

                <div className="text-warning fs-3 opacity-50">
                  <FiTool />
                </div>

              </div>

            </Card.Body>

          </Card>
        </Col>

      </Row>


      {/* =====================================================
          FILTER CARD
      ===================================================== */}

      <Card className="border-0 shadow-sm mb-4">

        <Card.Body>

          <Row className="g-3 align-items-end">

            {/* SEARCH */}

            <Col md={5}>

              <Form.Label className="small fw-semibold">
                Search Assets
              </Form.Label>

              <InputGroup>

                <InputGroup.Text>
                  <FiSearch />
                </InputGroup.Text>

                <Form.Control
                  placeholder="Search by code, name, serial number, brand..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      search: e.target.value,
                    })
                  }
                />

              </InputGroup>

            </Col>


            {/* CATEGORY */}

            <Col md={3}>

              <Form.Label className="small fw-semibold">
                Category
              </Form.Label>

              <Form.Select
                value={filters.category}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value,
                  })
                }
              >

                <option value="">
                  All Categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}

              </Form.Select>

            </Col>


            {/* STATUS */}

            <Col md={2}>

              <Form.Label className="small fw-semibold">
                Status
              </Form.Label>

              <Form.Select
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value,
                  })
                }
              >

                <option value="">
                  All Statuses
                </option>

                <option value="available">
                  Available
                </option>

                <option value="assigned">
                  Assigned
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="retired">
                  Retired
                </option>

              </Form.Select>

            </Col>


            {/* CLEAR */}

            <Col md={2}>

              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >

                <FiX className="me-1" />

                Clear Filters

              </Button>

            </Col>

          </Row>

        </Card.Body>

      </Card>


      {/* =====================================================
          ASSET TABLE
      ===================================================== */}

      <Card className="border-0 shadow-sm">

        <Card.Body className="p-0">

          <div className="table-responsive">

            <Table
              hover
              className="align-middle mb-0"
            >

              <thead className="table-light">

                <tr>

                  <th className="ps-4">
                    Asset ID
                  </th>

                  <th>
                    Asset
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Employee
                  </th>

                  <th>
                    Employee ID
                  </th>

                  <th>
                    Department
                  </th>

                  <th className="text-center pe-4">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {/* LOADING */}

                {loading ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="text-center py-5"
                    >

                      <Spinner animation="border" />

                      <div className="text-muted small mt-2">
                        Loading assets...
                      </div>

                    </td>

                  </tr>

                ) : assets.length === 0 ? (

                  /* EMPTY */

                  <tr>

                    <td
                      colSpan={8}
                      className="text-center py-5"
                    >

                      <FiMonitor
                        size={40}
                        className="text-muted mb-3"
                      />

                      <h6 className="fw-semibold">
                        No assets found
                      </h6>

                      <p className="text-muted small mb-3">
                        {hasActiveFilters
                          ? "No assets match your current filters."
                          : "There are no assets available yet."
                        }
                      </p>

                      {hasActiveFilters && (

                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={clearFilters}
                        >
                          <FiX className="me-1" />
                          Clear Filters
                        </Button>

                      )}

                    </td>

                  </tr>

                ) : (

                  /* DATA */

                  assets.map((asset) => (

                    <tr key={asset.id}>

                      {/* ASSET ID */}

                      <td className="ps-4">

                        <div className="d-flex align-items-center gap-2">

                          <FiHash
                            size={14}
                            className="text-muted"
                          />

                          <span className="fw-semibold">
                            {asset.asset_code}
                          </span>

                        </div>

                      </td>


                      {/* ASSET NAME */}

                      <td>

                        <div className="fw-semibold">
                          {asset.asset_name ||
                            asset.name ||
                            "Unnamed Asset"}
                        </div>

                        {asset.serial_number && (

                          <small className="text-muted">
                            S/N: {asset.serial_number}
                          </small>

                        )}

                      </td>


                      {/* CATEGORY */}

                      <td>

                        <Badge
                          bg="light"
                          text="dark"
                          className="border"
                        >
                          {asset.category_name ||
                            "—"}
                        </Badge>

                      </td>


                      {/* STATUS */}

                      <td>
                        {getStatusBadge(
                          asset.status
                        )}
                      </td>


                      {/* EMPLOYEE */}

                      <td style={{ minWidth: "190px" }}>
                        {getEmployeeName(asset)}
                      </td>


                      {/* EMPLOYEE ID */}

                      <td>

                        {getEmployeeId(asset)}

                      </td>


                      {/* DEPARTMENT */}

                      <td>

                        {getDepartment(asset)}

                      </td>


                      {/* ACTIONS */}

                      <td className="pe-4">

                        <div className="d-flex justify-content-center gap-1">

                          {/* VIEW */}

                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() =>
                              navigate(
                                `/admin/assets/${asset.id}`
                              )
                            }
                            title="View Asset"
                          >
                            <FiEye />
                          </Button>


                          {/* EDIT */}

                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {

                              setEditAsset(asset);
                              setShowFormModal(
                                true
                              );

                            }}
                            title="Edit Asset"
                          >
                            <FiEdit2 />
                          </Button>


                          {/* ASSIGN */}

                          {asset.status
                            ?.toLowerCase() ===
                            "available" && (

                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() =>
                                openAction(
                                  asset,
                                  "assign"
                                )
                              }
                              title="Assign Asset"
                            >
                              <FiUser />
                            </Button>

                          )}


                          {/* RETURN */}

                          {asset.status
                            ?.toLowerCase() ===
                            "assigned" && (

                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={() =>
                                openAction(
                                  asset,
                                  "return"
                                )
                              }
                              title="Return Asset"
                            >
                              ↩
                            </Button>

                          )}


                          {/* MAINTENANCE */}

                          {(
                            asset.status
                              ?.toLowerCase() ===
                              "available" ||
                            asset.status
                              ?.toLowerCase() ===
                              "assigned"
                          ) && (

                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() =>
                                openAction(
                                  asset,
                                  "maintenance"
                                )
                              }
                              title="Maintenance"
                            >
                              <FiTool />
                            </Button>

                          )}


                          {/* DELETE */}

                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() =>
                              handleDelete(
                                asset.id
                              )
                            }
                            title="Delete Asset"
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


      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      <AssetFormModal

        show={showFormModal}

        onHide={() => {
          setShowFormModal(false);
          setEditAsset(null);
        }}

        asset={editAsset}

        onSubmit={handleFormSubmit}

      />


      {/* =====================================================
          ASSIGN / RETURN / MAINTENANCE MODAL
      ===================================================== */}

      <AssetActionModal

        show={showActionModal}

        onHide={() => {
          setShowActionModal(false);
          setSelectedAsset(null);
        }}

        mode={actionMode}

        asset={selectedAsset}

        onSuccess={handleActionSuccess}

      />

    </div>
  );
};


export default AssetManagement;