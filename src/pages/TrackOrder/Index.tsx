import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  Printer,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { orderService } from "../../services/orderService";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { useCurrencyStore } from "../../store/useCurrencyStore";

export const TrackOrder: React.FC = () => {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber?: string }>();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get("id") || searchParams.get("order") || "";
  const initialQuery = paramOrderNumber || queryOrderId;
  const [searchInput, setSearchInput] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const { formatPrice } = useCurrencyStore();

  const handleLookup = async (idOrNumber: string) => {
    const query = idOrNumber.trim();
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Try direct ID lookup from API (which searches MongoDB orderNumber, _id, and sqlite_id)
      const found = await orderService.getOrderById(query);
      if (found && (found.id || found.orderNumber || found.order_number)) {
        setOrder(found);
        setLoading(false);
        return;
      }
    } catch {
      // Try search in all orders
    }

    try {
      const allOrders = await orderService.getOrders();
      const cleanQ = query.toLowerCase();
      const match = (allOrders || []).find((o) => {
        const ordNum = String(o.orderNumber || o.order_number || o.id || o._id || "").toLowerCase();
        const email = String(o.customerEmail || o.customer_email || o.customer?.email || "").toLowerCase();
        const phone = String(o.customerPhone || o.customer_phone || o.customer?.phone || "");
        return ordNum === cleanQ || ordNum.includes(cleanQ) || email === cleanQ || (cleanQ.length > 4 && phone.includes(cleanQ));
      });

      if (match) {
        setOrder(match);
      } else {
        setOrder(null);
        setError(`No active dispatch record found for "${query}". Please check your order reference (e.g. ATL-2026-6149) and try again.`);
      }
    } catch (e: any) {
      setError("Unable to retrieve dispatch record at this time. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetRef = paramOrderNumber || queryOrderId;
    if (targetRef) {
      setSearchInput(targetRef);
      handleLookup(targetRef);
    }
  }, [paramOrderNumber, queryOrderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(searchInput);
  };

  // Derive status step (1 to 5)
  const getStatusStep = (statusStr?: string) => {
    const s = (statusStr || "").toLowerCase();
    if (s === "delivered") return 5;
    if (s === "out for delivery") return 4;
    if (s === "shipped" || s === "in transit") return 3;
    if (s === "processing" || s === "paid") return 2;
    return 1; // Pending
  };

  const currentStep = order ? getStatusStep(order.orderStatus || order.status) : 1;

  const steps = [
    {
      step: 1,
      title: "Order Placed",
      desc: "Order logged in Atelier system",
      icon: Package,
    },
    {
      step: 2,
      title: "Payment Verified",
      desc: "NBC Bakong KHQR Cleared",
      icon: ShieldCheck,
    },
    {
      step: 3,
      title: "Quality Packing",
      desc: "White-glove runway prep",
      icon: Clock,
    },
    {
      step: 4,
      title: "In Transit",
      desc: "Handed to courier team",
      icon: Truck,
    },
    {
      step: 5,
      title: "Delivered",
      desc: "Delivered to patron",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-16 space-y-6 sm:space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black text-[#D6FF00] text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
          <Truck className="w-3.5 h-3.5" />
          <span>Real-Time Logistics Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
          Track Your Runway Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-light">
          Enter your Atelier order number (e.g. <span className="font-mono font-bold text-gray-900">ATL-2026-2592</span>) or customer email to inspect real-time courier dispatch milestones.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col xs:flex-row items-stretch xs:items-center bg-white p-2 rounded-2xl border-2 border-gray-200 focus-within:border-black shadow-lg transition-all gap-2"
        >
          <div className="flex items-center flex-1 gap-2 px-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Order ID (ATL-2026-...) or Email..."
              className="flex-1 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-hidden font-medium min-w-0"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-black hover:bg-neutral-800 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? "Searching..." : "Track"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Results Timeline Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8 animate-in fade-in duration-300">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Order Reference
                </span>
                <span className="font-mono text-sm font-black text-black bg-gray-100 px-2 py-0.5 rounded-md">
                  {order.orderNumber || order.order_number}
                </span>
              </div>
              <h2 className="text-xl font-black text-gray-950 uppercase">
                Status: {order.orderStatus || order.status || "Processing"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Placed on {order.date || (order.createdAt ? order.createdAt.split("T")[0] : "Today")} • Estimated Delivery: 2-3 Business Days
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>POS Thermal Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-900 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>

          {/* Visual Milestone Stepper */}
          <div className="py-2 sm:py-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 sm:mb-6">
              Dispatch Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 sm:gap-4 relative">
              {steps.map((st, idx) => {
                const Icon = st.icon;
                const isCompleted = currentStep >= st.step;
                const isCurrent = currentStep === st.step;

                return (
                  <div key={idx} className="relative flex flex-row sm:flex-col items-center text-left sm:text-center gap-3.5 sm:gap-0 sm:space-y-2.5">
                    {/* Connecting line on desktop */}
                    {idx < steps.length - 1 && (
                      <div
                        className={`hidden sm:block absolute top-5 left-1/2 w-full h-1 -z-0 transition-colors ${
                          currentStep > st.step ? "bg-black" : "bg-gray-200"
                        }`}
                      />
                    )}

                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold z-10 shrink-0 transition-all ${
                        isCompleted
                          ? "bg-black text-[#D6FF00] ring-4 ring-black/10 shadow-md"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          isCurrent
                            ? "text-black underline underline-offset-4 decoration-[#D6FF00] decoration-2"
                            : isCompleted
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {st.title}
                      </span>
                      <span className="text-[11px] text-gray-500 block">{st.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
            {/* Patron & Destination */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                Destination
              </span>
              <p className="text-xs font-bold text-gray-900">
                {order.customerName || "Patron Client"}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  {typeof order.shippingAddress === "string"
                    ? order.shippingAddress
                    : "Preah Norodom Blvd, Phnom Penh, Cambodia"}
                </span>
              </p>
              <p className="text-[11px] text-gray-500">{order.customerEmail}</p>
            </div>

            {/* Payment & Bakong Clearance */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                Payment Verification
              </span>
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                <span>{order.paymentMethod || "Bakong KHQR"}</span>
              </p>
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: {order.paymentStatus || "Paid"}</span>
              </p>
              <p className="font-mono text-[11px] text-gray-500 truncate">
                Ref: {order.transactionId || `TRX-${String(order.id || order.orderNumber).slice(-8)}`}
              </p>
            </div>

            {/* Logistics & Tracking Code */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                Courier Tracking
              </span>
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-gray-500" />
                <span>Atelier Express Dispatch</span>
              </p>
              <p className="font-mono text-xs font-bold text-indigo-700">
                AWB-882-{(order.orderNumber || "ATL").replace(/\D/g, "") || "90218"}
              </p>
              <p className="text-[11px] text-gray-500">Live courier updates active</p>
            </div>
          </div>

          {/* Purchased Items Overview */}
          <div className="space-y-3 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
              Package Contents ({order.items?.length || 0} Pieces)
            </h4>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
              {(order.items || []).map((item: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between bg-white hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "/user/images/home/product1.jpg"}
                      alt={item.name || "Item"}
                      className="w-12 h-14 object-cover rounded-xl border border-gray-200 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {item.name || item.productName || "Fashion Piece"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Qty: {item.quantity || 1} • Size: {item.size || "M"} • Color: {item.color || "Standard"}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-gray-900">
                    {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 rounded-2xl bg-neutral-900 text-white">
              <span className="text-xs uppercase tracking-wider font-bold text-neutral-300">
                Total Authorized Amount
              </span>
              <span className="text-base font-black text-[#D6FF00]">
                {formatPrice(Number(order.total || 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        order={order}
        onClose={() => setIsInvoiceOpen(false)}
      />

      {/* POS Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoiceData={order}
      />
    </div>
  );
};
export default TrackOrder;

