import { NavLink } from 'react-router-dom';
import { Nav} from 'react-bootstrap'
import { 
  FaTachometerAlt, FaUsers, FaBuilding, FaListAlt, FaTicketAlt, 
  FaLaptop, FaQuestionCircle, FaStar, FaComments, FaUserEdit, FaCog
} from 'react-icons/fa';
import {useAuth} from '../../context/AuthContext';

const Sidebar = ({ role, mobile, onClick }) => {
  const { logout } = useAuth();

  const menus = {
    admin: [
      { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard', end: true },
      { path: '/admin/users', icon: <FaUsers />, label: 'Users' },
      { path: '/admin/departments', icon: <FaBuilding />, label: 'Departments' },
      { path: '/admin/categories', icon: <FaListAlt />, label: 'Issue Categories' },
      { path: '/admin/tickets', icon: <FaTicketAlt />, label: 'Tickets' },
      { path: '/admin/tickets/:id', icon: <FaTicketAlt />, label: 'Ticket Details', hidden: true },
      { path: '/admin/assets', icon: <FaLaptop />, label: 'Assets' },
      { path: '/admin/asset-categories', icon: <FaListAlt />, label: 'Asset Categories'},
      { path: '/admin/faqs', icon: <FaQuestionCircle />, label: 'FAQ / KB' },
      { path: '/admin/feedbacks', icon: <FaComments />, label: 'Feedback' },
      { path: '/admin/reports', icon: <FaStar />, label: 'Reports' },
    ],
    employee: [
      { path: '/employee', icon: <FaTachometerAlt />, label: 'Dashboard', end: true },
      { path: '/employee/tickets/new', icon: <FaTicketAlt />, label: 'Raise Complaint' },
      { path: '/employee/tickets', icon: <FaListAlt />, label: 'My Tickets' },
      { path: '/employee/assets', icon: <FaLaptop />, label: 'My Assets' },
      { path: '/employee/faqs', icon: <FaQuestionCircle />, label: 'Knowledge Base' },
    ],
    technician: [
      { path: '/technician', icon: <FaTachometerAlt />, label: 'Dashboard', end: true },
      { path: '/technician/tickets', icon: <FaTicketAlt />, label: 'Assigned Tickets' },
      { path: '/technician/performance', icon: <FaStar />, label: 'My Performance' },
      { path: '/technician/faqs', icon: <FaQuestionCircle />, label: 'Knowledge Base' },
    ]
  };

  const currentMenu = menus[role] || [];

  return (
    <div className="d-flex flex-column h-100 bg-dark sidebar-scrollbar">
      {/* Logo Area */}
      <div className="p-3 border-bottom border-secondary text-center">
        <h5 className="text-white mb-0 fw-bold">IT Service Desk</h5>
        <small className="text-secondary text-uppercase" style={{fontSize: '0.7rem'}}>Management Portal</small>
      </div>

      {/* Navigation */}
      <Nav className="flex-column p-2 flex-grow-1">
        {currentMenu.filter(item => !item.hidden).map((item, idx) => (
          <NavLink 
            key={idx}
            to={item.path} 
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClick}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </Nav>

      {/* Bottom Settings/Logout */}
      <div className="p-3 border-top border-secondary">
        <NavLink to={`/${role}/profile`} className="sidebar-link mb-2">
          <FaUserEdit /> My Profile
        </NavLink>
        <div className="sidebar-link text-danger" style={{cursor: 'pointer'}} onClick={logout}>
          <FaCog className="me-2" /> Logout
        </div>
      </div>
    </div>
  );
};

export default Sidebar;