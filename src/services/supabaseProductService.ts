import { supabase } from "./supabase";
import { Product } from "../types";

export const supabaseProductService = {
  // Fetch active products with category filtering, search, and ordering
  getProducts: async ({
    category,
    search,
    minPrice,
    maxPrice,
    sortBy = "featured",
  }: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  } = {}): Promise<Product[]> => {
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

    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
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
      throw error;
    }

    return (data || []).map((p: any) => ({
      ...p,
      id: String(p.id),
      category: p.categories?.name || "Collection",
      originalPrice: p.original_price,
      stockCount: p.stock,
      inStock: p.stock > 0,
      isFeatured: p.is_featured,
      isRecommended: p.is_recommended,
      isNewArrival: p.is_latest,
      reviewsCount: p.reviews_count,
    }));
  },

  // Fetch single product by UUID
  getProductById: async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories:category_id (id, name, slug)")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      id: String(data.id),
      category: data.categories?.name || "Collection",
      originalPrice: data.original_price,
      stockCount: data.stock,
      inStock: data.stock > 0,
      isFeatured: data.is_featured,
      isRecommended: data.is_recommended,
      isNewArrival: data.is_latest,
      reviewsCount: data.reviews_count,
    };
  },
};

export default supabaseProductService;

