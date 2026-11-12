import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShoppingBag,
  QrCode,
  Building2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Store,
  ArrowLeft,
} from "lucide-react";

export interface InvoiceOrder {
  id?: string | number;
  orderNumber?: string;
  order_number?: string;
  date?: string;
  createdAt?: string;
  customerName?: string;
  customer_name?: string;
  customerEmail?: string;
  customer_email?: string;
  customerPhone?: string;
  customer_phone?: string;
  shippingAddress?: any;
  items?: Array<{
    id?: string | number;
    name?: string;
    productName?: string;
    product_name?: string;
    price: number;
    quantity: number;
    image?: string;
    size?: string;
    color?: string;
  }>;
  subtotal?: number;
  shippingFee?: number;
  shipping?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  payment_method?: string;
  paymentStatus?: string;
  payment_status?: string;
  orderStatus?: string;
  order_status?: string;
  status?: string;
  transactionId?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: InvoiceOrder | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  let navigate: any;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const handleBackToStore = () => {
    onClose();
    if (navigate) {
      navigate("/shop");
    } else {
      window.location.href = "/shop";
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const orderNumber =
    order.orderNumber ||
    order.order_number ||
    (order.id ? `ORD-${order.id}` : "ATL-2026-INV");

  const invoiceNumber = `INV-${orderNumber.replace(/^ORD-/, "").replace(/^ATL-/, "ATL-")}`;
  const invoiceDate =
    order.date ||
    (order.createdAt ? String(order.createdAt).split("T")[0] : new Date().toISOString().split("T")[0]);

  const customerName =
    order.customerName ||
    order.customer_name ||
    order.shippingAddress?.fullName ||
    "Patron Client";
  const customerEmail =
    order.customerEmail ||
    order.customer_email ||
    order.shippingAddress?.email ||
    "patron@atelier.com";
  const customerPhone =
    order.customerPhone ||
    order.customer_phone ||
    order.shippingAddress?.phone ||
    "+855 (0) 23 888 999";

  let shippingAddressText = "Phnom Penh, Kingdom of Cambodia";
  if (typeof order.shippingAddress === "string") {
    shippingAddressText = order.shippingAddress;
  } else if (order.shippingAddress && typeof order.shippingAddress === "object") {
    const sa = order.shippingAddress;
    shippingAddressText = [sa.street, sa.city, sa.postalCode, sa.country]
      .filter(Boolean)
      .join(", ");
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const shippingFee = Number(order.shippingFee ?? order.shipping ?? 0);
  const tax = Number(order.tax) || 0;
  const khrTotal = Math.round(total * 4100);

  const paymentMethod =
    order.paymentMethod || order.payment_method || "Bakong KHQR";
  const paymentStatus =
    order.paymentStatus || order.payment_status || "Paid";
  const orderStatus =
    order.orderStatus || order.order_status || order.status || "Processing";
  const transactionId =
    order.transactionId || `TRX-${orderNumber.slice(-8)}`;

  const handlePrint = () => {
    const safeCustomer = (customerName || "Patron").replace(/[^a-zA-Z0-9]/g, "_");
    const docTitle = `Atelier_Invoice_${invoiceNumber}_${safeCustomer}`;
    const originalTitle = document.title;
    document.title = docTitle;
    setTimeout(() => {
      document.title = originalTitle;
    }, 3000);

    const storeUrl = typeof window !== "undefined" ? `${window.location.origin}/shop` : "/shop";

    const printContent = document.getElementById("atelier-printable-invoice");
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${docTitle}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              background: #ffffff !important;
              color: #111111 !important;
              margin: 0;
              padding: 16px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #atelier-printable-invoice {
              width: 100% !important;
              max-width: 800px;
              margin: 0 auto;
              display: block !important;
            }
            .no-print {
              display: none !important;
            }
            @media screen {
              .print-top-bar {
                position: -webkit-sticky;
                position: sticky;
                top: 0;
                z-index: 99999;
                margin: -16px -16px 24px -16px;
                padding: 14px 20px;
                background: #0f172a;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #D6FF00;
                box-shadow: 0 4px 16px rgba(0,0,0,0.25);
              }
              .btn-return-store {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #D6FF00;
                color: #000000;
                text-decoration: none;
                padding: 9px 18px;
                border-radius: 10px;
                font-weight: 900;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(214,255,0,0.3);
              }
              .btn-action-outline {
                background: rgba(255,255,255,0.12);
                color: #ffffff;
                border: 1px solid rgba(255,255,255,0.25);
                padding: 9px 16px;
                border-radius: 10px;
                font-weight: 800;
                font-size: 12px;
                text-transform: uppercase;
                cursor: pointer;
              }
            }
          </style>
        </head>
        <body>
          <!-- Screen-only Persistent Top Navigation Bar -->
          <div class="no-print print-top-bar">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #D6FF00;"></span>
              <span style="font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #D6FF00;">
                Atelier Tax Invoice &bull; ${invoiceNumber}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <a href="${storeUrl}" onclick="if(window.opener && !window.opener.closed){window.opener.focus();window.close();return false;} return true;" class="btn-return-store">
                &larr; Back to Store
              </a>
              <button onclick="window.print()" class="btn-action-outline">
                Print / Save PDF
              </button>
              <button onclick="window.close()" class="btn-action-outline" style="background: rgba(255,255,255,0.08); color: #94a3b8; border: none;">
                Close
              </button>
            </div>
          </div>

          <div id="atelier-printable-invoice">
            ${printContent.innerHTML}
          </div>

          <!-- Screen-only Persistent Bottom Return Bar -->
          <div class="no-print" style="max-width: 800px; margin: 32px auto 0 auto; padding: 18px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-weight: 900; font-size: 13px; color: #0f172a; text-transform: uppercase;">
                Atelier Studio Official Platform
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                Verified Digital Tax Invoice &bull; Preah Norodom Blvd, Phnom Penh
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <a href="${storeUrl}" onclick="if(window.opener && !window.opener.closed){window.opener.focus();window.close();return false;} return true;" class="btn-return-store" style="padding: 10px 20px;">
                &larr; Back to Store
              </a>
              <button onclick="window.close()" class="btn-action-outline" style="background: #e2e8f0; color: #334155; border: none; padding: 10px 16px;">
                Close Window
              </button>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2.5 sm:p-6 pb-20 sm:pb-6 bg-black/75 backdrop-blur-sm print:p-0 print:bg-white print:static"
    >
      {/* Print-specific style fallback */}
      <style>{`
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body > *:not(#root) {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          #atelier-printable-invoice {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] border border-gray-100 print:max-h-none print:shadow-none print:rounded-none"
      >
        {/* Modal Top Control Bar (Always Visible & Sticky on Mobile, Hidden on print) */}
        <div className="no-print sticky top-0 z-20 px-4 sm:px-6 py-3 sm:py-4 bg-gray-900 text-white flex items-center justify-between gap-2 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#D6FF00] truncate">
              Tax Invoice • {invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBackToStore}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D6FF00] font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer border border-[#D6FF00]/40"
              title="Return to Atelier Storefront"
            >
              <Store className="w-3.5 h-3.5 text-[#D6FF00]" />
              <span className="hidden xs:inline sm:inline">Back to Store</span>
              <span className="inline xs:hidden sm:hidden">Store</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              title="Download direct PDF file via browser Print to PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Tax Invoice"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Close</span>
              <X className="w-4 h-4 text-[#D6FF00]" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-4 sm:p-10 print:p-0">
          <div id="atelier-printable-invoice" className="space-y-8 bg-white text-gray-900">
            {/* Header: Company & Invoice Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-black text-[#D6FF00] flex items-center justify-center font-black text-sm">
                    A
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                    Atelier Studio
                  </h1>
                </div>
                <p className="text-xs text-gray-500 font-medium">Haute Couture &amp; Modern Streetwear Platform</p>
                <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
                  <p>Preah Norodom Blvd, Daun Penh, Phnom Penh, Cambodia</p>
                  <p>VAT Registration No: K008-9824-771</p>
                  <p>support@atelier.com | +855 (0) 23 888 999</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-black text-[#D6FF00] text-xs font-black uppercase tracking-widest rounded-lg mb-2">
                  Tax Invoice
                </span>
                <p className="text-xs font-mono font-bold text-gray-900">{invoiceNumber}</p>
                <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
                  <p>
                    <span className="font-semibold text-gray-700">Order ID:</span> {orderNumber}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Issued Date:</span> {invoiceDate}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Payment:</span>{" "}
                    <span className="font-bold text-emerald-700">{paymentStatus}</span> ({paymentMethod})
                  </p>
                </div>
              </div>
            </div>

            {/* Billing & Shipping Client Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                  Billed &amp; Shipped To
                </span>
                <p className="text-sm font-bold text-gray-900">{customerName}</p>
                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{customerEmail}</span>
                  </p>
                  {customerPhone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{customerPhone}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{shippingAddressText}</span>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                  Payment &amp; Fulfillment
                </span>
                <div className="text-xs text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium text-gray-500">Method:</span>{" "}
                    <span className="font-bold">{paymentMethod}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Order Status:</span>{" "}
                    <span className="font-bold text-indigo-700">{orderStatus}</span>
                  </p>
                  <p className="font-mono text-[11px] text-gray-600">
                    <span className="font-sans font-medium text-gray-500">Transaction Ref:</span>{" "}
                    {transactionId}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>NBC Bakong EMVCo KHQR Verified</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900 text-[10px] uppercase tracking-wider font-black text-gray-900">
                    <th className="py-2.5 pr-4">Item &amp; Specifications</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 pl-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const name =
                      item.name ||
                      item.productName ||
                      item.product_name ||
                      `Fashion Item #${idx + 1}`;
                    const price = Number(item.price) || 0;
                    const qty = Number(item.quantity) || 1;
                    const lineTotal = price * qty;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-gray-900">{name}</p>
                          {(item.size || item.color) && (
                            <p className="text-[11px] text-gray-500">
                              Size: {item.size || "Standard"} • Color: {item.color || "Standard"}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-700">
                          {qty}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-600">
                          ${price.toFixed(2)}
                        </td>
                        <td className="py-3 pl-4 text-right font-bold text-gray-900">
                          ${lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 max-w-sm space-y-1">
                <p className="font-bold text-gray-800">Payment Notice:</p>
                <p>
                  This official computer-generated receipt is authorized under National Bank of Cambodia
                  Bakong Digital Payment Standards. Dual currency exchange indexed at standard NBC 1 USD = 4,100 KHR.
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (VAT)</span>
                    <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black uppercase text-black block">Total Due</span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      ៛ {khrTotal.toLocaleString()} KHR
                    </span>
                  </div>
                  <span className="text-lg font-black text-black">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Signature / Stamp Footer */}
            <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Verified Digital Record
                  </p>
                  <p className="text-[10px] text-gray-400">Atelier Studio E-Commerce Core v2.0</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400">
                Thank you for patronizing Atelier Studio.
              </p>
            </div>

            {/* Patron Navigation & Action Footer (Screen only) */}
            <div className="no-print pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-4 sm:p-5 rounded-2xl mt-6">
              <button
                type="button"
                onClick={handleBackToStore}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-neutral-800 text-[#D6FF00] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>← Back to Store / Continue Shopping</span>
              </button>
              <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="no-print sm:hidden sticky bottom-0 z-20 p-2.5 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBackToStore}
            className="flex-1 py-2.5 px-3 rounded-xl bg-black text-[#D6FF00] font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-[#D6FF00]" />
            <span>Back to Store</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-[#D6FF00] text-black font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-gray-200 text-gray-800 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

