import { Row, Col } from 'react-bootstrap';

const StatCard = ({ icon, title, value, subtitle, color = "primary" }) => {
  const colorMap = {
    primary: '#3b82f6', success: '#22c55e', warning: '#f59e0b', 
    danger: '#dc2626', info: '#06b6d4', secondary: '#64748b'
  };

  return (
    <div className="stat-card">
      <Row className="align-items-center">
        <Col xs="auto" className="p-2 pe-0">
          <div className="d-flex justify-content-center align-items-center rounded-circle" 
               style={{ width: '48px', height: '48px', backgroundColor: `${colorMap[color]}15`, color: colorMap[color] }}>
            {icon}
          </div>
        </Col>
        <Col className="ps-2">
          <div className="text-muted" style={{fontSize: '0.8rem'}}>{title}</div>
          <div className="fw-bold fs-4">{value}</div>
          {subtitle && <div className="text-muted" style={{fontSize: '0.75rem'}}>{subtitle}</div>}
        </Col>
      </Row>
    </div>
  );
};

export default StatCard;