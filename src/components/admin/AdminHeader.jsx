import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ExternalLink,
  Bell,
  LogOut,
  Settings,
  ShoppingBag,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { orderService } from "../../services/orderService";
import api from "../../services/api";

export function AdminHeader({ onToggleMobile, onToggleCollapse, isCollapsed }) {
  const { adminUser, adminLogout } = useAdminAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const [list, alertsRes] = await Promise.allSettled([
          orderService.getOrders(),
          api.get("/notifications/"),
        ]);
        if (list.status === "fulfilled" && Array.isArray(list.value)) {
          setRecentOrders(list.value.slice(0, 5));
        }
        if (alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value.data)) {
          setSystemAlerts(alertsRes.value.data.slice(0, 6));
        }
      } catch (e) {
        console.warn("Header notification sync note:", e);
      }
    };
    fetchRecent();

    const handleSync = () => fetchRecent();
    window.addEventListener("atelier_order_updated", handleSync);
    return () => window.removeEventListener("atelier_order_updated", handleSync);
  }, []);

  const unreadAlertsCount =
    systemAlerts.filter((a) => !a.read).length + recentOrders.length;

  const handleMarkAllRead = async () => {
    setSystemAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    try {
      await api.post("/notifications/", {});
    } catch {
      // ignore offline
    }
  };

  // Close flyouts on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Tools: Hamburger & Page context */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
          onClick={onToggleMobile}
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          className="hidden lg:flex p-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black tracking-tight text-gray-900 uppercase">
              ATELIER STUDIO
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] tracking-wider uppercase border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Online</span>
            </span>
          </div>
          <span className="text-[11px] text-gray-500 hidden md:block">
            Controller Active: <strong className="text-gray-800 font-semibold">{adminUser?.name || "Administrator"}</strong> ({adminUser?.role || "Super Administrator"})
          </span>
        </div>
      </div>

      {/* Right Tools: View Store, Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Quick View Store Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 transition-all text-xs font-bold uppercase tracking-wider shadow-xs"
          title="Open customer boutique website"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View Store</span>
        </Link>

        {/* Notifications Icon & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-black transition-colors relative cursor-pointer"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            title="Studio Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D6FF00] text-black text-[10px] font-black flex items-center justify-center border border-black shadow-xs">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs uppercase font-extrabold text-black tracking-wider">
                  Studio Activity &amp; KHQR Alerts
                </span>
                <div className="flex items-center gap-2">
                  {systemAlerts.some((a) => !a.read) && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-[#D6FF00] text-black text-[10px] font-black tracking-wider uppercase">
                    {unreadAlertsCount} Active
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/admin/payments");
                    }}
                    className={`p-3 flex items-start gap-2.5 hover:bg-gray-50 cursor-pointer ${
                      !alert.read ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] flex-1 min-w-0">
                      <div className="font-bold text-gray-900">
                        Live Merchant Alert ({alert.channel})
                      </div>
                      <p className="text-gray-600 line-clamp-2 mt-0.5">
                        {String(alert.message || "").replace(/<[^>]+>/g, "")}
                      </p>
                    </div>
                  </div>
                ))}
                {recentOrders.length > 0 ? (
                  recentOrders.map((ord) => (
                    <div
                      key={ord.orderNumber || ord.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/admin/orders");
                      }}
                      className="p-3.5 flex items-start gap-3 hover:bg-gray-50/80 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="text-xs flex-1 min-w-0">
                        <strong className="block text-gray-900 font-bold truncate">
                          Order #{ord.orderNumber}
                        </strong>
                        <p className="text-gray-500 mt-0.5 truncate">
                          {ord.customerName} • ${Number(ord.total || 0).toFixed(2)} ({ord.paymentMethod})
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          Status: <span className="font-semibold text-gray-700">{ord.orderStatus || ord.status}</span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No active notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with Fixed Strict Sizing */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all cursor-pointer group shadow-2xs"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="relative w-8 h-8 shrink-0">
              <img
                src={
                  adminUser?.avatar ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                }
                alt="Controller Avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#D6FF00] shadow-xs"
                style={{ width: "32px", height: "32px", maxWidth: "32px", maxHeight: "32px" }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-gray-900 group-hover:text-black transition-colors">
                {adminUser?.name || "Administrator"}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Online
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 ml-0.5 transition-transform" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      adminUser?.avatar ||
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    }
                    alt="Controller"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D6FF00]"
                    style={{ width: "40px", height: "40px", maxWidth: "40px", maxHeight: "40px" }}
                  />
                  <div className="overflow-hidden">
                    <strong className="block text-xs font-bold text-gray-900 truncate">
                      {adminUser?.name}
                    </strong>
                    <span className="text-[11px] text-gray-500 truncate block">
                      {adminUser?.email}
                    </span>
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded-sm bg-neutral-900 text-[#D6FF00] text-[9px] font-black uppercase tracking-wider">
                      {adminUser?.role || "Super Admin"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Studio Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out Controller</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
