import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function CartSummary({ showCheckoutButton = true }) {
  const {
    cartSubtotal,
    discountAmount,
    discountPercent,
    shippingFee,
    tax,
    cartTotal,
    promoCode,
    applyPromoCode,
  } = useCart();

  const [inputCode, setInputCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState(null);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = applyPromoCode(inputCode);
    setCouponFeedback(res);
  };

  return (
    <div className="total_area" style={{ background: "#f5f5ed", padding: 24, borderRadius: 4, border: "1px solid #e8e8e0" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 18, color: "#363432" }}>
        Order Summary
      </h3>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
        <li style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e2d8" }}>
          <span>Cart Sub Total</span>
          <span style={{ fontWeight: 600 }}>${cartSubtotal}</span>
        </li>

        {discountAmount > 0 && (
          <li style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e2d8", color: "#2e7d32" }}>
            <span>Discount ({discountPercent}%) [{promoCode}]</span>
            <span style={{ fontWeight: 600 }}>-${discountAmount}</span>
          </li>
        )}

        <li style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e2d8" }}>
          <span>Eco Tax (Demo)</span>
          <span style={{ fontWeight: 600 }}>${tax}</span>
        </li>

        <li style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e2d8" }}>
          <span>Shipping Cost</span>
          <span style={{ fontWeight: 600 }}>
            {shippingFee === 0 ? "Free" : `$${shippingFee}`}
          </span>
        </li>

        <li style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0 0", fontSize: 18, fontWeight: 700, color: "#fe980f" }}>
          <span>Grand Total</span>
          <span>${cartTotal}</span>
        </li>
      </ul>

      {/* Coupon form */}
      <div style={{ marginTop: 20 }}>
        <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            placeholder="Promo code (e.g. DISCOUNT10)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 4,
              fontSize: 13,
            }}
          />
          <button
            type="submit"
            className="btn btn-default"
            style={{
              backgroundColor: "#363432",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "8px 14px",
              fontSize: 13,
            }}
          >
            Apply
          </button>
        </form>

        {couponFeedback && (
          <small
            style={{
              display: "block",
              marginTop: 6,
              color: couponFeedback.success ? "#2e7d32" : "#d9534f",
              fontWeight: 500,
            }}
          >
            {couponFeedback.message}
          </small>
        )}
      </div>

      {showCheckoutButton && (
        <div style={{ marginTop: 24 }}>
          <Link
            to="/checkout"
            className="btn btn-default check_out"
            style={{
              display: "block",
              textAlign: "center",
              backgroundColor: "#fe980f",
              color: "#fff",
              padding: "12px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 4,
              textDecoration: "none",
              transition: "background-color 0.2s",
            }}
          >
            <i className="fa fa-shopping-cart" style={{ marginRight: 6 }}></i>
            Proceed to Checkout
          </Link>
        </div>
      )}
    </div>
  );
}

export default CartSummary;

