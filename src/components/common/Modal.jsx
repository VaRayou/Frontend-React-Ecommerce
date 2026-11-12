import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 640 }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const computedMaxWidth =
    typeof maxWidth === "number"
      ? `min(${maxWidth}px, calc(100vw - 24px))`
      : maxWidth;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ maxWidth: computedMaxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="font-bold text-gray-900 text-sm sm:text-lg min-w-0 flex-1">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body - flex-1 min-h-0 ensures dynamic height without clipping header or footer */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 overscroll-contain">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-4 py-2.5 sm:px-6 sm:py-3.5 border-t border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
