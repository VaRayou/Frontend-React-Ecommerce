import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

export const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto bg-[#111111] text-white p-3.5 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 backdrop-blur-md"
          >
            {toast.image ? (
              <img
                src={toast.image}
                alt="Product thumbnail"
                className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  toast.type === "error"
                    ? "bg-rose-500/20 text-rose-400"
                    : toast.type === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : toast.type === "info"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-[#D6FF00]/20 text-[#D6FF00]"
                }`}
              >
                {toast.type === "error" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : toast.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : toast.type === "info" ? (
                  <Info className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
              </div>
            )}

            <div className="flex-1 text-xs">
              <p className="font-semibold text-white leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

