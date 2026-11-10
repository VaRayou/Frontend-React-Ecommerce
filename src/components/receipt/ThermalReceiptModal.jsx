import { useState, useEffect, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  RotateCcw,
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useStoreSettings } from "../../store/useStoreSettings";

/**
 * Reusable Dashed Divider for Thermal Paper Sections
 */
const ReceiptDivider = () => (
  <div className="border-b border-dashed border-slate-300 my-3 w-full" />
);

/**
 * Dynamic Status Badge for the POS Printer Header ("Printing" vs "Ready")
 */
const PrinterStatusBadge = ({ isPrinting }) => {
  if (isPrinting) {
    return (
      <span
        data-testid="printer-status-badge"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs"
      >
        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
        <span>Printing</span>
      </span>
    );
  }

  return (
    <span
      data-testid="printer-status-badge"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs"
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      <span>Ready</span>
    </span>
  );
};

/**
 * Repeating SVG Saw-Tooth Bottom Edge for Authentic Thermal Paper Tear-Off
 */
const SawToothEdge = () => {
  const patternId = useId();
  return (
    <div className="w-full overflow-hidden leading-none select-none pointer-events-none -mt-[1px]">
      <svg
        className="w-full h-3.5 block drop-shadow-sm"
        preserveAspectRatio="none"
        viewBox="0 0 240 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`sawtooth-${patternId}`}
            x="0"
            y="0"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <polygon points="0,0 6,11 12,0" fill="#fcfcfa" />
          </pattern>
        </defs>
        <rect width="240" height="12" fill={`url(#sawtooth-${patternId})`} />
      </svg>
    </div>
  );
};

/**
 * Procedural Barcode Generator SVG
 * Deterministically converts the invoice/order number string into variable-width barcode bars
 */
