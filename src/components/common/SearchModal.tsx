import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Sparkles, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useUIStore } from "../../store/useUIStore";
import { productService } from "../../services/productService";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { Product } from "../../types";

const TRENDING_TAGS = [
  "Long Sleav",
  "Rob",
  "Dress",
  "Short",
  "Trench Coat",
  "Cashmere",
];

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, closeSearchModal } = useUIStore();
  const { formatPrice } = useCurrencyStore();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load live catalog from Supabase PostgreSQL backend when modal opens
  useEffect(() => {
    if (!isSearchModalOpen) return;
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const liveList = await productService.getProducts();
        if (Array.isArray(liveList) && liveList.length > 0) {
          setProducts(liveList);
        }
      } catch (err) {
        console.warn("Could not fetch live products for omni-search:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, [isSearchModalOpen]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchModalOpen) {
        closeSearchModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchModalOpen, closeSearchModal]);

  const results = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        const brandMatch = (p.brand || "").toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        return nameMatch || catMatch || brandMatch || descMatch;
      })
    : [];

  return (
    <AnimatePresence>
      {isSearchModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearchModal}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed top-8 sm:top-16 inset-x-4 max-w-2xl mx-auto z-50 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Input Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search live runway collections, dresses, coats, accessories..."
                autoFocus
                className="w-full text-base sm:text-lg font-medium text-black placeholder:text-gray-400 bg-transparent outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs text-gray-400 hover:text-black uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={closeSearchModal}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {!query ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#111111]" />
                    <span>Trending Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setQuery(tag)}
                        className="px-3.5 py-1.5 rounded-full bg-[#F8F8F8] hover:bg-black hover:text-[#D6FF00] text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {products.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        <span>Featured Pieces ({products.length})</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Live Supabase Catalog</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {products.slice(0, 4).map((p) => {
                          const img = p.images?.[0] || p.image || "/user/images/home/product1.jpg";
                          return (
                            <Link
                              key={p.id}
                              to={`/shop/${p.id}`}
                              onClick={closeSearchModal}
                              className="group block p-2 rounded-xl bg-gray-50/70 hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 transition-all text-center"
                            >
                              <img
                                src={img}
                                alt={p.name}
                                className="w-full h-20 object-cover rounded-lg mb-1.5 group-hover:scale-105 transition-transform"
                              />
                              <p className="text-[11px] font-bold text-gray-900 truncate">{p.name}</p>
                              <p className="text-[10px] font-black text-black">{formatPrice(Number(p.price || 0))}</p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-2 stroke-1" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    No matching runway products found for "{query}"
                  </p>
                  <p className="text-xs text-gray-400">
                    Try checking your spelling or searching by category like "Dress" or "Short".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    <span>Matching Live Catalog ({results.length})</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Supabase Live
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.map((product) => {
                      const img = product.images?.[0] || product.image || "/user/images/home/product1.jpg";
                      const stockCount = Number(product.stock ?? product.stockCount ?? product.quantity ?? 10);
                      const isOutOfStock = stockCount <= 0 || product.inStock === false || product.status === "Out of Stock";
                      const isLowStock = !isOutOfStock && stockCount <= 5;

                      return (
                        <Link
                          key={product.id}
                          to={`/shop/${product.id}`}
                          onClick={closeSearchModal}
                          className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 hover:border-black/30 hover:shadow-md transition-all bg-white group cursor-pointer"
                        >
                          <img
                            src={img}
                            alt={product.name}
                            className="w-14 h-16 object-cover rounded-xl bg-gray-100 shrink-0"
                            onError={(e: any) => {
                              e.target.src = "/user/images/home/product1.jpg";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                {product.category || "Couture"}
                              </span>
                              {isOutOfStock ? (
                                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                                  Low: {stockCount} left
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                                  In Stock
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-black truncate group-hover:underline">
                              {product.name}
                            </h4>
                            <span className="text-xs font-black text-black block mt-0.5">
                              {formatPrice(Number(product.price || 0))}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0 pr-1" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#F8F8F8] border-t border-gray-100 text-center text-xs text-gray-400 flex items-center justify-between px-5">
              <span>Press <strong className="text-gray-700">ESC</strong> to close</span>
              <Link
                to="/shop"
                onClick={closeSearchModal}
                className="font-bold text-black hover:underline"
              >
                Browse all products &rarr;
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export default SearchModal;
