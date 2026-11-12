import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, Database, KeyRound, CheckCircle2 } from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuthStore();

  const [email, setEmail] = useState("controller@atelier.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const OFFICIAL_ROLES = [
    {
      id: "super_admin",
      title: "Super Admin",
      badge: "Full Clearance",
      email: "controller@atelier.com",
      color: "border-[#D6FF00]/40 text-[#D6FF00] bg-[#D6FF00]/10",
    },
    {
      id: "catalog_mgr",
      title: "Catalog Manager",
      badge: "Catalog & Merch",
      email: "catalog@atelier.com",
      color: "border-sky-400/40 text-sky-400 bg-sky-400/10",
    },
    {
      id: "store_ctrl",
      title: "Store Controller",
      badge: "Orders & Ops",
      email: "admin@atelier.com",
      color: "border-purple-400/40 text-purple-400 bg-purple-400/10",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide administrator email and security password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await adminLogin(email, password);
      if (res && res.success) {
        navigate("/admin/dashboard");
      } else {
        setError(res?.message || "Authorization failed. Please verify administrator credentials.");
      }
    } catch (err) {
      setError("Authorization failed. Please verify administrator credentials.");
    } finally {
      setLoading(false);
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
              OFFICIAL CONTROLLER
            </span>
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Studio Management Portal
          </h1>
          <p className="text-xs text-gray-400 font-light">
            Production RBAC clearance for authorized studio administrators & inventory managers.
          </p>
        </div>

        {/* Controller Login Card */}
        <div className="bg-[#181A20] border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          {/* Status Pills */}
          <div className="flex items-center justify-between text-[11px] p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Cloud Auth: Enforced</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
              <Database className="w-3.5 h-3.5 text-[#D6FF00]" />
              <span>RLS 100% Active</span>
            </div>
          </div>

          {/* Official Admin Role Email Selectors */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Official Administrator Accounts:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {OFFICIAL_ROLES.map((role) => {
                const isSelected = email.toLowerCase() === role.email.toLowerCase();
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setEmail(role.email);
                      setError("");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-[#D6FF00] bg-[#D6FF00]/15 ring-1 ring-[#D6FF00]"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[11px] font-bold text-white truncate">
                        {role.title}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 text-[#D6FF00] shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400 truncate font-mono">
                      {role.badge}
                    </span>
                  </button>
                );
              })}
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
                Official Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="controller@atelier.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D6FF00] text-white placeholder:text-gray-500 outline-none transition-colors font-medium font-mono text-[12px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D6FF00] text-white placeholder:text-gray-500 outline-none transition-colors font-medium"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs flex items-center justify-between">
              <span className="font-semibold text-gray-300">Authentication Protocol</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D6FF00]/10 text-[#D6FF00] border border-[#D6FF00]/30 font-bold text-[10px] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Cryptographic JWT</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating via Supabase..." : "Sign In to Studio Controller"}</span>
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
          <span>Atelier Secure Administrative Gateway • Zero Demo Bypasses • RBAC Enforced</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

