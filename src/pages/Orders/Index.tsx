import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle2,
  Printer,
  RotateCcw,
  XCircle,
  Truck,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useUIStore } from "../../store/useUIStore";
import { PRODUCTS } from "../../data/products";
import { orderService } from "../../services/orderService";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { useCurrencyStore } from "../../store/useCurrencyStore";

const ORDER_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const getStepIndex = (status: string): number => {
  const s = String(status || "").trim().toLowerCase();
  if (s === "delivered" || s === "completed") return 3;
  if (s === "shipped" || s === "in transit" || s === "dispatched") return 2;
  if (s === "processing" || s === "confirmed") return 1;
  return 0;
};

export const Orders: React.FC = () => {
  const { user, isAuthenticated, orders: storeOrders } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const { addToCart } = useCartStore();
  const { showToast, openCartDrawer } = useUIStore();
  const { formatPrice } = useCurrencyStore();

  const syncOrders = async () => {
    if (!user?.email) {
      setOrders([]);
      return;
    }
    try {
      const customerOrders = await orderService.getOrdersByCustomer(user.email);
      setOrders(customerOrders || []);
    } catch (e) {
      console.warn("Could not sync customer orders:", e);
    }
  };

  useEffect(() => {
    syncOrders();

    const handleSync = () => syncOrders();
    window.addEventListener("atelier_order_updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("atelier_order_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [storeOrders, user?.email]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: "/orders" }} replace />;
  }

  const handleReorder = (item: any) => {
    const prod = PRODUCTS.find((p) => p.id === (item.productId || item.id)) || PRODUCTS[0];
    addToCart(prod, item.quantity || 1, item.size || "M");
    showToast(`Added "${item.productName || item.name}" to your bag`, "success", item.image);
    openCartDrawer();
  };

  const handleBuyOrderAgain = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return;
    items.forEach((item: any) => {
      const prod =
        PRODUCTS.find((p) => p.id === (item.productId || item.id)) || {
          ...PRODUCTS[0],
          id: String(item.productId || item.id || Date.now()),
          name: item.productName || item.name || "Fashion Piece",
          price: Number(item.price || 0),
          images: [item.image || PRODUCTS[0].images[0]],
        };
      addToCart(prod, item.quantity || 1, item.size || "M");
    });
    showToast(
      `Added all ${items.length} item(s) from #${order.orderNumber} to your bag`,
      "success"
    );
    openCartDrawer();
  };

  const handleCancelOrder = async (order: any) => {
    const ref = order.orderNumber || order.order_number || order.id;
    if (!window.confirm(`Cancel order #${ref}?`)) return;
    try {
      await orderService.updateOrderStatus(ref, "Cancelled");
      showToast(`Order #${ref} has been cancelled`, "info");
      syncOrders();
    } catch {
      showToast("Unable to cancel order right now", "error");
    }
  };

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold uppercase mb-2">No Previous Orders Found</h2>
        <p className="text-xs text-gray-500 mb-6">
          You haven't placed any runway orders yet. Browse our collections and discover everyday luxury.
        </p>
        <Link
          to="/shop"
          className="px-8 py-3 bg-black text-[#D6FF00] font-black text-xs uppercase rounded-full tracking-widest inline-block"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
          Patron Vault
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase">
          Order History ({orders.length})
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">
          Review dispatch statuses, courier tracking, and reorder bespoke pieces.
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => {
          const status = order.orderStatus || order.status || "Processing";
          const totalVal = Number(order.total || 0);
          const orderDate = order.date || (order.createdAt ? order.createdAt.split("T")[0] : "Recently");

          return (
            <div
              key={order.id || order.orderNumber}
              className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-5"
            >
              {/* Order Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black text-[#D6FF00] flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-black block">
                      {order.orderNumber || order.order_number}
                    </strong>
                    <span className="text-[11px] text-gray-400">
                      Placed on {orderDate}
                    </span>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Link
                    to={`/track/${order.orderNumber || order.order_number}`}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 hover:border-black text-gray-800 hover:text-black font-bold text-xs uppercase tracking-wider transition-colors"
                    title="Live Shipment Tracking"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleBuyOrderAgain(order)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    title="Add all items from this order back to your shopping bag"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Buy Again</span>
                  </button>

                  {status.toLowerCase() === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      title="Cancel Pending Order"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setReceiptOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-[#D6FF00] hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    title="Print POS Thermal Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>POS Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 hover:border-black text-gray-700 hover:text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    title="Official Tax Invoice & Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      status === "Delivered"
                        ? "bg-emerald-50 text-emerald-700"
                        : status === "Cancelled"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {status === "Delivered" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : status === "Cancelled" ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{status}</span>
                  </span>
                  <span className="font-extrabold text-sm text-black">
                    {formatPrice(totalVal)}
                  </span>
                </div>
              </div>

              {/* Live 4-Step Order Progress Timeline */}
              {status.toLowerCase() !== "cancelled" && (
                <div className="px-4 py-3.5 rounded-2xl bg-neutral-50 border border-gray-100">
                  <div className="flex items-center justify-between relative">
                    {ORDER_STEPS.map((stepName, sIdx) => {
                      const activeStep = getStepIndex(status);
                      const isDone = sIdx <= activeStep;
                      const isCurrent = sIdx === activeStep;
                      return (
                        <React.Fragment key={stepName}>
                          <div className="flex flex-col items-center gap-1 z-10">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                isDone
                                  ? "bg-black text-[#D6FF00] shadow-xs"
                                  : "bg-gray-200 text-gray-400"
                              } ${isCurrent ? "ring-2 ring-black ring-offset-2" : ""}`}
                            >
                              {isDone ? "✓" : sIdx + 1}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-bold ${
                                isDone ? "text-black" : "text-gray-400"
                              }`}
                            >
                              {stepName}
                            </span>
                          </div>
                          {sIdx < ORDER_STEPS.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                                sIdx < activeStep ? "bg-black" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-3">
                {(order.items || []).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80"
                        }
                        alt={item.productName || item.name || "Product"}
                        className="w-12 h-16 object-cover rounded-xl bg-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-black truncate">
                          {item.productName || item.name || "Fashion Piece"}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Size: {item.size || "M"} • Color: {item.color || "Standard"} • Qty: {item.quantity || 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-bold text-black">
                        {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                      </span>
                      <button
                        onClick={() => handleReorder(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-black text-[#D6FF00] font-bold text-[11px] uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
                <div>
                  <span className="font-semibold text-gray-700">Payment: </span>
                  <span>{order.paymentMethod || "Bakong KHQR"}</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold text-emerald-600 font-bold">{order.paymentStatus || "Paid"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Destination: </span>
                  <span>
                    {typeof order.shippingAddress === "string"
                      ? order.shippingAddress
                      : order.shippingAddress?.street
                      ? `${order.shippingAddress.street}, ${order.shippingAddress.city}`
                      : "Phnom Penh, Cambodia"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Tax Invoice & Print Receipt Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceOrder)}
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* POS Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        invoiceData={receiptOrder}
      />
    </div>
  );
};
