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
} from "lucide-react";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import { telegramService } from "../../services/telegramService";
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

export function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Women",
    brand: "ATELIER",
    price: "",
    originalPrice: "",
    stock: "15",
    image: "",
    images: [],
    status: "Active",
    isFeatured: true,
    isRecommended: true,
  });

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
        escapeCell(p.source || "mongodb"),
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

  const loadData = async () => {
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
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      category: categories[0]?.name || "Women",
      brand: "ATELIER",
      price: "",
      originalPrice: "",
      stock: "15",
      image: "",
      images: [],
      status: "Active",
      isFeatured: true,
      isRecommended: true,
    });
    setImageTab("upload");
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
      description: product.description || "",
      category: product.category || categories[0]?.name || "Women",
      brand: product.brand || "ATELIER",
      price: product.price !== undefined ? String(product.price) : "",
      originalPrice: product.originalPrice !== undefined ? String(product.originalPrice) : "",
      stock:
        product.stock !== undefined
          ? String(product.stock)
          : product.quantity !== undefined
          ? String(product.quantity)
          : "10",
      image: product.image || existingImgs[0] || "",
      images: existingImgs,
      status: product.status || "Active",
      isFeatured: product.isFeatured !== undefined ? Boolean(product.isFeatured) : true,
      isRecommended: product.isRecommended !== undefined ? Boolean(product.isRecommended) : true,
    });
    setImageTab(product.image ? "url" : "upload");
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

      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : Number(formData.price),
        stock: Number(formData.stock),
        quantity: Number(formData.stock),
        image: finalImages[0] || DEFAULT_IMAGE,
        images: finalImages,
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
            <div className="font-bold text-gray-900 text-xs sm:text-sm truncate max-w-xs sm:max-w-sm">
              {item.name}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span>Brand:</span>
              <strong className="text-gray-700 font-semibold">{item.brand || "ATELIER"}</strong>
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

  if (loading) {
    return <Loader message="Connecting to MongoDB catalog..." />;
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
            Manage your boutique inventory, pricing, computer image uploads, and MongoDB records.
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
        maxWidth={840}
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
                  : "Upload image from computer, configure price, and publish to MongoDB"}
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
                  <span>Saving to MongoDB...</span>
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
                    <option value="Active">🟢 Active (Visible & In Stock)</option>
                    <option value="Out of Stock">🔴 Out of Stock (Sold Out)</option>
                    <option value="Inactive">⚪ Inactive (Draft / Archived)</option>
                  </select>
                </div>

                <Input
                  label="Product Description"
                  placeholder="Describe material composition, garment silhouette, tailor specifications..."
                  type="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="pt-1 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                    />
                    <span className="text-xs font-bold text-gray-700">⭐ Featured Runway</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isRecommended}
                      onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                    />
                    <span className="text-xs font-bold text-gray-700">🔥 Best Seller</span>
                  </label>
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
              <h3 className="text-lg font-black text-gray-950">
                {selectedProduct.name}
              </h3>

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
              This action cannot be undone. The product will be removed from the MongoDB database catalog and will no longer appear on the customer storefront.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageProducts;
