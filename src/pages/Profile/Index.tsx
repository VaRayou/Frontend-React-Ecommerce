import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, CheckCircle2, Shield, MapPin, Phone, Mail, Edit3, Lock } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useUIStore } from "../../store/useUIStore";
import api from "../../services/api";

export const Profile: React.FC = () => {
  const { user, isAuthenticated, logout, updateProfile, orders } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

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
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("Please enter both your current and new password.", "error");
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
      const res = await api.post("/auth/change-password/", {
        email: user?.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast(res.data?.message || "Password updated successfully!", "success");
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || "Could not update password. Check your current password.";
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
            <span className="px-3 py-0.5 rounded-full bg-[#D6FF00] text-black font-black text-[10px] tracking-wider uppercase inline-block">
              VIP Platinum Patron
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs text-gray-400 font-light">{user.email}</p>
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="flex gap-4 w-full md:w-auto">
          <Link
            to="/orders"
            className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-center transition-colors"
          >
            <span className="text-xl font-black text-[#D6FF00] block">{orders.length}</span>
            <span className="text-[11px] font-bold text-gray-300 uppercase">Orders</span>
          </Link>

          <Link
            to="/wishlist"
            className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-center transition-colors"
          >
            <span className="text-xl font-black text-[#D6FF00] block">{wishlistItems.length}</span>
            <span className="text-[11px] font-bold text-gray-300 uppercase">Wishlist</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Details (8 cols) + Shortcuts (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Personal & Address Details */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-base font-black uppercase text-black">
              Profile & Shipping Details
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold uppercase tracking-wider text-black hover:text-[#D6FF00] flex items-center gap-1.5 transition-colors"
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
                  className="px-6 py-3 rounded-xl bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest hover:bg-neutral-900 transition-colors"
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
                  <span className="font-bold text-emerald-700">Active VIP Member</span>
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
                <span>Order History ({orders.length})</span>
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
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors mt-2"
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
                <label className="block font-bold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none"
                />
              </div>

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
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

