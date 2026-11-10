import React from "react";
import { Outlet, Link } from "react-router-dom";

function AuthLayout() {
  return (
    <div style={{ backgroundColor: "#f9f9f6", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header with logo and back to shop */}
      <header style={{ padding: "18px 30px", borderBottom: "1px solid #e8e8e0", backgroundColor: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/user/images/home/veayor-logo.jpg"
            alt="VEAYOR"
            style={{ height: 40, width: 40, objectFit: "cover", borderRadius: 8 }}
          />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "1.5px", color: "#1e293b", fontFamily: "serif" }}>
            VEAYOR
          </span>
        </Link>
        <Link
          to="/"
          style={{
            color: "#696763",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa fa-arrow-left"></i> Back to Store
        </Link>
      </header>

      {/* Main Form Outlet */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>

      {/* Simple Footer */}
      <footer style={{ textAlign: "center", padding: "16px", fontSize: 13, color: "#888", borderTop: "1px solid #e8e8e0", backgroundColor: "#fff" }}>
        &copy; {new Date().getFullYear()} E-Shopper. All Rights Reserved.
      </footer>
    </div>
  );
}

export default AuthLayout;

