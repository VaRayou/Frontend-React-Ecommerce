import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Star,
  Crown,
  ShoppingBag,
  ArrowLeft,
  QrCode,
  Truck,
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
    showToast(`Welcome back to Atelier Paris, ${data.email.split("@")[0]}!`, "success");
    navigate(from, { replace: true });
  };

  const handleQuickDemoFill = () => {
    setValue("email", "camille@atelier.com", { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
    showToast("VIP Patron credentials loaded — click 'Sign In' to proceed", "info");
  };

  const handleForgotPassword = () => {
    setResetSent(true);
    showToast(
      watchedEmail && watchedEmail.includes("@")
        ? `Security reset instructions dispatched to ${watchedEmail}`
        : "Please enter your email address above to receive your reset link.",
      "info"
    );
    setTimeout(() => setResetSent(false), 6000);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F6F6F4]">
      {/* Dynamic Ambient Blur Spheres */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-[#D6FF00]/12 blur-[100px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-black/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[2rem] overflow-hidden bg-white border border-gray-200/90 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.1)] relative z-10"
      >
        {/* Left Editorial Visual Column (5 Cols) */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-[#0B0B0B] text-white p-10 flex-col justify-between overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
            alt="Atelier Paris Haute Couture"
            className="absolute inset-0 w-full h-full object-cover opacity-50 scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-black/35" />

          {/* Header Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2.5 group/logo">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] inline-block shadow-[0_0_8px_#D6FF00]" />
              <span className="font-black tracking-[-0.04em] text-xl text-white">
                ATELIER
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.26em] text-neutral-400 uppercase">
                PARIS
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-wider text-[#D6FF00]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vault 256-Bit</span>
            </span>
          </div>

          {/* Middle Editorial Narrative & Privileges */}
          <div className="relative z-10 space-y-6 my-auto pt-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6FF00] text-black text-[10px] font-black uppercase tracking-widest shadow-xs">
                <Crown className="w-3 h-3" />
                <span>Patron Sanctuary • AW26</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-[1.08] text-white">
                Step Inside The Private Salon.
              </h2>
              <p className="text-xs text-neutral-300 font-normal leading-relaxed">
                Access your archived runway lookbooks, expedited NBC Bakong KHQR settlement, and real-time courier milestone updates.
              </p>
            </div>

            {/* Privilege Highlights */}
            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3 transition-colors hover:bg-white/12">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0 font-black">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant NBC Bakong KHQR</h4>
                  <p className="text-[11px] text-neutral-300">
                    Dual USD &amp; KHR checkout with luxury digital vouchers
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3 transition-colors hover:bg-white/12">
                <div className="w-8 h-8 rounded-xl bg-white/15 text-[#D6FF00] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">White-Glove Express Dispatch</h4>
                  <p className="text-[11px] text-neutral-300">
                    Complimentary worldwide shipping milestone tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <div className="flex text-[#D6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D6FF00] stroke-[#D6FF00]" />
                ))}
              </div>
              <span className="font-extrabold text-white text-[11px]">4.98 / 5.0</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Patron Verified</span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              Paris • Phnom Penh
            </span>
          </div>
        </div>

        {/* Right Form Column (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            {/* Top Navigation & Tab Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Creative Sliding Segmented Tabs */}
              <div className="p-1 rounded-2xl bg-gray-100/90 border border-gray-200/80 flex items-center w-full sm:w-72 relative">
                <button
                  type="button"
                  className="relative flex-1 py-2 text-center text-xs font-black uppercase tracking-wider text-black z-10 transition-colors"
                >
                  <motion.div
                    layoutId="auth-active-tab"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-200/60 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                  <span>Sign In</span>
                </button>
                <Link
                  to="/register"
                  state={location.state}
                  className="flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                >
                  Register
                </Link>
              </div>

              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Boutique</span>
              </Link>
            </div>

            {/* Header Titles */}
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                Atelier Client Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs text-gray-500 font-normal">
                {isRedirectedForPurchase
                  ? "Sign in to complete your runway acquisition with saved privileges."
                  : "Enter your patron credentials to manage orders, invoices, and saved pieces."}
              </p>
            </div>

            {/* Context-Aware Checkout Banner */}
            {isRedirectedForPurchase && (
              <div className="p-3.5 rounded-2xl bg-[#111111] text-white flex items-center gap-3 shadow-xs border border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <strong className="font-bold text-[#D6FF00] block text-xs">
                    Your Shopping Bag is Reserved
                  </strong>
                  <span className="text-gray-300 text-[11px] truncate block">
                    Sign in to seamlessly return and complete your order.
                  </span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder="name@atelier.com"
                    className="w-full pl-13 pr-4 py-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                    Security Passkey
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-gray-500 hover:text-black font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Forgot passkey?
                  </button>
                </div>
                <div className="relative group">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    placeholder="Enter your passkey"
                    className="w-full pl-13 pr-11 py-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-black transition-colors cursor-pointer"
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

              {/* Reset Password Toast Feedback */}
              <AnimatePresence>
                {resetSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 overflow-hidden"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Password recovery link dispatched. Check your inbox.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember Me & Demo Fill Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <label
                  htmlFor="rememberMe"
                  className="flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...register("rememberMe")}
                    className="w-4 h-4 accent-black rounded cursor-pointer"
                  />
                  <span>Keep me authenticated for 30 days</span>
                </label>

                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  title="Auto-fill Demo Patron Credentials for quick evaluation"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Demo VIP Login</span>
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? "Authenticating..." : "Sign In to Atelier"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Footer Navigation & Admin Link */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              <span>Don't have a patron account? </span>
              <Link
                to="/register"
                state={location.state}
                className="font-black text-black hover:underline uppercase tracking-wider ml-1"
              >
                Register Here &rarr;
              </Link>
            </div>

            <Link
              to="/admin/login"
              className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Studio Controller Access</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

