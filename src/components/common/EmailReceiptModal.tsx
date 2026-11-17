import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  Sparkles,
} from "lucide-react";
import { emailService, EmailOrderPayload } from "../../services/emailService";

interface EmailReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const EmailReceiptModal: React.FC<EmailReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success?: boolean;
    configured?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen || !order) return null;

  const recipientEmail =
    order.customerEmail ||
    order.customer_email ||
    order.shippingAddress?.email ||
    order.email ||
    "client@atelier.com";

  const customerName =
    order.customerName ||
    order.customer_name ||
    order.shippingAddress?.fullName ||
    order.name ||
    "Patron Client";

  const orderNumber = order.orderNumber || order.order_number || order.id || "ATL-2026-9999";
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal ?? 0);
  const shippingFee = Number(order.shippingFee ?? order.shipping_fee ?? 0);
  const discount = Number(order.discount ?? 0);
  const total = Number(order.total ?? 0);
  const paymentMethod = order.paymentMethod || order.payment_method || "Bakong KHQR";

  const shippingAddressStr =
    typeof order.shippingAddress === "string"
      ? order.shippingAddress
      : typeof order.shipping_address === "string"
      ? order.shipping_address
      : order.shippingAddress
      ? `${order.shippingAddress.street || ""}, ${order.shippingAddress.city || "Phnom Penh"}`
      : "Phnom Penh, Cambodia";

  const emailPayload: EmailOrderPayload = {
    orderNumber,
    customerName,
    customerEmail: recipientEmail,
    shippingAddress: shippingAddressStr,
    items: items.map((it: any) => ({
      name: it.name || it.product?.name || "Runway Piece",
      quantity: Number(it.quantity || 1),
      price: Number(it.price || it.product?.price || 0),
      size: it.selectedSize || it.size || "Standard",
      color: typeof it.selectedColor === "object" ? it.selectedColor?.name : it.selectedColor,
      image: it.image || it.product?.image || "",
    })),
    subtotal,
    shippingFee,
    discount,
    total,
    paymentMethod,
  };

  const htmlPreview = emailService.generateReceiptHtml(emailPayload);
  const mailtoUrl = emailService.generateMailtoUrl(emailPayload);

  const handleResend = async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await emailService.sendCustomerOrderConfirmation(emailPayload);
      setSendResult(res);
    } catch (e: any) {
      setSendResult({
        success: false,
        configured: false,
        message: "Email dispatch issue: " + (e?.message || "Network note"),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlPreview);
      setSendResult({
        success: true,
        configured: true,
        message: "HTML Email receipt template copied to clipboard!",
      });
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-[#111111] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-black border border-neutral-700 text-[#D6FF00] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm uppercase tracking-wider text-white truncate">
                    Customer Email Receipt
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-[#D6FF00] shrink-0">
                    #{orderNumber}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  Recipient: <strong className="text-white">{recipientEmail}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Status Banner */}
          {sendResult && (
            <div
              className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 ${
                sendResult.success
                  ? "bg-emerald-50 text-emerald-800 border-b border-emerald-100"
                  : "bg-amber-50 text-amber-800 border-b border-amber-100"
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="truncate">{sendResult.message}</span>
            </div>
          )}

          {/* Scrollable Email Preview Frame */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8F8F8]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <iframe
                title="Email Receipt Preview"
                srcDoc={htmlPreview}
                className="w-full h-[380px] sm:h-[440px] border-none"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? "Dispatching..." : "Send to Customer Inbox"}</span>
              </button>

              <a
                href={mailtoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-all cursor-pointer"
                title="Open in your default email client (Gmail, Outlook, Apple Mail)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Mail App</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyHtml}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer"
                title="Copy raw HTML email template"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy HTML</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
