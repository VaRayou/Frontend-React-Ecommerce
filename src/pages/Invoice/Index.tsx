import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Printer,
  Download,
  Store,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Search,
  Package,
} from "lucide-react";
import { orderService } from "../../services/orderService";
import { useAuthStore } from "../../store/useAuthStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import Loader from "../../components/common/Loader";

export const InvoicePage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { formatPrice } = useCurrencyStore();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        if (orderNumber) {
          const found = await orderService.getOrder(orderNumber);
          if (active && found) {
            setOrder(found);
            setLoading(false);
            return;
          }
        }

        // Fallback: fetch patron's latest order if logged in
        if (user?.email) {
          const list = await orderService.getOrdersByCustomer(user.email);
          if (active && Array.isArray(list) && list.length > 0) {
            setOrder(list[0]);
            setLoading(false);
            return;
          }
        }

        // Generic fallback to cached orders
        const cached = orderService.getCachedOrders();
        if (active && Array.isArray(cached) && cached.length > 0) {
          setOrder(cached[0]);
        }
      } catch (err) {
        console.warn("Could not load invoice order:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      active = false;
    };
  }, [orderNumber, user?.email]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;
    setLoading(true);
    try {
      const found = await orderService.getOrder(clean);
      if (found) {
        setOrder(found);
        navigate(`/invoice/${encodeURIComponent(clean)}`, { replace: true });
      } else {
        alert(`Order "${clean}" was not found.`);
      }
    } catch {
      alert("Error finding order invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const rawNumber = order?.orderNumber || order?.order_number || order?.id || "INV";
    const originalTitle = document.title;
    document.title = `Atelier_Invoice_${rawNumber}`;
    setTimeout(() => {
      document.title = originalTitle;
    }, 3000);
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader size="lg" text="Retrieving digital tax invoice..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
          Invoice Not Found
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Please enter your order reference number below to retrieve your official tax invoice.
        </p>

        <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. ORD-1731422..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>← Return to Atelier Store</span>
        </Link>
      </div>
    );
  }

  const orderNum = order.orderNumber || order.order_number || (order.id ? `ORD-${order.id}` : "ATL-2026-INV");
  const invoiceNum = `INV-${orderNum.replace(/^ORD-/, "").replace(/^ATL-/, "ATL-")}`;
  const invoiceDate = order.date || (order.createdAt ? String(order.createdAt).split("T")[0] : new Date().toISOString().split("T")[0]);

  const customerName = order.customerName || order.customer_name || order.shippingAddress?.fullName || "Patron Client";
  const customerEmail = order.customerEmail || order.customer_email || order.shippingAddress?.email || "patron@atelier.com";
  const customerPhone = order.customerPhone || order.customer_phone || order.shippingAddress?.phone || "+855 (0) 23 888 999";

  let shippingAddressText = "Phnom Penh, Kingdom of Cambodia";
  if (typeof order.shippingAddress === "string") {
    shippingAddressText = order.shippingAddress;
  } else if (order.shippingAddress && typeof order.shippingAddress === "object") {
    const sa = order.shippingAddress;
    shippingAddressText = [sa.street, sa.city, sa.postalCode, sa.country].filter(Boolean).join(", ");
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const shippingFee = Number(order.shippingFee ?? order.shipping ?? 0);
  const tax = Number(order.tax) || 0;
  const khrTotal = Math.round(total * 4100);

  const paymentMethod = order.paymentMethod || order.payment_method || "Bakong KHQR";
  const paymentStatus = order.paymentStatus || order.payment_status || "Paid";
  const orderStatus = order.orderStatus || order.order_status || order.status || "Processing";
  const transactionId = order.transactionId || `TRX-${orderNum.slice(-8)}`;

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-12 print:bg-white print:p-0">
      {/* Print styles */}
      <style>{`
        @media print {
          header, footer, nav, .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
          }
          #atelier-printable-invoice {
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation & Control Header */}
        <div className="no-print mb-6 p-4 rounded-2xl bg-gray-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              <Store className="w-4 h-4" />
              <span>← Back to Store</span>
            </Link>
            <Link
              to="/orders"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-[#D6FF00]" />
              <span>Orders</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/15"
            >
              <Printer className="w-3.5 h-3.5 text-[#D6FF00]" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              to={`/track/${encodeURIComponent(orderNum)}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <span>Track Courier</span>
            </Link>
          </div>
        </div>

        {/* The Tax Invoice Document */}
        <div
          id="atelier-printable-invoice"
          className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-12 space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center font-black text-base">
                  A
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
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
                Official Tax Invoice
              </span>
              <p className="text-xs font-mono font-bold text-gray-900">{invoiceNum}</p>
              <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
                <p>
                  <span className="font-semibold text-gray-700">Order Ref:</span> {orderNum}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Issued Date:</span> {invoiceDate}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Transaction ID:</span> {transactionId}
                </p>
              </div>
            </div>
          </div>

          {/* Bill To & Dispatch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-xs">
            <div>
              <h3 className="font-black uppercase tracking-wider text-gray-400 mb-2 text-[10px]">
                Patron &amp; Bill To
              </h3>
              <p className="font-bold text-gray-900 text-sm">{customerName}</p>
              <p className="text-gray-600 mt-0.5">{customerEmail}</p>
              <p className="text-gray-600">{customerPhone}</p>
            </div>
            <div>
              <h3 className="font-black uppercase tracking-wider text-gray-400 mb-2 text-[10px]">
                Shipping &amp; Delivery Destination
              </h3>
              <p className="text-gray-900 font-medium leading-relaxed">{shippingAddressText}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {orderStatus}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 font-semibold">{paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-900 text-left font-black uppercase tracking-wider text-gray-400 text-[10px]">
                  <th className="py-3 px-2">Piece Description</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Price</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">
                      Standard Atelier Studio Piece • Direct Dispatch
                    </td>
                  </tr>
                ) : (
                  items.map((it: any, idx: number) => {
                    const price = Number(it.price || 0);
                    const qty = Number(it.quantity || 1);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-2 font-bold text-gray-900">
                          {it.productName || it.name || "Runway Apparel"}
                          {(it.size || it.color) && (
                            <span className="block text-[10px] font-normal text-gray-500">
                              {[it.size && `Size ${it.size}`, it.color && `Color ${it.color}`]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-gray-700">{qty}</td>
                        <td className="py-3 px-2 text-right text-gray-600">${price.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-black text-gray-900">
                          ${(price * qty).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
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
                <span className="text-xl font-black text-black">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Official Verification Footer */}
          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-emerald-600 shrink-0">
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
        </div>

        {/* Prominent Bottom Return Bar */}
        <div className="no-print mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div>
            <h4 className="font-black text-gray-900 text-sm uppercase">
              Ready to Explore More Pieces?
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Browse our latest Haute Couture collection and studio releases.
            </p>
          </div>
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>← Return to Atelier Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
