import { supabase } from "./supabase";
import { ensureAdminSession } from "./productService";

const USERS_STORAGE_KEY = "atelier_users_v3";

const formatUser = (u) => ({
  id: String(u.id),
  name: u.full_name || u.name || (u.email ? u.email.split("@")[0] : "Patron"),
  email: u.email || "",
  phone: u.phone || "",
  avatar: u.avatar_url || u.avatar || "/admin/img/avatars/avatar-2.jpg",
  role: u.role || "customer",
  status: u.status || "Active",
  registeredDate: u.created_at
    ? String(u.created_at).split("T")[0]
    : new Date().toISOString().split("T")[0],
  shippingAddress: u.shipping_address || {},
});

export const userService = {
  getUsers: async () => {
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(formatUser);
      }
    } catch (err) {
      console.warn("[Supabase] getUsers note:", err.message);
    }
    return [];
  },

  getUserById: async (id) => {
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) return formatUser(data);
    } catch (err) {
      console.warn("[Supabase] getUserById note:", err.message);
    }
    throw new Error("User not found");
  },

  createUser: async (userData) => {
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            full_name: userData.name,
            email: userData.email,
            phone: userData.phone || "",
            role: userData.role || "customer",
            status: userData.status || "Active",
            avatar_url: userData.avatar || "/admin/img/avatars/avatar-2.jpg",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return formatUser(data);
    } catch (err) {
      console.error("[Supabase] createUser error:", err.message);
      throw err;
    }
  },

  updateUser: async (id, updatedFields) => {
    try {
      await ensureAdminSession();
      const patch = {};
      if (updatedFields.name !== undefined)
        patch.full_name = updatedFields.name;
      if (updatedFields.phone !== undefined) patch.phone = updatedFields.phone;
      if (updatedFields.role !== undefined) patch.role = updatedFields.role;
      if (updatedFields.status !== undefined)
        patch.status = updatedFields.status;

      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return formatUser(data);
    } catch (err) {
      console.error("[Supabase] updateUser error:", err.message);
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      await ensureAdminSession();
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("[Supabase] deleteUser error:", err.message);
      throw err;
    }
  },
};
