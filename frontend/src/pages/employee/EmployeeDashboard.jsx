import { Row, Col, Card, Button } from 'react-bootstrap';
import { FaTicketAlt, FaClock, FaSpinner, FaCheckCircle, FaPlus } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';
import RecentTicketsTable from '../../components/dashboard/RecentTicketTable';
import { employeeDashboardData } from '../../utils/mockData';

const EmployeeDashboard = () => {
  const data = employeeDashboardData;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Welcome back, {JSON.parse(localStorage.getItem('user')).first_name} 👋</h4>
          <p className="text-muted mb-0">Track your IT support requests and assigned assets.</p>
        </div>
        <Button variant="primary" className="rounded-3 px-4 shadow-sm">
          <FaPlus className="me-2" /> Raise New Complaint
        </Button>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} md><StatCard icon={<FaTicketAlt size={24}/>} title="My Tickets" value={data.stats.myTickets} color="primary" /></Col>
        <Col xs={6} md><StatCard icon={<FaClock size={24}/>} title="Open" value={data.stats.open} color="info" /></Col>
        <Col xs={6} md><StatCard icon={<FaSpinner size={24}/>} title="In Progress" value={data.stats.inProgress} color="warning" /></Col>
        <Col xs={6} md><StatCard icon={<FaCheckCircle size={24}/>} title="Resolved" value={data.stats.resolved} color="success" /></Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
              <h6 className="fw-bold mb-0">My Recent Tickets</h6>
            </Card.Header>
            <Card.Body className="pt-0">
              <RecentTicketsTable tickets={data.recentTickets} employeeView={true} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
              <h6 className="fw-bold mb-0">My Assets</h6>
            </Card.Header>
            <Card.Body>
              {data.myAssets.map((asset, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
                  <div>
                    <div className="fw-medium">{asset.name}</div>
                    <small className="text-muted">{asset.code} • {asset.category}</small>
                  </div>
                  <span className="badge bg-success">{asset.status}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
          <Card className="border-0 shadow-sm mt-3">
            <Card.Body>
              <h6 className="fw-bold">Knowledge Base</h6>
              <p className="text-muted small">Find answers to common IT issues before raising a ticket.</p>
              <Button variant="outline-primary" size="sm" className="w-100">View FAQs</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;