import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft,
  ShoppingBag,
  Star,
  Sparkles,
  Zap,
  Check,
  Crown,
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

// Framer Motion Animation Variants for Staggered Fluidity
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1],
    },
  },
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

  // Sync mode if URL changes externally (e.g. browser back/forward buttons or links)
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

  // If an authenticated admin visits login, route directly to dashboard (Option A)
  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (isAuth && (currentUser?.isAdmin || currentUser?.role === "admin")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

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
      "bg-yellow-400",
      "bg-emerald-500",
      "bg-[#D6FF00]",
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

    // Update browser URL without triggering unmount
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
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.isAdmin || currentUser?.role === "admin") {
      showToast(
        `Welcome to Studio Controller, ${currentUser.name || data.email.split("@")[0]}!`,
        "success"
      );
      const destination =
        from && from !== "/" && from.startsWith("/admin")
          ? from
          : "/admin/dashboard";
      navigate(destination, { replace: true });
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

  // Quick Demo Auto-fill Handlers
  const handleQuickDemoFillLogin = () => {
    loginForm.setValue("email", "camille@steav.com", { shouldValidate: true });
    loginForm.setValue("password", "password123", { shouldValidate: true });
    showToast("VIP Patron credentials loaded — click 'Sign In'", "info");
  };

  const handleQuickDemoFillAdmin = () => {
    loginForm.setValue("email", "controller@steav.com", { shouldValidate: true });
    loginForm.setValue("password", "password123", { shouldValidate: true });
    showToast("Studio Controller credentials loaded — click 'Sign In'", "info");
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
    showToast("Sample Patron details loaded — ready to create", "info");
  };

  const handleForgotPassword = () => {
    setResetSent(true);
    showToast(
      watchedEmail && watchedEmail.includes("@")
        ? `Security reset instructions sent to ${watchedEmail}`
        : "Please enter your email above to receive a reset link.",
      "info"
    );
    setTimeout(() => setResetSent(false), 6000);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F6F6F4]">
      {/* Dynamic Animated Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.18, 0.28, 0.18],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full bg-[#D6FF00]/20 blur-[110px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.12, 0.2, 0.12],
          x: [0, -25, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full bg-black/10 blur-[130px]"
      />

      {/* Main Unified Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[32px] overflow-hidden bg-white border border-gray-200/90 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.1)] relative z-10"
      >
        {/* ========================================================= */}
        {/* Left Column (5 Cols): Editorial Creative Fashion Showcase  */}
        {/* ========================================================= */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-[#0A0A0A] text-white p-10 flex-col justify-between overflow-hidden group">
          {/* Editorial Visual Backdrop with Subtle Ambient Zoom */}
          <motion.img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85"
            alt="STEAV Paris Autumn Runway"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/35" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2.5 group/logo">
              <img
                src="/navbar-logo.png?v=d6ff00"
                alt="STEAV"
                className="w-8 h-8 object-contain shrink-0 group-hover/logo:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(214,255,0,0.4)]"
              />
              <span className="font-black tracking-[-0.05em] text-2xl text-white">
                STEAV
              </span>
              <span className="text-[10px] font-black tracking-[0.28em] text-neutral-400 uppercase">
                PARIS
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-wider text-[#D6FF00]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF00] animate-pulse" />
              <span>AW26 SALON</span>
            </span>
          </div>

          {/* Center Editorial Statement */}
          <div className="relative z-10 my-auto py-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="space-y-3"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6FF00] text-black text-[10px] font-black uppercase tracking-widest shadow-xs">
                <Crown className="w-3 h-3" />
                <span>Private Patron Membership</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-[1.04] text-white">
                Haute Couture.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-[#D6FF00]">
                  Modern Luxury.
                </span>
              </h2>
              <p className="text-xs text-neutral-300 font-light leading-relaxed max-w-sm">
                Access bespoke seasonal lookbooks, 1-tap NBC Bakong KHQR settlement, and white-glove international dispatch.
              </p>
            </motion.div>

            {/* Micro Privilege Pills */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/6 backdrop-blur-md border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0 font-black shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant NBC Bakong KHQR</h4>
                  <p className="text-[11px] text-neutral-300">
                    Dual USD &amp; KHR checkout with automated digital voucher
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/6 backdrop-blur-md border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-white/15 text-[#D6FF00] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Official Tax Invoices &amp; Tracking</h4>
                  <p className="text-[11px] text-neutral-300">
                    5-stage courier dispatch milestones with downloadable thermal receipts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof & Location Stamp */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="flex text-[#D6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D6FF00] stroke-[#D6FF00]" />
                ))}
              </div>
              <span className="font-extrabold text-white text-[11px]">4.98 / 5.0</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider hidden xl:inline">
                • Verified Patrons
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              Paris • Phnom Penh
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Right Column (7 Cols): Sleek, Cool, High-Contrast Forms   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white relative">
          <div className="space-y-6">
            {/* Top Navigation Row: Segmented Switcher & Return Link */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-100 pb-5">
              {/* Mobile Brand Link (Visible only on smaller screens) */}
              <div className="lg:hidden flex items-center gap-2">
                <img
                  src="/navbar-logo.png?v=d6ff00"
                  alt="STEAV Logo"
                  className="w-6 h-6 object-contain"
                />
                <span className="font-black text-lg tracking-tight text-black">STEAV</span>
              </div>

              {/* Magnetic Sliding Segmented Switcher */}
              <div className="p-1 rounded-2xl bg-gray-100/90 border border-gray-200/80 inline-flex items-center relative w-full sm:w-64">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className={`relative flex-1 py-2 text-center text-xs font-black uppercase tracking-wider z-10 transition-colors cursor-pointer ${
                    mode === "login" ? "text-black" : "text-gray-400 hover:text-black"
                  }`}
                >
                  {mode === "login" && (
                    <motion.div
                      layoutId="auth-active-tab-glow"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-200/70 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchMode("register")}
                  className={`relative flex-1 py-2 text-center text-xs font-black uppercase tracking-wider z-10 transition-colors cursor-pointer ${
                    mode === "register" ? "text-black" : "text-gray-400 hover:text-black"
                  }`}
                >
                  {mode === "register" && (
                    <motion.div
                      layoutId="auth-active-tab-glow"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-200/70 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>Register</span>
                </button>
              </div>

              {/* Boutique Return Link */}
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Shop</span>
              </Link>
            </div>

            {/* Context-Aware Reserved Shopping Bag Notice */}
            {isRedirectedForPurchase && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-[#111111] text-white flex items-center gap-3 shadow-xs border border-neutral-800"
              >
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
                      : "Create your account to unlock instant member checkout."}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Dynamic Form with Staggered Cascading Animation */}
            <AnimatePresence mode="wait" initial={false}>
              {mode === "login" ? (
                /* ======================================================== */
                /* LOGIN FORM VIEW                                          */
                /* ======================================================== */
                <motion.div
                  key="view-login"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-5"
                >
                  {/* Header Title */}
                  <motion.div variants={itemVariants} className="space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-[0.24em] uppercase text-gray-400">
                      STEAV CLIENT PORTAL
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                      Welcome Back
                    </h1>
                    <p className="text-xs text-gray-500 font-normal">
                      Enter your patron credentials to access orders, invoices, and lookbooks.
                    </p>
                  </motion.div>

                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4 pt-1"
                  >
                    {/* Email Input */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                        <input
                          type="email"
                          autoComplete="email"
                          {...loginForm.register("email")}
                          placeholder="patron@steav.com"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                          <span>•</span>
                          <span>{loginForm.formState.errors.email.message}</span>
                        </p>
                      )}
                    </motion.div>

                    {/* Password Input */}
                    <motion.div variants={itemVariants}>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-black">
                          Security Password
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] text-gray-500 hover:text-black font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          {...loginForm.register("password")}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-11 py-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-black transition-colors cursor-pointer"
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
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                          <span>•</span>
                          <span>{loginForm.formState.errors.password.message}</span>
                        </p>
                      )}
                    </motion.div>

                    {/* Reset Password Sent Notice */}
                    {resetSent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Recovery link sent to your email. Check your inbox.</span>
                      </motion.div>
                    )}

                    {/* Remember Device */}
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between pt-0.5"
                    >
                      <label
                        htmlFor="rememberMe"
                        className="flex items-center gap-2.5 text-xs text-gray-600 font-medium cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          id="rememberMe"
                          {...loginForm.register("rememberMe")}
                          className="w-4 h-4 accent-black rounded cursor-pointer"
                        />
                        <span>Remember this device for 30 days</span>
                      </label>
                    </motion.div>

                    {/* Submit CTA */}
                    <motion.div variants={itemVariants} className="pt-1">
                      <button
                        type="submit"
                        disabled={loginForm.formState.isSubmitting}
                        className="w-full py-3.5 px-6 rounded-2xl bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {loginForm.formState.isSubmitting
                            ? "Authenticating..."
                            : "Sign In to STEAV"}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </form>
                </motion.div>
              ) : (
                /* ======================================================== */
                /* REGISTER FORM VIEW                                       */
                /* ======================================================== */
                <motion.div
                  key="view-register"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-4"
                >
                  {/* Header Title */}
                  <motion.div variants={itemVariants} className="space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-[0.24em] uppercase text-gray-400">
                      NEW PATRON REGISTRY
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                      Create Your Account
                    </h1>
                    <p className="text-xs text-gray-500 font-normal">
                      Join our private circle for instant checkout and personalized wardrobe service.
                    </p>
                  </motion.div>

                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-3 pt-1"
                  >
                    {/* Full Name & Phone */}
                    <motion.div
                      variants={itemVariants}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative group">
                          <User className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                          <input
                            type="text"
                            autoComplete="name"
                            {...registerForm.register("fullName")}
                            placeholder="e.g. Rayou Va"
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                          />
                        </div>
                        {registerForm.formState.errors.fullName && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                            <span>•</span>
                            <span>{registerForm.formState.errors.fullName.message}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
                          Phone Number{" "}
                          <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative group">
                          <Phone className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                          <input
                            type="tel"
                            autoComplete="tel"
                            {...registerForm.register("phone")}
                            placeholder="e.g. 096 835 0317"
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Email Input */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative group">
                        <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                        <input
                          type="email"
                          autoComplete="email"
                          {...registerForm.register("email")}
                          placeholder="name@steav.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                          <span>•</span>
                          <span>{registerForm.formState.errors.email.message}</span>
                        </p>
                      )}
                    </motion.div>

                    {/* Password & Confirm */}
                    <motion.div
                      variants={itemVariants}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
                          Security Password *
                        </label>
                        <div className="relative group">
                          <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                          <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...registerForm.register("password")}
                            placeholder="Min. 6 chars"
                            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
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
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                            <span>•</span>
                            <span>{registerForm.formState.errors.password.message}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
                          Confirm Password *
                        </label>
                        <div className="relative group">
                          <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-black absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...registerForm.register("confirmPassword")}
                            placeholder="Repeat password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
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
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                            <span>•</span>
                            <span>
                              {registerForm.formState.errors.confirmPassword.message}
                            </span>
                          </p>
                        )}
                      </div>
                    </motion.div>

                    {/* Animated Laser Security Strength Equalizer */}
                    {watchedRegisterPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-gray-700 uppercase tracking-wider">
                            Password Security:{" "}
                            <strong className="text-black font-black">
                              {passwordStrength.label}
                            </strong>
                          </span>
                          {watchedRegisterConfirm.length > 0 && (
                            <span
                              className={`font-black flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                                watchedRegisterPassword === watchedRegisterConfirm
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {watchedRegisterPassword === watchedRegisterConfirm ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Passwords Match</span>
                                </>
                              ) : (
                                <span>Does Not Match Yet</span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.score >= level
                                  ? passwordStrength.color
                                  : "bg-gray-200"
                              } ${
                                passwordStrength.score >= 4 && level === 4
                                  ? "shadow-[0_0_8px_#D6FF00]"
                                  : ""
                              }`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Terms Agreement */}
                    <motion.div variants={itemVariants} className="pt-1">
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
                          <Link to="/about" className="underline font-black text-black">
                            Terms of Service
                          </Link>{" "}
                          and Privacy Protocol.
                        </span>
                      </label>
                      {registerForm.formState.errors.agreeTerms && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                          <span>•</span>
                          <span>{registerForm.formState.errors.agreeTerms.message}</span>
                        </p>
                      )}
                    </motion.div>

                    {/* Submit CTA */}
                    <motion.div variants={itemVariants} className="pt-1">
                      <button
                        type="submit"
                        disabled={registerForm.formState.isSubmitting}
                        className="w-full py-3.5 px-6 rounded-2xl bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {registerForm.formState.isSubmitting
                            ? "Creating Account..."
                            : "Create STEAV Account"}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clean Bottom Navigation & Quick Demo Access */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              {mode === "login" ? (
                <span>
                  New to the House of STEAV?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("register")}
                    className="font-black text-black hover:underline uppercase tracking-wider ml-1 cursor-pointer"
                  >
                    Create Account &rarr;
                  </button>
                </span>
              ) : (
                <span>
                  Already an STEAV patron?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("login")}
                    className="font-black text-black hover:underline uppercase tracking-wider ml-1 cursor-pointer"
                  >
                    Sign In &rarr;
                  </button>
                </span>
              )}
            </div>

            {/* Discreet Quick Demo Credentials Pill Bar */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                Quick Test:
              </span>
              {mode === "login" ? (
                <>
                  <button
                    type="button"
                    onClick={handleQuickDemoFillLogin}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-800 font-bold transition-all cursor-pointer shadow-2xs"
                    title="Load VIP Patron credentials"
                  >
                    VIP Patron
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickDemoFillAdmin}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-800 font-bold transition-all cursor-pointer shadow-2xs"
                    title="Load Studio Controller credentials"
                  >
                    Admin
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickDemoFillRegister}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-800 font-bold transition-all cursor-pointer shadow-2xs"
                  title="Generate sample registration details"
                >
                  Sample Patron
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
