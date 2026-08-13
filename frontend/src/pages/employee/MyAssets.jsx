import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
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
      // Added cache-buster (?t=timestamp) to FORCE bypass browser cache
      const res = await assetService.getMyAssets(); 
      let rawData = res.data;
      
      // STRICT DEBUG LOG: Check exactly what backend returns NOW
      console.log("RAW BACKEND RESPONSE:", JSON.stringify(rawData));
      
      // BULLETPROOF EXTRACTION
      if (rawData?.results && Array.isArray(rawData.results)) rawData = rawData.results;
      else if (rawData?.data && Array.isArray(rawData.data)) rawData = rawData.data;
      
      setAssets(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error("My Assets Error:", err);
      setAssets([]);
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
          {assets.map((item, index) => {
            const asset = item.asset || item;
            const assetId = item.id || item.asset_id || item.asset?.id;
            const assetName = asset.asset_name || item.asset_name || asset.name || 'Unknown Asset';
            const assetCode = asset.asset_code || item.asset_code || '-';
            const categoryName = asset.category_name || item.category_name || '-';
            const brandModel = `${asset.brand || item.brand || ''}${asset.model || item.model ? ` ${asset.model || item.model}` : ''}`.trim();
            const assignedDate = item.assigned_date || asset.assigned_date;
            
            if (!assetId) return null;

            return (
              <Col xs={12} md={6} lg={4} key={assetId || index}>
                <Card className="shadow-sm h-100 border-top border-3 border-primary cursor-pointer" onClick={() => navigate(`/employee/assets/${assetId}`)}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="mb-0 fw-bold">{assetName}</h6>
                      <Badge bg="primary">Assigned</Badge>
                    </div>
                    <div className="small text-muted">
                      <p className="mb-1"><strong>Code:</strong> {assetCode}</p>
                      <p className="mb-1"><strong>Category:</strong> {categoryName}</p>
                      <p className="mb-1"><strong>Brand/Model:</strong> {brandModel || '-'}</p>
                      <p className="mb-0 d-flex align-items-center gap-1">
                        <FiCalendar size={14}/> 
                        <strong>Assigned:</strong> {assignedDate ? new Date(assignedDate).toLocaleDateString() : '-'}
                      </p>
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