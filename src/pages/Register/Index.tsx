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
  Award,
  Gift,
  Star,
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
    if (!watchedPassword) return { score: 0, label: "Enter 6+ characters", color: "bg-gray-200" };
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
    showToast(`Welcome to the House of Atelier, ${data.fullName}!`, "success");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[86vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Background Accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#D6FF00]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl sm:rounded-[2rem] overflow-hidden bg-white border border-gray-200/80 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.12)] relative z-10"
      >
        {/* Mobile Compact Luxury Header Banner (< lg) */}
        <div className="lg:hidden relative bg-[#111111] text-white p-5 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80"
            alt="Atelier Runway"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D6FF00] text-black font-black text-[9px] tracking-widest uppercase mb-1.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Private Membership</span>
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight leading-tight">
                Join The House of Atelier
              </h2>
              <p className="text-[11px] text-gray-300 font-light mt-0.5">
                Enjoy 20% Welcome Privilege (Code: ATELIER20)
              </p>
            </div>
            <div className="shrink-0 text-right hidden xs:block">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-[#D6FF00]">
                <Gift className="w-3 h-3" />
                <span>VIP Circle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Desktop Editorial Showcase Column (5 Cols) */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-[#0B0B0B] text-white p-10 flex-col justify-between overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80"
            alt="Atelier Runway Model"
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
              <span>Patron Registry</span>
            </span>
          </div>

          {/* Editorial Narrative & Benefits */}
          <div className="relative z-10 space-y-6 my-auto pt-12">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-[#D6FF00] text-black font-black text-[10px] tracking-widest uppercase inline-block shadow-sm">
                Private Membership • AW26
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-[1.06]">
                Begin Your Journey With The House of Atelier.
              </h2>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Create your personal patron profile for one-click Bakong KHQR checkout,
                saved runway wishlists, and private seasonal previews.
              </p>
            </div>

            {/* Member Benefits */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/12 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D6FF00] text-black flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">
                    20% Welcome Privilege (ATELIER20)
                  </h4>
                  <p className="text-[11px] text-gray-300">
                    Unlock instant savings on your first runway order
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/12 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 text-[#D6FF00] flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">
                    Digital Receipts &amp; Tax Invoices
                  </h4>
                  <p className="text-[11px] text-gray-300">
                    Permanent archive of all POS receipts and courier tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <div className="flex text-[#D6FF00]">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-3 h-3 fill-[#D6FF00] stroke-[#D6FF00]" />
                ))}
              </div>
              <span className="font-bold text-white">Complimentary</span>
              <span className="text-gray-400">Lifetime Membership</span>
            </div>
          </div>
        </div>

        {/* Right Registration Form Column (7 Cols) */}
        <div className="lg:col-span-7 p-5 sm:p-10 md:p-12 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            {/* Top Mode Switcher Tabs */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 border border-gray-200/70 w-full sm:w-72">
                <Link
                  to="/login"
                  state={location.state}
                  className="py-2 px-4 rounded-xl text-gray-500 hover:text-black text-center text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Sign In
                </Link>
                <div className="py-2 px-4 rounded-xl bg-[#111111] text-[#D6FF00] text-center text-xs font-black uppercase tracking-wider shadow-xs">
                  Create Account
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-black" />
                <span>Instant Activation</span>
              </span>
            </div>

            {/* Heading */}
            <div>
              <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-gray-400 block mb-1">
                New Patron Registration
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                Create Your Atelier Account
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-normal">
                Complete your profile below to unlock fast checkout and personalized order tracking.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs">
              {/* Row 1: Full Name + Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-extrabold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoComplete="name"
                      {...register("fullName")}
                      placeholder="e.g. Rayou Va"
                      className="w-full pl-12 pr-3.5 py-3 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-extrabold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      autoComplete="tel"
                      {...register("phone")}
                      placeholder="e.g. 096 835 0317"
                      className="w-full pl-12 pr-3.5 py-3 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email Address */}
              <div>
                <label className="block font-extrabold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
                  Email Address *
                </label>
                <div className="relative group">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Row 3: Password + Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-extrabold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Password *
                  </label>
                  <div className="relative group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("password")}
                      placeholder="Min. 6 characters"
                      className="w-full pl-12 pr-10 py-3 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
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
                  <label className="block font-extrabold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-[#111111] group-focus-within:text-[#D6FF00] text-gray-500 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                      placeholder="Repeat password"
                      className="w-full pl-12 pr-10 py-3 rounded-xl bg-gray-50/70 focus:bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none font-semibold text-black transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
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

              {/* Live Password Strength & Match Bar */}
              {watchedPassword.length > 0 && (
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-gray-600 uppercase tracking-wider">
                      Security Strength:{" "}
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
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <span>Passwords do not match yet</span>
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

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  {...register("agreeTerms")}
                  className="w-4 h-4 accent-black rounded cursor-pointer mt-0.5 shrink-0"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-gray-600 font-medium cursor-pointer text-[11px] leading-snug select-none"
                >
                  I agree to the{" "}
                  <Link to="/about" className="underline font-bold text-black">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/about" className="underline font-bold text-black">
                    Privacy Notice
                  </Link>
                  , and consent to receive private order updates.
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  {errors.agreeTerms.message}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#111111] hover:bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 mt-1"
              >
                <span>
                  {isSubmitting ? "Creating Your Patron Account..." : "Create Atelier Account"}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Bottom Switch to Login */}
          <div className="pt-5 mt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <div>
              <span>Already an Atelier patron? </span>
              <Link
                to="/login"
                state={location.state}
                className="font-black text-black hover:underline uppercase tracking-wider ml-1"
              >
                Sign In &rarr;
              </Link>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Instant Checkout Ready
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
