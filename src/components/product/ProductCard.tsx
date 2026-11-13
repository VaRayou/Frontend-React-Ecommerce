import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { Product } from "../../types";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useUIStore } from "../../store/useUIStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { useAuthStore } from "../../store/useAuthStore";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { openQuickView, showToast, openCartDrawer } = useUIStore();
  const { formatPrice } = useCurrencyStore();
  const { isAuthenticated } = useAuthStore();

  const isWishlisted = isInWishlist(product.id);
  const rawStock =
    product.stock !== undefined
      ? Number(product.stock)
      : product.quantity !== undefined
      ? Number(product.quantity)
      : product.stockCount !== undefined
      ? Number(product.stockCount)
      : 10;
  const isOutOfStock =
    String(product.status || "").trim().toLowerCase() === "out of stock" ||
    product.inStock === false ||
    isNaN(rawStock) ||
    rawStock <= 0;

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || ""];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast("Please sign in or create an account to purchase items", "info");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOutOfStock) {
      showToast(`"${product.name}" is out of stock`, "error");
      return;
    }
    addToCart(product, 1, product.sizes[0], product.colors[selectedColor]);
    showToast(`Added "${product.name}" to bag`, "success", images[0]);
    openCartDrawer();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    showToast(
      added ? `Saved "${product.name}" to wishlist` : `Removed from wishlist`,
      "info",
      images[0]
    );
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  };

  const displayImgIndex = isHovered && images.length > 1 && activeImgIdx === 0 ? 1 : activeImgIdx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.34, delay: Math.min((index % 4) * 0.045, 0.16), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col bg-white p-2.5 sm:p-3 rounded-3xl border border-gray-200/70 hover:border-black/20 shadow-2xs hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300 transform-gpu"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImgIdx(0);
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F1F1EF]">
        <Link to={`/shop/${product.id}`} className="block w-full h-full relative">
          <img
            src={images[displayImgIndex] || images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106 transform-gpu"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
              Out of Stock
            </span>
          ) : (
            <>
              {product.badge && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm ${
                    product.badge === "NEW" || product.badge === "HOT"
                      ? "bg-[#D6FF00] text-black"
                      : product.badge === "SALE"
                      ? "bg-rose-500 text-white"
                      : "bg-[#111111] text-[#D6FF00]"
                  }`}
                >
                  {product.badge}
                </span>
              )}
              {product.discount && !product.badge && (
                <span className="px-2.5 py-1 rounded-full bg-[#111111] text-[#D6FF00] text-[10px] font-black tracking-wider uppercase shadow-sm">
                  {product.discount}
                </span>
              )}
            </>
          )}
        </div>

        {/* Multi-Angle Gallery Dots (if product has >1 uploaded photos) */}
        {images.length > 1 && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 backdrop-blur-md">
            {images.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setActiveImgIdx(idx)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImgIdx(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  displayImgIndex === idx ? "w-4 bg-[#D6FF00]" : "w-1.5 bg-white/60 hover:bg-white"
                }`}
                aria-label={`Angle ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isWishlisted
              ? "bg-white text-rose-500 shadow-md scale-105"
              : "bg-white/85 backdrop-blur-md hover:bg-white text-gray-800 hover:text-black shadow-xs hover:scale-110"
          }`}
          title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125 ${
              isWishlisted ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>

        {/* Mobile Touch Quick Actions (< md) - Always Accessible Without Hover */}
        <div className="md:hidden absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleQuickViewClick}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-black shadow-md flex items-center justify-center active:scale-90 transition-transform"
            title="Quick View"
            aria-label="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform ${
              isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#111111] text-[#D6FF00]"
            }`}
            title={isOutOfStock ? "Out of Stock" : "Quick Add to Bag"}
            aria-label="Quick Add to Bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Floating Action Dock (Quick View & Quick Add on Hover) */}
        <div className="hidden md:flex absolute inset-x-2.5 bottom-2.5 z-10 gap-1.5 opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250 ease-out">
          <button
            onClick={handleQuickViewClick}
            className="flex-1 py-2.5 px-3 bg-white/95 hover:bg-white text-black text-[10px] font-extrabold tracking-widest uppercase rounded-xl shadow-lg backdrop-blur-md transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#111111] hover:bg-[#D6FF00] text-[#D6FF00] hover:text-black hover:scale-[1.06]"
            }`}
            title={isOutOfStock ? "Out of Stock" : "Quick Add to Bag"}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Details Underneath */}
      <div className="pt-2.5 sm:pt-3 px-0.5 sm:px-1 pb-0.5 flex flex-col gap-0.5 sm:gap-1">
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <span className="truncate">{product.category}</span>
          {/* Color Dots */}
          <div className="flex items-center gap-1 shrink-0">
            {product.colors.slice(0, 3).map((col, idx) => (
              <span
                key={col.name}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(idx);
                }}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border cursor-pointer transition-transform ${
                  selectedColor === idx ? "scale-125 border-black" : "border-gray-300 hover:scale-110"
                }`}
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/shop/${product.id}`}
          className="text-xs sm:text-sm font-extrabold text-[#111111] tracking-tight leading-snug group-hover:text-black line-clamp-1 transition-colors"
        >
          {product.name}
        </Link>

        {/* Price & Stock Row */}
        <div className="flex items-center justify-between mt-0.5 sm:mt-1 pt-1 sm:pt-1.5 border-t border-gray-100 gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-black text-xs sm:text-sm text-black truncate">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-[11px] line-through text-gray-400 font-semibold hidden xs:inline">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {!isOutOfStock && (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">In Stock</span>
              <span className="sm:hidden">Stock</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = "ProductCard";

