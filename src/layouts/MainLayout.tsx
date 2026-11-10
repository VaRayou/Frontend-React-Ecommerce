import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { AnnouncementBar } from "../components/common/AnnouncementBar";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import { CartDrawer } from "../components/common/CartDrawer";
import { QuickViewModal } from "../components/common/QuickViewModal";
import { SearchModal } from "../components/common/SearchModal";
import { ToastNotification } from "../components/common/ToastNotification";

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 450);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F4] text-[#111111] selection:bg-[#D6FF00] selection:text-black">
      {/* Instant Top Route Progress Bar on Navigation */}
      <motion.div
        key={`progress-${location.pathname}`}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{
          scaleX: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.25, delay: 0.32 },
        }}
        style={{ transformOrigin: "0% 50%" }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#D6FF00] z-50 pointer-events-none shadow-[0_0_10px_#D6FF00]"
      />

      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      {/* Floating Back-to-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#111111] text-[#D6FF00] border border-white/15 shadow-xl hover:bg-black hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
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
