import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-black">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block">
          Error 404
        </span>

        <h1 className="text-4xl sm:text-5xl font-black text-black uppercase tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-gray-500 font-light leading-relaxed">
          The runway garment or page you are seeking has been archived or relocated.
          Let us escort you back to the current collection.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-8 py-3.5 rounded-full bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest hover:bg-neutral-900 transition-all shadow-md"
          >
            Return to Homepage
          </Link>
          <Link
            to="/shop"
            className="px-8 py-3.5 rounded-full border border-gray-300 text-black font-bold text-xs uppercase tracking-widest hover:border-black transition-all flex items-center justify-center gap-1.5"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

