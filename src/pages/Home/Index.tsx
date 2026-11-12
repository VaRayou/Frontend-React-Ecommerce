import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  RefreshCw,
  Truck,
  Star,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Award,
  Globe,
  Eye,
} from "lucide-react";
import { ProductGrid } from "../../components/product/ProductGrid";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { useUIStore } from "../../store/useUIStore";
import { Product } from "../../types";
import api from "../../services/api";

const normalizeCatKey = (val: string) => {
  const s = String(val || "").trim().toLowerCase().replace(/['\s-]+/g, "");
  if (s === "womens" || s === "woman" || s === "female" || s === "ladies") return "women";
  if (s === "mens" || s === "man" || s === "male") return "men";
  if (s === "bag" || s === "handbags") return "bags";
  if (s === "shoe" || s === "footwear") return "shoes";
  if (s === "accessory") return "accessories";
  return s;
};

const HERO_SLIDES = [
  {
    id: "slide-1",
    season: "Autumn / Winter Runway 2026",
    headlineTop: "Define Your",
    headlineAccent: "Architecture.",
    subtitle:
      "Sculptural tailoring, double-faced virgin wool, and timeless essentials crafted between Paris and Milan for the modern wardrobe.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2400&q=85",
    ctaPrimary: { label: "Shop Runway Collection", link: "/shop" },
    ctaSecondary: { label: "Explore Curated Worlds", link: "/categories" },
  },
  {
    id: "slide-2",
    season: "Paris Flagship Exclusive Capsule",
    headlineTop: "Effortless",
    headlineAccent: "Modernity.",
    subtitle:
      "Minimalist silhouettes in organic silk, brushed mohair, and full-grain Tuscan calfskin. Engineered to outlast seasonal trends.",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2400&q=85",
    ctaPrimary: { label: "Discover Women's Edit", link: "/shop?category=women" },
    ctaSecondary: { label: "View Men's Tailoring", link: "/shop?category=men" },
  },
  {
    id: "slide-3",
    season: "Artisanal Leather & Footwear",
    headlineTop: "Uncompromising",
    headlineAccent: "Craftsmanship.",
    subtitle:
      "Hand-stitched leather goods and architectural footwear with instant NBC Bakong KHQR dual-currency checkout and white-glove delivery.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2400&q=85",
    ctaPrimary: { label: "Explore Leather & Bags", link: "/shop?category=bags" },
    ctaSecondary: { label: "Track Your Order", link: "/track-order" },
  },
];

const MARQUEE_ITEMS = [
  "AUTUMN / WINTER 2026 RUNWAY ARCHIVE",
  "PARIS • MILAN • TOKYO • PHNOM PENH",
  "INSTANT NBC BAKONG KHQR SETTLEMENT",
  "COMPLIMENTARY WHITE-GLOVE EXPRESS COURIER",
  "100% TRACEABLE ITALIAN VIRGIN WOOL & SILK",
  "USE CODE ATELIER20 FOR 20% OFF YOUR FIRST ORDER",
];

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [productsList, setProductsList] = useState<Product[]>(() => {
    const cached = (productService as any).getCachedProducts?.();
    return Array.isArray(cached) ? cached : [];
  });
  const [categoriesList, setCategoriesList] = useState<any[]>(() => {
    const cached = (categoryService as any).getCachedCategories?.();
    return Array.isArray(cached) ? cached : [];
  });
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [spotlightIdx, setSpotlightIdx] = useState<number>(0);
  const [activeHotspot, setActiveHotspot] = useState<number>(0);
  const [mousePos, setMousePos] = useState({ x: 50, y: 40 });

  const { formatPrice } = useCurrencyStore();
  const { openQuickView } = useUIStore();

  useEffect(() => {
    const fetchHomeCatalog = async () => {
      try {
        const [liveProds, liveCats, liveRevsRes] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories(),
          api.get("/reviews/").catch(() => ({ data: [] })),
        ]);
        if (Array.isArray(liveProds) && liveProds.length > 0) {
          setProductsList(liveProds as Product[]);
        }
        if (Array.isArray(liveRevsRes?.data)) {
          setRealReviews(liveRevsRes.data);
        }
        if (Array.isArray(liveCats) && liveCats.length > 0) {
          setCategoriesList(
            liveCats.map((c: any, idx: number) => ({
              id: String(c.id || c._id || idx),
              name: c.name || "Collection",
              slug: c.slug || String(c.name || "").toLowerCase().replace(/\s+/g, "-"),
              description: c.description || `Architectural ${c.name} collection`,
              image:
                c.image ||
                "/uploads/bed6e30a33b2.jpg",
              itemCount: c.itemCount ?? c.count ?? 0,
            }))
          );
        }
      } catch {
        // quiet
      }
    };
    fetchHomeCatalog();
  }, []);

  // Auto-advance catalog spotlight & synchronized hero background every 6.5 seconds
  const totalSpotlightCount = Math.max(1, productsList.length);

  const handlePrevSpotlight = () => {
    setSpotlightIdx((prev) => (prev - 1 + totalSpotlightCount) % totalSpotlightCount);
  };

  const handleNextSpotlight = () => {
    setSpotlightIdx((prev) => (prev + 1) % totalSpotlightCount);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % totalSpotlightCount);
    }, 6500);
    return () => clearInterval(timer);
  }, [totalSpotlightCount]);

  const activeSlideIndex = spotlightIdx % HERO_SLIDES.length;
  const currentSlide = HERO_SLIDES[activeSlideIndex];
  const spotlightProduct = productsList[spotlightIdx % totalSpotlightCount] || productsList[0];
  const heroBackgroundImg =
    spotlightProduct?.images?.[0] || spotlightProduct?.image || currentSlide.image;

  const featuredProducts =
    activeTab === "All"
      ? productsList
      : productsList.filter((p) => normalizeCatKey(p.category) === normalizeCatKey(activeTab));

  const newArrivals =
    productsList.filter((p) => p.isNewArrival).length > 0
      ? productsList.filter((p) => p.isNewArrival)
      : productsList.slice(0, 4);

  const lookbookProducts = productsList.slice(0, 3);
  const selectedLookProduct = lookbookProducts[activeHotspot] || productsList[0];

  // Build filter tabs dynamically from live categories + products
  const dynamicCatNames = Array.from(
    new Set(
      categoriesList
        .map((c) => String(c.name || "").trim())
        .filter(Boolean)
        .slice(0, 6)
    )
  );
  const filterTabs = ["All", ...(dynamicCatNames.length > 0 ? dynamicCatNames : ["Women", "Men", "Bags", "Shoes"])];

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="space-y-12 sm:space-y-24 pb-12 sm:pb-20 overflow-hidden">
      {/* =====================================================================
          1. CINEMATIC MULTI-SLIDE HERO SECTION + INTERACTIVE SPOTLIGHT STUDIO
          ===================================================================== */}
      <div>
        <section
          onMouseMove={handleHeroMouseMove}
          className="relative min-h-[420px] sm:min-h-[460px] flex items-center overflow-hidden bg-[#090909] text-white"
        >
          {/* Interactive Cursor Spotlight Glow */}
          <div
            className="pointer-events-none absolute inset-0 z-1 transition-opacity duration-500 hidden lg:block"
            style={{
              background: `radial-gradient(450px circle at ${mousePos.x}% ${mousePos.y}%, rgba(214, 255, 0, 0.1), transparent 65%)`,
            }}
          />

          {/* Animated Crossfading Background Image Synchronized with Live Catalog Spotlight */}
          <AnimatePresence initial={false}>
            <motion.div
              key={`bg-${spotlightProduct?.id || spotlightIdx}`}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 0.52, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-0 transform-gpu"
            >
              <img
                src={heroBackgroundImg}
                alt={spotlightProduct?.name || currentSlide.season}
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Multi-layer luxury vignette gradients */}
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#090909] via-transparent to-black/35" />

          {/* Main Hero Grid Container */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Column: Editorial Headline & CTAs (7 Cols) */}
              <div className="md:col-span-7 text-left space-y-3">
                <motion.div
                  key={`content-${spotlightProduct?.id || spotlightIdx}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-2.5"
                >
                  {/* Top Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black tracking-[0.16em] uppercase text-[#D6FF00]">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                    <span>
                      {spotlightProduct?.category
                        ? `${spotlightProduct.category} COLLECTION • ${currentSlide.season}`
                        : currentSlide.season}
                    </span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-black tracking-[-0.035em] uppercase leading-[1.02] text-white">
                    {currentSlide.headlineTop} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6FF00] via-white to-gray-400">
                      {currentSlide.headlineAccent}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xs sm:text-sm text-gray-300 max-w-md font-light leading-relaxed line-clamp-2">
                    {spotlightProduct?.description
                      ? spotlightProduct.description
                      : currentSlide.subtitle}
                  </p>

                  {/* Action CTAs */}
                  <div className="pt-1 grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                    <Link
                      to={spotlightProduct ? `/shop/${spotlightProduct.id}` : currentSlide.ctaPrimary.link}
                      className="px-3.5 sm:px-5 py-2.5 rounded-full bg-[#D6FF00] hover:bg-[#c6ef00] text-black text-[10px] sm:text-[11px] font-black tracking-wider sm:tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(214,255,0,0.25)] hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1.5 group truncate"
                    >
                      <span className="truncate">
                        {spotlightProduct ? `Shop ${spotlightProduct.name}` : currentSlide.ctaPrimary.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      to="/shop"
                      className="px-3.5 sm:px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 text-[10px] sm:text-[11px] font-black tracking-wider sm:tracking-widest uppercase transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                    >
                      <span>Explore All</span>
                    </Link>
                  </div>
                </motion.div>

                {/* Synchronized Slide & Catalog Spotlight Controls */}
                <div className="pt-1.5 flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                    {productsList.slice(0, 8).map((p, idx) => (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => setSpotlightIdx(idx)}
                        aria-label={`Spotlight ${idx + 1}`}
                        className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                          spotlightIdx % totalSpotlightCount === idx
                            ? "w-5 bg-[#D6FF00]"
                            : "w-1.5 bg-white/30 hover:bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      type="button"
                      onClick={handlePrevSpotlight}
                      aria-label="Previous spotlight"
                      className="w-6 h-6 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSpotlight}
                      aria-label="Next spotlight"
                      className="w-6 h-6 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[9px] font-mono text-white/50 tracking-widest uppercase">
                    0{(spotlightIdx % totalSpotlightCount) + 1} / 0{totalSpotlightCount}
                  </span>
                </div>
              </div>

              {/* Right Column: Compact Glassmorphic Runway Piece Card (5 Cols) */}
              {spotlightProduct && (
                <div className="flex md:col-span-5 justify-center md:justify-end">
                  <div className="w-full max-w-[270px] sm:max-w-[285px] rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#D6FF00] mb-2 px-0.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF00] animate-ping shrink-0" />
                        Live Catalog Spotlight
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={handlePrevSpotlight}
                          className="w-4.5 h-4.5 rounded-full bg-white/10 hover:bg-[#D6FF00] hover:text-black text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Previous Product"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="text-white/70 font-mono text-[9px] px-0.5">
                          {(spotlightIdx % totalSpotlightCount) + 1}/{totalSpotlightCount}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextSpotlight}
                          className="w-4.5 h-4.5 rounded-full bg-white/10 hover:bg-[#D6FF00] hover:text-black text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Next Product"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <Link
                      to={`/shop/${spotlightProduct.id}`}
                      className="block relative aspect-[4/4.1] rounded-xl overflow-hidden bg-gradient-to-b from-neutral-100 via-neutral-200 to-neutral-400 group"
                    >
                      <img
                        key={spotlightProduct.id}
                        src={spotlightProduct.images?.[0] || spotlightProduct.image}
                        alt={spotlightProduct.name}
                        className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[#D6FF00] text-[8px] font-black uppercase tracking-wider border border-white/10">
                          {spotlightProduct.category}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between text-white gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black tracking-tight truncate">
                            {spotlightProduct.name}
                          </h4>
                          <span className="text-[9px] text-emerald-400 font-semibold block">
                            ● In Stock &amp; Ready to Ship
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#D6FF00] text-black font-black text-[10px] shrink-0 shadow-md">
                          {formatPrice(spotlightProduct.price)}
                        </span>
                      </div>
                    </Link>

                    <div className="mt-2.5 flex items-center gap-1.5">
                      <Link
                        to={`/shop/${spotlightProduct.id}`}
                        className="flex-1 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#D6FF00] text-[9px] font-black uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Inspect Piece</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openQuickView(spotlightProduct)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/15 transition-colors cursor-pointer"
                        title="Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Luxury Guarantee Bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-3 text-left"
            >
              <div className="flex items-center gap-2.5 text-white/90">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#D6FF00] shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] leading-tight">
                  <strong className="block font-bold text-white">Complimentary Courier</strong>
                  <span className="text-[9px] text-gray-400">Express dispatch over $200</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#D6FF00] shrink-0">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] leading-tight">
                  <strong className="block font-bold text-white">NBC Bakong KHQR</strong>
                  <span className="text-[9px] text-gray-400">Instant USD &amp; KHR settlement</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#D6FF00] shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] leading-tight">
                  <strong className="block font-bold text-white">100% Authentic Craft</strong>
                  <span className="text-[9px] text-gray-400">Traceable Italian provenance</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#D6FF00] shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] leading-tight">
                  <strong className="block font-bold text-white">30-Day Free Returns</strong>
                  <span className="text-[9px] text-gray-400">Effortless boutique exchange</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===================================================================
            2. INFINITE EDITORIAL RUNWAY MARQUEE TICKER
            =================================================================== */}
        <div className="bg-[#111111] border-t border-white/10 py-3.5 overflow-hidden select-none">
          <div className="animate-marquee flex items-center">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
              <div key={idx} className="flex items-center gap-6 mx-6">
                <span className="w-2 h-2 rounded-full bg-[#D6FF00] shrink-0" />
                <span className="text-[11px] font-black tracking-[0.22em] uppercase text-white/90 whitespace-nowrap">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. CURATED WORLDS — EDITORIAL BENTO DEPARTMENT SHOWCASE
          ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
              Curated Worlds
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-black uppercase">
              Explore by Department
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 hover:border-black text-xs font-extrabold tracking-widest uppercase text-black transition-all shadow-2xs group w-fit"
          >
            <span>View All Collections</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {categoriesList.slice(0, 6).map((cat, idx) => {
            const dynamicCount =
              productsList.filter((p) => normalizeCatKey(p.category) === normalizeCatKey(cat.name))
                .length || cat.itemCount;
            const isHeroTile = idx === 0 || idx === 1;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.38, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={isHeroTile && categoriesList.length <= 4 ? "sm:col-span-1 lg:col-span-1" : ""}
              >
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111111] flex flex-col justify-between p-3.5 sm:p-6 shadow-xs hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 block transform-gpu"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15 group-hover:from-black/95 transition-colors" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[9px] sm:text-[10px] font-black text-[#D6FF00] tracking-wider sm:tracking-widest uppercase">
                      {dynamicCount} {dynamicCount === 1 ? "Piece" : "Pieces"}
                    </span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 group-hover:bg-[#D6FF00] group-hover:border-[#D6FF00] text-white group-hover:text-black flex items-center justify-center transition-all duration-300">
                      <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  <div className="relative z-10 text-white space-y-0.5 sm:space-y-1">
                    <span className="text-[8px] sm:text-[10px] font-bold tracking-[0.16em] sm:tracking-[0.2em] uppercase text-gray-300 block">
                      Dept 0{idx + 1}
                    </span>
                    <h3 className="font-black text-base sm:text-2xl tracking-tight uppercase leading-none truncate">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-[10px] sm:text-xs text-gray-300 line-clamp-1 pt-0.5 font-light hidden xs:block">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* =====================================================================
          4. FEATURED PRODUCTS (WITH INSTANT SPRING-ANIMATED FILTER TABS)
          ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
              Handpicked Essentials
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-black uppercase">
              Featured Products
            </h2>
          </div>

          {/* Animated Motion Filter Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-gray-200/80 shadow-2xs max-w-full overflow-x-auto no-scrollbar sm:flex-wrap sm:w-fit">
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer z-10 shrink-0 whitespace-nowrap ${
                    isActive ? "text-[#D6FF00]" : "text-gray-600 hover:text-black"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="homeActiveTabPill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#111111] -z-10 shadow-sm"
                    />
                  )}
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductGrid products={featuredProducts.slice(0, 8)} columns={4} />
        </motion.div>

        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#111111] hover:bg-black text-white hover:text-[#D6FF00] text-xs font-black tracking-widest uppercase transition-all shadow-md hover:shadow-xl hover:scale-[1.02] group"
          >
            <span>Discover Full Catalog ({productsList.length} Styles)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.section>

      {/* =====================================================================
          5. INTERACTIVE "SHOP THE RUNWAY LOOK" EDITORIAL SPOTLIGHT
          ===================================================================== */}
      {selectedLookProduct && (
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative rounded-3xl overflow-hidden bg-[#111111] text-white grid grid-cols-1 lg:grid-cols-12 min-h-[480px] sm:min-h-[540px] shadow-2xl border border-neutral-800">
            {/* Left Editorial Narrative & Selected Look Product Card (6 Cols) */}
            <div className="lg:col-span-6 p-5 sm:p-10 md:p-14 flex flex-col justify-between space-y-6 sm:space-y-8 z-10">
              <div className="space-y-4">
                <span className="px-3.5 py-1 rounded-full bg-[#D6FF00] text-black font-black text-[11px] tracking-widest uppercase inline-block w-fit">
                  Interactive Lookbook • AW26
                </span>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-[1.02]">
                  Shop The <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6FF00] via-white to-gray-400">
                    Runway Look.
                  </span>
                </h2>

                <p className="text-gray-400 text-xs sm:text-sm font-light leading-relaxed max-w-md">
                  Tap the interactive pins on the lookbook photography or select a numbered look below
                  to inspect thefeatured runway piece in real time.
                </p>
              </div>

              {/* Dynamic Selected Piece Showcase Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedLookProduct.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.35 }}
                  className="p-4 sm:p-5 rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <img
                    src={selectedLookProduct.images?.[0] || selectedLookProduct.image}
                    alt={selectedLookProduct.name}
                    className="w-20 h-24 rounded-xl object-cover bg-neutral-800 shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D6FF00]">
                        Look Pin #{activeHotspot + 1}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold">
                        {selectedLookProduct.category}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                      {selectedLookProduct.name}
                    </h3>
                    <p className="text-sm font-extrabold text-[#D6FF00] mt-1">
                      {formatPrice(selectedLookProduct.price)}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    <Link
                      to={`/shop/${selectedLookProduct.id}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-wider text-center transition-transform hover:scale-105"
                    >
                      Inspect Piece
                    </Link>
                    <button
                      type="button"
                      onClick={() => openQuickView(selectedLookProduct)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Quick View
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Look Selector Pills */}
              <div className="flex items-center gap-2 sm:gap-3 pt-1 overflow-x-auto no-scrollbar max-w-full pb-1">
                {lookbookProducts.map((lp, idx) => (
                  <button
                    key={lp.id}
                    type="button"
                    onClick={() => setActiveHotspot(idx)}
                    className={`px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeHotspot === idx
                        ? "bg-white text-black shadow-md scale-102"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black text-[#D6FF00] text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[95px] sm:max-w-[110px]">{lp.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Interactive Image with Pulsing Hotspot Pins (6 Cols) */}
            <div className="lg:col-span-6 relative min-h-[300px] sm:min-h-[380px] lg:min-h-full overflow-hidden group">
              <AnimatePresence initial={false}>
                <motion.img
                  key={`look-img-${selectedLookProduct.id}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  src={selectedLookProduct.images?.[0] || selectedLookProduct.image}
                  alt={selectedLookProduct.name}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111111] via-black/20 to-transparent" />

              {/* Interactive Hotspot Pins */}
              {[
                { top: "28%", left: "48%" },
                { top: "55%", left: "58%" },
                { top: "76%", left: "44%" },
              ].map((pos, idx) => {
                if (!lookbookProducts[idx]) return null;
                const isSelected = activeHotspot === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveHotspot(idx)}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all cursor-pointer shadow-xl ${
                      isSelected
                        ? "bg-[#D6FF00] text-black scale-125 ring-4 ring-[#D6FF00]/40"
                        : "bg-black/80 text-white hover:bg-[#D6FF00] hover:text-black border border-white/40"
                    }`}
                    title={`Inspect ${lookbookProducts[idx].name}`}
                  >
                    <span>{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* =====================================================================
          6. FRESH RUNWAY DROPS (NEW ARRIVALS)
          ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
              Fresh Runway Drops
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-black uppercase">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold tracking-widest uppercase text-black hover:text-neutral-600 transition-colors flex items-center gap-1.5 group"
          >
            <span>See All ({newArrivals.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <ProductGrid products={newArrivals.slice(0, 4)} columns={4} />
      </motion.section>

      {/* =====================================================================
          7. ATELIER HOUSE PHILOSOPHY & ARCHITECTURAL METRICS
          ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-white border border-gray-200/80 p-5 sm:p-12 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#111111] text-[#D6FF00] flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-lg sm:text-3xl font-black text-black block pt-1">
                100% Traceable
              </span>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-900">
                OEKO-TEX® Fabrics
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
                Every virgin wool, organic silk, and calfskin hide is ethically sourced from family-owned mills in Biella and Florence.
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#111111] text-[#D6FF00] flex items-center justify-center">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-lg sm:text-3xl font-black text-black block pt-1">
                Instant KHQR
              </span>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-900">
                NBC Bakong Direct
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
                Seamless dual-currency ($ USD &amp; ៛ KHR) EMVCo QR settlement with real-time cryptographic verification and thermal receipts.
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#111111] text-[#D6FF00] flex items-center justify-center">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-lg sm:text-3xl font-black text-black block pt-1">
                24h Dispatch
              </span>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-900">
                Global Courier
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
                Orders are inspected, steamed, and sealed in signature garment vaults with live milestone tracking from warehouse to door.
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#111111] text-[#D6FF00] flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-lg sm:text-3xl font-black text-black block pt-1">
                4.9 / 5.0 ★
              </span>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-900">
                Patron Satisfaction
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
                Trusted by discerning collectors across Paris, Phnom Penh, Tokyo, and New York with 24/7 private styling support.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          8. REAL CLIENT REVIEWS / TESTIMONIALS (FROM SUPABASE)
          ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
            Verified Customer Feedback
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-black uppercase">
            What Our Patrons Say
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-sm font-semibold text-black">
            <div className="flex text-black">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-black stroke-black" />
              ))}
            </div>
            <span>
              {realReviews.length > 0
                ? `${(realReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / realReviews.length).toFixed(1)} / 5.0 Average Rating across ${realReviews.length} ${realReviews.length === 1 ? "Real Customer Review" : "Real Customer Reviews"}`
                : "100% Authentic Customer Reviews from Verified Patrons"}
            </span>
          </div>
        </div>

        {realReviews.length === 0 ? (
          <div className="max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl bg-white border border-dashed border-gray-200 text-center space-y-4">
            <p className="text-sm sm:text-base font-bold text-black">
              No customer reviews have been submitted yet
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              We only display real, unedited reviews submitted by our customers. Visit any product page to share your review and see it featured here live!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111111] text-[#D6FF00] text-xs font-black uppercase tracking-wider hover:bg-black transition-all"
            >
              <span>Browse Products & Write a Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {realReviews.slice(0, 8).map((rev, idx) => {
              const authorName = rev.authorName || rev.author || "Customer";
              const avatarUrl = rev.authorAvatar || rev.avatar || "";
              return (
                <motion.div
                  key={rev.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs hover:shadow-xl flex flex-col justify-between hover:border-gray-200 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.floor(Number(rev.rating) || 5)
                                ? "fill-black stroke-black"
                                : "fill-gray-200 stroke-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{rev.date || "Recently"}</span>
                    </div>

                    {rev.productName && (
                      <Link
                        to={rev.productId ? `/product/${rev.productId}` : "/shop"}
                        className="inline-block text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-black bg-gray-100 px-2.5 py-1 rounded-full mb-3 transition-colors"
                      >
                        {rev.productName}
                      </Link>
                    )}

                    <p className="text-xs text-gray-700 leading-relaxed italic mb-6">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={authorName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#111111] text-[#D6FF00] font-black text-xs flex items-center justify-center uppercase shrink-0">
                        {authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-black">{authorName}</h4>
                      <span className="text-[10px] font-semibold text-emerald-600 block">
                        {rev.isVerifiedBuyer ? "✓ Verified Buyer" : "✓ Real Customer Review"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>
    </div>
  );
};
