import { useState } from 'react';
import { Form, Button, InputGroup, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate(); // React Router hook for redirection

  const { username, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Call the real login function from Context
      await login(username, password);
      
      // 2. Get the user from localStorage (Context just updated it)
      const currentUser = JSON.parse(localStorage.getItem('user'));

      // 3. Redirect based on role
      if (currentUser && currentUser.role) {
        navigate(`/${currentUser.role}`);
      } else {
        setError("User role not found. Contact admin.");
      }

    } catch (err) {
      // Handle specific Django errors
      if (err.detail) {
        setError(err.detail); // e.g., "No active account found..."
      } else {
        setError("An error occurred during login. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={5} lg={4}>
            <Card className="shadow border-0 rounded-4">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold text-primary">IT Service Desk</h3>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={onSubmit}>
                  {/* Username Field (Changed from Email) */}
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white"><FaUser /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Enter username"
                        name="username"
                        value={username}
                        onChange={onChange}
                        required
                        autoComplete="username"
                      />
                    </InputGroup>
                  </Form.Group>

                  {/* Password Field */}
                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white"><FaLock /></InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        required
                        autoComplete="current-password"
                      />
                      <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 py-2 fw-bold rounded-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Authenticating...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
            <p className="text-center text-muted mt-3">&copy; Smart IT Service Desk</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;