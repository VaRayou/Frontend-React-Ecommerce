import React, { useEffect, useState } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Home, ShoppingBag, Grid, Compass, User } from "lucide-react";
import { AnnouncementBar } from "../components/common/AnnouncementBar";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import { CartDrawer } from "../components/common/CartDrawer";
import { QuickViewModal } from "../components/common/QuickViewModal";
import { SearchModal } from "../components/common/SearchModal";
import { ToastNotification } from "../components/common/ToastNotification";
import { useCartStore } from "../store/useCartStore";
import { useUIStore } from "../store/useUIStore";
import { useAuthStore } from "../store/useAuthStore";

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { getItemCount } = useCartStore();
  const { openCartDrawer } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const cartCount = getItemCount();

  // Instant scroll to top on route change for snappy page transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 450);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F4] text-[#111111] selection:bg-[#D6FF00] selection:text-black pb-16 md:pb-0">
      {/* Instant Top Route Progress Bar on Navigation */}
      <motion.div
        key={`progress-${location.pathname}`}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{
          scaleX: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.2, delay: 0.25 },
        }}
        style={{ transformOrigin: "0% 50%" }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#D6FF00] z-50 pointer-events-none shadow-[0_0_10px_#D6FF00]"
      />

      <AnnouncementBar />
      <Navbar />

      <main className="flex-1 overflow-x-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      {/* Mobile Bottom App Navigation Bar (< md) */}
      <nav
        aria-label="Mobile Storefront Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-0.5 px-3 rounded-xl transition-all ${
              isActive ? "text-black font-black" : "text-gray-400 hover:text-black font-semibold"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-[#D6FF00] text-black" : ""}`}>
                <Home className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-0.5 px-3 rounded-xl transition-all ${
              isActive ? "text-black font-black" : "text-gray-400 hover:text-black font-semibold"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-[#D6FF00] text-black" : ""}`}>
                <Compass className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Shop</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-0.5 px-3 rounded-xl transition-all ${
              isActive ? "text-black font-black" : "text-gray-400 hover:text-black font-semibold"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-[#D6FF00] text-black" : ""}`}>
                <Grid className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Depts</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={openCartDrawer}
          className="relative flex flex-col items-center justify-center py-0.5 px-3 rounded-xl text-gray-500 hover:text-black font-semibold transition-all cursor-pointer"
        >
          <div className="p-1 rounded-lg relative">
            <ShoppingBag className="w-4 h-4 stroke-[2.2] text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 bg-[#111111] text-[#D6FF00] text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 text-black font-bold">Bag</span>
        </button>

        <NavLink
          to={isAuthenticated ? "/orders" : "/login"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-0.5 px-3 rounded-xl transition-all ${
              isActive ? "text-black font-black" : "text-gray-400 hover:text-black font-semibold"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-[#D6FF00] text-black" : ""}`}>
                <User className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {isAuthenticated ? "Orders" : "Account"}
              </span>
            </>
          )}
        </NavLink>
      </nav>

      {/* Floating Back-to-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#111111] text-[#D6FF00] border border-white/15 shadow-xl hover:bg-black hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Modals & Overlay Drawers */}
      <CartDrawer />
      <QuickViewModal />
      <SearchModal />
      <ToastNotification />
    </div>
  );
};
