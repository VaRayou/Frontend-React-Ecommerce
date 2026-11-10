import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || "/";
  const isRedirectedForPurchase = Boolean(location.state?.from);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const res = await login(data.email, data.password);
    if (!res.success) {
      showToast(res.message || "Invalid email or password", "error");
      return;
    }
    showToast(`Welcome back, ${data.email.split("@")[0]}!`, "success");
    navigate(from, { replace: true });
  };

  const handleQuickDemoFill = () => {
    setValue("email", "camille@atelier.com");
    setValue("password", "password123");
    showToast("Demo VIP patron credentials loaded", "info");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl">
        {/* Left: Editorial Image Banner */}
        <div className="relative hidden md:block bg-black">
          <img
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80"
            alt="Atelier Model"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#D6FF00] text-black font-black text-[10px] tracking-widest uppercase inline-block">
              Patron Sanctuary
            </span>
            <h3 className="text-2xl font-black uppercase tracking-tight">
              Curate Your Personal Runway Wardrobe.
            </h3>
            <p className="text-xs text-gray-300 font-light">
              Access bespoke tailoring reservations, private capsule previews, and VIP express dispatch.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
              Account Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase">
              Sign In to Atelier
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-light">
              {isRedirectedForPurchase
                ? "Please sign in or create an account to purchase products and checkout."
                : "Enter your credentials to manage your orders and wishlist."}
            </p>
          </div>

          {/* Quick Demo Fill Pill */}
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Click to fill Demo VIP Account</span>
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="camille@atelier.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => alert("Password reset link dispatched to your email address.")}
                  className="text-gray-400 hover:text-black underline text-[11px]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                {...register("rememberMe")}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-gray-600 font-medium cursor-pointer">
                Remember my device for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black hover:bg-neutral-900 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? "Authenticating..." : "Sign In to Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Register */}
          <div className="pt-2 text-center text-xs text-gray-500 border-t border-gray-100">
            <span>New to Atelier? </span>
            <Link
              to="/register"
              state={location.state}
              className="font-bold text-black hover:underline uppercase tracking-wider"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