const ProceduralBarcode = ({ value = "INV-000000" }) => {
  const cleanValue = String(value || "INV-000000").toUpperCase();

  const bars = useMemo(() => {
    const result = [];
    // Start guard pattern
    result.push({ w: 2, gap: 1 }, { w: 1, gap: 1 }, { w: 2, gap: 2 });

    for (let i = 0; i < cleanValue.length; i++) {
      const code = cleanValue.charCodeAt(i);
      const w1 = (code % 3) + 1;
      const g1 = ((code >> 2) % 2) + 1;
      const w2 = ((code >> 3) % 3) + 1;
      const g2 = ((code >> 5) % 2) + 1;
      result.push({ w: w1, gap: g1 }, { w: w2, gap: g2 });
    }

    // Checksum & stop guard pattern
    result.push({ w: 3, gap: 1 }, { w: 1, gap: 1 }, { w: 2, gap: 0 });
    return result;
  }, [cleanValue]);

  const totalWidth = useMemo(
    () => bars.reduce((acc, b) => acc + b.w + b.gap, 0),
    [bars]
  );

  let currentX = 0;

  return (
    <div className="pt-3 pb-1 flex flex-col items-center justify-center select-none">
      <svg
        className="w-full max-w-[230px] h-12 text-slate-900"
        viewBox={`0 0 ${totalWidth} 44`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Barcode for ${cleanValue}`}
      >
        {bars.map((bar, idx) => {
          const rectX = currentX;
          currentX += bar.w + bar.gap;
          return (
            <rect
              key={idx}
              x={rectX}
              y="0"
              width={bar.w}
              height="44"
              fill="currentColor"
            />
          );
        })}
      </svg>
      <span className="mt-1.5 font-mono text-[10px] tracking-[0.22em] font-semibold text-slate-700 uppercase">
        {cleanValue}
      </span>
    </div>
  );
};

/**
 * Deterministic SVG QR Code & Live Order Tracking Verification Link
 */
const ReceiptVerificationQr = ({ invoiceNumber = "INV-000000" }) => {
  const cleanRef = String(invoiceNumber || "INV-000000").toUpperCase();
  const trackPath = `/track?id=${encodeURIComponent(cleanRef)}`;

  const matrix = useMemo(() => {
    const size = 15;
    const grid = Array.from({ length: size }, () => Array(size).fill(false));

    // Finder patterns (5x5 corners)
    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
          const isCenter = r === 2 && c === 2;
          grid[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 5);
    drawFinder(size - 5, 0);

    // Deterministic data modules from invoiceNumber
    let seed = 2166136261;
    for (let i = 0; i < cleanRef.length; i++) {
      seed ^= cleanRef.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inTopLeft = r < 6 && c < 6;
        const inTopRight = r < 6 && c >= size - 6;
        const inBottomLeft = r >= size - 6 && c < 6;
        if (inTopLeft || inTopRight || inBottomLeft) continue;

        seed ^= (r * 31 + c * 17) & 0xff;
        seed = Math.imul(seed, 16777619);
        grid[r][c] = (Math.abs(seed) % 10) < 5;
      }
    }
    return grid;
  }, [cleanRef]);

  return (
    <div className="pt-2 pb-1 flex items-center justify-between gap-3 px-2 bg-slate-100/70 rounded-lg border border-dashed border-slate-300/90 my-1.5">
      <div className="p-1 bg-white border border-slate-300 rounded shrink-0">
        <svg
          width="46"
          height="46"
          viewBox="0 0 15 15"
          className="text-slate-900 block"
          role="img"
          aria-label={`Verification QR for ${cleanRef}`}
        >
          {matrix.map((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx}
                  y={rIdx}
                  width="1"
                  height="1"
                  fill="currentColor"
                />
              ) : null
            )
          )}
        </svg>
      </div>
      <div className="flex-1 min-w-0 text-left space-y-0.5">
        <div className="text-[9px] font-black uppercase tracking-wider text-slate-800">
          VERIFY & TRACK DISPATCH
        </div>
        <p className="text-[9px] text-slate-500 leading-tight">
          Scan or tap to inspect live courier status for{" "}
          <span className="font-bold text-slate-800">{cleanRef}</span>
        </p>
        <a
          href={trackPath}
          className="inline-block text-[9px] font-bold text-slate-900 underline hover:text-black pt-0.5"
        >
          {typeof window !== "undefined" ? `${window.location.host}${trackPath}` : trackPath}
        </a>
      </div>
    </div>
  );
};

/**
 * Helper to normalize any order or invoiceData object into a consistent receipt structure
 */
function normalizeInvoiceData(raw, storeBranding = {}) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const orderId =
    raw.orderNumber ||
    raw.order_number ||
    raw.invoiceNumber ||
    raw.invoice_number ||
    (raw.id ? `ORD-${raw.id}` : "ATL-2026-0001");

  const invoiceNumber =
    raw.invoiceNumber ||
    raw.invoice_number ||
    (String(orderId).startsWith("INV-") ? String(orderId) : `INV-${orderId}`);

  // Format date & time
  const rawDate = raw.createdAt || raw.created_at || raw.date || new Date().toISOString();
  let formattedDate = String(rawDate);
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      if (String(rawDate).length <= 10) {
        formattedDate = `${yyyy}-${mm}-${dd}`;
      } else {
        formattedDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }
    }
  } catch {
    formattedDate = String(rawDate);
  }

  const storeName = raw.storeName || storeBranding.storeName || "ATELIER STUDIO";
  const storeAddress =
    raw.storeAddress || storeBranding.storeAddress || "Preah Norodom Blvd, Phnom Penh, KH";
  const storePhone = raw.storePhone || storeBranding.storePhone || "+855 (0) 23 888 999";
  const storeTaxId = raw.storeTaxId || storeBranding.storeTaxId || "VAT TIN: K008-9824-771";
  const receiptFooterMessage =
    raw.receiptFooterMessage ||
    storeBranding.receiptFooterMessage ||
    "*** THANK YOU FOR PATRONIZING ATELIER ***";

  const cashier = raw.cashier || raw.terminal || "POS-01 / ONLINE";
  const customerName =
    raw.customerName ||
    raw.customer_name ||
    raw.shippingAddress?.fullName ||
    "Walk-in Patron";

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems.map((item, idx) => {
    const name =
      item?.name ||
      item?.productName ||
      item?.product_name ||
      item?.product?.name ||
      `Item #${idx + 1}`;
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    const unitPrice = Number(item?.price ?? item?.unitPrice ?? item?.product?.price ?? 0);
    const lineTotal = Number((unitPrice * quantity).toFixed(2));
    const size = item?.size || item?.selectedSize || null;
    const color =
      typeof item?.color === "object" && item?.color?.name
        ? item.color.name
        : item?.color || item?.selectedColor || null;

    return {
      id: item?.id || item?.productId || `${idx}`,
      name: String(name),
      quantity,
      unitPrice,
      lineTotal,
      size,
      color,
    };
  });

  const computedItemsSubtotal = items.reduce((acc, i) => acc + i.lineTotal, 0);
  const subtotal = Number(
    raw.subtotal !== undefined && raw.subtotal !== null
      ? raw.subtotal
      : computedItemsSubtotal
  );
  const discount = Math.max(0, Number(raw.discount || 0));
  const tax = Math.max(0, Number(raw.tax || 0));
  const shipping = Math.max(
    0,
    Number(raw.shippingFee ?? raw.shipping ?? 0)
  );

  const total = Number(
    raw.total !== undefined && raw.total !== null
      ? raw.total
      : Math.max(0, subtotal - discount + tax + shipping)
  );

  const paymentMethod =
    raw.paymentMethod || raw.payment_method || "Bakong KHQR";

  const rawPaymentStatus = String(
    raw.paymentStatus || raw.payment_status || "Paid"
  ).trim();

  const normalizedPayStatus = rawPaymentStatus.toUpperCase();
  const isApproved =
    normalizedPayStatus === "PAID" ||
    normalizedPayStatus === "APPROVED" ||
    normalizedPayStatus === "AUTHORIZED" ||
    normalizedPayStatus === "COMPLETED" ||
    normalizedPayStatus === "SUCCESS" ||
    normalizedPayStatus === "SUCCEEDED";

  const isFailed =
    normalizedPayStatus === "FAILED" ||
    normalizedPayStatus === "DECLINED" ||
    normalizedPayStatus === "CANCELLED" ||
    normalizedPayStatus === "EXPIRED";

  const approvalLabel = isApproved
    ? "APPROVED"
    : isFailed
    ? "FAILED"
    : "PENDING";

  const transactionId =
    raw.transactionId || raw.transaction_id || null;

  return {
    storeName,
    storeAddress,
    storePhone,
    storeTaxId,
    receiptFooterMessage,
    invoiceNumber,
    orderId,
    date: formattedDate,
    cashier,
    customerName,
    items,
    subtotal,
    discount,
    tax,
    shipping,
    total,
    paymentMethod,
    paymentStatus: rawPaymentStatus,
    isApproved,
    isFailed,
    approvalLabel,
    transactionId,
  };
}

