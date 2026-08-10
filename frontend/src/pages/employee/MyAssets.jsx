import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Table } from 'react-bootstrap';
import { FiMonitor, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import assetService from '../../services/assetService';

const MyAssets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    setLoading(true);
    try {
      // Backend /assets/manage/ automatically filters for logged-in employee
      const res = await assetService.getMyAssets();
      setAssets(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading your assets...</p></div>;

  return (
    <div>
      <div className="mb-4">
        <h4 className="mb-1">My Assets</h4>
        <p className="text-muted">View IT assets currently assigned to you.</p>
      </div>

      {assets.length === 0 ? (
        <Card className="shadow-sm text-center py-5">
          <Card.Body>
            <FiMonitor size={40} className="text-muted mb-3" />
            <h5 className="text-muted">No assets assigned.</h5>
            <p className="text-muted small">You currently have no IT assets assigned to you.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {assets.map(item => {
            const asset = item.asset || item; // Adjust based on exact backend serializer nesting
            return (
              <Col xs={12} md={6} lg={4} key={asset.id}>
                <Card className="shadow-sm h-100 border-top border-3 border-primary cursor-pointer" onClick={() => navigate(`/employee/assets/${asset.id}`)}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="mb-0 fw-bold">{asset.name}</h6>
                      <Badge bg="primary">Assigned</Badge>
                    </div>
                    <div className="small text-muted">
                      <p className="mb-1"><strong>Code:</strong> {asset.asset_code}</p>
                      <p className="mb-1"><strong>Category:</strong> {asset.category_name || '-'}</p>
                      <p className="mb-1"><strong>Brand/Model:</strong> {asset.brand} {asset.model}</p>
                      <p className="mb-0 d-flex align-items-center gap-1"><FiCalendar size={14}/> <strong>Assigned:</strong> {new Date(item.assigned_date || asset.assigned_date).toLocaleDateString()}</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default MyAssets;