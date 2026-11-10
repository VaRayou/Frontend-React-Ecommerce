import api from "./api";
import { initialCategories } from "../data/demoCategories.js";

const CATEGORIES_STORAGE_KEY = "atelier_categories_v2";
let _memoryCategories = null;

const getCategoriesStorage = () => {
  if (_memoryCategories && _memoryCategories.length > 0) {
    return _memoryCategories;
  }
  const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!stored) {
    return initialCategories;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      _memoryCategories = parsed;
      return parsed;
    }
    return initialCategories;
  } catch {
    return initialCategories;
  }
};

const saveCategoriesStorage = (categories) => {
  _memoryCategories = categories;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // ignore storage quota errors
  }
};

export const categoryService = {
  // Synchronously returns cached categories for 0ms instant rendering
  getCachedCategories: () => {
    return getCategoriesStorage();
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get("/categories/");
      if (Array.isArray(response.data) && response.data.length > 0) {
        saveCategoriesStorage(response.data);
      }
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      return getCategoriesStorage();
    }
  },

  // Create new category (Admin)
  createCategory: async (categoryData) => {
    try {
      const response = await api.post("/categories/", categoryData);
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getCategoriesStorage();
      const newCategory = {
        id: Date.now(),
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, "-"),
        description: categoryData.description || "",
        image: categoryData.image || "/user/images/home/product1.jpg",
        itemCount: 0,
        status: categoryData.status || "Active",
      };
      list.push(newCategory);
      saveCategoriesStorage(list);
      return newCategory;
    }
  },

  // Update category (Admin)
  updateCategory: async (id, updatedFields) => {
    try {
      const response = await api.put(`/categories/${id}/`, updatedFields);
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getCategoriesStorage();
      const index = list.findIndex((c) => String(c.id) === String(id));
      if (index === -1) throw new Error("Category not found");

      list[index] = { ...list[index], ...updatedFields };
      if (updatedFields.name) {
        list[index].slug = updatedFields.name.toLowerCase().replace(/\s+/g, "-");
      }
      saveCategoriesStorage(list);
      return list[index];
    }
  },

  // Delete category (Admin)
  deleteCategory: async (id) => {
    try {
      await api.delete(`/categories/${id}/`);
      return true;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getCategoriesStorage();
      const filtered = list.filter((c) => String(c.id) !== String(id));
      saveCategoriesStorage(filtered);
      return true;
    }
  },
};
