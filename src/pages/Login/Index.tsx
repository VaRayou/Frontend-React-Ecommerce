import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
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
  Gift,
  FileText,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";

// 1. Zod Validation Schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    agreeTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the Terms of Service"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthProps {
  initialMode?: "login" | "register";
}

// Spring transition config for butter-smooth, attractive gliding
const glideSpring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 28,
  mass: 0.85,
};

export const Login: React.FC<AuthProps> = ({ initialMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuthStore();
  const { showToast } = useUIStore();

  // Determine current mode from props or current URL
  const currentPath = location.pathname.toLowerCase();
  const defaultMode =
    initialMode || (currentPath.includes("register") ? "register" : "login");

  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Sync mode if URL changes externally (e.g. browser back/forward buttons or external links)
  useEffect(() => {
    const isReg = location.pathname.toLowerCase().includes("register");
    const targetMode = isReg ? "register" : "login";
    if (targetMode !== mode) {
      setMode(targetMode);
    }
  }, [location.pathname]);

  // Popstate listener for native browser history navigation
  useEffect(() => {
    const onPopState = () => {
      const isReg = window.location.pathname.toLowerCase().includes("register");
      setMode(isReg ? "register" : "login");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const from =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || "/";
  const isRedirectedForPurchase = Boolean(location.state?.from);

  // Forms setup
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeTerms: true,
    },
  });

  const watchedEmail = loginForm.watch("email");
  const watchedRegisterPassword = registerForm.watch("password") || "";
  const watchedRegisterConfirm = registerForm.watch("confirmPassword") || "";

  // Password Security Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!watchedRegisterPassword)
      return { score: 0, label: "Enter 6+ characters", color: "bg-gray-200" };
    let score = 0;
    if (watchedRegisterPassword.length >= 6) score++;
    if (watchedRegisterPassword.length >= 8) score++;
    if (/[A-Z]/.test(watchedRegisterPassword) || /[0-9]/.test(watchedRegisterPassword))
      score++;
    if (
      /[^A-Za-z0-9]/.test(watchedRegisterPassword) ||
      watchedRegisterPassword.length >= 10
    )
      score++;

    const labels = ["Too Short", "Fair", "Good", "Strong", "Vault-Grade"];
    const colors = [
      "bg-rose-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-emerald-500",
      "bg-[#111111]",
    ];
    return {
      score,
      label: labels[score] || "Good",
      color: colors[score] || "bg-emerald-500",
    };
  }, [watchedRegisterPassword]);

  // Smooth Mode Switcher with Zero-Flash URL synchronization
  const handleSwitchMode = (target: "login" | "register") => {
    if (target === mode) return;

    // Cross-populate email between forms for patron convenience
    if (target === "register") {
      const loginEmail = loginForm.getValues("email");
      if (loginEmail && !registerForm.getValues("email")) {
        registerForm.setValue("email", loginEmail, { shouldValidate: true });
      }
    } else {
      const regEmail = registerForm.getValues("email");
      if (regEmail && !loginForm.getValues("email")) {
        loginForm.setValue("email", regEmail, { shouldValidate: true });
      }
    }

    setMode(target);

    // Update browser URL without triggering unmount or Suspense fallback
    try {
      window.history.replaceState(
        window.history.state,
        "",
        target === "register" ? "/register" : "/login"
      );
    } catch {
      navigate(target === "register" ? "/register" : "/login", { replace: true });
    }
  };

  // Submit Handlers
  const onLoginSubmit = async (data: LoginFormData) => {
    const res = await login(data.email, data.password);
    if (!res.success) {
      showToast(res.message || "Invalid email or password", "error");
      return;
    }
    showToast(`Welcome back to STEAV Paris, ${data.email.split("@")[0]}!`, "success");
    navigate(from, { replace: true });
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    const res = await registerUser(
      data.fullName,
      data.email,
      data.password,
      data.phone || ""
    );
    if (!res.success) {
      showToast(res.message || "Could not create account", "error");
      return;
    }
    showToast(`Welcome to the House of STEAV Paris, ${data.fullName}!`, "success");
    navigate(from, { replace: true });
  };

  // Quick Demo Auto-fill
  const handleQuickDemoFillLogin = () => {
    loginForm.setValue("email", "camille@steav.com", { shouldValidate: true });
    loginForm.setValue("password", "password123", { shouldValidate: true });
    showToast("VIP Patron credentials loaded — click 'Sign In' to proceed", "info");
  };

  const handleQuickDemoFillRegister = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    registerForm.setValue("fullName", "Margot Fontaine", { shouldValidate: true });
    registerForm.setValue("email", `margot${randomSuffix}@steav.com`, {
      shouldValidate: true,
    });
    registerForm.setValue("phone", "+855 96 835 0317", { shouldValidate: true });
    registerForm.setValue("password", "SteavPass2026!", { shouldValidate: true });
    registerForm.setValue("confirmPassword", "SteavPass2026!", {
      shouldValidate: true,
    });
    showToast("Demo Patron credentials generated — ready to register", "info");
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
        {/* ========================================================= */}
        {/* Left Editorial Visual Column (5 Cols) with Dual-Pane Glide */}
        {/* ========================================================= */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-[#0B0B0B] text-white p-10 flex-col justify-between overflow-hidden group">
          {/* Persistent Background Images with Seamless Cross-Fade (Zero Blank Frame) */}
          <motion.img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
            alt="STEAV Paris Couture Model"
            animate={{
              opacity: mode === "register" ? 0.52 : 0,
              scale: mode === "register" ? 1 : 1.05,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <motion.img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
            alt="STEAV Paris Autumn Runway"
            animate={{
              opacity: mode === "login" ? 0.52 : 0,
              scale: mode === "login" ? 1 : 1.05,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-black/35" />

          {/* Header Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2.5 group/logo">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] inline-block shadow-[0_0_8px_#D6FF00]" />
              <span className="font-black tracking-[-0.04em] text-xl text-white">
                STEAV
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.26em] text-neutral-400 uppercase">
                PARIS
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-wider text-[#D6FF00]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{mode === "login" ? "Vault 256-Bit" : "Patron Circle"}</span>
            </span>
          </div>

          {/* Middle Editorial Narrative & Privileges - Dual-Pane Sliding Track */}
          <div className="relative z-10 my-auto pt-6 overflow-hidden w-full">
            <motion.div
              animate={{ x: mode === "register" ? "0%" : "-50%" }}
              transition={glideSpring}
              className="flex w-[200%] items-start"
            >
              {/* Left Editorial: Register (Slides in from Left to Right when x goes -50% -> 0%) */}
              <div className="w-1/2 pr-6 shrink-0 space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6FF00] text-black text-[10px] font-black uppercase tracking-widest shadow-xs">
                    <Crown className="w-3 h-3" />
                    <span>Private Membership Privileges</span>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-[1.08] text-white">
                    Begin Your Journey With STEAV.
                  </h2>
                  <p className="text-xs text-neutral-300 font-normal leading-relaxed">
                    Register your patron profile for one-click Bakong KHQR checkout, saved runway lookbooks, and private seasonal previews.
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">20% Welcome Voucher (STEAV20)</h4>
                      <p className="text-[11px] text-neutral-300">
                        Instant discount privilege applicable across the entire catalog
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/15 text-[#D6FF00] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Official Tax Receipts &amp; Tracker</h4>
                      <p className="text-[11px] text-neutral-300">
                        Permanent access to thermal invoices and 5-stage logistics
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Editorial: Login (Slides in from Right to Left when x goes 0% -> -50%) */}
              <div className="w-1/2 pl-6 shrink-0 space-y-6">
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

                {/* Highlights */}
                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3">
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

                  <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3">
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
            </motion.div>
          </div>

          {/* Bottom Social Proof */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <div className="flex text-[#D6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D6FF00] stroke-[#D6FF00]" />
                ))}
              </div>
              <span className="font-extrabold text-white text-[11px]">
                {mode === "login" ? "4.98 / 5.0" : "Complimentary"}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {mode === "login" ? "Patron Verified" : "Lifetime Membership"}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              Paris • Phnom Penh
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Right Form Column (7 Cols) with Dual-Pane Continuous Track */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white relative overflow-hidden">
          <div className="space-y-6">
            {/* Top Navigation & Fluid Animated Pill Switcher */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Creative Sliding Segmented Tabs */}
              <div className="p-1 rounded-2xl bg-gray-100/90 border border-gray-200/80 flex items-center w-full sm:w-72 relative">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className={`relative flex-1 py-2 text-center text-xs font-black uppercase tracking-wider z-10 transition-colors cursor-pointer ${
                    mode === "login" ? "text-black" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {mode === "login" && (
                    <motion.div
                      layoutId="auth-active-tab"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-200/60 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchMode("register")}
                  className={`relative flex-1 py-2 text-center text-xs font-black uppercase tracking-wider z-10 transition-colors cursor-pointer ${
                    mode === "register" ? "text-black" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {mode === "register" && (
                    <motion.div
                      layoutId="auth-active-tab"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-200/60 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>Create Account</span>
                </button>
              </div>

              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Boutique</span>
              </Link>
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
                    {mode === "login"
                      ? "Sign in to seamlessly return and complete your order."
                      : "Create your account now to unlock member checkout."}
                  </span>
                </div>
              </div>
            )}

            {/* Continuous Dual-Pane Track (Zero Blank Frames & Zero White Screen) */}
            <div className="relative overflow-hidden w-full min-h-[460px]">
              <motion.div
                animate={{ x: mode === "register" ? "0%" : "-50%" }}
                transition={glideSpring}
                className="flex w-[200%] items-start"
              >
                {/* ======================================================== */}
                {/* Left Pane (Pane 1): Register Form */}
                {/* Slides in from Left to Right when switching to Register */}
                {/* ======================================================== */}
                <div
                  className={`w-1/2 pr-3 sm:pr-6 shrink-0 transition-opacity duration-200 ${
                    mode === "register" ? "opacity-100" : "opacity-40 pointer-events-none select-none"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Titles */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                        New Patron Registry
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                        Create Your Account
                      </h1>
                      <p className="text-xs text-gray-500 font-normal">
                        Join our private patron circle for instant checkout and personalized runway orders.
                      </p>
                    </div>

                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-3 pt-1"
                    >
                      {/* Full Name & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                            Full Name *
                          </label>
                          <div className="relative group">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                              <User className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              autoComplete="name"
                              {...registerForm.register("fullName")}
                              placeholder="e.g. Rayou Va"
                              className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                            />
                          </div>
                          {registerForm.formState.errors.fullName && (
                            <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                              {registerForm.formState.errors.fullName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                            Phone Number{" "}
                            <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <div className="relative group">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                              <Phone className="w-4 h-4" />
                            </div>
                            <input
                              type="tel"
                              autoComplete="tel"
                              {...registerForm.register("phone")}
                              placeholder="e.g. 096 835 0317"
                              className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                          Email Address *
                        </label>
                        <div className="relative group">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            autoComplete="email"
                            {...registerForm.register("email")}
                            placeholder="name@steav.com"
                            className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                          />
                        </div>
                        {registerForm.formState.errors.email && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      {/* Password & Confirm */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                            Security Passkey *
                          </label>
                          <div className="relative group">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              {...registerForm.register("password")}
                              placeholder="Min. 6 chars"
                              className="w-full pl-13 pr-10 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
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
                          {registerForm.formState.errors.password && (
                            <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                              {registerForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                            Confirm Passkey *
                          </label>
                          <div className="relative group">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              {...registerForm.register("confirmPassword")}
                              placeholder="Repeat passkey"
                              className="w-full pl-13 pr-10 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
                              aria-label={
                                showConfirmPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {registerForm.formState.errors.confirmPassword && (
                            <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                              {registerForm.formState.errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Security Strength Gauge */}
                      {watchedRegisterPassword.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-gray-600 uppercase tracking-wider">
                              Passkey Strength:{" "}
                              <strong className="text-black">
                                {passwordStrength.label}
                              </strong>
                            </span>
                            {watchedRegisterConfirm.length > 0 && (
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  watchedRegisterPassword === watchedRegisterConfirm
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {watchedRegisterPassword === watchedRegisterConfirm ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Passkeys match</span>
                                  </>
                                ) : (
                                  <span>Passkeys do not match yet</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  passwordStrength.score >= level
                                    ? passwordStrength.color
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Terms & Quick Demo Fill */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <label
                          htmlFor="agreeTerms"
                          className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            id="agreeTerms"
                            {...registerForm.register("agreeTerms")}
                            className="w-4 h-4 accent-black rounded cursor-pointer mt-0.5 shrink-0"
                          />
                          <span className="text-[11px] leading-snug">
                            I agree to the{" "}
                            <Link to="/about" className="underline font-bold text-black">
                              Terms of Service
                            </Link>{" "}
                            and Privacy Protocol.
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={handleQuickDemoFillRegister}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-700 font-bold text-xs transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                          title="Auto-fill Demo Registration data for fast testing"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Demo Fill</span>
                        </button>
                      </div>
                      {registerForm.formState.errors.agreeTerms && (
                        <p className="text-[11px] text-rose-600 font-semibold">
                          {registerForm.formState.errors.agreeTerms.message}
                        </p>
                      )}

                      {/* Submit CTA */}
                      <button
                        type="submit"
                        disabled={registerForm.formState.isSubmitting}
                        className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {registerForm.formState.isSubmitting
                            ? "Creating Patron Account..."
                            : "Create STEAV Account"}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* Right Pane (Pane 2): Login Form */}
                {/* Slides in from Right to Left when switching to Login */}
                {/* ======================================================== */}
                <div
                  className={`w-1/2 pl-3 sm:pr-2 pl-4 sm:pl-6 shrink-0 transition-opacity duration-200 ${
                    mode === "login" ? "opacity-100" : "opacity-40 pointer-events-none select-none"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Titles */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                        STEAV Client Portal
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                        Welcome Back
                      </h1>
                      <p className="text-xs text-gray-500 font-normal">
                        Enter your patron credentials to manage orders, invoices, and saved pieces.
                      </p>
                    </div>

                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4 pt-1"
                    >
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
                            {...loginForm.register("email")}
                            placeholder="name@steav.com"
                            className="w-full pl-13 pr-4 py-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                            {loginForm.formState.errors.email.message}
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
                            {...loginForm.register("password")}
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
                        {loginForm.formState.errors.password && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      {/* Reset Feedback */}
                      {resetSent && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Password recovery instructions sent. Check your inbox.</span>
                        </div>
                      )}

                      {/* Remember Me & Demo Fill */}
                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <label
                          htmlFor="rememberMe"
                          className="flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            id="rememberMe"
                            {...loginForm.register("rememberMe")}
                            className="w-4 h-4 accent-black rounded cursor-pointer"
                          />
                          <span>Remember this device for 30 days</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleQuickDemoFillLogin}
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
                        disabled={loginForm.formState.isSubmitting}
                        className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {loginForm.formState.isSubmitting
                            ? "Authenticating..."
                            : "Sign In to STEAV"}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Navigation & Admin Link */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              {mode === "login" ? (
                <>
                  <span>New to the House of STEAV? </span>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("register")}
                    className="font-black text-black hover:underline uppercase tracking-wider ml-1 cursor-pointer"
                  >
                    Create Account &rarr;
                  </button>
                </>
              ) : (
                <>
                  <span>Already an STEAV patron? </span>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("login")}
                    className="font-black text-black hover:underline uppercase tracking-wider ml-1 cursor-pointer"
                  >
                    Sign In &rarr;
                  </button>
                </>
              )}
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
