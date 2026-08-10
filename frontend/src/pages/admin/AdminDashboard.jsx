import { Row, Col, Card, Carousel } from 'react-bootstrap';
import { FaTicketAlt, FaClock, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaUsers, FaUserTie, FaLaptop } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import RecentTicketsTable from '../../components/dashboard/RecentTicketTable';
import { adminDashboardData } from '../../utils/mockData';

const AdminDashboard = () => {
  const data = adminDashboardData;

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Welcome back, {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).first_name : 'Admin'} 👋</h4>
        <p className="text-muted mb-0">Monitor your organization's IT support operations.</p>
      </div>

      {/* Announcement Carousel */}
      <Card className="border-0 shadow-sm mb-4 bg-primary text-white">
        <Carousel indicators={false} interval={5000} controls={false}>
          <Carousel.Item>
            <div className="p-3"><strong>System Update:</strong> Scheduled maintenance on Saturday 10 PM - 2 AM.</div>
          </Carousel.Item>
          <Carousel.Item>
            <div className="p-3"><strong>SLA Reminder:</strong> 5 tickets are approaching SLA breach. Please review.</div>
          </Carousel.Item>
        </Carousel>
      </Card>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaTicketAlt size={24}/>} title="Total Tickets" value={data.stats.totalTickets} color="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaClock size={24}/>} title="Open Tickets" value={data.stats.openTickets} subtitle="Needs attention" color="info" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaSpinner size={24}/>} title="In Progress" value={data.stats.inProgress} color="warning" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaCheckCircle size={24}/>} title="Resolved" value={data.stats.resolvedTickets} subtitle="This month" color="success" /></Col>
        
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaExclamationTriangle size={24}/>} title="SLA Breached" value={data.stats.slaBreached} color="danger" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaUsers size={24}/>} title="Employees" value={data.stats.totalEmployees} color="secondary" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaUserTie size={24}/>} title="Technicians" value={data.stats.totalTechnicians} color="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<FaLaptop size={24}/>} title="Total Assets" value={data.stats.totalAssets} color="info" /></Col>
      </Row>

      {/* Charts Row */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Ticket Status</Card.Title>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.ticketStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.ticketStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex flex-wrap justify-content-around mt-2" style={{fontSize: '0.8rem'}}>
                {data.ticketStatus.map((item, i) => (
                  <div key={i} className="d-flex align-items-center me-2 mb-1">
                    <span className="me-1 rounded-circle" style={{width:10, height:10, backgroundColor:item.fill}}></span>
                    {item.name}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Ticket Priority</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ticketPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.ticketPriority.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="fw-bold h6">Technician Workload</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.techWorkload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={50} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="assigned" fill="#3b82f6" name="Assigned" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Tickets Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">Recent Tickets</h6>
          <a href="#" className="text-primary text-decoration-none" style={{fontSize:'0.9rem'}}>View All</a>
        </Card.Header>
        <Card.Body className="pt-0">
          <RecentTicketsTable tickets={data.recentTickets} />
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;