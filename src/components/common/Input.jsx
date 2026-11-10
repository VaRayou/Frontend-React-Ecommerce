import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export function Input({
  label,
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  helperText,
  rows = 4,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const isPassword = type === "password";
  const computedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-bold text-gray-800"
        >
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        {type === "textarea" ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/60 focus:bg-white rounded-xl border transition-all placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-black/15 resize-y ${
              error
                ? "border-red-400 focus:border-red-500 bg-red-50/20"
                : "border-gray-200 hover:border-gray-300 focus:border-black"
            }`}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={computedType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/60 focus:bg-white rounded-xl border transition-all placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-black/15 ${
              isPassword ? "pr-10" : ""
            } ${
              error
                ? "border-red-400 focus:border-red-500 bg-red-50/20"
                : "border-gray-200 hover:border-gray-300 focus:border-black"
            }`}
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {helperText && !error && (
        <span className="text-[11px] text-gray-500 block">{helperText}</span>
      )}

      {error && (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}

export default Input;
