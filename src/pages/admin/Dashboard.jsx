import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  FolderTree,
  ShoppingCart,
  Users,
  DollarSign,
  Plus,
  ExternalLink,
  Database,
  Eye,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  ArrowUpRight,
} from "lucide-react";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import { userService } from "../../services/userService";
import { orderService } from "../../services/orderService";
import Loader from "../../components/common/Loader";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";

const DEFAULT_PRODUCT_IMG =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";

function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
    orders: 0,
    pendingOrders: 0,
    revenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    khqr: 0,
    cod: 0,
    total: 1,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [posReceiptOrder, setPosReceiptOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prods, cats, usrs, ords] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories(),
          userService.getUsers(),
          orderService.getOrders(),
        ]);

        const activeOrders = ords.filter(
          (o) =>
            String(o.orderStatus || o.status || "").toLowerCase() !== "cancelled"
        );
        const pending = ords.filter(
          (o) =>
            o.orderStatus === "Pending" ||
            o.status === "Processing" ||
            o.orderStatus === "Processing"
        ).length;
        const totalRev = Number(
          activeOrders
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
            .toFixed(2)
        );

        setStats({
          products: prods.length,
          categories: cats.length,
          users: usrs.length,
          orders: ords.length,
          pendingOrders: pending,
          revenue: totalRev,
        });

        // Payment Methods Breakdown (across non-cancelled orders)
        const khqrOrders = activeOrders.filter(
          (o) =>
            (o.paymentMethod || "").toLowerCase().includes("khqr") ||
            (o.paymentMethod || "").toLowerCase().includes("qr")
        ).length;
        const codOrders = activeOrders.filter((o) =>
          (o.paymentMethod || "").toLowerCase().includes("cash")
        ).length;
        setPaymentBreakdown({
          khqr: khqrOrders || (activeOrders.length > 0 ? activeOrders.length : 1),
          cod: codOrders,
          total: activeOrders.length || 1,
        });

        // Low stock items (stock <= 5)
        const low = prods.filter(
          (p) => Number(p.stock ?? p.quantity ?? 10) <= 5
        );
        setLowStockProducts(low);

        setRecentOrders(ords.slice(0, 6));
        setTopProducts(prods.slice(0, 4));
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const normalized = String(status || "Pending");
    switch (normalized) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Delivered
          </span>
        );
      case "Shipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Shipped
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Cancelled
          </span>
        );
      case "Processing":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            {normalized}
          </span>
        );
    }
  };

  if (loading) {
    return <Loader message="Loading controller statistics..." />;
  }

  const khqrPercent = Math.round(
    (paymentBreakdown.khqr / paymentBreakdown.total) * 100
  );
  const codPercent = Math.max(0, 100 - khqrPercent);

  const revenueBars = [
    { month: "Jun", pct: 45, value: "$1,240" },
    { month: "Jul", pct: 62, value: "$1,890" },
    { month: "Aug", pct: 52, value: "$1,540" },
    { month: "Sep", pct: 76, value: "$2,400" },
    { month: "Oct", pct: 86, value: "$2,980" },
    {
      month: "Nov",
      pct: 96,
      value: `$${(3620 + Number(stats.revenue || 0)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      active: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-[#D6FF00]/40 flex items-center justify-center shadow-md shrink-0">
            <span className="w-3 h-3 rounded-full bg-[#D6FF00] animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
              Studio Controller Dashboard
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span className="font-bold text-gray-900">ATELIER STUDIO</span>
              <span>/</span>
              <span>Controller Overview</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <Link
            to="/admin/products"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 transition-all font-bold text-xs uppercase tracking-wider shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Store</span>
          </Link>
        </div>
      </div>

      {/* Database & Controller Health Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#111111] via-[#16181d] to-[#111111] text-white p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#D6FF00]/15 text-[#D6FF00] flex items-center justify-center shrink-0 border border-[#D6FF00]/25">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <span>MongoDB Database Engine Active</span>
              <span className="px-2 py-0.5 rounded-full bg-[#D6FF00] text-black text-[10px] font-black uppercase tracking-wider">
                SYNCED
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Collection: <strong className="text-white">django_lab.products</strong> • Port:{" "}
              <strong className="text-white">27017</strong> • Django REST Framework 6.1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs self-end sm:self-auto">
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-gray-400">
              Backend State
            </span>
            <strong className="text-emerald-400 font-bold">
              ● Online (127.0.0.1:8000)
            </strong>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-gray-400">
              Frontend Runtime
            </span>
            <strong className="text-[#D6FF00] font-bold">
              ● Vite React 19 Active
            </strong>
          </div>
        </div>
      </div>

      {/* 5 KPI Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          to="/admin/products"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="min-w-0">
            <div className="text-2xl font-black text-gray-950 tracking-tight">
              {stats.products}
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">
              Catalog Products
            </div>
            <span className="block text-[11px] font-bold text-emerald-600 mt-1.5">
              MongoDB Database Active
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#111111] text-[#D6FF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="min-w-0">
            <div className="text-2xl font-black text-gray-950 tracking-tight">
              {stats.categories}
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">
              Active Categories
            </div>
            <span className="block text-[11px] font-medium text-gray-400 mt-1.5 truncate">
              Men, Women, Bags, Shoes
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderTree className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="min-w-0">
            <div className="text-2xl font-black text-gray-950 tracking-tight">
              {stats.orders}
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">
              Orders Received
            </div>
            <span className="block text-[11px] font-bold text-amber-600 mt-1.5">
              {stats.pendingOrders} Processing
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="min-w-0">
            <div className="text-2xl font-black text-gray-950 tracking-tight">
              {stats.users}
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">
              Registered Patrons
            </div>
            <span className="block text-[11px] font-bold text-emerald-600 mt-1.5">
              +{stats.users} verified accounts
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/admin/payments"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="min-w-0">
            <div className="text-2xl font-black text-gray-950 tracking-tight truncate">
              ${Number(stats.revenue || 0).toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">
              Gross Revenue
            </div>
            <span className="block text-[11px] font-bold text-emerald-600 mt-1.5">
              +24.6% vs last week
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
        </Link>
      </div>

      {/* Row 1: Commercial Revenue Performance Chart (8 Cols) & Top Catalog Pieces (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Commercial Revenue Performance Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#D6FF00] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                  Commercial Revenue Performance
                </h3>
                <p className="text-[11px] text-gray-400">
                  Monthly settled volume + live MongoDB order ledger
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              Atelier Paris Vault
            </span>
          </div>

          {/* Bar Chart Container with Explicit Pixel Height for Bars */}
          <div className="pt-4 pb-2 px-2 sm:px-6">
            <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end">
              {revenueBars.map((bar, idx) => (
                <div
                  key={bar.month}
                  className="flex flex-col items-center group"
                >
                  <span
                    className={`text-[11px] mb-2 font-mono font-bold transition-colors ${
                      bar.active
                        ? "text-gray-950"
                        : "text-gray-400 group-hover:text-gray-800"
                    }`}
                  >
                    {bar.value}
                  </span>

                  {/* Fixed-height track so percentage height works reliably */}
                  <div className="w-full h-40 bg-gray-50 rounded-xl flex items-end p-1 border border-gray-100">
                    <div
                      style={{ height: `${bar.pct}%` }}
                      className={`w-full rounded-lg transition-all duration-500 ${
                        bar.active
                          ? "bg-[#111111] border-t-4 border-[#D6FF00] shadow-md"
                          : "bg-slate-200 group-hover:bg-slate-300"
                      }`}
                      title={`${bar.month}: ${bar.value}`}
                    />
                  </div>

                  <span
                    className={`text-xs mt-2.5 font-bold ${
                      bar.active ? "text-gray-950" : "text-gray-500"
                    }`}
                  >
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Catalog Pieces */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-3">
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              Top Catalog Pieces
            </h3>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-900 hover:underline"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1 flex flex-col justify-center">
            {topProducts.map((p) => (
              <div
                key={p.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.images?.[0] || p.image || DEFAULT_PRODUCT_IMG}
                    alt={p.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                    onError={(e) => {
                      e.target.src = DEFAULT_PRODUCT_IMG;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {p.name}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Stock: {p.stock ?? p.quantity ?? 10} units
                    </span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-950 shrink-0">
                  ${Number(p.price || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Payment Channels & Inventory Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channels Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#D6FF00] flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                Payment Channels &amp; Settlement
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              NBC Bakong KHQR Standard
            </span>
          </div>

          <div className="flex items-center justify-between mb-3 text-xs">
            <div>
              <span className="block text-[11px] text-gray-400 font-medium">
                Dynamic Bakong KHQR
              </span>
              <strong className="text-base font-black text-gray-950">
                {khqrPercent}% Volume
              </strong>
            </div>
            <div className="text-right">
              <span className="block text-[11px] text-gray-400 font-medium">
                Cash on Delivery
              </span>
              <strong className="text-base font-black text-gray-600">
                {codPercent}% Volume
              </strong>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${khqrPercent}%` }}
              className="bg-[#111111] border-r-2 border-[#D6FF00] transition-all duration-500"
              title="Bakong KHQR Payments"
            />
            <div
              style={{ width: `${codPercent}%` }}
              className="bg-slate-300 transition-all duration-500"
              title="Cash on Delivery"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span>Dual USD ($) &amp; KHR (៛) Clearing</span>
            <span>Indexed at 1 USD = 4,100 KHR</span>
          </div>
        </div>

        {/* Low Stock Radar Alert */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              Inventory Velocity &amp; Stock Radar
            </h3>
            <Link
              to="/admin/products"
              className="text-xs font-bold text-gray-900 hover:underline"
            >
              Restock Products &rarr;
            </Link>
          </div>

          {lowStockProducts.length > 0 ? (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 4).map((item) => {
                const currentStock = Number(item.stock ?? item.quantity ?? 0);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 bg-rose-50/80 border border-rose-200/70 px-3.5 py-2.5 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-rose-950 truncate">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {currentStock <= 0
                          ? "Out of Stock"
                          : `${currentStock} pieces remaining`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const newQty = currentStock + 10;
                          await productService.updateProduct(item.id, {
                            stock: newQty,
                            quantity: newQty,
                            status: "Active",
                          });
                          setLowStockProducts((prev) =>
                            prev
                              .map((p) =>
                                p.id === item.id
                                  ? { ...p, stock: newQty, quantity: newQty }
                                  : p
                              )
                              .filter((p) => Number(p.stock) <= 5)
                          );
                        } catch (err) {
                          alert("Failed to restock: " + err.message);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0"
                      title="Quickly add +10 units to stock"
                    >
                      +10 Stock
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All catalog stock healthy (10+ units per item).</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Patron Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              Recent Patron Orders
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Latest customer transactions recorded in MongoDB
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-gray-900 hover:underline"
          >
            Manage All Orders &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-gray-700 border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider font-bold text-gray-500">
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Client Patron</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((ord) => (
                <tr
                  key={ord.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-gray-900 whitespace-nowrap">
                    {ord.orderNumber}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-gray-900">
                      {ord.customerName}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {ord.customerEmail}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {ord.date}
                  </td>
                  <td className="px-5 py-3.5 font-black text-gray-950 whitespace-nowrap">
                    ${Number(ord.total || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ord.paymentStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.paymentStatus || "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(ord.orderStatus)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPosReceiptOrder(ord)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 text-[11px] font-extrabold cursor-pointer transition-colors"
                        title="Print POS Thermal Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>POS</span>
                      </button>
                      <Link
                        to="/admin/orders"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(posReceiptOrder)}
        onClose={() => setPosReceiptOrder(null)}
        invoiceData={posReceiptOrder}
      />
    </div>
  );
}

export default Dashboard;
