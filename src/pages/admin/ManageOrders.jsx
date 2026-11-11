import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
  ShoppingBag,
  RefreshCw,
  DollarSign,
  Trash2,
  Database,
  Printer,
  Receipt,
  FileText,
  Download,
} from "lucide-react";
import { orderService } from "../../services/orderService";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { PosCounterModal } from "../../components/admin/PosCounterModal";

export function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [posReceiptOrder, setPosReceiptOrder] = useState(null);
  const [isPosCounterOpen, setIsPosCounterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportCSV = () => {
    const listToExport = filteredOrders.length > 0 ? filteredOrders : orders;
    if (listToExport.length === 0) {
      alert("No customer orders available to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Shipping Address",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Subtotal (USD)",
      "Shipping Fee (USD)",
      "Tax (USD)",
      "Total (USD)",
      "Total (KHR)",
      "Items Count",
      "Items Summary",
    ];

    const escapeCell = (val) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = listToExport.map((o) => {
      const itemsList = Array.isArray(o.items) ? o.items : [];
      const itemsSummary = itemsList
        .map((i) => `${i.name || i.productName || "Fashion Piece"} (x${i.quantity || 1})`)
        .join("; ");
      const totalUSD = Number(o.total || 0);
      const totalKHR = Math.round(totalUSD * 4100);

      return [
        escapeCell(o.orderNumber || o.id),
        escapeCell(o.date || (o.createdAt ? o.createdAt.split("T")[0] : "")),
        escapeCell(o.customerName || o.shippingAddress?.fullName || "Patron Client"),
        escapeCell(o.customerEmail || "patron@atelier.com"),
        escapeCell(o.customerPhone || ""),
        escapeCell(typeof o.shippingAddress === "string" ? o.shippingAddress : (o.shippingAddress?.street || "")),
        escapeCell(o.paymentMethod || "Bakong KHQR"),
        escapeCell(o.paymentStatus || "Paid"),
        escapeCell(o.orderStatus || o.status || "Processing"),
        escapeCell(Number(o.subtotal || totalUSD).toFixed(2)),
        escapeCell(Number(o.shippingFee || o.shipping || 0).toFixed(2)),
        escapeCell(Number(o.tax || 0).toFixed(2)),
        escapeCell(totalUSD.toFixed(2)),
        escapeCell(totalKHR.toLocaleString()),
        escapeCell(itemsList.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)),
        escapeCell(itemsSummary),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `Atelier_Orders_Financial_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Exported ${listToExport.length} orders to CSV successfully`);
  };

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const list = await orderService.getOrders();
      setOrders(list || []);
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    orderService
      .getOrders()
      .then((list) => {
        if (active) setOrders(list || []);
      })
      .catch((e) => console.error("Failed to load orders:", e))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleSync = () => {
      loadOrders(true);
    };

    window.addEventListener("atelier_order_updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      active = false;
      window.removeEventListener("atelier_order_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadOrders]);

  const handleDeleteOrder = async (targetId) => {
    if (!window.confirm(`Permanently remove order #${targetId}?`)) return;
    try {
      await orderService.deleteOrder(targetId);
      showNotification(`Order #${targetId} deleted`);
      loadOrders(true);
    } catch {
      alert("Failed to delete order");
    }
  };

  const handleSyncMongo = async () => {
    try {
      setIsRefreshing(true);
      await orderService.syncMongoDB();
      showNotification("Orders & Payments synchronized with MongoDB (django_lab)");
      await loadOrders(true);
    } catch {
      alert("Failed syncing with MongoDB");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (targetId, newStatus) => {
    try {
      await orderService.updateOrderStatus(targetId, newStatus);
      showNotification(`Order #${targetId} status updated to ${newStatus}`);
      await loadOrders(true);
      if (selectedOrder && (selectedOrder.id === targetId || selectedOrder.orderNumber === targetId)) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          status: newStatus,
          ...(newStatus === "Delivered" ? { paymentStatus: "Paid" } : {}),
        }));
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    const currentStatus = o.orderStatus || o.status || "Pending";
    return currentStatus.toLowerCase() === statusFilter.toLowerCase();
  });

  // Calculate live stats
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingProcessingCount = orders.filter((o) => {
    const s = (o.orderStatus || o.status || "").toLowerCase();
    return s === "pending" || s === "processing";
  }).length;

  const getStatusBadge = (status) => {
    const s = status || "Pending";
    switch (s) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Delivered</span>
          </span>
        );
      case "Shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span>Shipped</span>
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Processing</span>
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const columns = [
    {
      title: "Order ID",
      key: "orderNumber",
      width: 140,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
          {item.orderNumber || `#${String(item.id || item._id).slice(-8).toUpperCase()}`}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customerName",
      render: (item) => (
        <div>
          <div className="font-bold text-gray-900 text-xs sm:text-sm">
            {item.customerName || item.shippingAddress?.fullName || "Patron Client"}
          </div>
          <span className="text-[11px] text-gray-500">
            {item.customerEmail || "patron@atelier.com"}
          </span>
        </div>
      ),
    },
    {
      title: "Date",
      key: "date",
      width: 110,
      render: (item) => (
        <span className="text-xs text-gray-600">
          {item.date || (item.createdAt ? item.createdAt.split("T")[0] : "Today")}
        </span>
      ),
    },
    {
      title: "Total Amount",
      key: "total",
      width: 120,
      render: (item) => (
        <strong className="text-gray-950 font-bold text-sm sm:text-base">
          ${Number(item.total || 0).toFixed(2)}
        </strong>
      ),
    },
    {
      title: "Payment",
      key: "paymentStatus",
      render: (item) => (
        <div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
              item.paymentStatus === "Paid"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {item.paymentStatus || "Authorized"}
          </span>
          <span className="block text-[11px] text-gray-500 mt-0.5 font-medium">
            {item.paymentMethod || "Bakong KHQR"}
          </span>
        </div>
      ),
    },
    {
      title: "Order Status",
      key: "orderStatus",
      render: (item) => (
        <select
          value={item.orderStatus || item.status || "Pending"}
          onChange={(e) => handleStatusChange(item.id || item.orderNumber, e.target.value)}
          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:border-black focus:outline-hidden cursor-pointer"
        >
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      ),
    },
  ];

  if (loading) {
    return <Loader message="Loading customer orders..." />;
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
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 mb-1 flex-wrap">
            <Link to="/admin/dashboard" className="hover:text-black font-semibold">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">Commerce</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              MongoDB Online
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            Customer Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track runway order statuses, dispatch shipments, and review client transactions.
          </p>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPosCounterOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#D6FF00] hover:bg-[#c5ec00] text-black font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title="Launch In-Store POS Counter Terminal"
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">New POS Sale</span>
            </button>

            <button
              type="button"
              onClick={handleSyncMongo}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Force Synchronize with MongoDB"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Sync MongoDB</span>
            </button>

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-700 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? "animate-spin text-[#D6FF00]" : ""}`} />
              <span className="truncate">{isRefreshing ? "Syncing..." : "Sync Orders"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shadow-xs"
              title="Download CSV spreadsheet report"
            >
              <Download className="w-3.5 h-3.5 text-[#D6FF00] shrink-0" />
              <span className="truncate">Export CSV</span>
            </button>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-gray-50 px-3.5 py-2.5 sm:py-2 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-600 shrink-0">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-gray-900 focus:outline-hidden cursor-pointer flex-1 sm:flex-initial text-right sm:text-left"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Row (3 compact cards side-by-side on mobile & desktop) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              Total
            </span>
            <span className="text-base sm:text-xl font-black text-gray-950 mt-0.5 sm:mt-1 block truncate">
              {orders.length} <span className="hidden sm:inline">Orders</span>
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center font-bold shrink-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              Active
            </span>
            <span className="text-base sm:text-xl font-black text-amber-600 mt-0.5 sm:mt-1 block truncate">
              {pendingProcessingCount} <span className="hidden sm:inline">Orders</span>
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block truncate">
              Revenue
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-600 mt-0.5 sm:mt-1 block truncate">
              ${totalRevenue.toFixed(0)}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        searchKey="customerName"
        searchPlaceholder="Search by customer name or email..."
        itemsPerPage={7}
        renderMobileCard={(item) => {
          const orderNum =
            item.orderNumber || `#${String(item.id || item._id).slice(-8).toUpperCase()}`;
          const orderDate =
            item.date || (item.createdAt ? item.createdAt.split("T")[0] : "Today");

          return (
            <div className="space-y-3">
              {/* Top Row: Order Number + Date + Total */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                    {orderNum}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {orderDate}
                  </span>
                </div>
                <strong className="text-base font-black text-gray-950 shrink-0">
                  ${Number(item.total || 0).toFixed(2)}
                </strong>
              </div>

              {/* Middle Row: Patron + Payment Badge */}
              <div className="flex items-center justify-between gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-xs truncate">
                    {item.customerName || item.shippingAddress?.fullName || "Patron Client"}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {item.customerEmail || "patron@atelier.com"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      item.paymentStatus === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.paymentStatus || "Authorized"}
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-0.5 font-medium">
                    {item.paymentMethod || "Bakong KHQR"}
                  </span>
                </div>
              </div>

              {/* Order Status Selector Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Order Status
                </span>
                <select
                  value={item.orderStatus || item.status || "Pending"}
                  onChange={(e) => handleStatusChange(item.id || item.orderNumber, e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:border-black focus:outline-hidden cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Action Buttons Bar */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPosReceiptOrder(item)}
                  className="py-2 px-2 rounded-xl bg-neutral-900 hover:bg-black text-[#D6FF00] font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(item);
                    setIsViewModalOpen(true);
                  }}
                  className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-700 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(item)}
                  className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-700 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(item.id || item.orderNumber)}
                  className="py-2 px-2 rounded-xl bg-red-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        }}
        renderActions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-[#D6FF00] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Print POS Thermal Receipt"
              onClick={() => setPosReceiptOrder(item)}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>POS</span>
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-700 transition-colors cursor-pointer"
              title="Inspect Order Breakdown"
              onClick={() => {
                setSelectedOrder(item);
                setIsViewModalOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-700 transition-colors cursor-pointer"
              title="Print Official Tax Invoice"
              onClick={() => setInvoiceOrder(item)}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Delete Order"
              onClick={() => handleDeleteOrder(item.id || item.orderNumber)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth={640}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-gray-900">
                Order #{selectedOrder?.orderNumber || selectedOrder?.id}
              </div>
              <span className="text-xs text-gray-500 font-normal">
                Placed on {selectedOrder?.date || (selectedOrder?.createdAt ? selectedOrder?.createdAt.split("T")[0] : "Today")}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setPosReceiptOrder(selectedOrder);
              }}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-[#D6FF00] hover:bg-black font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>POS Thermal Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInvoiceOrder(selectedOrder);
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs text-gray-700">
            {/* Status & Patron Summary */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[11px]">Patron Client:</span>
                <strong className="text-gray-900 font-bold block">{selectedOrder.customerName}</strong>
                <span className="text-gray-500 text-[11px] block">{selectedOrder.customerEmail}</span>
                {selectedOrder.customerPhone && (
                  <span className="text-gray-500 text-[11px] block">{selectedOrder.customerPhone}</span>
                )}
                {selectedOrder.shippingAddress && (
                  <span className="text-gray-500 text-[10px] block mt-1">{selectedOrder.shippingAddress}</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Delivery Status:</span>
                <div className="mt-1">{getStatusBadge(selectedOrder.orderStatus || selectedOrder.status)}</div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <span className="text-xs font-bold text-gray-900 block mb-2 uppercase tracking-wider">
                Purchased Pieces
              </span>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80"
                          }
                          alt={item.name || item.productName || "Product"}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                        <div>
                          <strong className="block text-gray-900 text-xs">
                            {item.name || item.productName || "Fashion Piece"}
                          </strong>
                          <span className="text-[11px] text-gray-500">
                            Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ""}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">${Number(item.price || 0).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">Runway package details logged</div>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-3.5 rounded-xl bg-neutral-900 text-white space-y-2">
              <div className="flex justify-between text-neutral-300">
                <span>Payment Method</span>
                <span className="font-semibold text-white">{selectedOrder.paymentMethod || "Bakong KHQR"}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Payment Status</span>
                <span className="text-[#D6FF00] font-bold">{selectedOrder.paymentStatus || "Paid"}</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between font-black text-sm">
                <span>Total Amount</span>
                <span className="text-[#D6FF00]">${Number(selectedOrder.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Tax Invoice & Print Receipt Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceOrder)}
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* POS Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(posReceiptOrder)}
        onClose={() => setPosReceiptOrder(null)}
        invoiceData={posReceiptOrder}
      />

      {/* In-Store POS Counter Sale Modal */}
      <PosCounterModal
        isOpen={isPosCounterOpen}
        onClose={() => setIsPosCounterOpen(false)}
        onOrderCompleted={(newOrder) => {
          loadOrders(true);
          setPosReceiptOrder(newOrder);
          showNotification(`POS Order #${newOrder.orderNumber} completed & receipt printed`);
        }}
      />
    </div>
  );
}

export default ManageOrders;
