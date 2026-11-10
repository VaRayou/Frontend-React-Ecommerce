import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";

export const Cart: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const { formatPrice } = useCurrencyStore();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    promoCode,
    promoError,
    applyPromoCode,
    removePromoCode,
    getSubtotal,
    getShipping,
    getDiscount,
    getTotal,
    getItemCount,
    freeShippingThreshold,
  } = useCartStore();

  const [inputCode, setInputCode] = useState("");
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const discount = getDiscount();
  const total = getTotal();
  const itemCount = getItemCount();

  const FREE_SHIPPING_GOAL = freeShippingThreshold || 200;
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_GOAL) * 100));
  const amountRemaining = Math.max(0, FREE_SHIPPING_GOAL - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      applyPromoCode(inputCode);
      setInputCode("");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 text-gray-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
          Your Shopping Bag
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase mb-3">
          Your Bag is Currently Empty
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-8 font-light">
          There are no pieces in your shopping bag. Explore our Autumn/Winter Runway collection
          and discover architectural silhouettes crafted for your wardrobe.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-black text-[#D6FF00] text-xs font-black uppercase tracking-widest hover:bg-neutral-900 transition-all shadow-md"
        >
          <span>Explore All Collections</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
            Review Bag
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-black uppercase">
            Shopping Bag ({itemCount} {itemCount === 1 ? "Item" : "Items"})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Bag</span>
        </button>
      </div>

      {/* Free Shipping Progress Card */}
      <div className="mb-10 p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-black mb-2">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D6FF00] fill-[#D6FF00]" />
            {amountRemaining === 0 ? (
              <span className="text-emerald-700">
                Congratulations! You qualify for <strong>FREE Express Worldwide Shipping</strong>.
              </span>
            ) : (
              <span>
                Add <strong className="text-black">{formatPrice(amountRemaining)}</strong> more to qualify for <strong>FREE Express Shipping</strong>
              </span>
            )}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#111111] h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Grid: Left Bag Items (8 Cols) + Right Summary (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:border-gray-200 transition-colors"
            >
              {/* Product Thumbnail */}
              <Link
                to={`/shop/${item.product?.id || item.id}`}
                className="w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden bg-gray-100 shrink-0"
              >
                <img
                  src={item.product?.images?.[0] || item.product?.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"}
                  alt={item.product?.name || "Product"}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  {item.product?.category || "Apparel"}
                </span>
                <Link
                  to={`/shop/${item.product?.id || item.id}`}
                  className="text-base font-extrabold text-black hover:underline block leading-snug"
                >
                  {item.product?.name || "Fashion Piece"}
                </Link>

                <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                  <span>Size: <strong className="text-black">{item.selectedSize || "M"}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: typeof item.selectedColor === "object" ? item.selectedColor?.hex : "#111111" }}
                    />
                    <strong className="text-black">
                      {typeof item.selectedColor === "object" && item.selectedColor?.name ? item.selectedColor.name : String(item.selectedColor || "Standard")}
                    </strong>
                  </span>
                </div>

                <div className="text-xs text-gray-400 font-semibold pt-1">
                  Unit Price: {formatPrice(Number(item.product?.price || 0))}
                </div>
              </div>

              {/* Quantity & Subtotal */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                <div className="flex items-center border border-gray-200 rounded-xl px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-black">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-black block">
                    {formatPrice(Number(item.product?.price || 0) * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[11px] text-gray-400 hover:text-red-500 transition-colors underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 flex justify-between items-center text-xs text-gray-500">
            <Link to="/shop" className="hover:text-black underline font-semibold">
              &larr; Continue browsing catalog
            </Link>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-6">
            <h3 className="font-black text-base uppercase tracking-tight text-black pb-4 border-b border-gray-100">
              Order Summary
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-bold text-black">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Estimated Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-[11px]">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount ({promoCode})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-between text-base font-black text-black">
                <span>Estimated Total</span>
                <span className="text-xl">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="pt-2">
              {promoCode ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon '{promoCode}' active</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-gray-500 hover:text-black underline text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="Promo Code (try ATELIER15)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-black placeholder:text-gray-400 focus:border-black outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-rose-500 font-medium">{promoError}</p>
                  )}
                </form>
              )}
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  showToast("Please sign in or create an account to proceed to checkout", "info");
                  navigate("/login", { state: { from: "/checkout" } });
                  return;
                }
                navigate("/checkout");
              }}
              className="w-full py-4 px-6 bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Reassurance list */}
            <div className="pt-2 space-y-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bank-grade 256-bit SSL encrypted checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pre-paid complimentary 30-day returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

