import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Administrator" | "Store Controller" | "Catalog Manager";
  avatar: string;
  lastLogin: string;
}

interface AdminAuthState {
  isAdminAuthenticated: boolean;
  adminUser: AdminUser | null;
  adminLogin: (
    email: string,
    password?: string,
    role?: AdminUser["role"]
  ) => Promise<{ success: boolean; message?: string }>;
  adminLogout: () => void;
  updateAdminProfile: (data: Partial<AdminUser>) => void;
}

const ALLOWED_ADMIN_EMAILS = new Set([
  "controller@atelier.com",
  "admin@atelier.com",
  "rayou@atelier.com",
]);

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      adminUser: null,

      adminLogin: async (email, password = "adminpass123", role = "Super Administrator") => {
        const cleanEmail = email.trim().toLowerCase();
        try {
          const res = await api.post("/auth/login/", {
            email: cleanEmail,
            password,
            require_admin: true,
          });
          if (res.data && res.data.user) {
            const u = res.data.user;
            if (u.role !== "admin" && !u.isAdmin && !ALLOWED_ADMIN_EMAILS.has(cleanEmail)) {
              return {
                success: false,
                message: "Access Denied: Customer accounts cannot access the Admin Controller.",
              };
            }
            if (res.data.token) {
              localStorage.setItem("eshopper_admin_token", res.data.token);
            }
            const user: AdminUser = {
              id: String(u.id),
              name:
                `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                u.name ||
                u.username ||
                cleanEmail.split("@")[0],
              email: u.email || cleanEmail,
              role,
              avatar:
                u.avatar ||
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
              lastLogin: new Date().toISOString(),
            };
            set({ isAdminAuthenticated: true, adminUser: user });
            return { success: true };
          }
        } catch (err: any) {
          const status = err?.response?.status;
          const errMsg = err?.response?.data?.error;
          if (status === 401 || status === 403 || status === 429) {
            return {
              success: false,
              message: errMsg || "Authorization failed: Invalid administrator credentials.",
            };
          }
          console.warn("Backend admin login notice, checking local controller credentials:", err.message);
        }

        // Offline fallback only for verified controller accounts
        if (
          ALLOWED_ADMIN_EMAILS.has(cleanEmail) &&
          (password === "adminpass123" || password === "admin123")
        ) {
          const user: AdminUser = {
            id: "adm-01",
            name: cleanEmail === "controller@atelier.com" ? "Alexander Vance" : "Atelier Administrator",
            email: cleanEmail,
            role,
            avatar:
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
            lastLogin: new Date().toISOString(),
          };
          set({ isAdminAuthenticated: true, adminUser: user });
          return { success: true };
        }

        return {
          success: false,
          message: "Access Denied: Invalid administrator email or security password.",
        };
      },

      adminLogout: () => {
        try {
          localStorage.removeItem("eshopper_admin_token");
        } catch {}
        set({ isAdminAuthenticated: false, adminUser: null });
      },

      updateAdminProfile: (data) => {
        set((state) => ({
          adminUser: state.adminUser ? { ...state.adminUser, ...data } : null,
        }));
      },
    }),
    {
      name: "atelier_admin_auth_v3",
    }
  )
);
export default useAdminAuthStore;
