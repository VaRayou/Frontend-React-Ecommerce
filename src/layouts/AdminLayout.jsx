import React, { useState, useEffect, Suspense } from "react";
import { Outlet, Navigate, useLocation, Link, NavLink } from "react-router-dom";
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  Layers,
  ShoppingCart,
  QrCode,
  Menu,
} from "lucide-react";
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

  useEffect(() => {
    if (!isAdminAuthenticated) return;

    // Preload all admin page bundles in background idle time for 0ms transitions
    const preloadAdminChunks = () => {
      import("../pages/admin/Dashboard");
      import("../pages/admin/ManageProducts");
      import("../pages/admin/ManageCategories");
      import("../pages/admin/ManageOrders");
      import("../pages/admin/ManagePayments");
      import("../pages/admin/ManageCoupons");
      import("../pages/admin/ManageUsers");
      import("../pages/admin/Settings");
    };
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(preloadAdminChunks);
      } else {
        setTimeout(preloadAdminChunks, 150);
      }
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

        {/* Dynamic Route Content (Enforced by RBAC with Persistent Layout) */}
        <main className="admin-page-container">
          {isRouteAllowed ? (
            <Suspense
              fallback={
                <div className="space-y-4 animate-pulse p-1 sm:p-2">
                  <div className="h-16 bg-white/70 rounded-2xl border border-gray-200/50" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="h-20 bg-white/70 rounded-2xl border border-gray-200/50" />
                    <div className="h-20 bg-white/70 rounded-2xl border border-gray-200/50" />
                    <div className="h-20 bg-white/70 rounded-2xl border border-gray-200/50" />
                    <div className="h-20 bg-white/70 rounded-2xl border border-gray-200/50" />
                  </div>
                  <div className="h-72 bg-white/70 rounded-2xl border border-gray-200/50" />
                </div>
              }
            >
              <div key={location.pathname} className="animate-in fade-in duration-150">
                <Outlet />
              </div>
            </Suspense>
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
              ● Supabase Cloud PostgreSQL & Realtime Synchronized
            </span>
          </div>
        </footer>

        {/* Mobile Bottom Quick-Navigation Bar (< lg screens) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111111] border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <NavLink
            to="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? "text-[#D6FF00] bg-white/10" : "text-gray-400 hover:text-white"
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/admin/products"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? "text-[#D6FF00] bg-white/10" : "text-gray-400 hover:text-white"
              }`
            }
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Products</span>
          </NavLink>

          {allowedPaths.includes("/admin/orders") && (
            <NavLink
              to="/admin/orders"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? "text-[#D6FF00] bg-white/10" : "text-gray-400 hover:text-white"
                }`
              }
            >
              <ShoppingCart className="w-4 h-4 mb-0.5" />
              <span>Orders</span>
            </NavLink>
          )}

          {allowedPaths.includes("/admin/payments") && (
            <NavLink
              to="/admin/payments"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? "text-[#D6FF00] bg-white/10" : "text-gray-400 hover:text-white"
                }`
              }
            >
              <QrCode className="w-4 h-4 mb-0.5" />
              <span>KHQR</span>
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              mobileOpen ? "text-[#D6FF00] bg-white/10" : "text-gray-400 hover:text-white"
            }`}
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default AdminLayout;
