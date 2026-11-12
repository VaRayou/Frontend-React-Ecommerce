import { supabase } from "./supabase";
import { telegramService } from "./telegramService";

const PRODUCTS_STORAGE_KEY = "atelier_products_v3";

// Clean up any legacy mock caches on initialization
try {
  localStorage.removeItem("eshopper_products");
  localStorage.removeItem("atelier_products_v2");
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Keep ONLY real Supabase products with valid UUID format
    const valid = Array.isArray(parsed)
      ? parsed.filter((p) => p && typeof p.id === "string" && p.id.includes("-"))
      : [];
    if (valid.length !== parsed?.length) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(valid));
    }
  }
} catch {
  // quiet
}

export const formatProductForDisplay = (p) => {
  if (!p) return null;
  const defaultLuxuryImg = "/uploads/8a82fc7bb76c.jpg";
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
    p.inStock === false ||
    rawStock <= 0;

  const finalStock = isStatusOut || isNaN(rawStock) ? 0 : Math.max(0, rawStock);
  const finalStatus = finalStock <= 0 ? "Out of Stock" : (p.status || "Active");
  const categoryName = p.categories?.name || p.category || "Collection";

  return {
    ...p,
    id: String(p.id || p._id),
    _id: String(p.id || p._id),
    name: p.name || "Untitled Piece",
    subtitle: p.subtitle || "",
    category: categoryName,
    categoryId: p.category_id || p.categories?.id,
    brand: p.brand || "ATELIER",
    price: Number(p.price || 0),
    originalPrice: Number(p.original_price ?? p.originalPrice ?? p.price ?? 0),
    discount: p.discount || "",
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
    rating: p.rating !== undefined ? Number(p.rating) : 5.0,
    reviewsCount: p.reviews_count !== undefined ? Number(p.reviews_count) : (p.reviewsCount !== undefined ? Number(p.reviewsCount) : 0),
    description: p.description || "Exclusive piece crafted with modern tailoring.",
    details:
      Array.isArray(p.details) && p.details.length > 0
        ? p.details
        : ["Premium craftsmanship", "Refined tactile finish", "Bespoke tailoring"],
    material: p.material || "Virgin Wool & Silk Blend",
    isFeatured: Boolean(p.is_featured ?? p.isFeatured ?? true),
    isRecommended: Boolean(p.is_recommended ?? p.isRecommended ?? true),
    isNewArrival: Boolean(p.is_latest ?? p.isNewArrival ?? true),
  };
};

let _memoryProducts = null;

const getProductsStorage = () => {
  if (_memoryProducts && _memoryProducts.length > 0) {
    return _memoryProducts;
  }
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const list = JSON.parse(stored);
    const valid = Array.isArray(list)
      ? list.filter((p) => p && typeof p.id === "string" && p.id.includes("-")).map(formatProductForDisplay)
      : [];
    if (valid.length > 0) {
      _memoryProducts = valid;
      return valid;
    }
    return [];
  } catch {
    return [];
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

// Ensure an active admin session with Super Admin privileges
export const ensureAdminSession = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) return data.session;

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: "controller@atelier.com",
      password: "adminpass123",
    });
    if (!error && signInData?.session) {
      return signInData.session;
    }
  } catch (e) {
    console.warn("[Supabase] ensureAdminSession note:", e.message);
  }
  return null;
};

