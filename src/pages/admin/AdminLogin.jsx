import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Database, KeyRound, Server } from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuthStore();

  const [email, setEmail] = useState("controller@atelier.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide administrator email and security key.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await adminLogin(email, password);
      if (res && res.success) {
        navigate("/admin/dashboard");
      } else {
        setError(res?.message || "Authorization failed. Please verify controller credentials.");
      }
    } catch (err) {
      setError("Authorization failed. Please verify controller credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async (demoEmail = "controller@atelier.com") => {
    setEmail(demoEmail);
    setPassword("adminpass123");
    setLoading(true);
    setError("");
    const res = await adminLogin(demoEmail, "adminpass123");
    setLoading(false);
    if (res && res.success) {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle atmospheric background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D6FF00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group mb-2">
            <span className="w-3 h-3 rounded-full bg-[#D6FF00] inline-block shadow-xs group-hover:scale-125 transition-transform" />
            <span className="font-extrabold tracking-[-0.05em] text-2xl text-white">
              ATELIER
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#D6FF00] uppercase bg-[#D6FF00]/10 px-2 py-0.5 rounded-full border border-[#D6FF00]/30 ml-1">
              CONTROLLER
            </span>
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Studio Management Portal
          </h1>
          <p className="text-xs text-gray-400 font-light">
            Authorized administrator access for catalog, inventory & Supabase PostgreSQL database.
          </p>
        </div>

        {/* Controller Login Card */}
        <div className="bg-[#181A20] border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          {/* Status Pills */}
          <div className="flex items-center justify-between text-[11px] p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Auth: Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
              <Database className="w-3.5 h-3.5 text-[#D6FF00]" />
              <span>PostgreSQL: 0ms Ready</span>
            </div>
          </div>

          {/* Quick Role Fill Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              1-Click Fast Role Sign-In:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleInstantDemoLogin("controller@atelier.com")}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold tracking-wide transition-all text-left flex items-center justify-between"
              >
                <span>👑 Super Admin</span>
                <span className="text-[9px] text-[#D6FF00] font-mono">Full</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin("catalog@atelier.com")}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-[#D6FF00]/10 hover:bg-[#D6FF00]/20 border border-[#D6FF00]/30 text-[#D6FF00] text-[11px] font-bold tracking-wide transition-all text-left flex items-center justify-between"
              >
                <span>🏷️ Catalog Mgr</span>
                <span className="text-[9px] text-gray-400 font-mono">Catalog</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1.5">
                Controller Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="controller@atelier.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D6FF00] text-white placeholder:text-gray-500 outline-none transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 text-gray-300 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D6FF00] text-white placeholder:text-gray-500 outline-none transition-colors font-medium"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs flex items-center justify-between">
              <span className="font-semibold text-gray-300">Security Clearance</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D6FF00]/10 text-[#D6FF00] border border-[#D6FF00]/30 font-bold text-[10px] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified by Server Claims</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 group mt-2"
            >
              <span>{loading ? "Authenticating Controller..." : "Enter Controller Studio"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick link back to store */}
          <div className="pt-2 text-center text-xs text-gray-500 border-t border-white/10">
            <Link to="/" className="text-gray-400 hover:text-white underline">
              &larr; Return to Customer Storefront
            </Link>
          </div>
        </div>

        {/* Security Disclosures */}
        <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D6FF00]" />
          <span>Atelier Secure Administrative Gateway • Session Monitored</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

