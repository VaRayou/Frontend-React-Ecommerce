import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    agreeTerms: z.boolean().refine((val) => val === true, "You must agree to the Terms of Service"),
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

  const from =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    const res = await registerUser(data.fullName, data.email, data.password);
    if (!res.success) {
      showToast(res.message || "Could not create account", "error");
      return;
    }
    showToast(`Account created! Welcome to Atelier, ${data.fullName}!`, "success");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl">
        {/* Left: Image Banner */}
        <div className="relative hidden md:block bg-black">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80"
            alt="Runway Model"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#D6FF00] text-black font-black text-[10px] tracking-widest uppercase inline-block">
              Private Membership
            </span>
            <h3 className="text-2xl font-black uppercase tracking-tight">
              Begin Your Journey With The House of Atelier.
            </h3>
            <p className="text-xs text-gray-300 font-light">
              Receive complimentary styling consultations, early runway access, and customized garment tailoring.
            </p>
          </div>
        </div>

        {/* Right: Registration Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
              New Patron
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase">
              Create an Account
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-light">
              Join our global private membership circle.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Full Legal Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register("fullName")}
                  placeholder="e.g. Marc Jacobs"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                {...register("agreeTerms")}
                className="w-4 h-4 accent-black rounded cursor-pointer mt-0.5"
              />
              <label htmlFor="agreeTerms" className="text-gray-600 font-medium cursor-pointer text-[11px] leading-snug">
                I agree to the <Link to="/about" className="underline font-bold text-black">Terms of Service</Link> and{" "}
                <Link to="/about" className="underline font-bold text-black">Privacy Notice</Link>.
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-[11px] text-rose-500 font-semibold">
                {errors.agreeTerms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black hover:bg-neutral-900 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-2 text-center text-xs text-gray-500 border-t border-gray-100">
            <span>Already an Atelier patron? </span>
            <Link
              to="/login"
              state={location.state}
              className="font-bold text-black hover:underline uppercase tracking-wider"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

