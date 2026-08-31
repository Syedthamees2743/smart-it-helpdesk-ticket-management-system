import { useState, useRef } from "react";
import { Spinner } from "react-bootstrap";

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaHeadset,
  FaArrowRight,
  FaUserPlus,
  FaUserCog,
  FaShieldAlt,
  FaServer,
  FaTicketAlt,
  FaLaptop,
  FaNetworkWired,
  FaCheckCircle,
  FaClock,
  FaChevronRight,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import "../../styles/login.css";


const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);

  const isSubmitting = useRef(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { username, password } = formData;


  /* =========================================================
     INPUT CHANGE
     ========================================================= */

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };


  /* =========================================================
     SHAKE ERROR
     ========================================================= */

  const shakeCard = () => {
    setShaking(true);

    setTimeout(() => {
      setShaking(false);
    }, 500);
  };


  /* =========================================================
     LOGIN
     ========================================================= */

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;
    setError("");

    /* Validation */

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      shakeCard();

      isSubmitting.current = false;
      return;
    }

    setLoading(true);

    try {
      await login(username, password);

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        const user = JSON.parse(
          localStorage.getItem("user")
        );

        if (user?.role) {
          navigate(`/${user.role}`);
        } else {
          setError(
            "User role not found. Please contact your administrator."
          );

          setSuccess(false);
          shakeCard();

          isSubmitting.current = false;
        }
      }, 1500);

    } catch (err) {

      setLoading(false);

      const data = err.response?.data;

      if (data?.detail) {
        setError(data.detail);

      } else if (data?.error) {
        setError(data.error);

      } else if (data?.non_field_errors) {
        const fieldError = data.non_field_errors;

        setError(
          Array.isArray(fieldError)
            ? fieldError.join(", ")
            : String(fieldError)
        );

      } else {
        setError(
          "Login failed. Please check your credentials and try again."
        );
      }

      shakeCard();

      isSubmitting.current = false;
    }
  };


  return (
    <div className="it-login-page">

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="it-bg">

        <div className="it-bg-grid" />

        <div className="it-bg-glow it-bg-glow-one" />
        <div className="it-bg-glow it-bg-glow-two" />

        <div className="it-bg-orb it-bg-orb-one" />
        <div className="it-bg-orb it-bg-orb-two" />

        <div className="it-code code-one">
          010101 110010 101011
        </div>

        <div className="it-code code-two">
          SERVER_01 // ONLINE
        </div>

        <div className="it-code code-three">
          API_GATEWAY // SECURE
        </div>

      </div>


      {/* =====================================================
          MAIN CONTAINER
          ===================================================== */}

      <main className="it-login-shell">


        {/* ===================================================
            LEFT / HERO AREA
            =================================================== */}

        <section className="it-hero">


          {/* Brand */}

          <div className="it-brand">

            <div className="it-brand-icon">
              <FaHeadset />
            </div>

            <div>
              <div className="it-brand-name">
                Smart<span>IT</span>
              </div>

              <div className="it-brand-sub">
                SERVICE DESK
              </div>
            </div>

          </div>


          {/* Hero Content */}

          <div className="it-hero-content">

            <div className="it-eyebrow">
              <span className="it-eyebrow-dot" />
              ENTERPRISE IT OPERATIONS
            </div>


            <h1>
              Your IT.
              <br />

              <span>Always Connected.</span>
            </h1>


            <p className="it-hero-description">
              One secure platform to manage support tickets,
              IT assets, service requests and technical operations.
            </p>


            {/* Feature List */}

            <div className="it-feature-list">

              <div className="it-feature">

                <div className="it-feature-icon">
                  <FaTicketAlt />
                </div>

                <div>
                  <strong>Smart Ticket Management</strong>
                  <span>
                    Track and resolve support requests faster.
                  </span>
                </div>

              </div>


              <div className="it-feature">

                <div className="it-feature-icon">
                  <FaLaptop />
                </div>

                <div>
                  <strong>IT Asset Tracking</strong>
                  <span>
                    Keep your organization’s devices organized.
                  </span>
                </div>

              </div>


              <div className="it-feature">

                <div className="it-feature-icon">
                  <FaNetworkWired />
                </div>

                <div>
                  <strong>Connected IT Operations</strong>
                  <span>
                    Keep employees and technicians in sync.
                  </span>
                </div>

              </div>

            </div>


            {/* System Status */}

            <div className="it-system-status">

              <div className="it-status-icon">
                <FaCheckCircle />
              </div>

              <div className="it-status-text">
                <strong>All systems operational</strong>
                <span>Service Desk infrastructure is online</span>
              </div>

              <div className="it-status-live">
                LIVE
              </div>

            </div>

          </div>


          {/* Hero Bottom */}

          <div className="it-hero-bottom">

            <span>
              <FaShieldAlt />
              Enterprise Security
            </span>

            <span>
              <FaClock />
              24/7 Support Operations
            </span>

            <span>
              <FaServer />
              Secure Infrastructure
            </span>

          </div>


          {/* Decorative Network */}

          <div className="it-network">

            <div className="network-line line-one" />
            <div className="network-line line-two" />
            <div className="network-line line-three" />

            <div className="network-node node-one" />
            <div className="network-node node-two" />
            <div className="network-node node-three" />
            <div className="network-node node-four" />
            <div className="network-node node-five" />

          </div>

        </section>



        {/* ===================================================
            RIGHT / LOGIN AREA
            =================================================== */}

        <section className="it-login-area">


          {/* Login Card */}

          <div
            className={`it-login-card ${
              shaking ? "it-card-shake" : ""
            }`}
          >


            {/* Success */}

            {success && (
              <div className="it-success">

                <div className="it-success-circle">
                  <FaCheckCircle />
                </div>

                <h3>
                  Welcome Back!
                </h3>

                <p>
                  Authentication successful
                </p>

                <div className="it-success-loader">
                  Redirecting to your dashboard...
                </div>

              </div>
            )}


            {/* Card Top */}

            <div className="it-card-top">

              <div className="it-mobile-brand">
                <div className="it-mobile-logo">
                  <FaHeadset />
                </div>

                <div>
                  <strong>
                    Smart<span>IT</span>
                  </strong>

                  <small>
                    SERVICE DESK
                  </small>
                </div>
              </div>


              <div className="it-login-badge">
                <FaShieldAlt />
                SECURE LOGIN
              </div>

            </div>


            {/* Header */}

            <div className="it-login-header">

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to access your IT service desk.
              </p>

            </div>


            {/* Error */}

            {error && (
              <div className="it-error">

                <div className="it-error-icon">
                  !
                </div>

                <div className="it-error-content">
                  <strong>
                    Authentication failed
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Close error"
                >
                  ×
                </button>

              </div>
            )}


            {/* Form */}

            <form
              className="it-login-form"
              onSubmit={onSubmit}
              noValidate
            >


              {/* Username */}

              <div className="it-form-group">

                <label htmlFor="username">
                  Username
                </label>

                <div className="it-input-box">

                  <div className="it-input-icon">
                    <FaUser />
                  </div>

                  <input
                    id="username"
                    type="text"
                    name="username"
                    value={username}
                    onChange={onChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                    disabled={loading || success}
                  />

                </div>

              </div>


              {/* Password */}

              <div className="it-form-group">

                <div className="it-label-row">

                  <label htmlFor="password">
                    Password
                  </label>

                  <span>
                    Protected
                  </span>

                </div>


                <div className="it-input-box">

                  <div className="it-input-icon">
                    <FaLock />
                  </div>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading || success}
                  />


                  <button
                    type="button"
                    className="it-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading || success}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>


              {/* Remember / Security */}

              <div className="it-login-meta">

                <span>
                  <span className="it-mini-dot" />
                  Secure connection
                </span>

                <span>
                  256-bit encrypted
                </span>

              </div>


              {/* Submit */}

              <button
                type="submit"
                className="it-login-button"
                disabled={loading || success}
              >

                {loading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                    />

                    <span>
                      Authenticating...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Sign in to Service Desk
                    </span>

                    <FaArrowRight />
                  </>
                )}

              </button>

            </form>


            {/* Divider */}

            {!success && (
              <div className="it-divider">
                <span>
                  New to Smart IT Service Desk?
                </span>
              </div>
            )}


            {/* Signup */}

            {!success && (
              <div className="it-register-grid">


                <Link
                  to="/employee/signup"
                  className="it-register-card"
                >

                  <div className="it-register-icon">
                    <FaUserPlus />
                  </div>

                  <div className="it-register-content">
                    <strong>
                      Employee
                    </strong>

                    <span>
                      Create account
                    </span>
                  </div>

                  <FaChevronRight className="it-register-arrow" />

                </Link>


                <Link
                  to="/technician/signup"
                  className="it-register-card it-register-card-alt"
                >

                  <div className="it-register-icon">
                    <FaUserCog />
                  </div>

                  <div className="it-register-content">
                    <strong>
                      Technician
                    </strong>

                    <span>
                      Join support team
                    </span>
                  </div>

                  <FaChevronRight className="it-register-arrow" />

                </Link>


              </div>
            )}


            {/* Card Footer */}

            <div className="it-card-footer">

              <FaShieldAlt />

              <span>
                Your credentials are securely encrypted
              </span>

            </div>

          </div>


          {/* Bottom copyright */}

          <div className="it-login-copyright">

            <span>
              © {new Date().getFullYear()}
              {" "}Smart IT Service Desk
            </span>

            <span className="it-copyright-divider">
              •
            </span>

            <span>
              Enterprise IT Support Platform
            </span>

          </div>

        </section>

      </main>

    </div>
  );
};


export default Login;