import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, Check, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUIStore } from "../../store/useUIStore";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { useAuthStore } from "../../store/useAuthStore";

export const QuickViewModal: React.FC = () => {
  const { isQuickViewOpen, quickViewProduct, closeQuickView, showToast, openCartDrawer } = useUIStore();
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { formatPrice } = useCurrencyStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (quickViewProduct) {
      setSelectedImage(0);
      setSelectedColor(0);
      setSelectedSize(quickViewProduct.sizes[0] || "M");
      setQuantity(1);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isWishlisted = isInWishlist(product.id);
  const rawStock =
    product.stock !== undefined
      ? Number(product.stock)
      : product.quantity !== undefined
      ? Number(product.quantity)
      : product.stockCount !== undefined
      ? Number(product.stockCount)
      : 10;
  const isStatusOut =
    String(product.status || "").trim().toLowerCase() === "out of stock" ||
    product.inStock === false;
  const stockCount = isStatusOut || isNaN(rawStock) ? 0 : Math.max(0, rawStock);
  const isOutOfStock = stockCount <= 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      closeQuickView();
      showToast("Please sign in or create an account to purchase items", "info");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOutOfStock) {
      showToast(`"${product.name}" is out of stock`, "error");
      return;
    }
    const safeQty = Math.min(quantity, stockCount);
    addToCart(
      product,
      safeQty,
      selectedSize,
      product.colors[selectedColor]
    );
    showToast(`Added ${safeQty}x "${product.name}" to bag`, "success", product.images[0]);
    closeQuickView();
    openCartDrawer();
  };

  const handleWishlistToggle = () => {
    const added = toggleWishlist(product);
    showToast(
      added ? `Saved "${product.name}" to wishlist` : `Removed from wishlist`,
      "info",
      product.images[0]
    );
  };

  return (
    <AnimatePresence>
      {isQuickViewOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQuickView}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Close Button */}
              <button
                onClick={closeQuickView}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-black hover:text-white flex items-center justify-center shadow-md transition-colors text-black"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left: Image Studio */}
                <div className="bg-[#F8F8F8] p-6 flex flex-col justify-between">
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-200 shadow-inner">
                    <img
                      src={product.images[selectedImage] || product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    {product.badge && (
                      <span className="absolute top-4 left-4 px-3 py-1 bg-[#111111] text-[#D6FF00] font-black text-[11px] tracking-wider uppercase rounded-full">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {product.images.length > 1 && (
                    <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-16 h-18 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            selectedImage === idx
                              ? "border-black scale-102"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Details & Selectors */}
                <div className="p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span className="font-bold uppercase tracking-widest text-black">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1 text-black font-semibold">
                        <Star className="w-3.5 h-3.5 fill-black stroke-black" />
                        <span>{product.rating}</span>
                        <span className="text-gray-400">({product.reviewsCount} reviews)</span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-black tracking-tight leading-tight">
                      {product.name}
                    </h2>
                    {product.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{product.subtitle}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-2xl font-black text-black">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm line-through text-gray-400 font-semibold">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                      {product.discount && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D6FF00] text-black text-[10px] font-black tracking-wider uppercase">
                          {product.discount}
                        </span>
                      )}
                    </div>

                    {/* Stock Badge */}
                    <div className="mt-2.5">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Stock ({stockCount} available)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-4 leading-relaxed line-clamp-3">
                      {product.description}
                    </p>

                    {/* Color Picker */}
                    <div className="mt-5">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                        <span>Color: <strong className="text-black">{product.colors[selectedColor]?.name}</strong></span>
                      </div>
                      <div className="flex gap-2">
                        {product.colors.map((color, idx) => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedColor(idx)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              selectedColor === idx
                                ? "ring-2 ring-black ring-offset-2 scale-110"
                                : "opacity-80 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          >
                            {selectedColor === idx && (
                              <Check
                                className={`w-3.5 h-3.5 ${
                                  color.hex === "#FFFFFF" || color.hex === "#FAFAFA" || color.hex === "#D6FF00"
                                    ? "text-black"
                                    : "text-white"
                                } stroke-[3]`}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Picker */}
                    <div className="mt-5">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                        <span>Size: <strong className="text-black">{selectedSize}</strong></span>
                        <span className="text-gray-400 font-normal">True to size</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-10 h-9 px-3 rounded-xl text-xs font-bold transition-all border ${
                              selectedSize === size
                                ? "bg-black text-white border-black"
                                : "bg-white text-black border-gray-200 hover:border-black"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Quantity */}
                  <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                    <div className="flex gap-3">
                      {/* Quantity counter */}
                      <div className={`flex items-center border border-gray-200 rounded-xl px-2 py-1 ${isOutOfStock ? "opacity-50 bg-gray-50" : ""}`}>
                        <button
                          type="button"
                          disabled={isOutOfStock || quantity <= 1}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-black">
                          {isOutOfStock ? 0 : Math.min(quantity, stockCount)}
                        </span>
                        <button
                          type="button"
                          disabled={isOutOfStock || quantity >= stockCount}
                          onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add to Bag Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={handleAddToCart}
                        className={`flex-1 py-3.5 px-6 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 group ${
                          isOutOfStock
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                            : "bg-[#111111] hover:bg-black text-white shadow-md hover:shadow-lg"
                        }`}
                      >
                        <span>
                          {isOutOfStock
                            ? "Out of Stock"
                            : `Add to Bag • ${formatPrice(product.price * Math.min(quantity, stockCount))}`}
                        </span>
                        {!isOutOfStock && (
                          <ArrowRight className="w-4 h-4 text-[#D6FF00] group-hover:translate-x-1 transition-transform" />
                        )}
                      </button>

                      {/* Wishlist Button */}
                      <button
                        onClick={handleWishlistToggle}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                          isWishlisted
                            ? "bg-rose-50 border-rose-200 text-rose-500"
                            : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                        }`}
                        title={isWishlisted ? "In wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Authenticity Guaranteed • Free 30-Day Returns</span>
                      </div>
                      <Link
                        to={`/shop/${product.id}`}
                        onClick={closeQuickView}
                        className="font-bold text-black hover:underline inline-flex items-center gap-1"
                      >
                        Full Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

