import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {Spinner} from 'react-bootstrap';

// We will create AuthContext in the next step. 
// For now, just know this component checks if the user is logged in.

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // If no user is found in context, kick them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required (e.g., 'admin'), check it
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If an employee tries to access /admin, send them to their own dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  // If everything is fine, render the child component (the actual page)
  return children;
};

export default ProtectedRoute;