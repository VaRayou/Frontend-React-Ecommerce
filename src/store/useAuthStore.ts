import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Order } from "../types";
import { supabase } from "../services/supabase";
import { useAdminAuthStore } from "./useAdminAuthStore";

interface AuthState {
  user: User | null;
  orders: Order[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addOrder: (order: Order) => void;
}

const INITIAL_ORDERS: Order[] = [];

// Whitelist of valid administrator emails (Used only as secondary check alongside authoritative app_metadata.role)
const VERIFIED_ADMIN_EMAILS = new Set([
  "controller@steav.com",
  "admin@steav.com",
  "rayou@steav.com",
  "catalog@steav.com",
  "manager@steav.com",
  "controller@atelier.com",
  "admin@atelier.com",
]);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      orders: INITIAL_ORDERS,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const cleanEmail = String(email || "").trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { success: false, message: "Email and password are required." };
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!error && data?.user) {
            const u = data.user;
            // Admin role claim MUST come from protected app_metadata (set server-side in Supabase Auth)
            const appRole = String(
              (u as any).app_metadata?.role || ""
            ).toLowerCase().trim();

            const isAuthorizedAdmin =
              (appRole.includes("admin") ||
                appRole.includes("controller") ||
                appRole.includes("catalog")) &&
              VERIFIED_ADMIN_EMAILS.has(cleanEmail);

            const loggedUser: User = {
              id: String(u.id),
              name: u.user_metadata?.full_name || cleanEmail.split("@")[0].toUpperCase(),
              email: u.email || cleanEmail,
              role: isAuthorizedAdmin ? "admin" : "customer",
              isAdmin: isAuthorizedAdmin,
              phone: u.user_metadata?.phone || "+855 23 888 999",
              avatar:
                u.user_metadata?.avatar_url ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
              address: {
                street: "Preah Norodom Blvd",
                city: "Phnom Penh",
                country: "Cambodia",
                postalCode: "12000",
              },
            };
            set({ user: loggedUser, isAuthenticated: true });

            // Seamlessly cross-authenticate useAdminAuthStore if admin
            if (isAuthorizedAdmin && password) {
              try {
                await useAdminAuthStore.getState().adminLogin(cleanEmail, password).catch(() => {});
              } catch {}
            }

            return { success: true, message: "Welcome back to STEAV Studio." };
          }

          if (error) {
            return { success: false, message: error.message || "Invalid email or password." };
          }
        } catch (err: any) {
          console.warn("[Supabase] login notice:", err?.message || err);
        }

        return { success: false, message: "Invalid email or password." };
      },

      register: async (name: string, email: string, password: string, phone: string = "") => {
        const cleanEmail = String(email || "").trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { success: false, message: "Email and password are required." };
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: name,
                phone: phone || "+855 23 888 999",
                role: "customer", // Default client registration is always customer
              },
            },
          });

          if (!error && data?.user) {
            const u = data.user;
            const newUser: User = {
              id: String(u.id),
              name: name || cleanEmail.split("@")[0],
              email: u.email || cleanEmail,
              phone: phone || "+855 23 888 999",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            };
            set({ user: newUser, isAuthenticated: true });
            return { success: true, message: "Patron account created successfully!" };
          }

          if (error) {
            return { success: false, message: error.message };
          }
        } catch (err: any) {
          console.warn("[Supabase] register note:", err?.message || err);
        }

        return { success: false, message: "Unable to register account. Please try again." };
      },

      logout: () => {
        try {
          supabase.auth.signOut();
          localStorage.removeItem("eshopper_token");
        } catch {}
        try {
          useAdminAuthStore.getState().adminLogout();
        } catch {}
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data) => {
        // Prevent normal users from escalating role through profile update
        const sanitized = { ...data };
        delete (sanitized as any).role;
        delete (sanitized as any).isAdmin;

        set((state) => ({
          user: state.user ? { ...state.user, ...sanitized } : null,
        }));
      },

      addOrder: (order: Order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),
    }),
    {
      name: "atelier_auth_v2",
    }
  )
);

export default useAuthStore;
