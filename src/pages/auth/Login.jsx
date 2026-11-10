import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email format.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const loggedUser = await login(formData.email, formData.password);
      setSuccessMessage(`Welcome back, ${loggedUser.name}!`);

      setTimeout(() => {
        // Role-based redirection:
        // Admin -> /admin/dashboard
        // Customer -> redirect to previous page or home
        if (loggedUser.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
      }, 700);
    } catch (err) {
      setServerError(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Demo helper buttons
  const fillCredentials = (email, password) => {
    setFormData({
      email,
      password,
      rememberMe: true,
    });
    setErrors({});
    setServerError("");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <Link to="/" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
            <img
              src="/user/images/home/veayor-logo.jpg"
              alt="VEAYOR"
              style={{ height: 60, width: 60, objectFit: "cover", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "1.5px", color: "#1e293b", marginTop: 8, fontFamily: "serif" }}>
              VEAYOR
            </span>
          </Link>
        </div>

        <h2 className="auth-title">Login to your account</h2>
        <p className="auth-subtitle">Enter your credentials to access your shopping or admin portal</p>

        {serverError && (
          <div className="alert alert-danger" style={{ fontSize: 13, marginBottom: 18 }}>
            <i className="fa fa-exclamation-triangle" style={{ marginRight: 6 }}></i>
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" style={{ fontSize: 13, marginBottom: 18 }}>
            <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="example@domain.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <div className="auth-actions-row">
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", margin: 0, fontWeight: "normal" }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember me
            </label>
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span>
                <i className="fa fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Demo Quick-Fill Accounts */}
        <div className="demo-accounts-box">
          <h5>Demo Testing Credentials:</h5>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="btn-demo-fill"
              onClick={() => fillCredentials("admin@example.com", "admin123")}
            >
              <i className="fa fa-shield" style={{ marginRight: 4 }}></i>
              Fill Admin Account
            </button>
            <button
              type="button"
              className="btn-demo-fill"
              onClick={() => fillCredentials("user@example.com", "user123")}
            >
              <i className="fa fa-user" style={{ marginRight: 4 }}></i>
              Fill Customer Account
            </button>
          </div>
        </div>

        <div className="auth-footer-link">
          Don't have an account? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

