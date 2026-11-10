import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useCartStore } from "../../store/useCartStore";
import { useUIStore } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import { ProductCard } from "../../components/product/ProductCard";

export const Wishlist: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { showToast, openCartDrawer } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddAllToBag = () => {
    if (!isAuthenticated) {
      showToast("Please sign in or create an account to purchase items", "info");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    items.forEach((p) => {
      const size = p.sizes?.[0] || "M";
      const color = p.colors?.[0] || { name: "Standard", hex: "#000000" };
      addToCart(p, 1, size, color);
    });
    const count = items.length;
    clearWishlist();
    showToast(`Moved all ${count} wishlist pieces to your shopping bag!`, "success");
    openCartDrawer();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
          Your Curated Selection
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase mb-3">
          Your Wishlist is Empty
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-8 font-light">
          Tap the heart icon on any design while exploring the catalog to bookmark your favorite
          silhouettes and leather pieces.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
            Saved Designs
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-black uppercase">
            My Wishlist ({items.length} {items.length === 1 ? "Piece" : "Pieces"})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddAllToBag}
            className="px-5 py-2.5 rounded-full bg-[#111111] text-[#D6FF00] text-xs font-black uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Move All to Bag</span>
          </button>

          <button
            onClick={clearWishlist}
            className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
        {items.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </div>
  );
};

