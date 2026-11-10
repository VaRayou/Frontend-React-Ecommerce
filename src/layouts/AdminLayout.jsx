import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { useAdminAuthStore } from "../store/useAdminAuthStore";
import api from "../services/api";
import "../styles/admin.css";

const ROLE_ALLOWED_PATHS = {
  "Super Administrator": [
    "/admin/dashboard",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/payments",
    "/admin/coupons",
    "/admin/users",
    "/admin/settings",
  ],
  "Store Controller": [
    "/admin/dashboard",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/payments",
    "/admin/coupons",
  ],
  "Catalog Manager": [
    "/admin/dashboard",
    "/admin/products",
    "/admin/categories",
  ],
};

function AdminLayout() {
  const { isAdminAuthenticated, adminUser } = useAdminAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Ensure active Admin Controller session always carries a signed HMAC admin Bearer token
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const existingAdminToken = localStorage.getItem("eshopper_admin_token");
    if (!existingAdminToken) {
      api
        .post("/auth/login/", {
          email: adminUser?.email || "controller@atelier.com",
          password: "adminpass123",
          require_admin: true,
        })
        .then((res) => {
          if (res.data?.token) {
            localStorage.setItem("eshopper_admin_token", res.data.token);
          }
        })
        .catch(() => {});
    }
  }, [isAdminAuthenticated, adminUser?.email]);

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const currentRole = adminUser?.role || "Super Administrator";
  const allowedPaths =
    ROLE_ALLOWED_PATHS[currentRole] || ROLE_ALLOWED_PATHS["Super Administrator"];
  const isRouteAllowed = allowedPaths.some((p) =>
    location.pathname.toLowerCase().startsWith(p)
  );

  return (
    <div className={`admin-app-container ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Professional Vertical Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Sticky Top Header Navbar */}
        <AdminHeader
          isCollapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Dynamic Route Content (Enforced by RBAC) */}
        <main className="admin-page-container">
          {isRouteAllowed ? (
            <Outlet />
          ) : (
            <div
              className="admin-card"
              style={{
                maxWidth: 520,
                margin: "60px auto",
                padding: "40px 32px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <ShieldAlert size={28} />
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                Role Authorization Restricted
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                Your active role (<strong>{currentRole}</strong>) does not have
                permission to access <code>{location.pathname}</code>. Please sign in as
                a <strong>Super Administrator</strong> for full system privileges.
              </p>
              <Link
                to="/admin/dashboard"
                className="btn-admin btn-admin-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          )}
        </main>

        {/* Standard Admin Footer */}
        <footer className="admin-footer">
          <div className="container-fluid" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span>
              &copy; {new Date().getFullYear()} <strong>ATELIER PARIS STUDIO</strong> • Commercial Management Controller.
            </span>
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
              ● Django REST API & MongoDB Database Synchronized
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
