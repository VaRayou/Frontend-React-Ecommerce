import { supabase } from "./supabase";
import { ensureAdminSession } from "./productService";

const CATEGORIES_STORAGE_KEY = "atelier_categories_v3";
let _memoryCategories = null;

// Purge old mock categories on initialization
try {
  localStorage.removeItem("atelier_categories_v2");
  const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const valid = Array.isArray(parsed)
      ? parsed.filter((c) => c && typeof c.id === "string" && c.id.includes("-"))
      : [];
    if (valid.length !== parsed?.length) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(valid));
    }
  }
} catch {
  // quiet
}

const getCategoriesStorage = () => {
  if (_memoryCategories && _memoryCategories.length > 0) {
    return _memoryCategories;
  }
  const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    const valid = Array.isArray(parsed)
      ? parsed.filter((c) => c && typeof c.id === "string" && c.id.includes("-"))
      : [];
    if (valid.length > 0) {
      _memoryCategories = valid;
      return valid;
    }
    return [];
  } catch {
    return [];
  }
};

const saveCategoriesStorage = (categories) => {
  _memoryCategories = categories;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // ignore
  }
};

export const categoryService = {
  // Synchronously returns cached Supabase categories
  getCachedCategories: () => {
    return getCategoriesStorage();
  },

  // Get all categories directly from Supabase
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("status", "Active")
        .order("display_order", { ascending: true });

      if (error) {
        console.warn("[Supabase] getCategories note:", error.message);
      } else if (Array.isArray(data) && data.length > 0) {
        saveCategoriesStorage(data);
        return data;
      }
      return getCategoriesStorage();
    } catch (err) {
      console.warn("[Supabase] getCategories exception:", err.message);
      return getCategoriesStorage();
    }
  },

  // Create new category directly in Supabase (Admin)
  createCategory: async (categoryData) => {
    try {
      await ensureAdminSession();
      const name = String(categoryData.name || "").trim();
      const slug = (categoryData.slug || name).toLowerCase().replace(/\s+/g, "-");

      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name,
            slug,
            description: categoryData.description || `Collection ${name}`,
            image: categoryData.image || "/uploads/bed6e30a33b2.jpg",
            status: categoryData.status || "Active",
            display_order: Number(categoryData.display_order || categoryData.displayOrder || 0),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const current = getCategoriesStorage();
      saveCategoriesStorage([...current, data]);
      return data;
    } catch (err) {
      console.error("Supabase createCategory failed:", err);
      throw err;
    }
  },

  // Update category directly in Supabase (Admin)
  updateCategory: async (id, updatedFields) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();
      const patch = {};
      if (updatedFields.name !== undefined) {
        patch.name = updatedFields.name;
        if (!updatedFields.slug) {
          patch.slug = updatedFields.name.toLowerCase().trim().replace(/\s+/g, "-");
        }
      }
      if (updatedFields.slug !== undefined) patch.slug = updatedFields.slug;
      if (updatedFields.description !== undefined) patch.description = updatedFields.description;
      if (updatedFields.image !== undefined) patch.image = updatedFields.image;
      if (updatedFields.status !== undefined) patch.status = updatedFields.status;
      if (updatedFields.display_order !== undefined) patch.display_order = Number(updatedFields.display_order);

      const { data, error } = await supabase
        .from("categories")
        .update(patch)
        .eq("id", cleanId)
        .select()
        .single();

      if (error) throw error;

      const current = getCategoriesStorage();
      saveCategoriesStorage(current.map((c) => (c.id === cleanId ? data : c)));
      return data;
    } catch (err) {
      console.error("Supabase updateCategory failed:", err);
      throw err;
    }
  },

  // Delete category directly from Supabase (Admin)
  deleteCategory: async (id) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();
      const { error } = await supabase.from("categories").delete().eq("id", cleanId);
      if (error) throw error;

      const current = getCategoriesStorage();
      saveCategoriesStorage(current.filter((c) => c.id !== cleanId));
      return true;
    } catch (err) {
      console.error("Supabase deleteCategory failed:", err);
      throw err;
    }
  },
};
