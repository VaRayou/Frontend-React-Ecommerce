import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function ProductCard({ product, columnClass = "col-sm-4" }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (!product) return null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const isOutOfStock = product.stock <= 0;
  const prodId = product.id || product._id;

  return (
    <div className={columnClass}>
      <div className="product-image-wrapper">
        {/* Discount Badge */}
        {product.discount && (
          <span className="product-badge-discount">{product.discount}</span>
        )}

        {/* Stock Badge */}
        <span
          className={`product-badge-stock ${isOutOfStock ? "product-badge-out" : ""}`}
        >
          {isOutOfStock ? "Out of Stock" : "In Stock"}
        </span>

        <div className="single-products">
          <div className="productinfo text-center" style={{ padding: "20px 15px 15px" }}>
            <Link to={`/shop/${prodId}`} style={{ display: "block" }}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  height: 220,
                  width: "100%",
                  objectFit: "contain",
                  cursor: "pointer",
                }}
                onError={(e) => {
                  e.target.src = "/user/images/home/product1.jpg";
                }}
              />
            </Link>

            <h2 style={{ color: "#FE980F", fontSize: 24, margin: "12px 0 6px" }}>
              ${product.price}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="product-original-price">
                  ${product.originalPrice}
                </span>
              )}
            </h2>

            <p style={{ fontWeight: 600, color: "#363432", minHeight: 38, marginBottom: 6 }}>
              <Link to={`/shop/${prodId}`} style={{ color: "inherit", textDecoration: "none" }}>
                {product.name}
              </Link>
            </p>

            <p style={{ fontSize: 12, color: "#888", minHeight: 34, marginBottom: 12, lineHeight: 1.4 }}>
              {product.description?.length > 55
                ? `${product.description.substring(0, 55)}...`
                : product.description}
            </p>

            <div className="product-card-actions">
              <button
                type="button"
                className="btn btn-default add-to-cart"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{ margin: 0 }}
              >
                <i className="fa fa-shopping-cart" style={{ marginRight: 6 }}></i>
                Add to cart
              </button>
              <button
                type="button"
                className="btn-view-details"
                onClick={() => navigate(`/shop/${product.id}`)}
              >
                <i className="fa fa-eye" style={{ marginRight: 4 }}></i>
                Details
              </button>
            </div>
          </div>

          {/* Product Hover Overlay (matching classic E-Shopper) */}
          <div className="product-overlay">
            <div className="overlay-content">
              <h2>${product.price}</h2>
              <p>{product.name}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-default add-to-cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <i className="fa fa-shopping-cart" style={{ marginRight: 6 }}></i>
                  Add to cart
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={() => navigate(`/shop/${product.id}`)}
                  style={{
                    backgroundColor: "#fff",
                    color: "#696763",
                    border: "none",
                    borderRadius: 0,
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist & Compare footer */}
        <div className="choose">
          <ul className="nav nav-pills nav-justified">
            <li>
              <Link to={`/shop/${product.id}`}>
                <i className="fa fa-info-circle"></i> Info
              </Link>
            </li>
            <li>
              <Link to="#" onClick={(e) => { e.preventDefault(); alert(`Added "${product.name}" to wishlist!`); }}>
                <i className="fa fa-plus-square"></i> Wishlist
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

