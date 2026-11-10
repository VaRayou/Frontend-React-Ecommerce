import React from "react";

function Button({
  children,
  type = "button",
  variant = "primary", // primary, default, danger, outline
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}) {
  let baseStyle = "btn ";

  if (variant === "primary") {
    baseStyle += "btn-default add-to-cart "; // E-Shopper button style
  } else if (variant === "danger") {
    baseStyle += "btn-danger ";
  } else if (variant === "outline") {
    baseStyle += "btn-default ";
  } else {
    baseStyle += "btn-default ";
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyle} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <span>
          <i className="fa fa-spinner fa-spin me-2" style={{ marginRight: 6 }}></i>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;

