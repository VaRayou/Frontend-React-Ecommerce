import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Tag,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { orderService } from "../../services/orderService";

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const { adminUser, adminLogout } = useAdminAuthStore();
  const navigate = useNavigate();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const orders = await orderService.getOrders();
        const pending = (orders || []).filter((o) => {
          const s = (o.orderStatus || o.status || "").toLowerCase();
          return s === "pending" || s === "processing";
        }).length;
        setPendingOrdersCount(pending);
      } catch {
        // quiet error handle
      }
    };
    fetchPending();

    const handleSync = () => fetchPending();
    window.addEventListener("atelier_order_updated", handleSync);
    return () =>
      window.removeEventListener("atelier_order_updated", handleSync);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const currentRole = adminUser?.role || "Super Administrator";

  const allMenuSections = [
    {
      header: "OVERVIEW",
      items: [
        {
          title: "Dashboard",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
          roles: ["Super Administrator", "Store Controller", "Catalog Manager"],
        },
      ],
    },
    {
      header: "CATALOG MANAGEMENT",
      items: [
        {
          title: "Manage Products",
          path: "/admin/products",
          icon: Layers,
          roles: ["Super Administrator", "Store Controller", "Catalog Manager"],
        },
        {
          title: "Manage Categories",
          path: "/admin/categories",
          icon: FolderTree,
          roles: ["Super Administrator", "Store Controller", "Catalog Manager"],
        },
      ],
    },
    {
      header: "COMMERCE & CLIENTS",
      items: [
        {
          title: "Manage Orders",
          path: "/admin/orders",
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : null,
          roles: ["Super Administrator", "Store Controller"],
        },
        {
          title: "Bakong KHQR Ledger",
          path: "/admin/payments",
          icon: QrCode,
          roles: ["Super Administrator", "Store Controller"],
        },
        {
          title: "Promo Coupons",
          path: "/admin/coupons",
          icon: Tag,
          roles: ["Super Administrator", "Store Controller"],
        },
        {
          title: "Patron Directory",
          path: "/admin/users",
          icon: Users,
          roles: ["Super Administrator"],
        },
      ],
    },
    {
      header: "CONFIGURATION",
      items: [
        {
          title: "Store Settings",
          path: "/admin/settings",
          icon: Settings,
          roles: ["Super Administrator"],
        },
      ],
    },
  ];

  const menuSections = allMenuSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) => !item.roles || item.roles.includes(currentRole),
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  const isCollapsed = collapsed && !mobileOpen;

  const handlePreload = (path) => {
    try {
      if (path === "/admin/dashboard") import("../../pages/admin/Dashboard");
      else if (path === "/admin/products") import("../../pages/admin/ManageProducts");
      else if (path === "/admin/categories") import("../../pages/admin/ManageCategories");
      else if (path === "/admin/orders") import("../../pages/admin/ManageOrders");
      else if (path === "/admin/payments") import("../../pages/admin/ManagePayments");
      else if (path === "/admin/coupons") import("../../pages/admin/ManageCoupons");
      else if (path === "/admin/users") import("../../pages/admin/ManageUsers");
      else if (path === "/admin/settings") import("../../pages/admin/Settings");
    } catch {}
  };

  return (
    <aside
      className={`admin-sidebar ${isCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      {/* Sidebar Header / Brand */}
      <div className="admin-sidebar-header">
        <Link
          to="/admin/dashboard"
          className="sidebar-brand-link"
          onClick={onCloseMobile}
        >
          <div className="sidebar-brand-icon">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] inline-block shadow-xs" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="brand-main tracking-tight font-black">
                ATELIER
              </span>
              <span className="brand-sub font-mono font-bold tracking-widest text-[#D6FF00]">
                CONTROLLER
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Toggle Button */}
        <button
          type="button"
          className="sidebar-toggle-btn desktop-only"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-close-btn mobile-only"
          onClick={onCloseMobile}
          title="Close sidebar"
        >
          &times;
        </button>
      </div>

      {/* Controller User Quick Info */}
      {!isCollapsed && (
        <div
          className="sidebar-user-card"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: 12,
            margin: "12px 14px",
            padding: "10px 12px",
          }}
        >
          <div className="sidebar-user-avatar-wrap">
            <img
              src={
                adminUser?.avatar ||
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
              }
              alt="Admin"
              className="sidebar-user-avatar"
              style={{ borderColor: "#D6FF00" }}
            />
            <span
              className="sidebar-status-dot"
              style={{ background: "#D6FF00" }}
              title="Online Controller"
            ></span>
          </div>
          <div className="sidebar-user-details">
            <div
              className="sidebar-user-name"
              style={{ fontWeight: 700, fontSize: 13 }}
            >
              {adminUser?.name || "Admin Controller"}
            </div>
            <div
              className="sidebar-user-role"
              style={{
                color: "#D6FF00",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {adminUser?.role || "Super Administrator"}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="sidebar-scrollable">
        <nav className="sidebar-nav">
          {menuSections.map((sec, secIdx) => (
            <div key={secIdx} className="sidebar-section">
              {!isCollapsed && (
                <div className="sidebar-section-title">{sec.header}</div>
              )}
              <ul className="sidebar-menu-list">
                {sec.items.map((item, itemIdx) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={itemIdx} className="sidebar-menu-item">
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `sidebar-menu-link ${isActive ? "active" : ""}`
                        }
                        onMouseEnter={() => handlePreload(item.path)}
                        onClick={onCloseMobile}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <span className="sidebar-icon">
                          <IconComponent className="w-4 h-4" />
                        </span>
                        {!isCollapsed && (
                          <span className="sidebar-link-text">
                            {item.title}
                          </span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="sidebar-link-badge">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Customer Storefront Shortcut */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">STORE SHORTCUT</div>
            )}
            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item">
                <Link
                  to="/"
                  className="sidebar-menu-link store-shortcut-link"
                  onClick={onCloseMobile}
                  title={isCollapsed ? "Open Customer Storefront" : undefined}
                >
                  <span className="sidebar-icon">
                    <Store className="w-4 h-4" />
                  </span>
                  {!isCollapsed && (
                    <span className="sidebar-link-text">Customer Store</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="admin-sidebar-footer">
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title={isCollapsed ? "Logout Controller" : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sign Out Controller</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
