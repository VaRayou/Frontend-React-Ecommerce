import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Order } from "../types";
import { supabase } from "../services/supabase";

interface AuthState {
  user: User | null;
  orders: Order[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password?: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addOrder: (order: Order) => void;
}

const DEMO_USER: User = {
  id: "usr-01",
  name: "Camille Laurent",
  email: "camille@atelier.com",
  phone: "+1 (555) 349-2810",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  address: {
    street: "740 Madison Avenue, Apt 8B",
    city: "New York",
    country: "United States",
    postalCode: "10065",
  },
};

const INITIAL_ORDERS: Order[] = [];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      orders: INITIAL_ORDERS,
      isAuthenticated: false,

      login: async (email, password = "password123") => {
        const cleanEmail = email.trim().toLowerCase();
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!error && data?.user) {
            const u = data.user;
            const loggedUser: User = {
              id: String(u.id),
              name: u.user_metadata?.full_name || cleanEmail.split("@")[0].toUpperCase(),
              email: u.email || cleanEmail,
              role: u.user_metadata?.role || "customer",
              isAdmin: Boolean(u.user_metadata?.role === "super_admin" || u.user_metadata?.role === "admin"),
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
            return { success: true, message: "Welcome back to Atelier Studio." };
          }
          if (error) {
            if (cleanEmail === "camille@atelier.com") {
              set({ user: DEMO_USER, isAuthenticated: true });
              return { success: true, message: "Welcome back, Camille!" };
            }
            return { success: false, message: error.message };
          }
        } catch (err: any) {
          console.warn("[Supabase] login notice:", err.message);
        }

        // Demo account fallback if camille@atelier.com is used
        if (cleanEmail === "camille@atelier.com") {
          set({ user: DEMO_USER, isAuthenticated: true });
          return { success: true, message: "Welcome back, Camille!" };
        }

        return { success: false, message: "Invalid email or password." };
      },

      register: async (name, email, password = "password123", phone = "") => {
        const cleanEmail = email.trim().toLowerCase();
        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: name,
                phone: phone || "+855 23 888 999",
                role: "customer",
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
          console.warn("[Supabase] register note:", err.message);
        }

        return { success: false, message: "Unable to register account. Please try again." };
      },

      logout: () => {
        try {
          supabase.auth.signOut();
          localStorage.removeItem("eshopper_token");
        } catch {}
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data) => {
        const current = useAuthStore.getState().user;
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
        if (current && current.id && /^\d+$/.test(String(current.id))) {
          api
            .patch(`/users/${current.id}/`, {
              name: data.name ?? current.name,
              email: data.email ?? current.email,
              phone: data.phone ?? current.phone ?? "",
              address: data.address?.street ?? current.address?.street ?? "",
              city: data.address?.city ?? current.address?.city ?? "",
              country: data.address?.country ?? current.address?.country ?? "",
            })
            .catch((err) => {
              console.warn("Profile backend sync note:", err?.message);
            });
        }
      },

      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }));
      },
    }),
    {
      name: "atelier_auth_v3",
    }
  )
);
export default useAuthStore;
