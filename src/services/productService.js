import api from "./api";
import { PRODUCTS } from "../data/products";
import { supabase } from "./supabase";

const PRODUCTS_STORAGE_KEY = "atelier_products_v2";

// Legacy demo product names to purge
const DEMO_PRODUCT_NAMES = [
  "easy polo",
  "akira",
  "classic summer blazer",
  "floral summer dress",
  "urban denim jacket",
  "casual slim fit shirt",
  "athletic performance shorts",
  "colorblock dress",
  "leather shoulder bag",
  "running sneakers",
  "cotton graphic hoodie",
  "silk scarf",
  "table vase",
];

const isDemoProduct = (p) => {
  if (!p) return false;
  const name = (p.name || "").toLowerCase();
  const idNum = Number(p.id);
  if (!isNaN(idNum) && idNum >= 1 && idNum <= 12 && (!p.images || p.image?.includes("/user/images/"))) {
    return true;
  }
  return DEMO_PRODUCT_NAMES.some((dn) => name === dn || name.includes(dn));
};

// Purge legacy storage caches on initialization
try {
  localStorage.removeItem("eshopper_products");
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const cleaned = parsed.filter((p) => !isDemoProduct(p));
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(cleaned));
  }
} catch (e) {
  // quiet
}

export const formatProductForDisplay = (p) => {
  const defaultLuxuryImg = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80";
  const mainImg = p.image || (Array.isArray(p.images) && p.images[0]) || defaultLuxuryImg;

  const rawStock =
    p.stock !== undefined
      ? Number(p.stock)
      : p.quantity !== undefined
      ? Number(p.quantity)
      : p.stockCount !== undefined
      ? Number(p.stockCount)
      : 10;

  const isStatusOut =
    String(p.status || "").trim().toLowerCase() === "out of stock" ||
    p.inStock === false;

  const finalStock = isStatusOut || isNaN(rawStock) ? 0 : Math.max(0, rawStock);
  const finalStatus = finalStock <= 0 ? "Out of Stock" : (p.status || "Active");

  return {
    ...p,
    id: String(p.id || p._id),
    _id: String(p._id || p.id),
    image: mainImg,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg],
    colors:
      Array.isArray(p.colors) && p.colors.length > 0
        ? p.colors
        : [
            { name: "Obsidian Black", hex: "#111111" },
            { name: "Chalk Ecru", hex: "#F3EDE2" },
          ],
    sizes:
      Array.isArray(p.sizes) && p.sizes.length > 0
        ? p.sizes
        : ["XS", "S", "M", "L", "XL"],
    stock: finalStock,
    quantity: finalStock,
    stockCount: finalStock,
    inStock: finalStock > 0,
    status: finalStatus,
    rating: p.rating !== undefined ? Number(p.rating) : 0,
    reviewsCount: p.reviewsCount !== undefined ? Number(p.reviewsCount) : 0,
    details: Array.isArray(p.details) ? p.details : ["Premium Italian craftsmanship", "Fine virgin wool and silk blend"],
  };
};

let _memoryProducts = null;

const getProductsStorage = () => {
  if (_memoryProducts && _memoryProducts.length > 0) {
    return _memoryProducts;
  }
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!stored) {
    const cleanList = PRODUCTS.filter((p) => !isDemoProduct(p)).map(formatProductForDisplay);
    return cleanList;
  }
  try {
    const list = JSON.parse(stored);
    const cleaned = Array.isArray(list) ? list.filter((p) => !isDemoProduct(p)).map(formatProductForDisplay) : [];
    if (cleaned.length > 0) {
      _memoryProducts = cleaned;
      return cleaned;
    }
    return PRODUCTS.filter((p) => !isDemoProduct(p)).map(formatProductForDisplay);
  } catch {
    return PRODUCTS.filter((p) => !isDemoProduct(p)).map(formatProductForDisplay);
  }
};

const saveProductsStorage = (products) => {
  _memoryProducts = products;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore storage quota errors
  }
};

