import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Filter, X, SlidersHorizontal, ArrowUpDown, RotateCcw, Check, Search, Sparkles } from "lucide-react";
import { ProductGrid } from "../../components/product/ProductGrid";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { Product } from "../../types";

const normalizeCatKey = (val: string) => {
  const s = String(val || "").trim().toLowerCase().replace(/['\s-]+/g, "");
  if (s === "womens" || s === "woman" || s === "female" || s === "ladies") return "women";
  if (s === "mens" || s === "man" || s === "male") return "men";
  if (s === "bag" || s === "handbags") return "bags";
  if (s === "shoe" || s === "footwear") return "shoes";
  if (s === "accessory") return "accessories";
  return s;
};

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "39", "40", "41", "42", "43", "44", "One Size"];

const ALL_COLORS = [
  { name: "Black", hex: "#111111" },
  { name: "White/Ecru", hex: "#F3EDE2" },
  { name: "Camel", hex: "#C2A68D" },
  { name: "Gold", hex: "#E5C158" },
  { name: "Acid Lime", hex: "#D6FF00" },
  { name: "Navy", hex: "#151F30" },
  { name: "Olive", hex: "#4B5320" },
];

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Sync
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [catalogCeiling, setCatalogCeiling] = useState<number>(600);
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(() => {
    const cached = (productService as any).getCachedProducts?.();
    return Array.isArray(cached) ? cached : [];
  });
  const [liveCategories, setLiveCategories] = useState<any[]>(() => {
    const cached = (categoryService as any).getCachedCategories?.();
    return Array.isArray(cached) ? cached : [];
  });
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [live, cats] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories(),
        ]);
        if (live && live.length > 0) {
          const prods = live as Product[];
          setProductsList(prods);
          const highest = Math.max(
            600,
            ...prods.map((p) => Math.ceil((Number(p.price) || 0) / 50) * 50)
          );
          setCatalogCeiling(highest);
          setMaxPrice(highest);
        }
        if (cats && cats.length > 0) {
          const formatted = cats.map((c: any) => ({
            id: String(c.id || c._id),
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
            count: c.itemCount ?? c.products_count ?? 0,
            itemCount: c.itemCount ?? c.products_count ?? 0,
          }));
          setLiveCategories(formatted);
        }
      } catch (err) {
        // Fallback to initial constants
      }
    };
    fetchCatalog();
  }, []);

  // Sync with URL params
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [categoryParam, searchParam]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setMaxPrice(catalogCeiling);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSortBy("featured");
    setSearchParams({});
  };

  // Filtered & Sorted Product List
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // 1. Category Filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "new-arrivals") {
          if (!product.isNewArrival) return false;
        } else if (
          normalizeCatKey(product.category) !== normalizeCatKey(selectedCategory)
        ) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc) return false;
      }

      // 3. Price Filter
      if (product.price > maxPrice) {
        return false;
      }

      // 4. Size Filter
      if (selectedSizes.length > 0) {
        const hasSize = product.sizes.some((s) => selectedSizes.includes(s));
        if (!hasSize) return false;
      }

      // 5. Color Filter
      if (selectedColors.length > 0) {
        const hasColor = product.colors.some((c) =>
          selectedColors.some((sc) => c.name.toLowerCase().includes(sc.toLowerCase()))
        );
        if (!hasColor) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [productsList, selectedCategory, searchQuery, maxPrice, selectedSizes, selectedColors, sortBy]);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (maxPrice < catalogCeiling ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-12">
      {/* Editorial Dark Obsidian Header Banner with Quick Category Pills */}
      <div className="relative rounded-3xl overflow-hidden bg-[#111111] text-white p-5 sm:p-10 mb-5 sm:mb-8 shadow-xl border border-white/10">
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6FF00 0%, transparent 70%)" }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#D6FF00] text-[10px] font-black tracking-[0.2em] uppercase mb-2.5 sm:mb-3">
              <Sparkles className="w-3 h-3" />
              <span>Autumn / Winter 2026 Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
              {selectedCategory === "all"
                ? "Complete Collection"
                : selectedCategory === "new-arrivals"
                ? "New Runway Arrivals"
                : `${selectedCategory} Archive`}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl">
              Architectural silhouettes, fine Italian wools, and sculptural accessories. Showing{" "}
              <strong className="text-[#D6FF00]">{filteredProducts.length}</strong> available pieces.
            </p>
          </div>

          {/* Animated Quick-Switch Category Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full sm:flex-wrap">
            {[
              { label: "All Pieces", slug: "all" },
              ...liveCategories.slice(0, 6).map((c) => ({
                label: c.name,
                slug: c.slug || String(c.name).toLowerCase(),
              })),
            ].map((pill) => {
              const isSelected = normalizeCatKey(selectedCategory) === normalizeCatKey(pill.slug);
              return (
                <button
                  key={pill.slug}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(pill.slug);
                    if (pill.slug === "all") {
                      setSearchParams({});
                    } else {
                      setSearchParams({ category: pill.slug });
                    }
                  }}
                  className={`relative px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer z-10 shrink-0 whitespace-nowrap ${
                    isSelected ? "text-black" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="shopQuickCatPill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#D6FF00] -z-10 shadow-sm"
                    />
                  )}
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Controls Bar: Search, Mobile Filter Toggle, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-xs mb-6 sm:mb-8">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within catalog..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[#F8F8F8] border border-transparent focus:border-black focus:bg-white outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Sort & Mobile Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#D6FF00] text-black text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#F8F8F8] text-black text-xs font-bold rounded-xl px-3 py-2 border border-gray-200 outline-none cursor-pointer"
            >
              <option value="featured">Featured Curations</option>
              <option value="newest">Newest Runway Drops</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-2xl bg-gray-50 border border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
            Active Filters ({activeFilterCount}):
          </span>

          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-black">
              Category: <strong className="uppercase">{selectedCategory}</strong>
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => setSelectedCategory("all")}
              />
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-black">
              Search: "{searchQuery}"
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => setSearchQuery("")}
              />
            </span>
          )}

          {maxPrice < catalogCeiling && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-black">
              Under {formatPrice(maxPrice)}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => setMaxPrice(catalogCeiling)}
              />
            </span>
          )}

          {selectedSizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-black"
            >
              Size: {size}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => toggleSize(size)}
              />
            </span>
          ))}

          {selectedColors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-black"
            >
              Color: {color}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => toggleColor(color)}
              />
            </span>
          ))}

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-gray-500 hover:text-black underline ml-auto pr-1 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Main Layout: Left Sidebar + Right Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-28 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-7">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-black flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D6FF00]" />
              <span>Filters</span>
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-gray-400 hover:text-black"
              >
                Clear all
              </button>
            )}
          </div>

          {/* 1. Category Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Categories
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  selectedCategory === "all"
                    ? "bg-[#111111] text-[#D6FF00]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <span>All Collections</span>
                <span className="text-[11px] opacity-60">{productsList.length}</span>
              </button>

              {liveCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                    normalizeCatKey(selectedCategory) === normalizeCatKey(cat.slug)
                      ? "bg-[#111111] text-[#D6FF00]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[11px] opacity-60">{cat.itemCount ?? cat.count ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range Slider */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Max Price
              </h4>
              <span className="text-xs font-extrabold text-black">{formatPrice(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="10"
              max={catalogCeiling}
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{formatPrice(10)}</span>
              <span>{formatPrice(Math.round(catalogCeiling / 2))}</span>
              <span>{formatPrice(catalogCeiling)}+</span>
            </div>
          </div>

          {/* 3. Sizes */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Size
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SIZES.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-200 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Colors */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Color Palette
            </h4>
            <div className="flex flex-wrap gap-2">
              {ALL_COLORS.map((col) => {
                const isSelected = selectedColors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    onClick={() => toggleColor(col.name)}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "ring-2 ring-black ring-offset-2 scale-110"
                        : "border-gray-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          col.hex === "#FFFFFF" || col.hex === "#D6FF00" || col.hex === "#F3EDE2"
                            ? "text-black"
                            : "text-white"
                        } stroke-[3]`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Main Grid */}
        <div className="lg:col-span-9">
          <ProductGrid
            products={filteredProducts}
            columns={3}
            emptyMessage="No pieces match your selected combination of filters. Try widening your price range or clearing size filters."
          />
        </div>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 overflow-y-auto z-10 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold uppercase tracking-wider text-sm text-black">
                  Filters ({activeFilterCount})
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-gray-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Category */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Category
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                      selectedCategory === "all" ? "bg-black text-[#D6FF00]" : "text-gray-600"
                    }`}
                  >
                    All Collections
                  </button>
                  {liveCategories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                        selectedCategory === c.slug ? "bg-black text-[#D6FF00]" : "text-gray-600"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Max Price</span>
                  <span>{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={catalogCeiling}
                  step={catalogCeiling > 500 ? 20 : 5}
                  value={Math.min(maxPrice, catalogCeiling)}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-black"
                />
              </div>

              {/* Mobile Sizes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Sizes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold border ${
                        selectedSizes.includes(size)
                          ? "bg-black text-white border-black"
                          : "border-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 text-center border border-gray-200 text-xs font-bold uppercase rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 text-center bg-black text-[#D6FF00] text-xs font-bold uppercase rounded-xl"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

