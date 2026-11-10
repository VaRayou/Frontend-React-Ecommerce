import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ArrowRight, ShoppingBag, Plus, Minus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useUIStore } from "../../store/useUIStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { useAuthStore } from "../../store/useAuthStore";

export const CartDrawer: React.FC = () => {
  const { isCartDrawerOpen, closeCartDrawer, showToast } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    updateQuantity,
    removeFromCart,
    getSubtotal,
    getShipping,
    getTotal,
    getItemCount,
    freeShippingThreshold,
    syncCartWithLiveStock,
  } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isCartDrawerOpen) {
      syncCartWithLiveStock().then((res) => {
        if (res.adjustments.length > 0) {
          res.adjustments.forEach((msg) => showToast(msg, "warning"));
        }
      });
    }
  }, [isCartDrawerOpen, syncCartWithLiveStock, showToast]);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();
  const itemCount = getItemCount();

  const FREE_SHIPPING_GOAL = freeShippingThreshold || 200;
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_GOAL) * 100));
  const amountRemaining = Math.max(0, FREE_SHIPPING_GOAL - subtotal);

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCartDrawer}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white text-[#111111] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#111111]" />
                <h3 className="font-bold tracking-tight text-base uppercase">
                  Shopping Bag ({itemCount})
                </h3>
              </div>
              <button
                onClick={closeCartDrawer}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500 hover:text-black"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Meter */}
            <div className="px-5 py-3.5 bg-[#F8F8F8] border-b border-gray-100 text-xs">
              <div className="flex items-center justify-between mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Sparkles className="w-3.5 h-3.5 text-[#111111]" />
                  {amountRemaining === 0 ? (
                    <strong className="text-black font-semibold">
                      You've unlocked FREE Express Shipping!
                    </strong>
                  ) : (
                    <span>
                      Add <strong className="text-black">{formatPrice(amountRemaining)}</strong> more for Free Shipping
                    </span>
                  )}
                </span>
                <span className="font-bold text-black">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#111111] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(items || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-black text-lg mb-1">Your bag is empty</h4>
                  <p className="text-xs text-gray-500 max-w-xs mb-6">
                    Discover our latest runway collection and elevate your everyday wardrobe.
                  </p>
                  <button
                    onClick={() => {
                      closeCartDrawer();
                      navigate("/shop");
                    }}
                    className="px-6 py-3 bg-[#111111] text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-black transition-colors"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                (items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition-colors"
                  >
                    <Link
                      to={`/shop/${item.product?.id || item.id}`}
                      onClick={closeCartDrawer}
                      className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                    >
                      <img
                        src={item.product?.images?.[0] || item.product?.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"}
                        alt={item.product?.name || "Product"}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/shop/${item.product?.id || item.id}`}
                            onClick={closeCartDrawer}
                            className="font-semibold text-xs text-black hover:underline line-clamp-1"
                          >
                            {item.product?.name || "Fashion Piece"}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                          <span>Size: <strong>{item.selectedSize || "M"}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-300"
                              style={{ backgroundColor: typeof item.selectedColor === "object" ? item.selectedColor?.hex : "#111111" }}
                            />
                            {typeof item.selectedColor === "object" && item.selectedColor?.name ? item.selectedColor.name : String(item.selectedColor || "Standard")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-xs text-black">
                          {formatPrice(Number(item.product?.price || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Summary */}
            {(items || []).length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-[#F8F8F8] space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-black">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-emerald-600 font-bold uppercase text-[11px]">Free</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-black pt-2 border-t border-gray-200">
                    <span>Estimated Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/cart"
                    onClick={closeCartDrawer}
                    className="w-full py-3 text-center border border-black text-black text-xs font-bold tracking-wider uppercase rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    View Bag
                  </Link>
                  <button
                    onClick={() => {
                      closeCartDrawer();
                      if (!isAuthenticated) {
                        showToast("Please sign in or create an account to checkout", "info");
                        navigate("/login", { state: { from: "/checkout" } });
                        return;
                      }
                      navigate("/checkout");
                    }}
                    className="w-full py-3 bg-[#111111] text-white text-xs font-bold tracking-wider uppercase rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1.5 group"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

