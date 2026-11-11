import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { orderService } from "../../services/orderService";
import { khqrService } from "../../services/khqrService";
import { KhqrPaymentModal } from "../../components/checkout/KhqrPaymentModal";
import Input from "../../components/common/Input";
import CartSummary from "../../components/shop/CartSummary";

function Checkout() {
  const { user } = useAuth();
  const { cart, cartSubtotal, shippingFee, tax, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "Phnom Penh",
    country: user?.country || "Cambodia",
    notes: "",
    paymentMethod: "Bakong KHQR",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showKhqrModal, setShowKhqrModal] = useState(false);
  const [khqrData, setKhqrData] = useState(null);
  const [pendingOrderPayload, setPendingOrderPayload] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required.";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.address.trim()) newErrors.address = "Shipping address is required.";
    if (!formData.city.trim()) newErrors.city = "City is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before placing an order.");
      navigate("/shop");
      return;
    }

    if (!validate()) return;

    const orderNumber = `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const basePayload = {
      order_number: orderNumber,
      orderNumber: orderNumber,
      customerId: user?.id || null,
      customerName: formData.fullName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.country}`,
      items: cart.map((item) => ({
        id: item.product.id,
        productId: item.product.id,
        product_id: item.product.id,
        name: item.product.name,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
      })),
      subtotal: cartSubtotal,
      shippingFee,
      tax,
      total: cartTotal,
      currency: "USD",
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === "Bakong KHQR" ? "Pending" : "Pending COD",
      notes: formData.notes,
    };

    if (formData.paymentMethod === "Bakong KHQR") {
      setLoading(true);
      try {
        setPendingOrderPayload(basePayload);
        const khqrRes = await khqrService.createPayment({
          amount: cartTotal,
          currency: "USD",
          order_number: orderNumber,
          customer_name: formData.fullName,
          customer_phone: formData.phone,
        });
        setKhqrData(khqrRes);
        setShowKhqrModal(true);
      } catch (err) {
        console.error("KHQR Generation Error:", err);
        alert("Failed to initialize Bakong KHQR payment. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Direct Cash on Delivery or Bank Transfer flow
    setLoading(true);
    try {
      const createdOrder = await orderService.createOrder(basePayload);
      clearCart();
      navigate("/order-success", { state: { order: createdOrder } });
    } catch (err) {
      alert("Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKhqrSuccess = async (transactionId) => {
    setShowKhqrModal(false);
    if (!pendingOrderPayload) return;

    setLoading(true);
    try {
      const finalPayload = {
        ...pendingOrderPayload,
        paymentStatus: "Paid",
        notes: (pendingOrderPayload.notes ? pendingOrderPayload.notes + " " : "") + `[Bakong Ref: ${transactionId}]`,
      };
      const createdOrder = await orderService.createOrder(finalPayload);
      clearCart();
      navigate("/order-success", { state: { order: createdOrder } });
    } catch (err) {
      console.error("Error creating order after payment:", err);
      clearCart();
      navigate("/order-success", {
        state: { order: { ...pendingOrderPayload, id: transactionId, payment_status: "Paid" } },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKhqr = async () => {
    try {
      const newOrderNum = `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setPendingOrderPayload((prev) => (prev ? { ...prev, order_number: newOrderNum } : prev));
      const khqrRes = await khqrService.createPayment({
        amount: cartTotal,
        currency: "USD",
        order_number: newOrderNum,
        customer_name: formData.fullName,
        customer_phone: formData.phone,
      });
      setKhqrData(khqrRes);
    } catch (e) {
      console.warn("Regenerate failed:", e);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container text-center" style={{ padding: "80px 20px" }}>
        <i className="fa fa-shopping-cart" style={{ fontSize: 50, color: "#ccc", marginBottom: 20 }}></i>
        <h2>Your Cart is Empty</h2>
        <p style={{ color: "#777", marginBottom: 20 }}>
          You need at least one product in your cart to proceed with checkout.
        </p>
        <Link to="/shop" className="btn btn-default add-to-cart">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <section id="do_action" style={{ padding: "30px 0 60px" }}>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <ol className="breadcrumb">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li className="active">Checkout</li>
          </ol>
        </div>

        {/* Demo Notice */}
        <div className="alert alert-info" style={{ fontSize: 13, marginBottom: 24 }}>
          <i className="fa fa-info-circle" style={{ marginRight: 6 }}></i>
          <strong>Frontend Demonstration:</strong> Payment gateway simulation only. No actual credit card or real financial transaction will occur.
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="row">
            {/* Customer Information Form */}
            <div className="col-sm-7">
              <div style={{ background: "#fff", border: "1px solid #e8e8e0", padding: "24px 28px", borderRadius: 4, marginBottom: 30 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px 0", color: "#363432" }}>
                  1. Customer &amp; Shipping Details
                </h3>

                <div className="row">
                  <div className="col-sm-6">
                    <Input
                      label="Full Name"
                      name="fullName"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      error={errors.fullName}
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-6">
                    <Input
                      label="Phone Number"
                      name="phone"
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#363432", marginBottom: 6 }}>
                        Country *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="form-control"
                        style={{ height: 42 }}
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Cambodia">Cambodia</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Input
                  label="Shipping Street Address"
                  name="address"
                  placeholder="Street name, house/apartment number"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  required
                />

                <div className="row">
                  <div className="col-sm-6">
                    <Input
                      label="City"
                      name="city"
                      placeholder="e.g. New York"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <Input
                      label="Special Delivery Notes"
                      name="notes"
                      placeholder="Optional notes for delivery"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Payment Selection UI */}
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "24px 0 16px 0", color: "#363432" }}>
                  2. Payment Method
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#f9f9f6", padding: 18, borderRadius: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", margin: 0, padding: "12px 14px", borderRadius: 6, border: formData.paymentMethod === "Bakong KHQR" ? "2px solid #fe980f" : "1px solid #e0e0e0", background: formData.paymentMethod === "Bakong KHQR" ? "#fff9f0" : "#fff", transition: "all 0.2s" }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Bakong KHQR"
                      checked={formData.paymentMethod === "Bakong KHQR"}
                      onChange={handleChange}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#d90429", fontSize: 15 }}>Bakong KHQR (Live NBC Gateway)</span>
                        <span style={{ fontSize: 11, background: "#d90429", color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>INSTANT</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        Universal QR: Scan & Pay with ABA Mobile, Bakong, ACLEDA, or any Cambodian bank app.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", margin: 0, padding: "10px 14px", borderRadius: 6, border: formData.paymentMethod === "Cash on Delivery" ? "2px solid #fe980f" : "1px solid #e0e0e0", background: formData.paymentMethod === "Cash on Delivery" ? "#fff9f0" : "#fff" }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={formData.paymentMethod === "Cash on Delivery"}
                      onChange={handleChange}
                    />
                    <div>
                      <strong>Cash on Delivery (COD)</strong>
                      <div style={{ fontSize: 12, color: "#777" }}>Pay with cash upon physical delivery.</div>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", margin: 0, padding: "10px 14px", borderRadius: 6, border: formData.paymentMethod === "Direct Bank Transfer" ? "2px solid #fe980f" : "1px solid #e0e0e0", background: formData.paymentMethod === "Direct Bank Transfer" ? "#fff9f0" : "#fff" }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Direct Bank Transfer"
                      checked={formData.paymentMethod === "Direct Bank Transfer"}
                      onChange={handleChange}
                    />
                    <div>
                      <strong>Direct Bank Transfer</strong>
                      <div style={{ fontSize: 12, color: "#777" }}>Manual wire transfer with reference slip.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Review & Place Order Column */}
            <div className="col-sm-5">
              <div style={{ background: "#fff", border: "1px solid #e8e8e0", padding: "20px 24px", borderRadius: 4, marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", color: "#363432" }}>
                  Review Your Items ({cart.length})
                </h3>

                <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 16 }}>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 0",
                        borderBottom: "1px solid #f2f2f2",
                      }}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 4 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.product.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          Qty: {item.quantity} &times; ${item.product.price}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#fe980f" }}>
                        ${item.product.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                <CartSummary showCheckoutButton={false} />

                <div style={{ marginTop: 24 }}>
                  <button
                    type="submit"
                    className="btn btn-default"
                    disabled={loading}
                    style={{
                      width: "100%",
                      backgroundColor: "#fe980f",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      fontSize: 16,
                      fontWeight: 700,
                      borderRadius: 4,
                      transition: "background-color 0.2s",
                    }}
                  >
                    {loading ? (
                      <span>
                        <i className="fa fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                        Processing Order...
                      </span>
                    ) : (
                      <span>
                        <i className="fa fa-check" style={{ marginRight: 8 }}></i>
                        Place Order (${cartTotal})
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showKhqrModal && khqrData && (
        <KhqrPaymentModal
          isOpen={showKhqrModal}
          onClose={() => setShowKhqrModal(false)}
          onPaymentSuccess={handleKhqrSuccess}
          khqrData={khqrData}
          onRegenerate={handleRegenerateKhqr}
        />
      )}
    </section>
  );
}

export default Checkout;

