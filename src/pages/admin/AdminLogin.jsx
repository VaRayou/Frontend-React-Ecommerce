import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter your administrator email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await adminLogin(cleanEmail, password);
      if (res && res.success) {
        navigate("/admin/dashboard");
      } else {
        setError(res?.message || "Invalid credentials. Please verify your administrator email and password.");
      }
    } catch (err) {
      setError("Invalid credentials. Please verify your administrator email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle atmospheric ambient glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D6FF00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-1">
            <img
              src="/favicon-32x32.png"
              alt="STEAV Logo"
              className="w-8 h-8 rounded-lg object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-black tracking-[-0.04em] text-2xl text-white">
              STEAV
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            Executive Management Portal
          </h1>
          <p className="text-xs text-gray-400 font-normal">
            Authorized administrative &amp; operational personnel only
          </p>
        </div>

        {/* Controller Login Card */}
        <div className="bg-[#121418] border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1.5 uppercase text-[10px] tracking-wider">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="name@steav.com"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D6FF00] focus:ring-1 focus:ring-[#D6FF00]/40 text-white placeholder:text-gray-500 outline-none transition-all font-medium text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5 uppercase text-[10px] tracking-wider">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D6FF00] focus:ring-1 focus:ring-[#D6FF00]/40 text-white placeholder:text-gray-500 outline-none transition-all font-medium text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#D6FF00]/10 flex items-center justify-center gap-2 group mt-4 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick link back to store */}
          <div className="pt-2 text-center text-xs border-t border-white/10">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              &larr; Return to Storefront
            </Link>
          </div>
        </div>

        {/* Discreet Footer */}
        <div className="text-center text-[11px] text-gray-500">
          <span>&copy; {new Date().getFullYear()} STEAV Paris • Internal System Gateway</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