/**
 * Reusable POS Thermal Receipt Modal Component
 * Interface: <ThermalReceiptModal isOpen={...} onClose={...} invoiceData={...} />
 */
export const ThermalReceiptModal = ({ isOpen, onClose, invoiceData }) => {
  const [printCount, setPrintCount] = useState(0);
  const [completedCycleKey, setCompletedCycleKey] = useState(null);
  const { storeName, storeAddress, storePhone, storeTaxId, receiptFooterMessage } =
    useStoreSettings();

  const normalized = useMemo(
    () =>
      normalizeInvoiceData(invoiceData, {
        storeName,
        storeAddress,
        storePhone,
        storeTaxId,
        receiptFooterMessage,
      }),
    [invoiceData, storeName, storeAddress, storePhone, storeTaxId, receiptFooterMessage]
  );

  const activeCycleKey = `${normalized?.invoiceNumber || "none"}-${printCount}`;
  const isPrinting = Boolean(isOpen && completedCycleKey !== activeCycleKey);

  // Fallback timer synchronized with the 2.1s Framer Motion extrusion transition
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setCompletedCycleKey(activeCycleKey);
    }, 2100);
    return () => clearTimeout(timer);
  }, [isOpen, activeCycleKey]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePrintAgain = () => {
    setPrintCount((prev) => prev + 1);
  };

  const handleSystemPrint = () => {
    const printContent = document.getElementById("pos-thermal-receipt-paper");
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=480,height=750");
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
          <title>POS Receipt - ${normalized?.invoiceNumber || "Receipt"}</title>
          ${styles}
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0;
              padding: 8px;
              font-family: monospace, -apple-system, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #pos-thermal-receipt-paper {
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
            }
          </style>
        </head>
        <body>
          <div id="pos-thermal-receipt-paper">
            ${printContent.innerHTML}
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Your receipt"
        >
          {/* Main POS Terminal Column */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md my-auto flex flex-col items-center select-none"
          >
            {/* Top Modal Header Bar */}
            <div className="w-full flex items-center justify-between px-2 pb-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-[#D6FF00] shadow-inner">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                    Your receipt
                  </h2>
                  <span className="text-[10px] text-slate-400 font-mono">
                    POS Thermal Printer • 80mm Series
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <PrinterStatusBadge isPrinting={isPrinting} />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close receipt modal"
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dark Physical POS Printer Body */}
            <div className="w-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-3xl border border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-3.5 sm:p-5 relative">
              {/* Hardware Top Bezel & Indicator LEDs */}
              <div className="flex items-center justify-between px-2 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      isPrinting
                        ? "bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse"
                        : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                    }`}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    {isPrinting ? "FEEDING PAPER..." : "CUTTER READY"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  ATELIER-POS V2
                </span>
              </div>

              {/* Recessed Printer Slot */}
              <div className="relative h-3.5 bg-black rounded-full border border-slate-800 shadow-inner z-20 flex items-center justify-center">
                <div className="w-[94%] h-[2px] bg-slate-900 rounded-full" />
              </div>

              {/* Paper Clipping Container */}
              <div
                key={normalized?.invoiceNumber || "receipt-slot"}
                className="relative -mt-1.5 mx-1 sm:mx-2.5 overflow-hidden pt-1.5 pb-3 px-0.5"
              >
                {/* Fixed Top-Edge Shadow Overlay (casts realistic slot shadow onto paper) */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/75 via-black/30 to-transparent z-10" />

                {/* Extruding Thermal Paper */}
                <motion.div
                  key={printCount}
                  initial={{ y: "-105%", opacity: 1 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 2.1, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={() => setCompletedCycleKey(activeCycleKey)}
                  className="w-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)] will-change-transform"
                >
                  {/* Thermal Paper Body */}
                  <div
                    id="pos-thermal-receipt-paper"
                    className="bg-[#fcfcfa] text-slate-900 font-mono px-4 sm:px-6 pt-6 pb-4 text-xs relative max-h-[64vh] overflow-y-auto"
                  >
                    {!normalized ? (
                      <div className="py-10 text-center space-y-2 text-slate-500">
                        <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
                        <p className="text-xs font-bold uppercase">
                          No Invoice Data Available
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Store Information Header */}
                        <div className="text-center space-y-1">
                          <h3 className="text-base sm:text-lg font-black tracking-widest uppercase text-slate-950">
                            {normalized.storeName}
                          </h3>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                            {normalized.storeAddress}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Tel: {normalized.storePhone}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {normalized.storeTaxId}
                          </p>
                        </div>

                        <ReceiptDivider />

                        {/* Invoice, Date, Cashier & Customer Metadata */}
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">INVOICE:</span>
                            <span className="font-bold text-slate-900 text-right">
                              {normalized.invoiceNumber}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">ORDER ID:</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {normalized.orderId}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">DATE:</span>
                            <span className="text-slate-800 text-right">
                              {normalized.date}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">CASHIER:</span>
                            <span className="text-slate-800 text-right">
                              {normalized.cashier}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">PATRON:</span>
                            <span className="text-slate-800 text-right truncate max-w-[180px]">
                              {normalized.customerName}
                            </span>
                          </div>
                        </div>

                        <ReceiptDivider />

                        {/* Column Headers */}
                        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase pb-1.5 border-b border-dotted border-slate-300">
                          <span className="col-span-6">ITEM</span>
                          <span className="col-span-2 text-center">QTY</span>
                          <span className="col-span-4 text-right">AMOUNT</span>
                        </div>

                        {/* Itemized Product Rows */}
                        <div className="divide-y divide-dotted divide-slate-200/80 my-1">
                          {normalized.items.length === 0 ? (
                            <div className="py-2 text-[11px] text-slate-400 italic text-center">
                              No itemized products listed
                            </div>
                          ) : (
                            normalized.items.map((item, idx) => (
                              <div key={item.id || idx} className="py-2 text-[11px]">
                                <div className="grid grid-cols-12 items-baseline gap-1">
                                  <span className="col-span-6 font-bold text-slate-900 break-words leading-tight">
                                    {item.name}
                                  </span>
                                  <span className="col-span-2 text-center text-slate-700 font-semibold">
                                    x{item.quantity}
                                  </span>
                                  <span className="col-span-4 text-right font-bold text-slate-900">
                                    ${item.lineTotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-0.5">
                                  <span>
                                    Unit: ${item.unitPrice.toFixed(2)}
                                    {item.size ? ` • Sz: ${item.size}` : ""}
                                    {item.color ? ` • ${item.color}` : ""}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <ReceiptDivider />

                        {/* Totals Breakdown */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-600">
                            <span>SUBTOTAL</span>
                            <span>${normalized.subtotal.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between text-slate-600">
                            <span>DISCOUNT</span>
                            <span>
                              {normalized.discount > 0
                                ? `-$${normalized.discount.toFixed(2)}`
                                : "$0.00"}
                            </span>
                          </div>

                          {normalized.shipping > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>SHIPPING</span>
                              <span>${normalized.shipping.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-600">
                            <span>TAX (VAT)</span>
                            <span>${normalized.tax.toFixed(2)}</span>
                          </div>

                          <div className="pt-2 mt-1.5 border-t-2 border-slate-900 flex justify-between items-baseline text-sm font-black text-slate-950">
                            <span>TOTAL</span>
                            <div className="text-right">
                              <span>${normalized.total.toFixed(2)} USD</span>
                              <span className="block text-[10px] font-normal text-slate-500">
                                ៛ {Math.round(normalized.total * 4100).toLocaleString()} KHR
                              </span>
                            </div>
                          </div>
                        </div>

                        <ReceiptDivider />

                        {/* Payment Method & Approval Status */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">PAYMENT METHOD:</span>
                            <span className="font-bold text-slate-900 uppercase">
                              {normalized.paymentMethod}
                            </span>
                          </div>

                          {normalized.transactionId && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">TXN REF:</span>
                              <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                                {normalized.transactionId}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-500">STATUS:</span>
                            {normalized.isApproved ? (
                              <span
                                data-testid="receipt-approval-status"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900 text-white font-black text-[10px] tracking-widest uppercase"
                              >
                                <ShieldCheck className="w-3 h-3 text-[#D6FF00]" />
                                <span>APPROVED</span>
                              </span>
                            ) : normalized.isFailed ? (
                              <span
                                data-testid="receipt-approval-status"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-700 text-white font-black text-[10px] tracking-widest uppercase"
                              >
                                <span>FAILED</span>
                              </span>
                            ) : (
                              <span
                                data-testid="receipt-approval-status"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-black text-[10px] tracking-widest uppercase"
                              >
                                <Clock className="w-3 h-3" />
                                <span>PENDING</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <ReceiptDivider />

                        {/* QR Code Verification & Live Tracking Link */}
                        <ReceiptVerificationQr invoiceNumber={normalized.invoiceNumber} />

                        {/* Procedural Barcode Displaying Invoice Number */}
                        <ProceduralBarcode value={normalized.invoiceNumber} />

                        {/* Centered Thank-You Footer */}
                        <div className="text-center pt-2 space-y-0.5 text-[10px] text-slate-500">
                          <p className="font-bold text-slate-800 uppercase tracking-wider">
                            {normalized.receiptFooterMessage}
                          </p>
                          <p>Please retain this thermal receipt for your records.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Repeating SVG Saw-Tooth Bottom Edge */}
                  <SawToothEdge />
                </motion.div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 mt-4 px-1">
              <button
                type="button"
                onClick={handlePrintAgain}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#D6FF00] hover:bg-[#c6ef00] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${isPrinting ? "animate-spin" : ""}`} />
                <span>Print Again</span>
              </button>

              <button
                type="button"
                onClick={handleSystemPrint}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Print physical copy or save as PDF"
              >
                <Printer className="w-4 h-4 text-[#D6FF00]" />
                <span className="hidden sm:inline">Save PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThermalReceiptModal;
