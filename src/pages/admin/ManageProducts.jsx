import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FolderOpen,
  X,
  ExternalLink,
  Layers,
  Check,
  Download,
  Send,
  Palette,
  Scissors,
  ShieldCheck,
  Heart,
  ShoppingBag,
  Star,
} from "lucide-react";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import { telegramService } from "../../services/telegramService";
import { supabase } from "../../services/supabase";
import { soundEffects } from "../../utils/soundEffects";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

// Curated high-res luxury runway fashion presets
const PRESET_IMAGES = [
  {
    name: "Cashmere Double-Breasted Coat",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Architectural Wool Blazer",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Silk Satin Slip Dress",
    url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Sculptural Leather Chelsea Boots",
    url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Structured Calfskin Tote Bag",
    url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Minimalist Oversized Poplin Shirt",
    url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Tailored Wide-Leg Pleated Trousers",
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Handcrafted Gold Statement Ring",
    url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80",
  },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80";

const LUXURY_PALETTES = [
  { name: "Obsidian Black", hex: "#111111" },
  { name: "Chalk Ecru", hex: "#F3EDE2" },
  { name: "Slate Anthracite", hex: "#334155" },
  { name: "Camel Tan", hex: "#C19A6B" },
  { name: "Royal Navy", hex: "#1E293B" },
  { name: "Olive Drab", hex: "#556B2F" },
  { name: "Bordeaux Crimson", hex: "#7F1D1D" },
  { name: "Studio Lime", hex: "#D6FF00" },
  { name: "Pure White", hex: "#FFFFFF" },
];

const SIZE_PRESETS = {
  apparel: ["XS", "S", "M", "L", "XL", "XXL"],
  footwear: ["38", "39", "40", "41", "42", "43", "44"],
  accessories: ["One Size"],
};

const BADGE_OPTIONS = [
  { value: "NONE", label: "No Badge", pill: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  { value: "HOT", label: "⚡ HOT", pill: "bg-[#D6FF00] text-black font-black hover:bg-[#c6ef00]" },
  { value: "NEW", label: "✨ NEW", pill: "bg-black text-[#D6FF00] font-black hover:bg-neutral-800" },
  { value: "SALE", label: "🏷️ SALE", pill: "bg-rose-500 text-white font-black hover:bg-rose-600" },
  { value: "LIMITED", label: "👑 LIMITED", pill: "bg-amber-400 text-black font-black hover:bg-amber-500" },
  { value: "BEST SELLER", label: "⭐ BEST SELLER", pill: "bg-neutral-900 text-white font-black hover:bg-black" },
];

const INITIAL_PRODUCT_FORM = {
  name: "",
  subtitle: "",
  category: "Women",
  brand: "ATELIER",
  price: "",
  originalPrice: "",
  discount: "",
  stock: "15",
  image: "",
  images: [],
  status: "Active",
  badge: "NEW",
  colors: [
    { name: "Obsidian Black", hex: "#111111" },
    { name: "Chalk Ecru", hex: "#F3EDE2" },
  ],
  sizes: ["XS", "S", "M", "L", "XL"],
  material: "Virgin Wool & Mulberry Silk",
  details: [
    "Bespoke Italian architectural tailoring",
    "Refined tactile hand-finished seams",
    "Sustainable natural fiber composition",
  ],
  description: "",
  isFeatured: true,
  isRecommended: true,
  isNewArrival: true,
};

export function ManageProducts() {
  const cachedProds = productService.getCachedProducts();
  const cachedCats = categoryService.getCachedCategories();

  const [products, setProducts] = useState(cachedProds);
  const [categories, setCategories] = useState(cachedCats);
  const [loading, setLoading] = useState(cachedProds.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState(INITIAL_PRODUCT_FORM);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#111111");
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customDetailInput, setCustomDetailInput] = useState("");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'active' | 'low' | 'out'
  const [restockingId, setRestockingId] = useState(null);
  const [sendingTelegramAudit, setSendingTelegramAudit] = useState(false);

  const handleSendTelegramAudit = async () => {
    setSendingTelegramAudit(true);
    try {
      const res = await telegramService.sendInventoryAuditReport(products);
      if (res.ok) {
        showNotification(
          `Inventory Audit sent to Telegram (${res.lowCount} Low Stock, ${res.outCount} Out of Stock)`
        );
      } else {
        showNotification(
          `Telegram Notice: ${res.description || "Check Bot Token & Chat ID in Settings"}`
        );
      }
    } finally {
      setSendingTelegramAudit(false);
    }
  };

  const handleSendItemAlert = async (item) => {
    const qty = Number(item.stock ?? item.quantity ?? 0);
    const res = await telegramService.sendLowStockAlert({
      productName: item.name,
      remainingStock: qty,
      productId: item.id || item._id,
      category: item.category,
      brand: item.brand,
      price: Number(item.price || 0),
      triggerSource: "Manual Admin Inventory Alert",
      forceSend: true,
    });
    if (res.ok) {
      showNotification(`Low-stock alert for "${item.name}" sent to Telegram!`);
    } else {
      showNotification(`Telegram Error: ${res.description || "Check Settings"}`);
    }
  };

  const handleQuickRestock = async (item, addQty = 5) => {
    const prodId = item.id || item._id;
    const currStock = Number(item.stock ?? item.quantity ?? 0);
    const nextStock = Math.max(0, currStock + addQty);
    const nextStatus = nextStock <= 0 ? "Out of Stock" : "Active";
    setRestockingId(prodId);
    try {
      await productService.updateProduct(prodId, {
        ...item,
        stock: nextStock,
        quantity: nextStock,
        status: nextStatus,
      });
      showNotification(
        nextStock > 0
          ? `Restocked "${item.name}" → ${nextStock} in stock (${nextStatus})`
          : `"${item.name}" marked Out of Stock (0 units)`
      );
      await loadData();
    } catch (err) {
      alert("Quick restock failed: " + (err.response?.data?.error || err.message));
    } finally {
      setRestockingId(null);
    }
  };

  // Image Upload State
  const fileInputRef = useRef(null);
  const [imageTab, setImageTab] = useState("upload"); // 'upload' | 'preset' | 'url'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      alert("No products available to export.");
      return;
    }

    const headers = [
      "Product ID",
      "Title",
      "Category",
      "Brand",
      "Price (USD)",
      "Price (KHR)",
      "Stock",
      "Status",
      "Rating",
      "Reviews Count",
      "Image URL",
      "Source",
    ];

    const escapeCell = (val) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = products.map((p) => {
      const priceUSD = Number(p.price || 0);
      const priceKHR = Math.round(priceUSD * 4100);
      const stock = Number(p.stock ?? p.quantity ?? 10);
      return [
        escapeCell(p.id || p._id),
        escapeCell(p.name),
        escapeCell(p.category || "Electronics"),
        escapeCell(p.brand || "E-Shopper"),
        escapeCell(priceUSD.toFixed(2)),
        escapeCell(priceKHR.toLocaleString()),
        escapeCell(stock),
        escapeCell(p.status || (stock > 0 ? "Active" : "Out of Stock")),
        escapeCell(Number(p.rating || 5.0).toFixed(1)),
        escapeCell(p.reviewsCount || p.reviews_count || 0),
        escapeCell(p.image || (p.images && p.images[0]) || ""),
        escapeCell(p.source || "supabase"),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `Atelier_Catalog_Inventory_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Exported ${products.length} catalog items to CSV successfully`);
  };

  const loadData = async (silent = false) => {
    if (!silent && products.length === 0) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [prodList, catList] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(prodList || []);
      setCategories(catList || []);
    } catch (err) {
      console.error("Failed to load products/categories:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadData(cachedProds.length > 0);

    const handleSync = () => {
      if (active) loadData(true);
    };
    window.addEventListener("atelier_products_updated", handleSync);
    window.addEventListener("storage", handleSync);

    // Live Supabase Realtime WebSocket subscription for instant inventory & catalog sync
    const productsChannel = supabase
      .channel("admin_products_realtime_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "INSERT") {
            soundEffects.playOrderChime();
            showNotification(`✨ New piece added to catalog: "${payload.new?.name || "Product"}"`);
          } else if (payload.eventType === "UPDATE") {
            const pName = payload.new?.name || "Product";
            const stock = payload.new?.stock;
            if (stock !== undefined && Number(stock) <= 5) {
              soundEffects.playOrderChime();
            }
            showNotification(
              `📦 Inventory Synced: "${pName}" (${stock !== undefined ? stock + " units" : "Updated"})`
            );
          } else if (payload.eventType === "DELETE") {
            showNotification(`🗑 Product removed from cloud database`);
          }
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("atelier_products_updated", handleSync);
      window.removeEventListener("storage", handleSync);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const handleToggleColorPreset = (preset) => {
    setFormData((prev) => {
      const exists = (prev.colors || []).some(
        (c) => c.hex.toLowerCase() === preset.hex.toLowerCase() || c.name.toLowerCase() === preset.name.toLowerCase()
      );
      if (exists) {
        return {
          ...prev,
          colors: (prev.colors || []).filter(
            (c) => c.hex.toLowerCase() !== preset.hex.toLowerCase() && c.name.toLowerCase() !== preset.name.toLowerCase()
          ),
        };
      } else {
        return {
          ...prev,
          colors: [...(prev.colors || []), preset],
        };
      }
    });
  };

  const handleAddCustomColor = () => {
    const cleanName = customColorName.trim();
    if (!cleanName) return;
    setFormData((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: cleanName, hex: customColorHex }],
    }));
    setCustomColorName("");
    setCustomColorHex("#111111");
  };

  const handleRemoveColor = (idx) => {
    setFormData((prev) => ({
      ...prev,
      colors: (prev.colors || []).filter((_, i) => i !== idx),
    }));
  };

  const handleToggleSize = (size) => {
    setFormData((prev) => {
      const exists = (prev.sizes || []).includes(size);
      if (exists) {
        return {
          ...prev,
          sizes: (prev.sizes || []).filter((s) => s !== size),
        };
      } else {
        return {
          ...prev,
          sizes: [...(prev.sizes || []), size],
        };
      }
    });
  };

  const handleApplySizePreset = (presetKey) => {
    if (SIZE_PRESETS[presetKey]) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...SIZE_PRESETS[presetKey]],
      }));
    }
  };

  const handleAddCustomSize = (e) => {
    if (e) e.preventDefault();
    const clean = customSizeInput.trim().toUpperCase();
    if (!clean) return;
    if (!(formData.sizes || []).includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...(prev.sizes || []), clean],
      }));
    }
    setCustomSizeInput("");
  };

  const handleAddDetail = (e) => {
    if (e) e.preventDefault();
    const clean = customDetailInput.trim();
    if (!clean) return;
    setFormData((prev) => ({
      ...prev,
      details: [...(prev.details || []), clean],
    }));
    setCustomDetailInput("");
  };

  const handleRemoveDetail = (idx) => {
    setFormData((prev) => ({
      ...prev,
      details: (prev.details || []).filter((_, i) => i !== idx),
    }));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormData({
      ...INITIAL_PRODUCT_FORM,
      category: categories[0]?.name || "Women",
    });
    setImageTab("upload");
    setCustomColorName("");
    setCustomColorHex("#111111");
    setCustomSizeInput("");
    setCustomDetailInput("");
    setErrors({});
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    const existingImgs = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

    setFormData({
      name: product.name || "",
      subtitle: product.subtitle || "",
      category: product.category || categories[0]?.name || "Women",
      brand: product.brand || "ATELIER",
      price: product.price !== undefined ? String(product.price) : "",
      originalPrice: product.originalPrice !== undefined ? String(product.originalPrice) : "",
      discount: product.discount || "",
      stock:
        product.stock !== undefined
          ? String(product.stock)
          : product.quantity !== undefined
          ? String(product.quantity)
          : "10",
      image: product.image || existingImgs[0] || "",
      images: existingImgs,
      status: product.status || "Active",
      badge: product.badge || "NONE",
      colors:
        Array.isArray(product.colors) && product.colors.length > 0
          ? product.colors
          : [
              { name: "Obsidian Black", hex: "#111111" },
              { name: "Chalk Ecru", hex: "#F3EDE2" },
            ],
      sizes:
        Array.isArray(product.sizes) && product.sizes.length > 0
          ? product.sizes
          : ["XS", "S", "M", "L", "XL"],
      material: product.material || "Virgin Wool & Mulberry Silk",
      details:
        Array.isArray(product.details) && product.details.length > 0
          ? product.details
          : ["Bespoke Italian architectural tailoring", "Refined tactile hand-finished seams"],
      description: product.description || "",
      isFeatured: product.isFeatured !== undefined ? Boolean(product.isFeatured) : true,
      isRecommended: product.isRecommended !== undefined ? Boolean(product.isRecommended) : true,
      isNewArrival: product.isNewArrival !== undefined ? Boolean(product.isNewArrival) : true,
    });
    setImageTab(product.image ? "url" : "upload");
    setCustomColorName("");
    setCustomColorHex("#111111");
    setCustomSizeInput("");
    setCustomDetailInput("");
    setErrors({});
    setIsAddEditModalOpen(true);
  };

  const handleOpenView = (product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Image upload handler
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image file size should not exceed 10MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadedUrl = await productService.uploadImage(file);
      setFormData((prev) => {
        const nextImgs = Array.from(new Set([...(prev.images || []), uploadedUrl]));
        return {
          ...prev,
          image: prev.image || uploadedUrl,
          images: nextImgs,
        };
      });
      showNotification("Product image uploaded successfully!");
    } catch (err) {
      console.warn("Upload to backend media failed, falling back to local base64 preview:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = e.target.result;
        setFormData((prev) => {
          const nextImgs = Array.from(new Set([...(prev.images || []), b64]));
          return {
            ...prev,
            image: prev.image || b64,
            images: nextImgs,
          };
        });
        showNotification("Image loaded successfully!");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (imgToRemove) => {
    setFormData((prev) => {
      const filtered = (prev.images || []).filter((u) => u !== imgToRemove);
      return {
        ...prev,
        images: filtered,
        image: filtered[0] || (prev.image === imgToRemove ? "" : prev.image),
      };
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Product name is required.";
    if (!formData.price || Number(formData.price) <= 0) {
      errs.price = "Valid price is required.";
    }
    if (formData.stock === "" || Number(formData.stock) < 0) {
      errs.stock = "Valid stock quantity is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProduct = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const finalImages = Array.isArray(formData.images) && formData.images.length > 0
        ? formData.images
        : formData.image
        ? [formData.image]
        : [DEFAULT_IMAGE];

      const numPrice = Number(formData.price) || 0;
      const numOrig = formData.originalPrice ? Number(formData.originalPrice) : numPrice;
      const computedDiscount =
        numOrig > numPrice && numPrice > 0
          ? `${Math.round(((numOrig - numPrice) / numOrig) * 100)}% OFF`
          : formData.discount || "";

      const payload = {
        ...formData,
        price: numPrice,
        originalPrice: numOrig,
        discount: computedDiscount,
        stock: Number(formData.stock),
        quantity: Number(formData.stock),
        image: finalImages[0] || DEFAULT_IMAGE,
        images: finalImages,
        badge: formData.badge && formData.badge !== "NONE" ? formData.badge : null,
        isFeatured: Boolean(formData.isFeatured),
        isRecommended: Boolean(formData.isRecommended),
        isNewArrival: Boolean(formData.isNewArrival),
      };

      if (isEditing && selectedProduct) {
        const prodId = selectedProduct.id || selectedProduct._id;
        await productService.updateProduct(prodId, payload);
        showNotification(`Product "${payload.name}" updated successfully in Supabase!`);
      } else {
        await productService.createProduct(payload);
        showNotification(`New product "${payload.name}" published to Supabase!`);
      }
      setIsAddEditModalOpen(false);
      await loadData();
    } catch (err) {
      alert("Failed to save product: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const prodId = selectedProduct.id || selectedProduct._id;
    setSaving(true);
    try {
      await productService.deleteProduct(prodId);
      showNotification(`Product "${selectedProduct.name}" removed from catalog.`);
      setIsDeleteModalOpen(false);
      setProducts((prev) =>
        prev.filter((p) => String(p.id) !== String(prodId) && String(p._id) !== String(prodId))
      );
      await loadData();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Discount calculation
  const numPrice = Number(formData.price);
  const numOrig = Number(formData.originalPrice);
  const hasDiscount = numOrig > numPrice && numPrice > 0;
  const discountPercent = hasDiscount ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;
  const discountSavings = hasDiscount ? (numOrig - numPrice).toFixed(2) : 0;

  // Table columns definition
  const columns = [
    {
      title: "ID",
      key: "id",
      width: 100,
      render: (item) => (
        <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
          #{String(item.id || item._id).slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      title: "Product",
      key: "name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <img
            src={item.image || DEFAULT_IMAGE}
            alt={item.name}
            className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-50 shadow-2xs shrink-0"
            style={{ width: "48px", height: "48px", minWidth: "48px" }}
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 text-xs sm:text-sm truncate max-w-xs sm:max-w-sm">
                {item.name}
              </span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#D6FF00] text-black">
                  {item.badge}
                </span>
              )}
            </div>
            {item.subtitle && (
              <div className="text-[10px] text-gray-400 truncate">{item.subtitle}</div>
            )}
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span>Brand:</span>
              <strong className="text-gray-700 font-semibold">{item.brand || "ATELIER"}</strong>
              {Array.isArray(item.colors) && item.colors.length > 0 && (
                <div className="flex items-center gap-1 ml-1.5">
                  {item.colors.slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full border border-gray-300"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 uppercase tracking-wider">
          {item.category || "Unassigned"}
        </span>
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (item) => (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-gray-900 text-sm">${item.price}</span>
            {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
              <span className="text-[11px] text-gray-400 line-through">
                ${item.originalPrice}
              </span>
            )}
          </div>
          {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
            <span className="text-[10px] font-bold text-emerald-600">
              {Math.round(((Number(item.originalPrice) - Number(item.price)) / Number(item.originalPrice)) * 100)}% OFF
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Inventory",
      key: "stock",
      render: (item) => {
        const qty =
          item.stock !== undefined
            ? Number(item.stock)
            : item.quantity !== undefined
            ? Number(item.quantity)
            : 0;
        const waitlistCount = Number(item.waitlistCount || (Array.isArray(item.waitlist) ? item.waitlist.length : 0));
        const prodId = item.id || item._id;
        const isBusy = restockingId === prodId;

        let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        let dotStyle = "bg-emerald-500";
        let label = `${qty} in stock`;

        if (qty <= 0) {
          badgeStyle = "bg-red-50 text-red-700 border-red-200";
          dotStyle = "bg-red-500";
          label = "Out of Stock";
        } else if (qty <= 5) {
          badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
          dotStyle = "bg-amber-500 animate-pulse";
          label = `${qty} units left`;
        }

        return (
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                <span>{label}</span>
              </span>

              {/* One-Click Quick Restock Buttons */}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleQuickRestock(item, 5)}
                className="px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-black text-[#D6FF00] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                title="Add +5 units to inventory immediately"
              >
                {isBusy ? "..." : "+5 Stock"}
              </button>
              {qty <= 0 && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleQuickRestock(item, 15)}
                  className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  title="Restock +15 units and activate product"
                >
                  +15
                </button>
              )}
              {qty <= 5 && (
                <button
                  type="button"
                  onClick={() => handleSendItemAlert(item)}
                  className="px-2 py-0.5 rounded-md bg-[#0088cc] hover:bg-[#0077b5] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                  title="Push low-stock alert for this piece to Telegram"
                >
                  <Send className="w-2.5 h-2.5" />
                  <span>Alert</span>
                </button>
              )}
            </div>

            {waitlistCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                <span>🔔 {waitlistCount} waiting for restock</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
            item.status === "Active"
              ? "bg-emerald-100/70 text-emerald-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {item.status || "Active"}
        </span>
      ),
    },
  ];

  if (loading && products.length === 0) {
    return <Loader message="Connecting to Supabase catalog..." />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#D6FF00] shrink-0" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Page Title & Add New Product CTA */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/dashboard" className="hover:text-black font-semibold">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">Catalog</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            Product Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your boutique inventory, pricing, computer image uploads, and Supabase records.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            disabled={sendingTelegramAudit}
            onClick={handleSendTelegramAudit}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all font-bold text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
            title="Send full Inventory Health & Low-Stock Report to Telegram Bot"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">
              {sendingTelegramAudit ? "Sending..." : "Telegram Audit"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-800 transition-all font-bold text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer border border-gray-200 shrink-0"
            title="Download Catalog CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" />
            <span className="truncate">Add Product</span>
          </button>
        </div>
      </div>

      {/* Quick Inventory Status Filter Tabs */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {[
          {
            id: "all",
            label: "All Products",
            count: products.length,
            badge: "bg-gray-100 text-gray-800",
          },
          {
            id: "active",
            label: "In Stock",
            count: products.filter((p) => Number(p.stock ?? p.quantity ?? 0) > 5).length,
            badge: "bg-emerald-100 text-emerald-800",
          },
          {
            id: "low",
            label: "Low Stock (≤5)",
            count: products.filter((p) => {
              const s = Number(p.stock ?? p.quantity ?? 0);
              return s > 0 && s <= 5;
            }).length,
            badge: "bg-amber-100 text-amber-800",
          },
          {
            id: "out",
            label: "Out of Stock",
            count: products.filter(
              (p) =>
                Number(p.stock ?? p.quantity ?? 0) <= 0 ||
                String(p.status || "").toLowerCase() === "out of stock"
            ).length,
            badge: "bg-red-100 text-red-700",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStockFilter(tab.id)}
            className={`inline-flex items-center justify-between sm:justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              stockFilter === tab.id
                ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="truncate">{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                stockFilter === tab.id ? "bg-[#D6FF00] text-black" : tab.badge
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Modern Products DataTable */}
      <DataTable
        columns={columns}
        data={products.filter((p) => {
          const s = Number(p.stock ?? p.quantity ?? 0);
          const isOut = s <= 0 || String(p.status || "").toLowerCase() === "out of stock";
          if (stockFilter === "out") return isOut;
          if (stockFilter === "low") return !isOut && s <= 5;
          if (stockFilter === "active") return !isOut && s > 5;
          return true;
        })}
        searchKey="name"
        searchPlaceholder="Search product by title, category, or brand..."
        itemsPerPage={7}
        renderMobileCard={(item) => {
          const qty =
            item.stock !== undefined
              ? Number(item.stock)
              : item.quantity !== undefined
              ? Number(item.quantity)
              : 0;
          const prodId = item.id || item._id;
          const isBusy = restockingId === prodId;
          const hasDisc =
            item.originalPrice && Number(item.originalPrice) > Number(item.price);

          return (
            <div className="space-y-3">
              {/* Top Row: Thumbnail + Title + Price */}
              <div className="flex items-start gap-3">
                <img
                  src={item.image || DEFAULT_IMAGE}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      #{String(prodId).slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "Active" && qty > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {qty <= 0 ? "Out of Stock" : item.status || "Active"}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm truncate mt-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-bold text-[10px] uppercase">
                      {item.category || "Collection"}
                    </span>
                    <span>•</span>
                    <span className="truncate">{item.brand || "ATELIER"}</span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Price & Quick Stock Controls */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Retail Price
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <strong className="text-base font-black text-gray-950">
                      ${Number(item.price || 0).toFixed(2)}
                    </strong>
                    {hasDisc && (
                      <span className="text-xs text-gray-400 line-through">
                        ${item.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      qty <= 0
                        ? "bg-red-50 text-red-700 border-red-200"
                        : qty <= 5
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {qty} in stock
                  </span>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleQuickRestock(item, 5)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 text-[#D6FF00] text-[11px] font-black uppercase cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isBusy ? "..." : "+5"}
                  </button>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenView(item)}
                  className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(item)}
                  className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        }}
        renderActions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-700 transition-colors cursor-pointer"
              title="Inspect Product Details"
              onClick={() => handleOpenView(item)}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition-colors cursor-pointer"
              title="Edit Product & Image"
              onClick={() => handleOpenEdit(item)}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
              title="Delete Product"
              onClick={() => handleOpenDelete(item)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Professional Add / Edit Product Studio Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        maxWidth={1080}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
              {isEditing ? <Pencil className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-base font-extrabold text-gray-900">
                {isEditing ? `Edit Runway Piece: ${selectedProduct?.name}` : "Create New Runway Product"}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                {isEditing
                  ? "Update product specifications, media asset, and inventory stock"
                  : "Upload image from computer, configure price, and publish to Supabase"}
              </p>
            </div>
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={saving || uploadingImage}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 disabled:opacity-50 transition-all text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : isEditing ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Update Product</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Product Identity & Details */}
            <div className="lg:col-span-7 space-y-4">
              {/* 1. Core Product Specifications Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    Product Specifications
                  </span>
                  <span className="text-[11px] text-gray-500">* Required</span>
                </div>

                <Input
                  label="Product Title"
                  placeholder="e.g. Sculptural Trench Coat in Virgin Wool"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />

                <Input
                  label="Silhouette Subtitle / Tagline"
                  placeholder="e.g. Oversized Tailored Wool Silhouette or SS26 Runway Capsule"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-black/15 font-semibold"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Brand / Label"
                      placeholder="e.g. ATELIER, Acne, Prada"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Visibility Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        status: nextStatus,
                        stock: nextStatus === "Out of Stock" ? "0" : (Number(prev.stock) <= 0 && nextStatus === "Active" ? "10" : prev.stock),
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-black/15 font-semibold"
                  >
                    <option value="Active">🟢 Active (Visible &amp; In Stock)</option>
                    <option value="Out of Stock">🔴 Out of Stock (Sold Out)</option>
                    <option value="Inactive">⚪ Inactive (Draft / Archived)</option>
                  </select>
                </div>

                <Input
                  label="Product Description"
                  placeholder="Describe material composition, garment silhouette, tailor specifications..."
                  type="textarea"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <Input
                  label="Fabrication &amp; Material Composition"
                  placeholder="e.g. 100% Organic Virgin Wool &amp; Mulberry Silk Blend"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>

              {/* 2. Storefront Badges & Placements Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Storefront Badges &amp; Placements</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">Home Page Sync</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Storefront Card Badge
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BADGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, badge: opt.value })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          formData.badge === opt.value
                            ? "border-black ring-2 ring-black/20 scale-102 " + opt.pill
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                    />
                    <span className="text-xs font-bold text-gray-800">⭐ Hero Spotlight Carousel</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                    />
                    <span className="text-xs font-bold text-gray-800">✨ Home "New Arrivals" Section</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isRecommended}
                      onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                    />
                    <span className="text-xs font-bold text-gray-800">🔥 Best Seller Recommendation</span>
                  </label>
                </div>
              </div>

              {/* 3. Garment Color Swatches & Palette Builder */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-black" />
                    <span>Garment Color Swatches</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">Home Card Dots</span>
                </div>

                {/* Selected Color Chips */}
                <div className="flex flex-wrap gap-2">
                  {(formData.colors || []).map((col, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 shadow-2xs"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300 shadow-2xs"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="text-gray-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                        title="Remove color"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(!formData.colors || formData.colors.length === 0) && (
                    <span className="text-xs text-gray-400 italic">No colors selected (default will apply)</span>
                  )}
                </div>

                {/* Quick Luxury Presets */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Click to Toggle Luxury Staples:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LUXURY_PALETTES.map((preset) => {
                      const isSelected = (formData.colors || []).some(
                        (c) => c.hex.toLowerCase() === preset.hex.toLowerCase()
                      );
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => handleToggleColorPreset(preset)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-black text-[#D6FF00] border-black shadow-xs font-bold"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-gray-400/50"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span>{preset.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#D6FF00]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white shrink-0"
                    title="Pick custom hex color"
                  />
                  <input
                    type="text"
                    placeholder="Custom Color Name (e.g. Desert Sand)..."
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-black/15 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3.5 py-1.5 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase cursor-pointer"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* 4. Size Variants & Presets Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-black" />
                    <span>Size Variants</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">Storefront Quick Add</span>
                </div>

                {/* Active Sizes */}
                <div className="flex flex-wrap gap-1.5">
                  {(formData.sizes || []).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleToggleSize(sz)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black text-[#D6FF00] text-xs font-black shadow-xs cursor-pointer hover:bg-neutral-800"
                      title="Click to remove size"
                    >
                      <span>{sz}</span>
                      <X className="w-3 h-3 text-[#D6FF00]" />
                    </button>
                  ))}
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplySizePreset("apparel")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:border-black cursor-pointer"
                  >
                    Apparel (XS–XXL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySizePreset("footwear")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:border-black cursor-pointer"
                  >
                    Footwear (38–44)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySizePreset("accessories")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:border-black cursor-pointer"
                  >
                    One Size
                  </button>
                </div>

                {/* Custom Size Input */}
                <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom size (e.g. 3XL, 45, 100ml)..."
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-black/15 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3.5 py-1.5 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase cursor-pointer"
                  >
                    Add Size
                  </button>
                </div>
              </div>

              {/* 5. Craftsmanship & Atelier Details Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-black" />
                    <span>Craftsmanship &amp; Atelier Details</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">Quick View &amp; Accordion</span>
                </div>

                <div className="space-y-1.5">
                  {(formData.details || []).map((det, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                        <span className="truncate font-medium">{det}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(idx)}
                        className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add craftsmanship specification..."
                    value={customDetailInput}
                    onChange={(e) => setCustomDetailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDetail();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-black/15 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleAddDetail}
                    className="px-3.5 py-1.5 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase cursor-pointer"
                  >
                    Add Bullet
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing, Inventory & Media Upload */}
            <div className="lg:col-span-5 space-y-4">
              {/* Pricing & Stock Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    Pricing & Inventory
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Retail Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="290.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    error={errors.price}
                    required
                  />

                  <Input
                    label="Original Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="350.00"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>

                {hasDiscount && (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center justify-between">
                    <span>Discount Savings:</span>
                    <span>{discountPercent}% OFF (Save ${discountSavings})</span>
                  </div>
                )}

                <Input
                  label="Inventory Quantity"
                  type="number"
                  min="0"
                  placeholder="15"
                  value={formData.stock}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = Number(val);
                    setFormData((prev) => ({
                      ...prev,
                      stock: val,
                      status:
                        val !== "" && num <= 0
                          ? "Out of Stock"
                          : prev.status === "Out of Stock" && num > 0
                          ? "Active"
                          : prev.status,
                    }));
                  }}
                  error={errors.stock}
                  required
                />
              </div>

              {/* Media Uploader Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    Product Photography
                  </span>
                  {formData.image && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  )}
                </div>

                {/* Tabs for Upload, Presets, URL */}
                <div className="flex items-center p-1 rounded-xl bg-gray-200/60 gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setImageTab("upload")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      imageTab === "upload" ? "bg-white text-black shadow-xs" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Computer Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("preset")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      imageTab === "preset" ? "bg-white text-black shadow-xs" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Runway Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("url")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      imageTab === "url" ? "bg-white text-black shadow-xs" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Web URL
                  </button>
                </div>

                {/* Tab: Computer File Upload */}
                {imageTab === "upload" && (
                  <div>
                    {/* Multi-Image Gallery Previews */}
                    {formData.images && formData.images.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                          <span>Uploaded Gallery Angles ({formData.images.length}/5)</span>
                          <span className="text-[10px] text-gray-400">Click photo to set as cover</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {formData.images.map((imgUrl, iIdx) => (
                            <div
                              key={iIdx}
                              onClick={() => setFormData((prev) => ({ ...prev, image: imgUrl }))}
                              className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                formData.image === imgUrl ? "border-black ring-2 ring-black/20" : "border-gray-200 opacity-75 hover:opacity-100"
                              }`}
                            >
                              <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                              {formData.image === imgUrl && (
                                <span className="absolute bottom-1 left-1 bg-black text-[#D6FF00] text-[9px] font-black uppercase px-1 rounded">
                                  Cover
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(imgUrl);
                                }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove photo"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!formData.images || formData.images.length < 5) && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                          dragActive
                            ? "border-black bg-neutral-100"
                            : "border-gray-300 hover:border-black bg-white"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-gray-700 mb-2">
                          {uploadingImage ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <UploadCloud className="w-5 h-5" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          {uploadingImage ? "Uploading from computer..." : "Add photos from computer"}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Drag and drop photo here, or click to browse (up to 5 angles)
                        </p>
                        <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
                          PNG, JPG, WEBP (Max 10MB)
                        </span>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                )}

                {/* Tab: Runway Presets */}
                {imageTab === "preset" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-500">
                      Choose from curated high-fashion photography:
                    </p>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {PRESET_IMAGES.map((preset) => {
                        const isSelected = formData.image === preset.url;
                        return (
                          <div
                            key={preset.url}
                            onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                            className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                              isSelected ? "border-[#111111] ring-2 ring-[#D6FF00]" : "border-transparent opacity-80 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-16 object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#D6FF00] text-black flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab: Direct Web URL */}
                {imageTab === "url" && (
                  <div className="space-y-2">
                    <Input
                      label="Paste Image URL"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.image}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                    />
                    {formData.image && (
                      <div className="mt-2 text-center">
                        <img
                          src={formData.image}
                          alt="URL Preview"
                          className="w-24 h-24 rounded-xl object-cover mx-auto border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Live Home Page Storefront Card Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-gray-950 to-neutral-900 text-white border border-gray-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D6FF00]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#D6FF00]">
                      Live Home Page Card Preview
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">1:1 Storefront Sync</span>
                </div>

                <div className="bg-white rounded-2xl p-3 text-gray-900 shadow-xl max-w-xs mx-auto border border-gray-100">
                  {/* Product Image Frame */}
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={formData.image || (Array.isArray(formData.images) && formData.images[0]) || DEFAULT_IMAGE}
                      alt={formData.name || "Preview"}
                      className="w-full h-full object-cover"
                    />

                    {/* Badge Overlay */}
                    {formData.badge && formData.badge !== "NONE" && (
                      <span
                        className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shadow-sm ${
                          formData.badge === "HOT" || formData.badge === "NEW"
                            ? "bg-[#D6FF00] text-black"
                            : formData.badge === "SALE"
                            ? "bg-rose-500 text-white"
                            : "bg-black text-[#D6FF00]"
                        }`}
                      >
                        {formData.badge}
                      </span>
                    )}

                    {/* Multi-angle dots preview */}
                    {Array.isArray(formData.images) && formData.images.length > 1 && (
                      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50">
                        {formData.images.slice(0, 4).map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-[#D6FF00] w-3" : "bg-white/60"}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Heart icon */}
                    <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 flex items-center justify-center text-gray-600 shadow-xs">
                      <Heart className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Card Details */}
                  <div className="pt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span className="truncate">{formData.category || "Collection"}</span>
                      {/* Color Dots */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(formData.colors || []).slice(0, 4).map((c, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="font-extrabold text-xs text-gray-950 truncate">
                      {formData.name || "Untitled Runway Piece"}
                    </div>

                    {formData.subtitle && (
                      <div className="text-[10px] text-gray-500 truncate leading-tight">
                        {formData.subtitle}
                      </div>
                    )}

                    {/* Price and Discount */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-black">
                          ${Number(formData.price || 0).toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[10px] line-through text-gray-400 font-semibold">
                            ${Number(formData.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {hasDiscount && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#D6FF00] text-black uppercase">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Stock Urgency Pill */}
                    <div className="pt-1">
                      {Number(formData.stock) <= 0 || formData.status === "Out of Stock" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Out of Stock
                        </span>
                      ) : Number(formData.stock) <= 3 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-[10px] font-black text-amber-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          ⚡ Only {formData.stock} left in studio
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          In Stock ({formData.stock} available)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Product Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth={640}
        title="Product Information Details"
        footer={
          <button
            type="button"
            onClick={() => setIsViewModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Close Details
          </button>
        }
      >
        {selectedProduct && (
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-full sm:w-48 shrink-0 text-center">
              <img
                src={selectedProduct.image || DEFAULT_IMAGE}
                alt={selectedProduct.name}
                className="w-full h-52 sm:h-48 object-cover rounded-2xl border border-gray-200 bg-gray-50 shadow-xs"
                onError={(e) => {
                  e.target.src = DEFAULT_IMAGE;
                }}
              />
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {selectedProduct.status || "Active"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs text-gray-600">
              <div className="font-mono text-[11px] text-gray-400">
                DATABASE ID: #{String(selectedProduct.id || selectedProduct._id)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-gray-950">
                  {selectedProduct.name}
                </h3>
                {selectedProduct.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#D6FF00] text-black">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>
              {selectedProduct.subtitle && (
                <p className="text-xs text-gray-500 font-medium">{selectedProduct.subtitle}</p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[11px]">Brand:</span>
                  <strong className="text-gray-900 font-semibold">{selectedProduct.brand || "ATELIER"}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Category:</span>
                  <strong className="text-gray-900 font-semibold">{selectedProduct.category}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Price:</span>
                  <strong className="text-gray-900 text-sm font-bold">${selectedProduct.price}</strong>
                  {selectedProduct.originalPrice && Number(selectedProduct.originalPrice) > Number(selectedProduct.price) && (
                    <span className="text-gray-400 line-through ml-1.5 text-xs">
                      ${selectedProduct.originalPrice}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Inventory Stock:</span>
                  <strong className="text-emerald-700 font-bold">
                    {selectedProduct.stock || selectedProduct.quantity || 0} units
                  </strong>
                </div>
              </div>

              {/* Colors & Sizes in Inspect Modal */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[11px] font-bold">Colors:</span>
                  <div className="flex items-center gap-1">
                    {(selectedProduct.colors || []).map((c, i) => (
                      <span
                        key={i}
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[11px] font-bold">Sizes:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(selectedProduct.sizes || []).map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {selectedProduct.material && (
                <div className="text-[11px] text-gray-600">
                  <strong className="text-gray-800">Material:</strong> {selectedProduct.material}
                </div>
              )}

              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 leading-relaxed">
                {selectedProduct.description || "No editorial description available."}
              </div>

              <div className="pt-2">
                <Link
                  to={`/shop/${selectedProduct.id || selectedProduct._id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-black underline underline-offset-4"
                >
                  <span>Open Product in Customer Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth={460}
        title="Confirm Product Deletion"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{saving ? "Deleting..." : "Permanently Delete"}</span>
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-800 font-medium">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-950 font-bold">&ldquo;{selectedProduct?.name}&rdquo;</strong>?
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This action cannot be undone. The product will be removed from the Supabase database catalog and will no longer appear on the customer storefront.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageProducts;
