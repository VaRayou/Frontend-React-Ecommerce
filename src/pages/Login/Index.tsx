import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  QrCode,
  Truck,
  CheckCircle2,
  KeyRound,
  Star,
} from "lucide-react";
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

  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const from =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || "/";
  const isRedirectedForPurchase = Boolean(location.state?.from);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const watchedEmail = watch("email");

  const onSubmit = async (data: LoginFormData) => {
    const res = await login(data.email, data.password);
    if (!res.success) {
      showToast(res.message || "Invalid email or password", "error");
      return;
    }
    showToast(`Welcome back, ${data.email.split("@")[0]}!`, "success");
    navigate(from, { replace: true });
  };

  const handleQuickDemoFill = async () => {
    setValue("email", "camille@atelier.com", { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
    showToast("VIP Patron credentials filled — click Sign In to continue", "info");
  };

  const handleForgotPassword = () => {
    setResetSent(true);
    showToast(
      watchedEmail && watchedEmail.includes("@")
        ? `Password recovery instructions sent to ${watchedEmail}`
        : "Enter your email above and we'll dispatch a secure recovery link.",
      "info"
    );
    setTimeout(() => setResetSent(false), 5000);
  };

  return (
    <div className="min-h-[84vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Ambient Architectural Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#D6FF00]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-black/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl sm:rounded-[2rem] overflow-hidden bg-white border border-gray-200/80 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.12)] relative z-10"
      >
        {/* Mobile Compact Luxury Header Banner (< lg) */}
        <div className="lg:hidden relative bg-[#111111] text-white p-5 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80"
            alt="Atelier Paris"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D6FF00] text-black font-black text-[9px] tracking-widest uppercase mb-1.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Patron Sanctuary</span>
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight leading-tight">
                House of Atelier Paris
              </h2>
              <p className="text-[11px] text-gray-300 font-light mt-0.5">
                VIP Express Dispatch • NBC Bakong KHQR • Private Archive
              </p>
            </div>
            <div className="shrink-0 text-right hidden xs:block">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-[#D6FF00]">
                <ShieldCheck className="w-3 h-3" />
                <span>256-Bit SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Desktop Editorial Showcase Column (5 Cols) */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-[#0B0B0B] text-white p-10 flex-col justify-between overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80"
            alt="Atelier Editorial"
            className="absolute inset-0 w-full h-full object-cover opacity-55 scale-102 transition-transform duration-1000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-black/55 to-black/30" />

          {/* Top Brand Crest */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] inline-block group-hover:scale-125 transition-transform" />
              <span className="font-extrabold tracking-[-0.05em] text-xl text-white">
                ATELIER
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] text-gray-300 uppercase ml-0.5">
                PARIS
              </span>
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-[#D6FF00]">
              <ShieldCheck className="w-3 h-3" />
              <span>Encrypted Vault</span>
            </span>
          </div>

          {/* Middle & Bottom Editorial Narrative + Privileges */}
          <div className="relative z-10 space-y-6 my-auto pt-12">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-[#D6FF00] text-black font-black text-[10px] tracking-widest uppercase inline-block shadow-sm">
                Private Client Portal • AW26
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-[1.06]">
                Curate Your Personal Runway Wardrobe.
              </h2>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Sign in to access your saved lookbooks, instant NBC Bakong KHQR settlement,
                and real-time courier milestone tracking.
              </p>
            </div>

            {/* Luxury Member Privileges Cards */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/12 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Instant Bakong KHQR</h4>
                  <p className="text-[11px] text-gray-300">
                    Seamless USD ($) &amp; KHR (៛) checkout with official thermal receipts
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/12 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 text-[#D6FF00] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Priority Global Dispatch</h4>
                  <p className="text-[11px] text-gray-300">
                    Complimentary express courier on orders over $200
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof Footer */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <div className="flex text-[#D6FF00]">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-3 h-3 fill-[#D6FF00] stroke-[#D6FF00]" />
                ))}
              </div>
              <span className="font-bold text-white">4.9 / 5.0</span>
              <span className="text-gray-400">Patron Rating</span>
            </div>
            <span className="uppercase tracking-widest text-[10px] text-gray-400 font-semibold">
              Paris • Phnom Penh
            </span>
          </div>
        </div>

        {/* Right Form Column (7 Cols) */}
        <div className="lg:col-span-7 p-5 sm:p-10 md:p-12 flex flex-col justify-between bg-white">
          {/* Top Mode Switcher Tabs (Sign In / Create Account) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 border border-gray-200/70 w-full sm:w-72">
                <div className="py-2 px-4 rounded-xl bg-[#111111] text-[#D6FF00] text-center text-xs font-black uppercase tracking-wider shadow-xs">
                  Sign In
                </div>
                <Link
                  to="/register"
                  state={location.state}
                  className="py-2 px-4 rounded-xl text-gray-500 hover:text-black text-center text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Online</span>
              </span>
            </div>

            {/* Heading */}
            <div>
              <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-gray-400 block mb-1">
                Welcome Back
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                Sign In to Your Account
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-normal">
                {isRedirectedForPurchase
                  ? "Sign in to complete your bag checkout and unlock live order tracking."
                  : "Enter your patron credentials to manage orders, receipts, and saved pieces."}
              </p>
            </div>

            {/* Context-Aware Checkout Notice */}
            {isRedirectedForPurchase && (
              <div className="p-3.5 rounded-2xl bg-[#111111] text-white flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="font-bold text-[#D6FF00] block">
                    Your Shopping Bag is Reserved
                  </strong>
                  <span className="text-gray-300 text-[11px]">
                    Sign in now and you will be returned directly to complete your purchase.
                  </span>
                </div>
              </div>
            )}

            {/* Main Sign-In Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              {/* Email Input */}
              <div>
                <label className="block font-extrabold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder="name@atelier.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-extrabold text-gray-800 uppercase tracking-wider text-[11px]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-gray-500 hover:text-black font-bold underline underline-offset-2 text-[11px] cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-11 py-3.5 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {resetSent && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    If an account matches your email, a secure password reset link has been sent.
                  </span>
                </div>
              )}

              {/* Remember Device & Quick Demo Fill Row */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <label
                  htmlFor="rememberMe"
                  className="flex items-center gap-2 text-gray-600 font-semibold cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...register("rememberMe")}
                    className="w-4 h-4 accent-black rounded cursor-pointer"
                  />
                  <span>Keep me signed in for 30 days</span>
                </label>

                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-700 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Auto-fill VIP Patron Demo Credentials"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Fill VIP Demo</span>
                </button>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 mt-2"
              >
                <span>{isSubmitting ? "Authenticating Account..." : "Sign In to Atelier"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Bottom Footer Links */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              <span>New to the House of Atelier? </span>
              <Link
                to="/register"
                state={location.state}
                className="font-black text-black hover:underline uppercase tracking-wider ml-1"
              >
                Create Account &rarr;
              </Link>
            </div>

            <Link
              to="/admin/login"
              className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Studio Controller Portal</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
