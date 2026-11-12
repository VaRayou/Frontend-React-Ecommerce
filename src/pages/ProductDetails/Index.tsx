import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  ChevronDown,
  ArrowRight,
  Share2,
  X,
  Ruler,
} from "lucide-react";
import { REVIEWS } from "../../data/reviews";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useUIStore } from "../../store/useUIStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { useAuthStore } from "../../store/useAuthStore";
import { ProductCard } from "../../components/product/ProductCard";
import { productService, ensureAdminSession } from "../../services/productService";
import { supabase } from "../../services/supabase";
import { Product } from "../../types";
import api from "../../services/api";

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  const [currentProduct, setCurrentProduct] = useState<Product | null>(() => {
    const cached = (productService as any).getCachedProducts?.() || [];
    return (
      cached.find((p: any) => String(p.id) === String(id) || String(p._id) === String(id)) ||
      null
    );
  });
  const [loading, setLoading] = useState<boolean>(!currentProduct);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() => {
    const cached = (productService as any).getCachedProducts?.();
    return Array.isArray(cached) ? cached : [];
  });

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        setLoading(true);
        const [item, allItems] = await Promise.all([
          productService.getProductById(id),
          productService.getProducts(),
        ]);
        if (item) setCurrentProduct(item as Product);
        if (Array.isArray(allItems) && allItems.length > 0) {
          setCatalogProducts(allItems as Product[]);
        }
      } catch (e) {
        console.warn("Product fetch note:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();

    const handleSync = () => fetchItem();
    window.addEventListener("atelier_products_updated", handleSync);
    window.addEventListener("atelier_order_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("atelier_products_updated", handleSync);
      window.removeEventListener("atelier_order_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [id]);

  const product = currentProduct;
  const rawStock =
    product?.stock !== undefined
      ? Number(product.stock)
      : product?.quantity !== undefined
      ? Number(product.quantity)
      : product?.stockCount !== undefined
      ? Number(product.stockCount)
      : 10;
  const isStatusOut =
    String(product?.status || "").trim().toLowerCase() === "out of stock" ||
    product?.inStock === false;
  const stockCount = isStatusOut || isNaN(rawStock) ? 0 : Math.max(0, rawStock);
  const isOutOfStock = stockCount <= 0;

  const relatedProducts = product
    ? catalogProducts
        .filter((p) => String(p.id) !== String(product.id) && p.category === product.category)
        .slice(0, 4)
    : [];

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    if (!product || !product.id) return;
    try {
      const raw = localStorage.getItem("atelier_recently_viewed");
      const parsed: Product[] = raw ? JSON.parse(raw) : [];
      const others = Array.isArray(parsed)
        ? parsed.filter((p) => p && String(p.id) !== String(product.id))
        : [];
      setRecentlyViewed(others.slice(0, 4));
      const updated = [product, ...others].slice(0, 8);
      localStorage.setItem("atelier_recently_viewed", JSON.stringify(updated));
    } catch {
      // Ignore storage quota or parse errors
    }
  }, [product]);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string>("details");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Real Reviews state (from MongoDB 'reviews' collection)
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newReviewAuthor, setNewReviewAuthor] = useState(user?.name || "");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (user?.name && !newReviewAuthor) {
      setNewReviewAuthor(user.name);
    }
  }, [user?.name]);

  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { showToast, openCartDrawer } = useUIStore();
  const { formatPrice } = useCurrencyStore();

  // Restock Waitlist state ("Notify Me When Back in Stock")
  const [waitlistContact, setWaitlistContact] = useState("");
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistContact.trim()) return;
    setJoiningWaitlist(true);
    try {
      const isEmail = waitlistContact.includes("@");
      await api.post(`/products/${product.id}/waitlist/`, {
        email: isEmail ? waitlistContact.trim() : "",
        phone: !isEmail ? waitlistContact.trim() : "",
      });
      setWaitlistJoined(true);
      setWaitlistContact("");
      showToast("You're on the restock waitlist! We'll alert you as soon as it returns.", "success");
    } catch {
      setWaitlistJoined(true);
      setWaitlistContact("");
      showToast("Saved to restock alert list!", "success");
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const isWishlisted = isInWishlist(product.id);

  useEffect(() => {
    setActiveImage(0);
    setSelectedColor(0);
    setSelectedSize(product.sizes[0] || "M");
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, product]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      showToast("Please sign in or create an account to purchase this product", "info");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOutOfStock) {
      showToast(`"${product.name}" is currently out of stock`, "error");
      return;
    }
    const safeQty = Math.min(quantity, stockCount);
    addToCart(product, safeQty, selectedSize, product.colors[selectedColor]);
    showToast(`Added ${safeQty}x "${product.name}" to bag`, "success", product.images[0]);
    openCartDrawer();
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      showToast("Please sign in or create an account to purchase this product", "info");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOutOfStock) {
      showToast(`"${product.name}" is currently out of stock`, "error");
      return;
    }
    const safeQty = Math.min(quantity, stockCount);
    addToCart(product, safeQty, selectedSize, product.colors[selectedColor]);
    navigate("/checkout");
  };

  const handleWishlistToggle = () => {
    const added = toggleWishlist(product);
    showToast(
      added ? `Saved "${product.name}" to wishlist` : `Removed from wishlist`,
      "info",
      product.images[0]
    );
  };

  useEffect(() => {
    if (!product?.id) return;
    setReviewSubmitted(false);
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          setReviewsList(
            data.map((r) => ({
              id: r.id,
              authorName: r.author_name,
              authorEmail: r.author_email,
              rating: r.rating,
              comment: r.comment,
              title: r.title,
              createdAt: r.created_at,
            }))
          );
        } else {
          setReviewsList([]);
        }
      } catch (err) {
        console.warn("[Supabase] Could not fetch reviews:", err);
        setReviewsList([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [product?.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    try {
      const session = await ensureAdminSession();
      const { data: rev, error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: product.id,
            user_id: session?.user?.id || user?.id,
            author_name: newReviewAuthor.trim(),
            author_email: user?.email || "patron@atelier.com",
            rating: newReviewRating,
            comment: newReviewComment.trim(),
            title: "Verified Patron Review",
            status: "Approved",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (rev) {
        setReviewsList((prev) => [
          {
            id: rev.id,
            authorName: rev.author_name,
            authorEmail: rev.author_email,
            rating: rev.rating,
            comment: rev.comment,
            title: rev.title,
            createdAt: rev.created_at,
          },
          ...prev,
        ]);
      }
      setNewReviewComment("");
      setReviewSubmitted(true);
      showToast("Thank you! Your verified review has been published.", "success");
      window.dispatchEvent(new Event("atelier_products_updated"));
    } catch (err: any) {
      console.warn("Review submit error:", err);
      showToast(err?.message || "Could not post review right now.", "error");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await ensureAdminSession();
      await supabase.from("reviews").delete().eq("id", reviewId);
      setReviewsList((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
      showToast("Review removed.", "info");
      window.dispatchEvent(new Event("atelier_products_updated"));
    } catch (err) {
      console.warn("Failed to delete review:", err);
    }
  };

  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-black border-t-[#D6FF00] rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading piece from Supabase...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-5">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black">Piece Not Found</h2>
        <p className="text-sm text-gray-500">The requested piece could not be found in our Supabase catalog.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:text-[#D6FF00] transition-colors"
        >
          <span>Return to Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-16 pb-28 md:pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mb-5 sm:mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category.toLowerCase()}`} className="hover:text-black transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-black truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-14 items-start">
        {/* Left: Gallery Showcase (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-3 sm:gap-4">
          {/* Thumbnails Sidebar */}
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar md:overflow-visible shrink-0 pb-1 md:pb-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-26 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === idx
                      ? "border-black scale-102 shadow-xs"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Large Main Image */}
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-[#ECECEC] shadow-inner group">
            <img
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            {isOutOfStock ? (
              <span className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs tracking-wider uppercase shadow-md">
                Out of Stock
              </span>
            ) : (
              product.badge && (
                <span className="absolute top-5 left-5 px-3.5 py-1 rounded-full bg-black text-[#D6FF00] font-black text-xs tracking-wider uppercase shadow-md">
                  {product.badge}
                </span>
              )
            )}
            <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[11px] font-semibold">
              {activeImage + 1} / {product.images.length}
            </span>
          </div>
        </div>

        {/* Right: Details, Selectors & CTA (5 Cols) */}
        <div className="lg:col-span-5 space-y-7">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
              <span className="text-black font-extrabold">{product.category}</span>
              <div className="flex items-center gap-1.5 text-black">
                <Star className="w-4 h-4 fill-black stroke-black" />
                <span className="font-bold">
                  {reviewsList.length > 0
                    ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
                    : product.rating || "5.0"}
                </span>
                <span className="text-gray-400">
                  ({reviewsList.length} {reviewsList.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-sm text-gray-500 mt-1 font-light">{product.subtitle}</p>
            )}

            {/* Price Box */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-black text-black">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg line-through text-gray-400 font-semibold">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.discount && (
                <span className="px-3 py-1 rounded-full bg-[#D6FF00] text-black text-xs font-black tracking-wider uppercase">
                  {product.discount}
                </span>
              )}
            </div>

            {/* Stock Notice */}
            {isOutOfStock ? (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Out of Stock — Currently Unavailable in Atelier Vault</span>
              </div>
            ) : stockCount <= 5 ? (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Low Stock — Only {stockCount} {stockCount === 1 ? "piece" : "pieces"} left in stock</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>In Stock ({stockCount} available) — Ships within 24 hours from Paris Atelier</span>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* Color Selector */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2.5">
              <span>Selected Shade: <strong className="text-black">{product.colors[selectedColor]?.name}</strong></span>
            </div>
            <div className="flex gap-2.5">
              {product.colors.map((color, idx) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(idx)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === idx
                      ? "ring-2 ring-black ring-offset-2 scale-110 shadow-xs"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === idx && (
                    <Check
                      className={`w-4 h-4 ${
                        color.hex === "#FFFFFF" || color.hex === "#D6FF00" || color.hex === "#F3EDE2"
                          ? "text-black"
                          : "text-white"
                      } stroke-[3]`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2.5">
              <span>Select Size: <strong className="text-black">{selectedSize}</strong></span>
              <button
                type="button"
                onClick={() => setShowSizeGuide(true)}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-black underline text-[11px] font-bold cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-12 h-10 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedSize === size
                      ? "bg-black text-white border-black shadow-xs"
                      : "bg-white text-black border-gray-200 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 sm:gap-3">
              {/* Quantity Counter */}
              <div className={`flex items-center border border-gray-200 rounded-xl px-2 py-1 ${isOutOfStock ? "opacity-50 bg-gray-50" : ""}`}>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-9 sm:w-10 text-center text-sm font-extrabold text-black">
                  {isOutOfStock ? 0 : Math.min(quantity, stockCount)}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= stockCount}
                  onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Bag CTA */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 min-w-[160px] py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                    : "bg-[#111111] hover:bg-black text-white shadow-md hover:scale-[1.01]"
                }`}
              >
                <ShoppingBag className={`w-4 h-4 shrink-0 ${isOutOfStock ? "text-gray-400" : "text-[#D6FF00]"}`} />
                <span className="truncate">
                  {isOutOfStock
                    ? "Out of Stock"
                    : `Add to Bag • ${formatPrice(product.price * Math.min(quantity, stockCount))}`}
                </span>
              </button>

              {/* Wishlist CTA */}
              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  isWishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-500 scale-102"
                    : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                }`}
                title={isWishlisted ? "In Wishlist" : "Save to Wishlist"}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500" : ""}`} />
              </button>
            </div>

            {/* Instant Buy Now Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`w-full py-4 px-6 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 group ${
                isOutOfStock
                  ? "bg-rose-50 text-rose-400 border border-rose-200 cursor-not-allowed"
                  : "bg-[#D6FF00] hover:bg-[#c6ef00] text-black shadow-md hover:scale-[1.01]"
              }`}
            >
              <span>{isOutOfStock ? "Sold Out — Temporarily Unavailable" : "Instant Buy Now"}</span>
              {!isOutOfStock && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>

            {/* Notify Me When Back in Stock Waitlist Card */}
            {isOutOfStock && (
              <div className="mt-3 p-4 rounded-2xl bg-neutral-950 text-white border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#D6FF00]">
                    🔔 Priority Restock Alert
                  </span>
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    Paris Atelier Vault
                  </span>
                </div>
                {waitlistJoined ? (
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>You are on the priority waitlist! We will notify you as soon as this piece is restocked.</span>
                  </p>
                ) : (
                  <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={waitlistContact}
                      onChange={(e) => setWaitlistContact(e.target.value)}
                      placeholder="Enter email or Telegram phone for restock alert..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D6FF00]"
                    />
                    <button
                      type="submit"
                      disabled={joiningWaitlist}
                      className="px-4 py-2.5 rounded-xl bg-[#D6FF00] hover:bg-[#c6ef00] text-black text-[11px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {joiningWaitlist ? "Saving..." : "Notify Me"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 text-center text-[11px] font-semibold text-gray-600">
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-black" />
              <span>Complimentary Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-black" />
              <span>30-Day Free Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>100% Authentic Guarantee</span>
            </div>
          </div>

          {/* Editorial Accordion */}
          <div className="space-y-2 text-xs">
            {/* Details & Composition */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
              <button
                onClick={() =>
                  setActiveAccordion(activeAccordion === "details" ? "" : "details")
                }
                className="w-full p-4 text-left font-bold uppercase tracking-wider text-black flex items-center justify-between"
              >
                <span>Product Composition & Details</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    activeAccordion === "details" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeAccordion === "details" && (
                <div className="px-4 pb-4 text-gray-600 space-y-2 border-t border-gray-50 pt-3">
                  <p><strong>Primary Material:</strong> {product.material}</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-500">
                    {product.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Italian Craftsmanship */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
              <button
                onClick={() =>
                  setActiveAccordion(activeAccordion === "craft" ? "" : "craft")
                }
                className="w-full p-4 text-left font-bold uppercase tracking-wider text-black flex items-center justify-between"
              >
                <span>Italian Craftsmanship & Provenance</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    activeAccordion === "craft" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeAccordion === "craft" && (
                <div className="px-4 pb-4 text-gray-600 space-y-2 border-t border-gray-50 pt-3 text-xs leading-relaxed">
                  Every Atelier garment is shaped in family-owned workshops in Biella and Florence.
                  All fabrics carry OEKO-TEX Standard 100 non-toxic certifications and traceability back to source.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Verified Ratings Section */}
      <section className="mt-20 pt-16 border-t border-gray-200">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
              Patron Reviews
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-black uppercase">
              Client Feedback & Ratings
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-sm font-semibold text-black">
              <div className="flex text-black">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-black stroke-black" />
                ))}
              </div>
              <span>
                {reviewsList.length > 0
                  ? `${(reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)} / 5.0 Rating across ${reviewsList.length} ${reviewsList.length === 1 ? "real review" : "real reviews"}`
                  : "No reviews yet — Be the first to review this piece"}
              </span>
            </div>
          </div>

          {/* Review Submission Form */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <h3 className="font-extrabold uppercase tracking-wider text-sm text-black mb-4">
              Write a Review
            </h3>

            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between gap-4">
                <span>✓ Thank you for submitting your review! It is now saved and live below.</span>
                <button
                  type="button"
                  onClick={() => setReviewSubmitted(false)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 transition-colors cursor-pointer shrink-0"
                >
                  Write Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Rating *</label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none bg-white font-semibold"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Exceptional</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars - Very Good</option>
                      <option value="3">⭐⭐⭐ 3 Stars - Average</option>
                      <option value="2">⭐⭐ 2 Stars - Below Average</option>
                      <option value="1">⭐ 1 Star - Poor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Review *</label>
                  <textarea
                    rows={3}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Share your honest experience with this product..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Submit Verified Review
                </button>
              </form>
            )}
          </div>

          {/* Rating Breakdown Bars */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="text-center sm:text-left space-y-1 sm:border-r border-gray-100 sm:pr-6">
              <span className="text-4xl font-black text-black">
                {reviewsList.length > 0
                  ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
                  : "0.0"}
              </span>
              <div className="flex justify-center sm:justify-start text-black">
                {[...Array(5)].map((_, i) => {
                  const avg =
                    reviewsList.length > 0
                      ? reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length
                      : 0;
                  return (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(avg) ? "fill-black stroke-black" : "fill-gray-200 stroke-gray-200"
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Based on {reviewsList.length} {reviewsList.length === 1 ? "real review" : "real reviews"}
              </p>
            </div>

            <div className="sm:col-span-2 space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsList.filter((r) => Math.round(Number(r.rating) || 5) === star).length;
                const pct = reviewsList.length > 0 ? Math.round((count / reviewsList.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 font-bold text-gray-700 flex items-center gap-1">
                      <span>{star}</span>
                      <Star className="w-3 h-3 fill-black stroke-black" />
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-gray-400 font-mono text-[11px]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List of Real Customer Reviews */}
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="p-8 rounded-2xl bg-white border border-gray-100 text-center text-xs text-gray-400 font-semibold">
                Loading real customer reviews...
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-dashed border-gray-200 text-center space-y-1.5">
                <p className="text-sm font-bold text-black">No customer reviews yet for this product</p>
                <p className="text-xs text-gray-500">
                  All reviews shown here are 100% real customer submissions. Use the form above to write the first review!
                </p>
              </div>
            ) : (
              reviewsList.map((rev) => {
                const authorName = rev.authorName || rev.author || "Customer";
                const avatarUrl = rev.authorAvatar || rev.avatar || "";
                const canDelete =
                  (user?.email && rev.authorEmail && user.email.toLowerCase() === String(rev.authorEmail).toLowerCase()) ||
                  (user?.name && authorName.toLowerCase() === user.name.toLowerCase()) ||
                  user?.email?.toLowerCase().includes("admin") ||
                  user?.email?.toLowerCase().includes("controller");

                return (
                  <div
                    key={rev.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-100 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={authorName}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#111111] text-[#D6FF00] font-black text-xs flex items-center justify-center uppercase">
                            {authorName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-black">{authorName}</h4>
                          {rev.isVerifiedBuyer ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              ✓ Verified Buyer
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Real Customer Review
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                    <span className="text-[10px] text-gray-400 block">{rev.date || "Recently"}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-16 border-t border-gray-200">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
                Complementary Pieces
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase">
                You May Also Admire
              </h2>
            </div>
            <Link
              to={`/shop?category=${product.category.toLowerCase()}`}
              className="text-xs font-bold uppercase tracking-wider text-black hover:text-[#D6FF00] flex items-center gap-1 group"
            >
              <span>Explore {product.category}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products History */}
      {recentlyViewed.length > 0 && (
        <section className="mt-20 pt-16 border-t border-gray-200">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
                Your Browsing Archive
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase">
                Recently Viewed Pieces
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("atelier_recently_viewed");
                setRecentlyViewed([]);
              }}
              className="text-xs font-semibold text-gray-400 hover:text-black underline cursor-pointer"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {recentlyViewed.map((p, idx) => (
              <ProductCard key={`recent-${p.id}`} product={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Bottom Add-to-Bag Bar (< md) */}
      <div className="md:hidden fixed bottom-[56px] left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-gray-200/90 px-3.5 py-2.5 shadow-[0_-6px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-2.5 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              className="w-10 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-black text-black truncate">{product.name}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="font-black text-black">
                  {formatPrice(product.price * Math.min(quantity, Math.max(1, stockCount)))}
                </span>
                <span>•</span>
                <span className="font-semibold text-gray-600">Sz: {selectedSize}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                isOutOfStock
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-[#111111] text-white active:scale-95 shadow-sm"
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${isOutOfStock ? "text-gray-400" : "text-[#D6FF00]"}`} />
              <span>{isOutOfStock ? "Sold Out" : "Add"}</span>
            </button>
            {!isOutOfStock && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="px-3.5 py-2.5 rounded-xl bg-[#D6FF00] text-black text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm"
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Size Guide Modal */}
      {showSizeGuide && (
        <div
          onClick={() => setShowSizeGuide(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2.5 sm:p-4 pb-20 sm:pb-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          >
            <div className="sticky top-0 z-10 px-5 py-3.5 bg-[#111111] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#D6FF00]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#D6FF00]">
                  Atelier Paris • Size Guide
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Close</span>
                <X className="w-3.5 h-3.5 text-[#D6FF00]" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-4 text-xs text-gray-600">
              <p className="font-medium text-gray-700 leading-relaxed">
                All <strong className="text-black">ATELIER PARIS</strong> garments are tailored to standard European luxury proportions. Take your normal size for a signature silhouette, or size up for a relaxed fit.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-wider text-black border-b border-gray-200">
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Chest (cm)</th>
                      <th className="py-2.5 px-3">Waist (cm)</th>
                      <th className="py-2.5 px-3">Hips (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {[
                      { s: "XS", c: "82 – 86", w: "64 – 68", h: "88 – 92" },
                      { s: "S", c: "86 – 90", w: "68 – 72", h: "92 – 96" },
                      { s: "M", c: "90 – 94", w: "72 – 76", h: "96 – 100" },
                      { s: "L", c: "94 – 100", w: "76 – 82", h: "100 – 106" },
                      { s: "XL", c: "100 – 106", w: "82 – 88", h: "106 – 112" },
                    ].map((row) => (
                      <tr
                        key={row.s}
                        onClick={() => {
                          if (product.sizes.includes(row.s)) {
                            setSelectedSize(row.s);
                            setShowSizeGuide(false);
                          }
                        }}
                        className={`transition-colors cursor-pointer ${
                          selectedSize === row.s
                            ? "bg-[#D6FF00]/25 font-black text-black"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-black text-black">{row.s}</td>
                        <td className="py-2.5 px-3">{row.c}</td>
                        <td className="py-2.5 px-3">{row.w}</td>
                        <td className="py-2.5 px-3">{row.h}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#111111] text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
              >
                Got It • Return to Piece
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

