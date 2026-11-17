import React, { useState, useMemo } from "react";
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
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Gift,
  Star,
  Crown,
  ArrowLeft,
  KeyRound,
  FileText,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";

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

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerUser } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const from =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
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

  const watchedPassword = watch("password") || "";
  const watchedConfirm = watch("confirmPassword") || "";

  // Live Password Strength Computation (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!watchedPassword)
      return { score: 0, label: "Enter 6+ characters", color: "bg-gray-200" };
    let score = 0;
    if (watchedPassword.length >= 6) score++;
    if (watchedPassword.length >= 8) score++;
    if (/[A-Z]/.test(watchedPassword) || /[0-9]/.test(watchedPassword)) score++;
    if (/[^A-Za-z0-9]/.test(watchedPassword) || watchedPassword.length >= 10) score++;

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
  }, [watchedPassword]);

  const handleQuickDemoFill = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setValue("fullName", "Margot Fontaine", { shouldValidate: true });
    setValue("email", `margot${randomSuffix}@atelier.com`, { shouldValidate: true });
    setValue("phone", "+855 96 835 0317", { shouldValidate: true });
    setValue("password", "AtelierPass2026!", { shouldValidate: true });
    setValue("confirmPassword", "AtelierPass2026!", { shouldValidate: true });
    showToast("Demo Patron credentials generated — ready to register", "info");
  };

  const onSubmit = async (data: RegisterFormData) => {
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
    showToast(`Welcome to the House of Atelier Paris, ${data.fullName}!`, "success");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F6F6F4]">
      {/* Ambient Lighting Spheres */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#D6FF00]/12 blur-[100px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-black/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[2rem] overflow-hidden bg-white border border-gray-200/90 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.1)] relative z-10"
      >
        {/* Left Editorial Visual Column (5 Cols) */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-[#0B0B0B] text-white p-10 flex-col justify-between overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
            alt="Atelier Paris Runway"
            className="absolute inset-0 w-full h-full object-cover opacity-50 scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-black/35" />

          {/* Top Brand Bar */}
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
              <span>Patron Circle</span>
            </span>
          </div>

          {/* Middle Editorial Content */}
          <div className="relative z-10 space-y-6 my-auto pt-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6FF00] text-black text-[10px] font-black uppercase tracking-widest shadow-xs">
                <Crown className="w-3 h-3" />
                <span>Private Membership Privileges</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-[1.08] text-white">
                Begin Your Journey With Atelier.
              </h2>
              <p className="text-xs text-neutral-300 font-normal leading-relaxed">
                Register your patron profile for one-click Bakong KHQR checkout, saved runway lookbooks, and private seasonal access.
              </p>
            </div>

            {/* Member Benefit Cards */}
            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3 transition-colors hover:bg-white/12">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">20% Welcome Voucher (ATELIER20)</h4>
                  <p className="text-[11px] text-neutral-300">
                    Instant discount privilege applicable across the entire catalog
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex items-center gap-3 transition-colors hover:bg-white/12">
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

          {/* Bottom Social Proof */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <div className="flex text-[#D6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D6FF00] stroke-[#D6FF00]" />
                ))}
              </div>
              <span className="font-extrabold text-white text-[11px]">Complimentary</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Lifetime Membership</span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              Global Archive
            </span>
          </div>
        </div>

        {/* Right Form Column (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            {/* Top Navigation & Tab Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Creative Segmented Control */}
              <div className="p-1 rounded-2xl bg-gray-100/90 border border-gray-200/80 flex items-center w-full sm:w-72 relative">
                <Link
                  to="/login"
                  state={location.state}
                  className="flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                >
                  Sign In
                </Link>
                <button
                  type="button"
                  className="relative flex-1 py-2 text-center text-xs font-black uppercase tracking-wider text-black z-10 transition-colors"
                >
                  <motion.div
                    layoutId="auth-active-tab"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-200/60 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                  <span>Register</span>
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Row 1: Full Name & Phone */}
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
                      {...register("fullName")}
                      placeholder="e.g. Rayou Va"
                      className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 group-focus-within:bg-black group-focus-within:text-[#D6FF00] flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-all">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      autoComplete="tel"
                      {...register("phone")}
                      placeholder="e.g. 096 835 0317"
                      className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email Address */}
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
                    {...register("email")}
                    placeholder="name@atelier.com"
                    className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Row 3: Password & Confirm Password */}
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
                      {...register("password")}
                      placeholder="Min. 6 chars"
                      className="w-full pl-13 pr-10 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      {errors.password.message}
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
                      {...register("confirmPassword")}
                      placeholder="Repeat passkey"
                      className="w-full pl-13 pr-10 py-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/90 focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-semibold text-xs text-black transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Real-Time Password Security Gauge */}
              {watchedPassword.length > 0 && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-gray-600 uppercase tracking-wider">
                      Passkey Strength:{" "}
                      <strong className="text-black">{passwordStrength.label}</strong>
                    </span>
                    {watchedConfirm.length > 0 && (
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          watchedPassword === watchedConfirm
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {watchedPassword === watchedConfirm ? (
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

              {/* Terms of Service Checkbox & Quick Demo Fill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <label
                  htmlFor="agreeTerms"
                  className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    {...register("agreeTerms")}
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
                  onClick={handleQuickDemoFill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-black hover:text-[#D6FF00] text-gray-700 font-bold text-xs transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                  title="Auto-fill Demo Registration data for fast testing"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Demo Fill</span>
                </button>
              </div>
              {errors.agreeTerms && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  {errors.agreeTerms.message}
                </p>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
              >
                <span>
                  {isSubmitting ? "Creating Patron Account..." : "Create Atelier Account"}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Bottom Switch to Login */}
          <div className="pt-5 mt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <div>
              <span>Already a registered patron? </span>
              <Link
                to="/login"
                state={location.state}
                className="font-black text-black hover:underline uppercase tracking-wider ml-1"
              >
                Sign In &rarr;
              </Link>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Instant Activation Ready
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

