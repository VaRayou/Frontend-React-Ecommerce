import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F4] text-[#111111]">
      {/* Brand Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <img
            src="/favicon-32x32.png"
            alt="STEAV Logo"
            className="w-6 h-6 rounded-md object-contain group-hover:scale-110 transition-transform shadow-xs"
          />
          <span className="font-black tracking-[-0.04em] text-lg text-black">
            STEAV
          </span>
          <span className="text-[9px] font-extrabold tracking-[0.24em] text-gray-400 uppercase">
            PARIS
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Boutique</span>
        </Link>
      </header>

      {/* Main Outlet */}
      <div className="flex-1 flex items-center justify-center">
        <Outlet />
      </div>

      {/* Luxury Footer */}
      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200/80 bg-white flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
        <span>
          &copy; {new Date().getFullYear()} STEAV PARIS. All Rights Reserved.
          Private Vault 256-Bit SSL.
        </span>
      </footer>
    </div>
  );
}

export default AuthLayout;
