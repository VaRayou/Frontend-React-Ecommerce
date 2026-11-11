import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import CartSummary from "../../components/shop/CartSummary";

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <section id="cart_items">
        <div className="container">
          {/* Breadcrumbs */}
          <div className="breadcrumbs" style={{ marginTop: 20 }}>
            <ol className="breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li className="active">Shopping Cart</li>
            </ol>
          </div>

          {cart.length === 0 ? (
            /* Empty Cart State */
            <div className="cart-empty-state">
              <i className="fa fa-shopping-cart"></i>
              <h2>Your Shopping Cart is Empty</h2>
              <p style={{ color: "#777", marginBottom: 24, fontSize: 15 }}>
                Looks like you haven't added any products to your cart yet.
              </p>
              <Link
                to="/shop"
                className="btn btn-default add-to-cart"
                style={{ padding: "10px 24px", fontSize: 15 }}
              >
                <i className="fa fa-shopping-bag" style={{ marginRight: 8 }}></i>
                Start Shopping Now
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Table */}
              <div className="table-responsive cart_info">
                <table className="table table-condensed">
                  <thead>
                    <tr className="cart_menu">
                      <td className="image" style={{ width: 100 }}>Item</td>
                      <td className="description">Description</td>
                      <td className="price" style={{ width: 120 }}>Price</td>
                      <td className="quantity" style={{ width: 150 }}>Quantity</td>
                      <td className="total" style={{ width: 120 }}>Total</td>
                      <td style={{ width: 60 }}></td>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const { product, quantity } = item;
                      const lineTotal = product.price * quantity;
                      return (
                        <tr key={product.id}>
                          <td className="cart_product" style={{ margin: 0, padding: 12 }}>
                            <Link to={`/shop/${product.id}`}>
                              <img
                                src={product.image}
                                alt={product.name}
                                style={{ width: 65, height: 65, objectFit: "contain", borderRadius: 4 }}
                              />
                            </Link>
                          </td>
                          <td className="cart_description" style={{ verticalAlign: "middle" }}>
                            <h4 style={{ margin: "0 0 4px 0", fontSize: 16 }}>
                              <Link to={`/shop/${product.id}`} style={{ color: "#363432" }}>
                                {product.name}
                              </Link>
                            </h4>
                            <p style={{ margin: 0, color: "#888", fontSize: 12 }}>
                              Category: {product.category} &bull; Brand: {product.brand}
                            </p>
                          </td>
                          <td className="cart_price" style={{ verticalAlign: "middle" }}>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#FE980F" }}>
                              ${product.price}
                            </p>
                          </td>
                          <td className="cart_quantity" style={{ verticalAlign: "middle" }}>
                            <div className="cart_quantity_button">
                              <a
                                className="cart_quantity_down"
                                href="#decrease"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateQuantity(product.id, quantity - 1);
                                }}
                                title="Decrease"
                              >
                                &minus;
                              </a>
                              <input
                                className="cart_quantity_input"
                                type="text"
                                name="quantity"
                                value={quantity}
                                onChange={(e) => updateQuantity(product.id, e.target.value)}
                                autoComplete="off"
                                size="2"
                              />
                              <a
                                className="cart_quantity_up"
                                href="#increase"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateQuantity(product.id, quantity + 1);
                                }}
                                title="Increase"
                              >
                                +
                              </a>
                            </div>
                          </td>
                          <td className="cart_total" style={{ verticalAlign: "middle" }}>
                            <p className="cart_total_price" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                              ${lineTotal}
                            </p>
                          </td>
                          <td className="cart_delete" style={{ verticalAlign: "middle", textAlign: "center" }}>
                            <a
                              className="cart_quantity_delete"
                              href="#remove"
                              onClick={(e) => {
                                e.preventDefault();
                                removeFromCart(product.id);
                              }}
                              title="Remove item"
                              style={{ color: "#d9534f" }}
                            >
                              <i className="fa fa-times"></i>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cart Table Bottom Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 10 }}>
                <Link to="/shop" className="btn btn-default" style={{ background: "#f5f5ed", color: "#696763", padding: "8px 18px" }}>
                  <i className="fa fa-arrow-left" style={{ marginRight: 6 }}></i>
                  Continue Shopping
                </Link>

                <button
                  type="button"
                  className="btn btn-default"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to empty your cart?")) {
                      clearCart();
                    }
                  }}
                  style={{ background: "#fff", border: "1px solid #d9534f", color: "#d9534f", padding: "8px 18px" }}
                >
                  <i className="fa fa-trash-o" style={{ marginRight: 6 }}></i>
                  Clear Cart
                </button>
              </div>

              {/* Order Summary Section */}
              <div className="row" style={{ marginBottom: 50 }}>
                <div className="col-sm-6">
                  <div style={{ background: "#fdfdfb", padding: 20, border: "1px dashed #dcdcce", borderRadius: 4 }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#363432", fontWeight: 600 }}>
                      <i className="fa fa-truck" style={{ color: "#fe980f", marginRight: 8 }}></i>
                      Delivery Information
                    </h4>
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>
                      Standard delivery takes 3-5 business days. Free delivery applies automatically to all orders exceeding $150.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <CartSummary showCheckoutButton={true} />
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default Cart;