export const productService = {
  // Synchronously returns the latest cached Supabase products for instant 0ms first-frame
  getCachedProducts: () => {
    return getProductsStorage();
  },

  // Upload product image
  uploadImage: async (file) => {
    try {
      await ensureAdminSession();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from("products")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (!error && data?.path) {
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(data.path);
        if (urlData?.publicUrl) return urlData.publicUrl;
      }
    } catch (e) {
      console.warn("Supabase bucket upload note:", e.message);
    }

    // 2. DataURL fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Get all products directly from Supabase
  getProducts: async ({ category, search, minPrice, maxPrice, sortBy } = {}) => {
    try {
      const hasCategoryFilter = Boolean(category && category.toLowerCase() !== "all");

      // Build Supabase Query (include both Active and Out of Stock items)
      let query = hasCategoryFilter
        ? supabase.from("products").select("*, categories:category_id!inner(id, name, slug)")
        : supabase.from("products").select("*, categories:category_id(id, name, slug)");

      if (hasCategoryFilter) {
        query = query.ilike("categories.name", `%${category.trim()}%`);
      }

      if (search && search.trim() !== "") {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      if (minPrice !== undefined && minPrice !== "") {
        query = query.gte("price", Number(minPrice));
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        query = query.lte("price", Number(maxPrice));
      }

      if (sortBy === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.warn("[Supabase] Products query error:", error.message);
      } else if (Array.isArray(data)) {
        const formatted = data.map(formatProductForDisplay);
        if (!category && !search && !minPrice && !maxPrice && formatted.length > 0) {
          saveProductsStorage(formatted);
        }
        return formatted;
      }
      return getProductsStorage();
    } catch (err) {
      console.warn("[Supabase] getProducts exception:", err.message);
      return getProductsStorage();
    }
  },

  // Get single product details directly from Supabase
  getProductById: async (id) => {
    if (!id) return null;
    const cleanId = String(id).trim();

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories:category_id(id, name, slug)")
        .eq("id", cleanId)
        .maybeSingle();

      if (!error && data) {
        return formatProductForDisplay(data);
      }
    } catch (err) {
      console.warn("[Supabase] getProductById note:", err.message);
    }

    // Check cached real products
    const cached = getProductsStorage();
    const found = cached.find((p) => String(p.id) === cleanId || String(p._id) === cleanId);
    if (found) return found;

    throw new Error(`Product not found: ${cleanId}`);
  },

  // Create new product directly into Supabase (Admin)
  createProduct: async (productData) => {
    try {
      await ensureAdminSession();

      let categoryId = productData.categoryId || productData.category_id;
      if (!categoryId && productData.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", productData.category.trim())
          .maybeSingle();
        if (cat) categoryId = cat.id;
      }

      const rawStock = Number(productData.stock ?? productData.quantity ?? 10);
      const isOut = String(productData.status || "").toLowerCase() === "out of stock" || rawStock <= 0;
      const finalStock = isOut ? 0 : Math.max(0, rawStock);
      const mainImg =
        productData.image ||
        (Array.isArray(productData.images) && productData.images[0]) ||
        "/uploads/8a82fc7bb76c.jpg";

      const payload = {
        name: productData.name,
        subtitle: productData.subtitle || "",
        category_id: categoryId || null,
        brand: productData.brand || "ATELIER",
        price: Number(productData.price) || 0,
        original_price: Number(productData.originalPrice) || Number(productData.price) || 0,
        discount: productData.discount || "",
        stock: finalStock,
        status: finalStock <= 0 ? "Out of Stock" : (productData.status || "Active"),
        image: mainImg,
        images:
          Array.isArray(productData.images) && productData.images.length > 0
            ? productData.images
            : [mainImg],
        colors:
          Array.isArray(productData.colors) && productData.colors.length > 0
            ? productData.colors
            : [{ name: "Obsidian Black", hex: "#111111" }],
        sizes:
          Array.isArray(productData.sizes) && productData.sizes.length > 0
            ? productData.sizes
            : ["XS", "S", "M", "L", "XL"],
        description: productData.description || "Exclusive piece crafted with modern tailoring.",
        details:
          Array.isArray(productData.details) && productData.details.length > 0
            ? productData.details
            : ["Premium craftsmanship", "Refined tactile finish"],
        material: productData.material || "Virgin Wool & Silk Blend",
        is_featured: Boolean(productData.isFeatured ?? true),
        is_recommended: Boolean(productData.isRecommended ?? true),
        is_latest: true,
      };

      const { data, error } = await supabase
        .from("products")
        .insert([payload])
        .select("*, categories:category_id (id, name, slug)")
        .single();

      if (error) throw error;
      const formatted = formatProductForDisplay(data);

      const current = getProductsStorage();
      saveProductsStorage([formatted, ...current]);
      window.dispatchEvent(new Event("atelier_products_updated"));

      // Dispatch low-stock or out-of-stock alert to Telegram if initial stock <= 5
      if (formatted.stock <= 5) {
        telegramService
          .sendLowStockAlert({
            productName: formatted.name,
            remainingStock: formatted.stock,
            productId: formatted.id,
            category: formatted.category,
            brand: formatted.brand,
            price: formatted.price,
            triggerSource: "New Catalog Product Created",
          })
          .catch(() => {});
      }

      return formatted;
    } catch (err) {
      console.error("Supabase createProduct failed:", err);
      throw err;
    }
  },

  // Update product directly in Supabase (Admin)
  updateProduct: async (id, updatedFields) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();
      const existingCached = getProductsStorage().find(
        (p) => String(p.id) === cleanId
      );
      const prevStock =
        existingCached?.stock !== undefined
          ? Number(existingCached.stock)
          : undefined;

      let categoryId = updatedFields.categoryId || updatedFields.category_id;
      if (!categoryId && updatedFields.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", updatedFields.category.trim())
          .maybeSingle();
        if (cat) categoryId = cat.id;
      }

      const patch = {};
      if (updatedFields.name !== undefined) patch.name = updatedFields.name;
      if (updatedFields.subtitle !== undefined) patch.subtitle = updatedFields.subtitle;
      if (categoryId !== undefined) patch.category_id = categoryId;
      if (updatedFields.brand !== undefined) patch.brand = updatedFields.brand;
      if (updatedFields.price !== undefined) patch.price = Number(updatedFields.price);
      if (updatedFields.originalPrice !== undefined) patch.original_price = Number(updatedFields.originalPrice);
      if (updatedFields.discount !== undefined) patch.discount = updatedFields.discount;

      if (updatedFields.stock !== undefined) {
        const s = Number(updatedFields.stock);
        patch.stock = s;
        patch.status = s <= 0 ? "Out of Stock" : (updatedFields.status || "Active");
      } else if (updatedFields.status !== undefined) {
        patch.status = updatedFields.status;
      }

      if (updatedFields.image !== undefined) patch.image = updatedFields.image;
      if (updatedFields.images !== undefined) patch.images = updatedFields.images;
      if (updatedFields.description !== undefined) patch.description = updatedFields.description;
      if (updatedFields.details !== undefined) patch.details = updatedFields.details;
      if (updatedFields.material !== undefined) patch.material = updatedFields.material;
      if (updatedFields.isFeatured !== undefined) patch.is_featured = Boolean(updatedFields.isFeatured);
      if (updatedFields.isRecommended !== undefined) patch.is_recommended = Boolean(updatedFields.isRecommended);

      const { data, error } = await supabase
        .from("products")
        .update(patch)
        .eq("id", cleanId)
        .select("*, categories:category_id (id, name, slug)")
        .single();

      if (error) throw error;
      const formatted = formatProductForDisplay(data);

      const current = getProductsStorage();
      const updatedList = current.map((p) => (p.id === cleanId ? formatted : p));
      saveProductsStorage(updatedList);
      window.dispatchEvent(new Event("atelier_products_updated"));

      // Dispatch Low-Stock / Out-of-Stock Telegram Alert whenever stock is <= 5
      if (
        formatted.stock <= 5 &&
        (updatedFields.stock !== undefined ||
          String(updatedFields.status || "").toLowerCase() === "out of stock")
      ) {
        telegramService
          .sendLowStockAlert({
            productName: formatted.name,
            remainingStock: formatted.stock,
            previousStock: prevStock,
            productId: formatted.id,
            category: formatted.category,
            brand: formatted.brand,
            price: formatted.price,
            triggerSource:
              updatedFields.triggerSource || "Admin Inventory Stock Update",
          })
          .catch(() => {});
      }

      return formatted;
    } catch (err) {
      console.error("Supabase updateProduct failed:", err);
      throw err;
    }
  },

  // Delete product directly from Supabase (Admin)
  deleteProduct: async (id) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();

      const { error } = await supabase.from("products").delete().eq("id", cleanId);
      if (error) throw error;

      const current = getProductsStorage();
      const next = current.filter((p) => p.id !== cleanId);
      saveProductsStorage(next);
      window.dispatchEvent(new Event("atelier_products_updated"));
      return true;
    } catch (err) {
      console.error("Supabase deleteProduct failed:", err);
      throw err;
    }
  },
};
