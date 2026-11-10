import { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Banknote,
  QrCode,
  Receipt,
  User,
  Phone,
  Loader2,
} from "lucide-react";
import { productService } from "../../services/productService";
import { orderService } from "../../services/orderService";
import { khqrService } from "../../services/khqrService";
import { KhqrPaymentModal } from "../checkout/KhqrPaymentModal";

export function PosCounterModal({ isOpen, onClose, onOrderCompleted }) {
  const [products, setProducts] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-In Patron");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "khqr"
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KHQR modal state for in-store QR scan
  const [khqrData, setKhqrData] = useState(null);
  const [isKhqrOpen, setIsKhqrOpen] = useState(false);
  const [pendingOrderNumber, setPendingOrderNumber] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    productService
      .getProducts()
      .then((list) => {
        if (active) setProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("POS catalog load error:", err);
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const loadingProducts = isOpen && products === null;

  const filteredProducts = useMemo(() => {
    const catalogList = products || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalogList;
    return catalogList.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const addToCart = (product) => {
    const maxStock = Number(product.stock ?? product.quantity ?? 10);
    if (maxStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((it) => String(it.id) === String(product.id));
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        return prev.map((it) =>
          String(it.id) === String(product.id)
            ? { ...it, quantity: it.quantity + 1 }
            : it
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image: product.image,
          stock: maxStock,
          quantity: 1,
          size: "M",
          color: "Standard",
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (String(it.id) !== String(id)) return it;
          const nextQty = Math.min(it.stock || 99, it.quantity + delta);
          return nextQty > 0 ? { ...it, quantity: nextQty } : null;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((it) => String(it.id) !== String(id)));
  };

  const subtotal = useMemo(
    () =>
      Math.round(
        cart.reduce((sum, it) => sum + it.price * it.quantity, 0) * 100
      ) / 100,
    [cart]
  );
  const tax = useMemo(() => Math.round(subtotal * 0.08 * 100) / 100, [subtotal]);
  const total = useMemo(
    () => Math.round((subtotal + tax) * 100) / 100,
    [subtotal, tax]
  );

  const finalizePosOrder = async (methodLabel, paymentStatusLabel, txnId = "") => {
    setIsSubmitting(true);
    try {
      const orderNum =
        pendingOrderNumber ||
        `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const created = await orderService.createOrder({
        orderNumber: orderNum,
        customerName: customerName.trim() || "Walk-In Patron",
        customerEmail: "pos-counter@atelier.com",
        customerPhone: customerPhone.trim(),
        shippingAddress: "In-Store POS Counter Pickup • Phnom Penh",
        items: cart,
        subtotal,
        shippingFee: 0,
        tax,
        total,
        paymentMethod: methodLabel,
        paymentStatus: paymentStatusLabel,
        orderStatus: "Delivered",
        transactionId: txnId,
        cashier: "POS-ADMIN-01",
      });

      setCart([]);
      setPendingOrderNumber("");
      setIsKhqrOpen(false);
      onClose?.();
      onOrderCompleted?.({
        ...created,
        transactionId: txnId || created.transactionId,
        cashier: "POS-ADMIN-01",
      });
    } catch (err) {
      console.error("Failed to create POS order:", err);
      alert("Could not complete POS order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutAction = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === "cash") {
      await finalizePosOrder("Cash (POS Counter)", "Paid", `CASH-${Date.now().toString().slice(-6)}`);
      return;
    }

    // Bakong KHQR flow
    setIsSubmitting(true);
    try {
      const orderNum = `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setPendingOrderNumber(orderNum);
      const res = await khqrService.createKhqrPayment({
        amount: total,
        currency: "USD",
        orderNumber: orderNum,
        customerName: customerName.trim() || "Walk-In Patron",
        customerPhone: customerPhone.trim(),
        customerEmail: "pos-counter@atelier.com",
      });
      setKhqrData(res);
      setIsKhqrOpen(true);
    } catch (err) {
      console.error("POS KHQR generation error:", err);
      alert("Failed to generate Bakong KHQR code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-neutral-950 text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center font-black">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  ATELIER POS COUNTER TERMINAL
                </h2>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Instant In-Store Checkout • Auto Stock Deduction & Thermal Receipt
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
            {/* Left: Catalog Picker */}
            <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col overflow-hidden bg-gray-50/50">
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog by product name, brand, or category..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[48vh] lg:max-h-[58vh]">
                {loadingProducts ? (
                  <div className="col-span-full py-12 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading catalog inventory...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-gray-400">
                    No matching products found.
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const stock = Number(prod.stock ?? prod.quantity ?? 10);
                    const outOfStock = stock <= 0;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(prod)}
                        className={`text-left p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          outOfStock
                            ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                            : "bg-white border-gray-200/90 hover:border-black hover:shadow-md cursor-pointer active:scale-[0.98]"
                        }`}
                      >
                        <div>
                          <div className="relative h-24 w-full rounded-xl bg-gray-100 overflow-hidden mb-2">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/user/images/home/product1.jpg";
                              }}
                            />
                            <span
                              className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                outOfStock
                                  ? "bg-rose-600 text-white"
                                  : "bg-black/80 text-[#D6FF00]"
                              }`}
                            >
                              {outOfStock ? "Sold Out" : `${stock} in stock`}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-gray-900 line-clamp-1">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {prod.category}
                          </div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-black text-gray-950">
                            ${Number(prod.price || 0).toFixed(2)}
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Counter Ticket & Payment */}
            <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-white overflow-y-auto">
              <div className="space-y-4">
                {/* Patron Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Patron Name"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-black"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone (Optional)"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                {/* Selected Items */}
                <div>
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                    <span>Counter Ticket ({cart.length} items)</span>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCart([])}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl max-h-48 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="py-10 text-center text-xs text-gray-400 space-y-1">
                        <ShoppingBag className="w-6 h-6 mx-auto text-gray-300" />
                        <p>Tap products on the left to add to POS ticket</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              ${item.price.toFixed(2)} each
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Payment Method Toggle */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block mb-1.5">
                    Counter Tender Method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === "cash"
                          ? "bg-black text-[#D6FF00] border-black shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Cash Tender</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("khqr")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === "khqr"
                          ? "bg-[#E1232E] text-white border-[#E1232E] shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Bakong KHQR</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Totals & Print Receipt Trigger */}
              <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>VAT (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-950 pt-1 border-t border-gray-100">
                    <span>TOTAL DUE</span>
                    <span>
                      ${total.toFixed(2)} USD (៛ {Math.round(total * 4100).toLocaleString()})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleCheckoutAction}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#D6FF00] hover:bg-[#c5ec00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Receipt className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? "Processing..."
                      : paymentMethod === "cash"
                      ? "Complete Sale & Print POS Receipt"
                      : "Generate Bakong KHQR & Print Receipt"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live NBC Bakong KHQR Verification Modal for In-Store Counter */}
      <KhqrPaymentModal
        isOpen={isKhqrOpen}
        onClose={() => setIsKhqrOpen(false)}
        khqrData={khqrData}
        onRegenerate={handleCheckoutAction}
        onPaymentSuccess={(txnId) => {
          finalizePosOrder("Bakong KHQR", "Paid", txnId);
        }}
      />
    </>
  );
}

export default PosCounterModal;
