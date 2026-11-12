import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "customer" | "catalog_manager" | "store_controller" | "super_admin";
  phone?: string;
  avatarUrl?: string;
  shippingAddress?: Record<string, any>;
}

export const supabaseAuth = {
  // Sign Up a new patron with email and password
  signUp: async (email: string, password: string, fullName: string = "") => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "customer",
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign In existing patron or admin
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch the attached public.profiles row for role & metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return {
      session: data.session,
      user: data.user,
      profile: profile as UserProfile | null,
    };
  },

  // Sign Out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current active session and profile
  getCurrentSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    return {
      session,
      user: session.user,
      profile: profile as UserProfile | null,
      isAdmin:
        profile?.role === "super_admin" || profile?.role === "store_controller",
    };
  },

  // Listen to auth state changes across the application
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabaseAuth;
