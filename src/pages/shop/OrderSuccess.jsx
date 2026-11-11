import React from "react";
import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="container" style={{ padding: "60px 15px", maxWidth: 720 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e0",
          borderRadius: 8,
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            marginBottom: 20,
          }}
        >
          <i className="fa fa-check"></i>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#363432", margin: "0 0 10px 0" }}>
          Thank You! Your Order has been Placed.
        </h2>
        <p style={{ color: "#696763", fontSize: 15, marginBottom: 25 }}>
          We have received your order and sent a confirmation summary to your email.
        </p>

        {order && (
          <div
            style={{
              background: "#f9f9f6",
              borderRadius: 6,
              padding: 20,
              textAlign: "left",
              marginBottom: 30,
              border: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e2d8", paddingBottom: 10, marginBottom: 12 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>Order Reference:</span>
              <strong style={{ color: "#0f172a", fontSize: 14 }}>{order.orderNumber}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e2d8", paddingBottom: 10, marginBottom: 12 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>Recipient:</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{order.customerName} ({order.customerEmail})</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e2d8", paddingBottom: 10, marginBottom: 12 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>Shipping Address:</span>
              <span style={{ fontSize: 13, textAlign: "right", maxWidth: 300 }}>{order.shippingAddress}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e2d8", paddingBottom: 10, marginBottom: 12 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>Payment Method:</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{order.paymentMethod}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, fontSize: 16 }}>
              <strong style={{ color: "#363432" }}>Total Amount Paid:</strong>
              <strong style={{ color: "#fe980f" }}>${order.total}</strong>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <Link
            to="/shop"
            className="btn btn-default add-to-cart"
            style={{ margin: 0, padding: "10px 22px" }}
          >
            <i className="fa fa-shopping-bag" style={{ marginRight: 6 }}></i>
            Continue Shopping
          </Link>
          <Link
            to="/profile"
            className="btn btn-default"
            style={{ background: "#f5f5ed", color: "#696763", padding: "10px 22px" }}
          >
            <i className="fa fa-user" style={{ marginRight: 6 }}></i>
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;

