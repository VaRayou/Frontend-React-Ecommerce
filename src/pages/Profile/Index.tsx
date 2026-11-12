import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  LogOut,
  CheckCircle2,
  Shield,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Lock,
  Sparkles,
  Award,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useUIStore } from "../../store/useUIStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { supabase } from "../../services/supabase";
import { orderService } from "../../services/orderService";

export const Profile: React.FC = () => {
  const { user, isAuthenticated, logout, updateProfile, orders: storeOrders } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const { showToast } = useUIStore();
  const { formatPrice } = useCurrencyStore();
  const navigate = useNavigate();

  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "Phnom Penh",
    country: user?.address?.country || "Cambodia",
    postalCode: user?.address?.postalCode || "12000",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Sync customer orders from Supabase PostgreSQL
  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    orderService
      .getOrdersByCustomer(user.email)
      .then((list) => {
        if (active) setCustomerOrders(list || []);
      })
      .catch((err) => console.warn("Profile order load note:", err))
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    const handleSync = () => {
      orderService.getOrdersByCustomer(user.email).then((list) => {
        if (active) setCustomerOrders(list || []);
      });
    };
    window.addEventListener("atelier_order_updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      active = false;
      window.removeEventListener("atelier_order_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [user?.email]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        street: user.address?.street || "",
        city: user.address?.city || "Phnom Penh",
        country: user.address?.country || "Cambodia",
        postalCode: user.address?.postalCode || "12000",
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold uppercase mb-2">Authentication Required</h2>
        <p className="text-xs text-gray-500 mb-6">
          Please sign in to access your Atelier VIP membership profile and addresses.
        </p>
        <Link
          to="/login"
          className="px-8 py-3 bg-black text-[#D6FF00] font-black text-xs uppercase rounded-full tracking-widest inline-block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Compute lifetime spend & live orders count
  const liveOrdersCount = Math.max(customerOrders.length, storeOrders.length);
  const totalLifetimeSpend = customerOrders.reduce((sum, o) => {
    return sum + Number(o.total || o.subtotal || 0);
  }, 0);

  // Dynamic VIP Tier Calculation based on live orders
  let vipTier = {
    name: "Classic Patron",
    badge: "🏛️ Classic Member",
    pill: "bg-white/20 text-white border border-white/20",
    color: "text-gray-300",
    discountPercent: 0,
    nextTierName: "Silver VIP ($50)",
    threshold: 50,
    progress: Math.min(100, Math.round((totalLifetimeSpend / 50) * 100)),
    perk: "Welcome access to Atelier seasonal collections & express checkout.",
  };

  if (totalLifetimeSpend >= 500) {
    vipTier = {
      name: "Diamond Patron",
      badge: "💎 Diamond VIP Patron",
      pill: "bg-gradient-to-r from-[#D6FF00] to-emerald-400 text-black font-black",
      color: "text-[#D6FF00]",
      discountPercent: 20,
      nextTierName: "Peak Tier Achieved",
      threshold: 500,
      progress: 100,
      perk: "Dedicated private styling advisor, 20% privilege, & bespoke delivery.",
    };
  } else if (totalLifetimeSpend >= 250) {
    vipTier = {
      name: "Platinum Patron",
      badge: "👑 Platinum VIP Patron",
      pill: "bg-[#D6FF00] text-black font-black",
      color: "text-[#D6FF00]",
      discountPercent: 15,
      nextTierName: "Diamond VIP ($500)",
      threshold: 500,
      progress: Math.min(100, Math.round((totalLifetimeSpend / 500) * 100)),
      perk: "Complimentary express global DHL courier & early drop runway access.",
    };
  } else if (totalLifetimeSpend >= 100) {
    vipTier = {
      name: "Gold Patron",
      badge: "⭐ Gold VIP Patron",
      pill: "bg-amber-400 text-black font-black",
      color: "text-amber-400",
      discountPercent: 10,
      nextTierName: "Platinum VIP ($250)",
      threshold: 250,
      progress: Math.min(100, Math.round((totalLifetimeSpend / 250) * 100)),
      perk: "Complimentary luxury gift packaging & priority runway reservations.",
    };
  } else if (totalLifetimeSpend >= 50) {
    vipTier = {
      name: "Silver Patron",
      badge: "✨ Silver VIP Patron",
      pill: "bg-slate-200 text-black font-bold",
      color: "text-slate-200",
      discountPercent: 5,
      nextTierName: "Gold VIP ($100)",
      threshold: 100,
      progress: Math.min(100, Math.round((totalLifetimeSpend / 100) * 100)),
      perk: "5% private member credit & preview access to seasonal sales.",
    };
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
      },
    });
    setIsEditing(false);
    showToast("Profile details saved & synchronized!", "success");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      showToast("Please enter your new password.", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setChangingPassword(true);
    try {
      // 1. Direct Supabase Cloud Auth update
      const { data, error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        if (user?.email === "camille@atelier.com") {
          setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          showToast("Demo account password simulated successfully!", "success");
        } else {
          showToast(error.message || "Could not update password. Please log in again.", "error");
        }
      } else {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        showToast("Password updated successfully via Supabase Cloud Auth!", "success");
      }
    } catch (err: any) {
      const errMsg = err?.message || "Could not update password.";
      showToast(errMsg, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Profile Hero Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[#111111] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 shadow-xl">
        <div className="flex items-center gap-5">
          <img
            src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-[#D6FF00] shadow-md"
          />
          <div className="space-y-1">
            <span className={`px-3 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase inline-block ${vipTier.pill}`}>
              {vipTier.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs text-gray-400 font-light">{user.email}</p>
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          {/* Lifetime Spend Stat */}
          <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[110px]">
            <span className="text-lg font-black text-[#D6FF00] block">
              {formatPrice(totalLifetimeSpend)}
            </span>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
              Lifetime Spend
            </span>
          </div>

          <Link
            to="/orders"
            className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-center transition-colors min-w-[90px]"
          >
            <span className="text-lg font-black text-[#D6FF00] block">{liveOrdersCount}</span>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Orders</span>
          </Link>

          <Link
            to="/wishlist"
            className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-center transition-colors min-w-[90px]"
          >
            <span className="text-lg font-black text-[#D6FF00] block">{wishlistItems.length}</span>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Wishlist</span>
          </Link>
        </div>
      </div>

      {/* VIP Tier Progression Card */}
      <div className="p-6 rounded-3xl bg-neutral-900 text-white mb-8 border border-neutral-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D6FF00]/10 border border-[#D6FF00]/20 flex items-center justify-center text-[#D6FF00]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {vipTier.name} Status
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#D6FF00]">
                  {vipTier.discountPercent}% VIP Privilege
                </span>
              </div>
              <p className="text-xs text-gray-400 font-light mt-0.5">
                {vipTier.perk}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Next Tier Target
            </span>
            <strong className="text-xs font-black text-[#D6FF00]">
              {vipTier.nextTierName}
            </strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#D6FF00] h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${vipTier.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1.5">
          <span>Current Spend: {formatPrice(totalLifetimeSpend)}</span>
          <span>{vipTier.progress}% to next threshold</span>
        </div>
      </div>

      {/* Main Grid: Details (8 cols) + Shortcuts (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Personal & Address Details */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-base font-black uppercase text-black">
              Profile &amp; Shipping Details
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold uppercase tracking-wider text-black hover:text-[#D6FF00] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Cancel" : "Edit Details"}</span>
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Primary Street Address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-gray-400 block font-semibold text-[11px]">Client Name</span>
                  <strong className="text-black text-sm">{user.name}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold text-[11px]">Primary Email</span>
                  <strong className="text-black text-sm">{user.email}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold text-[11px]">Telephone</span>
                  <strong className="text-black text-sm">{user.phone || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold text-[11px]">Membership Status</span>
                  <span className="font-bold text-emerald-700">{vipTier.badge}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-wider text-gray-400 text-[11px] mb-2">
                  Default Shipping Address
                </h3>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-black block font-bold">{user.address?.street}</strong>
                    <span className="text-gray-500">
                      {user.address?.city}, {user.address?.postalCode} • {user.address?.country}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Shortcuts & Sign Out */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-black pb-3 border-b border-gray-100">
              Patron Services
            </h3>

            <Link
              to="/orders"
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 text-xs font-bold text-black transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Order History ({liveOrdersCount})</span>
              </div>
              <span className="text-gray-400">&rarr;</span>
            </Link>

            <Link
              to="/wishlist"
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 text-xs font-bold text-black transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>Wishlist ({wishlistItems.length})</span>
              </div>
              <span className="text-gray-400">&rarr;</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors mt-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </div>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Account Security & Password Change Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Lock className="w-4 h-4 text-black" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-black">
                Account Security &amp; Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-3 rounded-xl bg-black hover:bg-neutral-900 text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
              >
                {changingPassword ? "Updating via Supabase..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
