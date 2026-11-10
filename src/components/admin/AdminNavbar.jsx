import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminNavbar() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="admin-navbar">
      {/* Brand */}
      <Link to="/admin/dashboard" className="admin-brand">
        <div className="admin-brand-icon">
          <i className="fa fa-shopping-bag"></i>
        </div>
        <span>E-SHOPPER <span style={{ color: "#fe980f", fontSize: 13, fontWeight: 500 }}>ADMIN</span></span>
      </Link>

      {/* Horizontal Nav Links */}
      <nav>
        <ul className="admin-nav-links">
          <li>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <i className="fa fa-dashboard"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/products"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <i className="fa fa-cubes"></i>
              <span>Manage Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/categories"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <i className="fa fa-tags"></i>
              <span>Manage Categories</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <i className="fa fa-users"></i>
              <span>Manage Users</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <i className="fa fa-shopping-cart"></i>
              <span>Manage Orders</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <i className="fa fa-cog"></i>
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Right Side Tools */}
      <div className="admin-nav-right">
        {/* View Store Button */}
        <Link to="/" className="btn-view-store" title="Go to customer website">
          <i className="fa fa-external-link"></i>
          <span>View Store</span>
        </Link>

        {/* Notifications Icon */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="admin-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <i className="fa fa-bell-o"></i>
            <span className="admin-notifications-badge">3</span>
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: 45,
                right: 0,
                width: 280,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                border: "1px solid #e2e8f0",
                zIndex: 9999,
                color: "#333",
                padding: "12px 0",
              }}
            >
              <div style={{ padding: "0 16px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                Notifications
              </div>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                <strong>New Order #ORD-9024</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b" }}>Emily Watson placed an order ($140)</p>
              </div>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                <strong>Low Stock Alert</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b" }}>Classic Leather Bag has 7 items left</p>
              </div>
              <div style={{ padding: "10px 16px", fontSize: 12 }}>
                <strong>User Registration</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b" }}>New customer account registered</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div style={{ position: "relative" }}>
          <div
            className="admin-user-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <img
              src={user?.avatar || "/admin/img/avatars/avatar.jpg"}
              alt="Admin"
              className="admin-avatar"
            />
            <div className="admin-user-info" style={{ display: "none" }}>
              <span className="admin-user-name">{user?.name || "Admin"}</span>
              <span className="admin-user-role">Administrator</span>
            </div>
            <i className="fa fa-angle-down" style={{ color: "#cbd5e1", fontSize: 12 }}></i>
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: 45,
                right: 0,
                width: 210,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                border: "1px solid #e2e8f0",
                zIndex: 9999,
                color: "#333",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                  {user?.name || "Admin"}
                </p>
                <small style={{ color: "#64748b", fontSize: 11 }}>{user?.email || "admin@example.com"}</small>
              </div>
              <Link
                to="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  color: "#334155",
                  textDecoration: "none",
                }}
              >
                <i className="fa fa-user-circle"></i> Profile Settings
              </Link>
              <Link
                to="/"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  color: "#334155",
                  textDecoration: "none",
                }}
              >
                <i className="fa fa-shopping-bag"></i> Customer Store
              </Link>
              <div style={{ borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <i className="fa fa-sign-out"></i> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;