export const productService = {
  // Synchronously returns the latest cached MongoDB products for 0ms instant first-frame rendering
  getCachedProducts: () => {
    return getProductsStorage();
  },

  // Upload product image from computer
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.image_url;
    } catch (err) {
      console.warn("Backend upload failed, using DataURL fallback:", err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  // Get all products with optional filters
  getProducts: async ({ category, search, minPrice, maxPrice, sortBy } = {}) => {
    try {
      const params = {};
      if (category && category.toLowerCase() !== "all") params.category = category;
      if (search && search.trim() !== "") params.search = search.trim();
      if (minPrice !== undefined && minPrice !== "") params.minPrice = minPrice;
      if (maxPrice !== undefined && maxPrice !== "") params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;

      // 1. Direct High-Speed Supabase Query (0ms Cold Start)
      if (supabase) {
        try {
          let query = supabase
            .from("products")
            .select("*, categories:category_id (id, name, slug)")
            .eq("status", "Active");

          if (category && category.toLowerCase() !== "all") {
            query = query.ilike("categories.slug", `%${category.toLowerCase()}%`);
          }
          if (search && search.trim() !== "") {
            query = query.ilike("name", `%${search.trim()}%`);
          }
          if (minPrice !== undefined && minPrice !== "") query = query.gte("price", Number(minPrice));
          if (maxPrice !== undefined && maxPrice !== "") query = query.lte("price", Number(maxPrice));

          if (sortBy === "price-asc") query = query.order("price", { ascending: true });
          else if (sortBy === "price-desc") query = query.order("price", { ascending: false });
          else if (sortBy === "newest") query = query.order("created_at", { ascending: false });
          else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

          const { data, error } = await query;
          if (!error && Array.isArray(data) && data.length > 0) {
            const formatted = data.map((p) =>
              formatProductForDisplay({
                ...p,
                id: String(p.id),
                category: p.categories?.name || p.category || "Collection",
                originalPrice: p.original_price,
                stockCount: p.stock,
                inStock: p.stock > 0,
                isFeatured: p.is_featured,
                isRecommended: p.is_recommended,
                isNewArrival: p.is_latest,
                reviewsCount: p.reviews_count,
              })
            );
            if (Object.keys(params).length === 0 && formatted.length > 0) {
              saveProductsStorage(formatted);
            }
            return formatted;
          }
        } catch (supabaseErr) {
          console.warn("[Supabase] Products query note:", supabaseErr.message);
        }
      }

      // 2. Secondary API Query Fallback
      const response = await api.get("/products/", { params });
      if (Array.isArray(response.data)) {
        const clean = response.data.filter((p) => !isDemoProduct(p));
        const formatted = clean.map(formatProductForDisplay);
        if (Object.keys(params).length === 0 && formatted.length > 0) {
          saveProductsStorage(formatted);
        }
        return formatted;
      }
      return [];
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      let list = [...getProductsStorage().filter((p) => !isDemoProduct(p)).map(formatProductForDisplay)];

      if (category && category.toLowerCase() !== "all") {
        list = list.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (search && search.trim() !== "") {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q))
        );
      }

      if (minPrice !== undefined && minPrice !== "") {
        list = list.filter((p) => p.price >= Number(minPrice));
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        list = list.filter((p) => p.price <= Number(maxPrice));
      }

      if (sortBy === "price-asc") {
        list.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-desc") {
        list.sort((a, b) => b.price - a.price);
      } else if (sortBy === "name-asc") {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "name-desc") {
        list.sort((a, b) => b.name.localeCompare(a.name));
      }

      return list;
    }
  },

  // Get single product details
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}/`);
      return formatProductForDisplay(response.data);
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getProductsStorage();
      const product = list.find(
        (p) => String(p.id) === String(id) || String(p._id) === String(id)
      );
      if (!product) {
        // Fallback to static PRODUCTS
        const fallback = PRODUCTS.find((p) => String(p.id) === String(id));
        if (fallback) return formatProductForDisplay(fallback);
        throw new Error("Product not found");
      }
      return formatProductForDisplay(product);
    }
  },

  // Create new product (Admin)
  createProduct: async (productData) => {
    try {
      const response = await api.post("/products/", productData);
      const formatted = formatProductForDisplay(response.data);
      window.dispatchEvent(new Event("atelier_products_updated"));
      return formatted;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getProductsStorage();
      const rawStock = productData.stock !== undefined ? Number(productData.stock) : 1;
      const isOut = String(productData.status || "").toLowerCase() === "out of stock" || rawStock <= 0;
      const finalStock = isOut ? 0 : Math.max(0, rawStock);
      const newProduct = {
        id: `prod-${Date.now()}`,
        name: productData.name,
        price: Number(productData.price) || 0,
        originalPrice: Number(productData.originalPrice) || Number(productData.price) || 0,
        discount: productData.discount || "",
        category: productData.category || "Women",
        brand: productData.brand || "Atelier",
        stock: finalStock,
        quantity: finalStock,
        status: finalStock <= 0 ? "Out of Stock" : (productData.status || "Active"),
        rating: 5.0,
        reviewsCount: 0,
        image: productData.image || "/user/images/home/product1.jpg",
        images: [
          productData.image || "/user/images/home/product1.jpg",
        ],
        description: productData.description || "No description provided.",
        isFeatured: Boolean(productData.isFeatured),
        isRecommended: Boolean(productData.isRecommended),
        isNewArrival: true,
      };

      list.unshift(newProduct);
      saveProductsStorage(list);
      window.dispatchEvent(new Event("atelier_products_updated"));
      return formatProductForDisplay(newProduct);
    }
  },

  // Update product (Admin)
  updateProduct: async (id, updatedFields) => {
    try {
      const response = await api.put(`/products/${id}/`, updatedFields);
      const formatted = formatProductForDisplay(response.data);
      window.dispatchEvent(new Event("atelier_products_updated"));
      return formatted;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getProductsStorage();
      const index = list.findIndex(
        (p) => String(p.id) === String(id) || String(p._id) === String(id)
      );
      if (index === -1) {
        throw new Error("Product to update was not found");
      }

      const rawStock = updatedFields.stock !== undefined ? Number(updatedFields.stock) : Number(list[index].stock ?? 0);
      const isStatusOut = String(updatedFields.status || "").toLowerCase() === "out of stock";
      const finalStock = isStatusOut ? 0 : Math.max(0, rawStock);
      const finalStatus = finalStock <= 0 ? "Out of Stock" : (updatedFields.status || "Active");

      const updated = {
        ...list[index],
        ...updatedFields,
        price: Number(updatedFields.price !== undefined ? updatedFields.price : list[index].price),
        originalPrice: Number(updatedFields.originalPrice !== undefined ? updatedFields.originalPrice : list[index].originalPrice),
        stock: finalStock,
        quantity: finalStock,
        status: finalStatus,
      };

      list[index] = updated;
      saveProductsStorage(list);
      window.dispatchEvent(new Event("atelier_products_updated"));
      return formatProductForDisplay(updated);
    }
  },

  // Delete product (Admin)
  deleteProduct: async (id) => {
    const cleanId = String(id).trim();
    try {
      await api.delete(`/products/${cleanId}/`);
    } catch (err) {
      console.warn("Backend API offline or delete failed:", err.message);
    }
    try {
      const list = getProductsStorage();
      const filtered = list.filter(
        (p) => String(p.id) !== cleanId && String(p._id) !== cleanId
      );
      saveProductsStorage(filtered);
    } catch {
      // ignore
    }
    return true;
  },
};
