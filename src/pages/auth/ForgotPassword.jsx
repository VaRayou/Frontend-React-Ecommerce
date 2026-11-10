import React, { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/common/Input";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email format.");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
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

        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">
          Enter your email address and we'll send you a link to reset your account password.
        </p>

        {submitted ? (
          <div>
            <div className="alert alert-success" style={{ fontSize: 14 }}>
              <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
              A reset link has been dispatched to <strong>{email}</strong> (Demo simulation).
            </div>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link to="/login" className="btn btn-default" style={{ backgroundColor: "#fe980f", color: "#fff", padding: "10px 24px" }}>
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
              required
            />

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
              style={{ marginTop: 10 }}
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="auth-footer-link">
          Remembered your password? <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

