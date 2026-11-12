import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  Receipt,
  DollarSign,
  Database,
  Search,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { khqrService } from "../../services/khqrService";

export function ManagePayments() {
  const cachedPayments = khqrService.getCachedPayments();
  const [payments, setPayments] = useState(cachedPayments);
  const [gatewayInfo, setGatewayInfo] = useState(null);
  const [loading, setLoading] = useState(cachedPayments.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [posReceiptData, setPosReceiptData] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingPending, setIsClearingPending] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadPayments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [payList, gwInfo] = await Promise.allSettled([
        khqrService.getPayments(),
        khqrService.getGatewayStatus(),
      ]);

      if (payList.status === "fulfilled" && Array.isArray(payList.value)) {
        setPayments(payList.value);
      }
      if (gwInfo.status === "fulfilled" && gwInfo.value) {
        setGatewayInfo(gwInfo.value);
      }
    } catch (e) {
      console.error("Failed loading payments ledger:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments(cachedPayments.length > 0);
  }, [loadPayments]);

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerifyPayment = async (payment) => {
    const targetKey = payment.md5_hash || payment.order_number || payment.id;
    if (!targetKey) return;

    setVerifyingId(targetKey);
    try {
      const res = await khqrService.verifyPayment(targetKey);
      if (res.is_paid || res.success) {
        showNotification(
          `Verified PAID! Bakong Ref: ${res.transaction_id || "CONFIRMED"}`
        );
        await loadPayments(true);
      } else {
        showNotification(
          res.message || "Payment is still PENDING on NBC Bakong network."
        );
      }
    } catch {
      showNotification("Could not verify with NBC Bakong API right now.");
    } finally {
      setVerifyingId(null);
    }
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    try {
      await khqrService.deletePayment(paymentToDelete);
      const targetId = paymentToDelete.id;
      const targetMd5 = paymentToDelete.md5_hash;
      const targetOrder = paymentToDelete.order_number;

      setPayments((prev) =>
        prev.filter((p) => {
          if (targetId && p.id === targetId) return false;
          if (targetMd5 && p.md5_hash === targetMd5) return false;
          if (!targetId && !targetMd5 && targetOrder && p.order_number === targetOrder) {
            return false;
          }
          return true;
        })
      );
      showNotification(
        `Deleted KHQR record ${targetOrder || targetMd5?.slice(0, 8) || ""} from ledger.`
      );
      setPaymentToDelete(null);
    } catch {
      showNotification("Failed to delete payment record from Supabase.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearPending = async () => {
    if (!pendingPayments.length) return;
    if (
      !window.confirm(
        `Remove all ${pendingPayments.length} uncompleted PENDING QR records from the ledger?`
      )
    ) {
      return;
    }
    setIsClearingPending(true);
    try {
      await khqrService.clearPendingPayments(pendingPayments);
      setPayments((prev) =>
        prev.filter((p) => String(p.status || "PENDING").toUpperCase() !== "PENDING")
      );
      showNotification(`Cleared ${pendingPayments.length} pending KHQR records.`);
    } catch {
      showNotification("Could not clear pending KHQR records.");
    } finally {
      setIsClearingPending(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const st = String(p.status || "PENDING").toUpperCase();
    if (statusFilter !== "all" && st !== statusFilter.toUpperCase()) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(p.order_number || "").toLowerCase().includes(q) ||
      String(p.md5_hash || "").toLowerCase().includes(q) ||
      String(p.transaction_id || "").toLowerCase().includes(q) ||
      String(p.customer_name || "").toLowerCase().includes(q)
    );
  });

  const paidPayments = payments.filter(
    (p) => String(p.status || "").toUpperCase() === "PAID"
  );
  const pendingPayments = payments.filter(
    (p) => String(p.status || "PENDING").toUpperCase() === "PENDING"
  );
  const settledUsdVolume = paidPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      showNotification("No payment records to export.");
      return;
    }
    const headers = [
      "Order Number",
      "Customer Name",
      "Phone",
      "Amount (USD)",
      "KHR Equivalent",
      "Currency",
      "Status",
      "MD5 Hash",
      "Bakong Transaction ID",
      "Created At",
    ];
    const escapeCSV = (val) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = filteredPayments.map((p) => {
      const usdAmount = Number(p.amount) || 0;
      const khrAmount = Math.round(usdAmount * 4100);
      return [
        escapeCSV(p.order_number || p.id || ""),
        escapeCSV(p.customer_name || "Guest Client"),
        escapeCSV(p.customer_phone || ""),
        escapeCSV(usdAmount.toFixed(2)),
        escapeCSV(khrAmount),
        escapeCSV(p.currency || "USD"),
        escapeCSV(String(p.status || "PENDING").toUpperCase()),
        escapeCSV(p.md5_hash || ""),
        escapeCSV(p.transaction_id || ""),
        escapeCSV(p.created_at || p.paid_at || ""),
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `bakong-khqr-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Exported ${filteredPayments.length} KHQR ledger records to CSV!`);
  };

  if (loading && payments.length === 0) {
    return <Loader message="Loading NBC Bakong KHQR payment ledger..." />;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#D6FF00] shrink-0" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 mb-1 flex-wrap">
            <Link to="/admin/dashboard" className="hover:text-black font-semibold">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">Bakong KHQR Ledger</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              NBC Open API Active
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            Bakong KHQR Payment Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Audit EMVCo MD5 hashes, verify real-time bank settlements, and print POS receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {pendingPayments.length > 0 && (
            <button
              type="button"
              disabled={isClearingPending}
              onClick={handleClearPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Delete all uncompleted PENDING QR records"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {isClearingPending
                  ? "Clearing..."
                  : `Clear Pending (${pendingPayments.length})`}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => loadPayments(true)}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="truncate">{isRefreshing ? "Refreshing..." : "Refresh Ledger"}</span>
          </button>
        </div>
      </div>

      {/* NBC Bakong Gateway Banner */}
      <div className="bg-gradient-to-r from-[#E1232E] to-[#b51620] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 shadow-md">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25 shrink-0">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-base tracking-tight">
                {gatewayInfo?.gateway || "National Bank of Cambodia (NBC) Bakong KHQR"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#E1232E] font-black text-[9px] sm:text-[10px] uppercase">
                LIVE VERIFICATION
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-white/85 mt-0.5 break-words">
              Merchant: <strong>{gatewayInfo?.merchant_name || "Rayou Va"}</strong> (
              <code className="bg-black/20 px-1.5 py-0.5 rounded">
                {gatewayInfo?.merchant_account || "rayou_va@bkrt"}
              </code>
              ) • {gatewayInfo?.emvco_specification || "EMVCo Universal QR"}
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/15 sm:border-0 flex sm:block items-center justify-between text-left sm:text-right text-xs">
          <span className="block text-white/75 text-[10px] uppercase">Endpoint</span>
          <code className="font-mono font-bold text-[11px] sm:text-xs">
            {gatewayInfo?.api_endpoint || "https://api-bakong.nbc.gov.kh"}
          </code>
        </div>
      </div>

      {/* Metrics Row (2x2 on phones, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              QR Generated
            </span>
            <span className="text-lg sm:text-xl font-black text-gray-950 mt-0.5 sm:mt-1 block">
              {payments.length}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              Verified Paid
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 sm:mt-1 block">
              {paidPayments.length}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              Awaiting Scan
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 sm:mt-1 block">
              {pendingPayments.length}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              Settled Volume
            </span>
            <span className="text-lg sm:text-xl font-black text-gray-950 mt-0.5 sm:mt-1 block truncate">
              ${settledUsdVolume.toFixed(2)}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, MD5 hash, or Bank Txn ID..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-hidden focus:border-black"
          />
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          {["all", "PAID", "PENDING"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-center ${
                statusFilter === st
                  ? "bg-black text-[#D6FF00]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st === "all" ? "All" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Container: Mobile Card List (< md) + Full Table (>= md) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-gray-400">
            No KHQR payment records match your filter.
          </div>
        ) : (
          <>
            {/* 1. Mobile Card View (< md screens) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredPayments.map((pay, idx) => {
                const isPaid = String(pay.status || "").toUpperCase() === "PAID";
                const keyId = pay.md5_hash || pay.order_number || idx;
                const amt = Number(pay.amount || 0);
                return (
                  <div
                    key={keyId}
                    className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Top Row: Order # & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                        {pay.order_number || "N/A"}
                      </span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{pay.status || "PENDING"}</span>
                        </span>
                      )}
                    </div>

                    {/* Middle Row: Patron & Amount */}
                    <div className="flex items-center justify-between gap-2 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-xs truncate">
                          {pay.customer_name || "Patron Client"}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {pay.customer_phone || pay.customer_email || "Bakong KHQR"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <strong className="text-gray-950 font-black text-sm block">
                          ${amt.toFixed(2)} {pay.currency || "USD"}
                        </strong>
                        <span className="block text-[10px] text-gray-400">
                          ៛ {Math.round(amt * 4100).toLocaleString()} KHR
                        </span>
                      </div>
                    </div>

                    {/* Hash & Bank Txn Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          MD5 Hash
                        </span>
                        {pay.md5_hash ? (
                          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">
                            <span>{String(pay.md5_hash).slice(0, 12)}...</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(pay.md5_hash)}
                              className="text-gray-500 hover:text-black cursor-pointer p-0.5"
                              title="Copy full MD5 hash"
                            >
                              {copiedHash === pay.md5_hash ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Bank Ref
                        </span>
                        <span className="font-mono text-[11px] text-gray-700 truncate max-w-[200px]">
                          {pay.transaction_id || (isPaid ? "BAKONG-VERIFIED" : "Awaiting Scan")}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      className={`grid ${
                        !isPaid ? "grid-cols-3" : "grid-cols-2"
                      } gap-2 pt-2 border-t border-gray-100`}
                    >
                      {!isPaid && (
                        <button
                          type="button"
                          disabled={verifyingId === keyId}
                          onClick={() => handleVerifyPayment(pay)}
                          className="py-2 px-2.5 rounded-xl bg-[#E1232E] hover:bg-[#c51b25] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 shrink-0 ${
                              verifyingId === keyId ? "animate-spin" : ""
                            }`}
                          />
                          <span className="truncate">Verify API</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setPosReceiptData({
                            orderNumber: pay.order_number,
                            customerName: pay.customer_name || "Walk-In Patron",
                            total: amt,
                            subtotal: amt,
                            tax: 0,
                            paymentMethod: "Bakong KHQR",
                            paymentStatus: isPaid ? "Paid" : "Pending",
                            transactionId: pay.transaction_id || pay.md5_hash,
                            createdAt: pay.paid_at || pay.created_at,
                            items: [
                              {
                                name: `Bakong KHQR Settlement (${pay.order_number})`,
                                quantity: 1,
                                price: amt,
                              },
                            ],
                          })
                        }
                        className="py-2 px-2.5 rounded-xl bg-neutral-900 hover:bg-black text-[#D6FF00] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Receipt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentToDelete(pay)}
                        className="py-2 px-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Full Table View (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Patron</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">MD5 Hash</th>
                    <th className="py-3.5 px-4">Bank Txn Ref</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredPayments.map((pay, idx) => {
                    const isPaid = String(pay.status || "").toUpperCase() === "PAID";
                    const keyId = pay.md5_hash || pay.order_number || idx;
                    const amt = Number(pay.amount || 0);
                    return (
                      <tr key={keyId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          {pay.order_number || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            {pay.customer_name || "Patron Client"}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {pay.customer_phone || pay.customer_email || "Bakong KHQR"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <strong className="text-gray-950 font-black">
                            ${amt.toFixed(2)} {pay.currency || "USD"}
                          </strong>
                          <span className="block text-[10px] text-gray-400">
                            ៛ {Math.round(amt * 4100).toLocaleString()} KHR
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {pay.md5_hash ? (
                            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                              <span>{String(pay.md5_hash).slice(0, 10)}...</span>
                              <button
                                type="button"
                                onClick={() => handleCopyHash(pay.md5_hash)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                                title="Copy full MD5 hash"
                              >
                                {copiedHash === pay.md5_hash ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-700">
                          {pay.transaction_id || (isPaid ? "BAKONG-VERIFIED" : "Awaiting Scan")}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>PAID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>{pay.status || "PENDING"}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <button
                                type="button"
                                disabled={verifyingId === keyId}
                                onClick={() => handleVerifyPayment(pay)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#E1232E] hover:bg-[#c51b25] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Check live settlement status on NBC Bakong API"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${
                                    verifyingId === keyId ? "animate-spin" : ""
                                  }`}
                                />
                                <span>Verify API</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setPosReceiptData({
                                  orderNumber: pay.order_number,
                                  customerName: pay.customer_name || "Walk-In Patron",
                                  total: amt,
                                  subtotal: amt,
                                  tax: 0,
                                  paymentMethod: "Bakong KHQR",
                                  paymentStatus: isPaid ? "Paid" : "Pending",
                                  transactionId: pay.transaction_id || pay.md5_hash,
                                  createdAt: pay.paid_at || pay.created_at,
                                  items: [
                                    {
                                      name: `Bakong KHQR Settlement (${pay.order_number})`,
                                      quantity: 1,
                                      price: amt,
                                    },
                                  ],
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-[#D6FF00] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Print POS Thermal Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>POS</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentToDelete(pay)}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete KHQR Ledger Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Confirm Delete KHQR Record Modal */}
      <Modal
        isOpen={Boolean(paymentToDelete)}
        onClose={() => !isDeleting && setPaymentToDelete(null)}
        title="Delete KHQR Ledger Record"
        size="sm"
      >
        {paymentToDelete && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-black uppercase tracking-wide">
                  Permanent Ledger Removal
                </p>
                <p className="text-rose-700">
                  Are you sure you want to delete this Bakong KHQR payment record from Supabase?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold">Order Ref:</span>
                <span className="font-mono font-black text-gray-900">
                  {paymentToDelete.order_number || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold">Patron:</span>
                <span className="font-bold text-gray-900">
                  {paymentToDelete.customer_name || "Patron Client"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold">Amount:</span>
                <span className="font-black text-gray-950">
                  ${Number(paymentToDelete.amount || 0).toFixed(2)}{" "}
                  {paymentToDelete.currency || "USD"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold">Status:</span>
                <span className="font-bold uppercase text-gray-800">
                  {paymentToDelete.status || "PENDING"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPaymentToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeletePayment}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete Record"}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* POS Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(posReceiptData)}
        onClose={() => setPosReceiptData(null)}
        invoiceData={posReceiptData}
      />
    </div>
  );
}

export default ManagePayments;

