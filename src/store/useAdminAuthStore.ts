import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

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
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  adminLogout: () => void;
  updateAdminProfile: (data: Partial<AdminUser>) => void;
}

const AUTHORIZED_ADMIN_EMAILS = new Set([
  "controller@atelier.com",
  "admin@atelier.com",
  "rayou@atelier.com",
  "catalog@atelier.com",
  "manager@atelier.com",
]);

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      adminUser: null,

      adminLogin: async (email: string, password: string) => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !password) {
          return {
            success: false,
            message: "Please enter your administrator email and password.",
          };
        }

        // Authenticate strictly with Supabase Cloud Auth (0ms Cold Start, Signed Cryptographic JWT)
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
            return {
              success: false,
              message: error.message || "Invalid administrator credentials.",
            };
          }

          if (data?.user) {
            const u = data.user;
            const rawRole = String((u as any).app_metadata?.role || "").toLowerCase();

            // Verify that this account possesses official administrative clearance
            const isAuthorizedEmail = AUTHORIZED_ADMIN_EMAILS.has(cleanEmail);
            const isAuthorizedRole =
              rawRole.includes("admin") ||
              rawRole.includes("controller") ||
              rawRole.includes("catalog");

            if (!isAuthorizedEmail && !isAuthorizedRole) {
              await supabase.auth.signOut();
              return {
                success: false,
                message:
                  "Access Denied: This account does not possess official administrative clearance.",
              };
            }

            // Determine authoritative RBAC role
            let resolvedRole: AdminUser["role"] = "Store Controller";
            if (
              rawRole.includes("super") ||
              cleanEmail === "controller@atelier.com" ||
              cleanEmail === "rayou@atelier.com"
            ) {
              resolvedRole = "Super Administrator";
            } else if (
              rawRole.includes("catalog") ||
              cleanEmail === "catalog@atelier.com" ||
              cleanEmail === "manager@atelier.com"
            ) {
              resolvedRole = "Catalog Manager";
            } else if (
              rawRole.includes("controller") ||
              cleanEmail === "admin@atelier.com"
            ) {
              resolvedRole = "Store Controller";
            }

            const adminUserObj: AdminUser = {
              id: String(u.id),
              name:
                u.user_metadata?.full_name ||
                (resolvedRole === "Super Administrator"
                  ? "Alexander Vance (Super Admin)"
                  : resolvedRole === "Catalog Manager"
                  ? "Elena Moreau (Catalog Manager)"
                  : "Marcus Thorne (Store Controller)"),
              email: u.email || cleanEmail,
              role: resolvedRole,
              avatar:
                u.user_metadata?.avatar_url ||
                (resolvedRole === "Catalog Manager"
                  ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"),
              lastLogin: new Date().toISOString(),
            };

            set({ isAdminAuthenticated: true, adminUser: adminUserObj });
            return { success: true };
          }
        } catch (err: any) {
          console.error("[Supabase Auth] Login error:", err);
          return {
            success: false,
            message: err.message || "Failed to reach Supabase authentication server.",
          };
        }

        return {
          success: false,
          message: "Access Denied: Invalid administrator email or password.",
        };
      },

      adminLogout: () => {
        try {
          supabase.auth.signOut();
          localStorage.removeItem("eshopper_admin_token");
        } catch {}
        set({ isAdminAuthenticated: false, adminUser: null });
      },

      updateAdminProfile: (data) =>
        set((state) => ({
          adminUser: state.adminUser ? { ...state.adminUser, ...data } : null,
        })),
    }),
    {
      name: "atelier_admin_auth",
    }
  )
);
