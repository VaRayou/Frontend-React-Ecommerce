import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  Printer,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Send,
  XCircle,
  Sparkles,
} from "lucide-react";
import { orderService } from "../../services/orderService";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../services/supabase";
import { soundEffects } from "../../utils/soundEffects";

export const TrackOrder: React.FC = () => {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const queryOrderId =
    searchParams.get("id") || searchParams.get("order") || "";
  const initialQuery = paramOrderNumber || queryOrderId;

  const [searchInput, setSearchInput] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [order, setOrder] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const { formatPrice } = useCurrencyStore();

  const copyText = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleLookup = useCallback(
    async (idOrNumber: string, silent = false) => {
      const query = idOrNumber.trim();
      if (!query) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const found = await orderService.getOrderById(query);
        if (found && (found.id || found.orderNumber || found.order_number)) {
          setOrder(found);
          setLastSyncedAt(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch {
        // Fallback to full list search below
      }

      try {
        const allOrders = await orderService.getOrders();
        const cleanQ = query.toLowerCase();
        const match = (allOrders || []).find((o: any) => {
          const ordNum = String(
            o.orderNumber || o.order_number || o.id || o._id || ""
          ).toLowerCase();
          const email = String(
            o.customerEmail || o.customer_email || o.customer?.email || ""
          ).toLowerCase();
          const phone = String(
            o.customerPhone || o.customer_phone || o.customer?.phone || ""
          );
          return (
            ordNum === cleanQ ||
            ordNum.includes(cleanQ) ||
            email === cleanQ ||
            (cleanQ.length > 4 && phone.includes(cleanQ))
          );
        });

        if (match) {
          setOrder(match);
          setLastSyncedAt(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        } else if (!silent) {
          setOrder(null);
          setError(
            `No active dispatch record found for "${query}". Check your order reference (e.g. ATL-2026-...) or tap one of the recent orders below.`
          );
        }
      } catch {
        if (!silent) {
          setError(
            "Unable to retrieve dispatch record at this time. Please try again."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Load recent orders for quick-tap pills (customer's own orders or latest store orders)
  useEffect(() => {
    let active = true;
    const loadRecent = async () => {
      try {
        const list = user?.email
          ? await orderService.getOrdersByCustomer(user.email)
          : await orderService.getOrders();
        if (!active) return;
        const top = Array.isArray(list) ? list.slice(0, 5) : [];
        setRecentOrders(top);
        // If no initial query was given and we have at least 1 order for the signed-in user, pre-load it
        if (!initialQuery && user?.email && top.length > 0) {
          const firstRef = top[0].orderNumber || top[0].order_number;
          if (firstRef) {
            setSearchInput(firstRef);
            setOrder(top[0]);
            setLastSyncedAt(
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            );
          }
        }
      } catch {
        // ignore
      }
    };
    loadRecent();
    return () => {
      active = false;
    };
  }, [user?.email, initialQuery]);

  useEffect(() => {
    const targetRef = paramOrderNumber || queryOrderId;
    if (targetRef) {
      setSearchInput(targetRef);
      handleLookup(targetRef);
    }
  }, [paramOrderNumber, queryOrderId, handleLookup]);

  // Live Supabase Realtime WebSocket subscription for instant status progression
  useEffect(() => {
    const activeRef = order?.orderNumber || order?.order_number;
    if (!activeRef) return;

    let active = true;
    const onOrderEvent = () => handleLookup(activeRef, true);
    window.addEventListener("atelier_order_updated", onOrderEvent);

    const trackingChannel = supabase
      .channel(`tracking_feed_${String(activeRef).replace(/[^a-zA-Z0-9_-]/g, "_")}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          if (!active) return;
          const updatedNum = payload.new?.order_number || payload.new?.id;
          const currentNum = order?.orderNumber || order?.order_number || order?.id;
          if (
            String(updatedNum).toLowerCase() === String(currentNum).toLowerCase() ||
            String(updatedNum).toLowerCase() === String(activeRef).toLowerCase()
          ) {
            soundEffects.playOrderChime();
            handleLookup(activeRef, true);
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      handleLookup(activeRef, true);
    }, 15000);

    return () => {
      active = false;
      window.removeEventListener("atelier_order_updated", onOrderEvent);
      clearInterval(interval);
      supabase.removeChannel(trackingChannel);
    };
  }, [order?.orderNumber, order?.order_number, order?.id, handleLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    handleLookup(searchInput);
  };

  const handleQuickSelect = (ordRef: string) => {
    setSearchInput(ordRef);
    navigate(`/track/${encodeURIComponent(ordRef)}`, { replace: true });
    handleLookup(ordRef);
  };

  // Derive status step (1 to 5)
  const rawStatus = String(order?.orderStatus || order?.status || "Processing");
  const isCancelled = rawStatus.toLowerCase() === "cancelled";

  const getStatusStep = (statusStr?: string) => {
    const s = (statusStr || "").toLowerCase();
    if (s === "delivered" || s === "completed") return 5;
    if (s === "out for delivery") return 4;
    if (s === "shipped" || s === "in transit" || s === "dispatched") return 4;
    if (s === "processing" || s === "paid" || s === "confirmed") return 3;
    return 2; // Order Placed + Verified
  };

  const currentStep = order ? getStatusStep(rawStatus) : 1;
  const progressPercent = isCancelled
    ? 0
    : Math.min(100, Math.round((currentStep / 5) * 100));

  const steps = [
    {
      step: 1,
      title: "Order Placed",
      desc: "Logged in Atelier ledger",
      icon: Package,
    },
    {
      step: 2,
      title: "KHQR Verified",
      desc: "NBC Bakong cleared",
      icon: ShieldCheck,
    },
    {
      step: 3,
      title: "Quality Packing",
      desc: "White-glove studio prep",
      icon: Clock,
    },
    {
      step: 4,
      title: "In Transit",
      desc: "Dispatched with courier",
      icon: Truck,
    },
    {
      step: 5,
      title: "Delivered",
      desc: "Received by patron",
      icon: CheckCircle2,
    },
  ];

  const activeOrderNum = order?.orderNumber || order?.order_number || "";
  const shareUrl =
    typeof window !== "undefined" && activeOrderNum
      ? `${window.location.origin}/track/${encodeURIComponent(activeOrderNum)}`
      : "";
  const telegramCmd = activeOrderNum ? `/track ${activeOrderNum}` : "/track";

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-14 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black text-[#D6FF00] text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-xs">
          <Truck className="w-3.5 h-3.5" />
          <span>Live Supabase &amp; Telegram Logistics Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
          Track Your Runway Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-light">
          Enter your Atelier order reference (e.g.{" "}
          <span className="font-mono font-bold text-gray-900">
            ATL-2026-2592
          </span>
          ), customer email, or phone number — or send{" "}
          <code className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-gray-900 font-bold">
            /track ORDER_ID
          </code>{" "}
          to our Telegram Bot.
        </p>
      </div>

      {/* Search Input Box + Recent Order Quick Pills */}
      <div className="max-w-2xl mx-auto space-y-3">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white p-2 rounded-2xl border-2 border-gray-200 focus-within:border-black shadow-lg transition-all gap-2"
        >
          <div className="flex items-center flex-1 gap-2 px-2.5">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Order ID (ATL-2026-...), Phone, or Email..."
              className="flex-1 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-hidden font-semibold min-w-0"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-black hover:bg-neutral-800 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            <span>{loading ? "Locating..." : "Track Order"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick-Tap Recent Order Chips */}
        {recentOrders.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">
              Recent Dispatch Refs:
            </span>
            {recentOrders.map((ro) => {
              const ref = ro.orderNumber || ro.order_number;
              const isSelected = ref === activeOrderNum;
              return (
                <button
                  key={ref}
                  type="button"
                  onClick={() => handleQuickSelect(ref)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-black text-[#D6FF00] border-black shadow-xs"
                      : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {ref}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Results Timeline Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Header Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-gray-100 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Order Reference
                </span>
                <span className="font-mono text-xs sm:text-sm font-black text-black bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                  {activeOrderNum}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(activeOrderNum, "ref")}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 cursor-pointer"
                  title="Copy Order Reference"
                >
                  {copiedField === "ref" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
                {lastSyncedAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Synced {lastSyncedAt}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                <h2 className="text-lg sm:text-2xl font-black text-gray-950 uppercase tracking-tight">
                  Status: {rawStatus}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isCancelled
                      ? "bg-rose-100 text-rose-700"
                      : currentStep === 5
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-black text-[#D6FF00]"
                  }`}
                >
                  {isCancelled ? "Cancelled" : `${progressPercent}% Complete`}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Placed on{" "}
                {order.date ||
                  (order.createdAt ? order.createdAt.split("T")[0] : "Today")}{" "}
                •{" "}
                {isCancelled
                  ? "Dispatch cancelled"
                  : currentStep === 5
                  ? "Delivered to destination"
                  : "Estimated Delivery: 2–3 Business Days"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={refreshing}
                onClick={() => handleLookup(activeOrderNum, true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>{refreshing ? "Syncing..." : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={() => copyText(shareUrl, "link")}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {copiedField === "link" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>POS Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInvoiceOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-900 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Tax Invoice</span>
              </button>
            </div>
          </div>

          {/* Cancelled Banner OR Visual Milestone Stepper */}
          {isCancelled ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3.5 text-rose-800">
              <XCircle className="w-7 h-7 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Order Cancelled
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  This order has been cancelled and is no longer scheduled for courier dispatch. Contact Atelier Concierge if you need assistance.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Live Dispatch Milestones
                </h3>
                <span className="text-xs font-extrabold text-gray-900">
                  Step {currentStep} of 5
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 pt-2 relative">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isCompleted = currentStep >= st.step;
                  const isCurrent = currentStep === st.step;

                  return (
                    <div
                      key={idx}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-row sm:flex-col items-center text-left sm:text-center gap-3 sm:gap-2 ${
                        isCurrent
                          ? "bg-neutral-950 text-white border-black shadow-md"
                          : isCompleted
                          ? "bg-gray-50/90 border-gray-200 text-gray-900"
                          : "bg-white border-gray-100 text-gray-400 opacity-75"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                          isCurrent
                            ? "bg-[#D6FF00] text-black shadow-xs"
                            : isCompleted
                            ? "bg-black text-[#D6FF00]"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center sm:justify-center gap-1.5">
                          <span
                            className={`text-xs font-extrabold block truncate ${
                              isCurrent
                                ? "text-[#D6FF00]"
                                : isCompleted
                                ? "text-gray-900"
                                : "text-gray-400"
                            }`}
                          >
                            {st.title}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] block ${
                            isCurrent ? "text-neutral-300" : "text-gray-500"
                          }`}
                        >
                          {st.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Telegram Instant Bot Lookup Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-sky-950 uppercase tracking-wide">
                    Track via Telegram Bot
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <p className="text-[11px] text-sky-800">
                  Send{" "}
                  <code className="px-1.5 py-0.5 rounded bg-white border border-sky-200 font-mono font-bold text-sky-950">
                    {telegramCmd}
                  </code>{" "}
                  in Telegram for instant mobile status &amp; courier updates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyText(telegramCmd, "tg")}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {copiedField === "tg" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Command Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {telegramCmd}</span>
                </>
              )}
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 border-t border-gray-100">
            {/* Patron & Destination */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                Destination
              </span>
              <p className="text-xs font-bold text-gray-900">
                {order.customerName || "Patron Client"}
              </p>
              <p className="text-xs text-gray-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>
                  {typeof order.shippingAddress === "string"
                    ? order.shippingAddress
                    : "Preah Norodom Blvd, Phnom Penh, Cambodia"}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 break-all">
                {order.customerEmail}
              </p>
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
                Ref:{" "}
                {order.transactionId ||
                  `TRX-${String(order.id || activeOrderNum).slice(-8)}`}
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
                AWB-882-{activeOrderNum.replace(/\D/g, "") || "90218"}
              </p>
              <p className="text-[11px] text-gray-500">
                Auto-refreshing every 15s
              </p>
            </div>
          </div>

          {/* Purchased Items Overview */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
              Package Contents ({order.items?.length || 0} Pieces)
            </h4>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
              {(order.items || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image || "/user/images/home/product1.jpg"}
                      alt={item.name || "Item"}
                      className="w-12 h-14 object-cover rounded-xl border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.name || item.productName || "Fashion Piece"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Qty: {item.quantity || 1} • Size: {item.size || "M"} •
                        Color: {item.color || "Standard"}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-gray-900 shrink-0">
                    {formatPrice(
                      Number(item.price || 0) * Number(item.quantity || 1)
                    )}
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
