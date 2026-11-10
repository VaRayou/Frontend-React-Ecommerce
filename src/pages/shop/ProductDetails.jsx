import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import ProductCard from "../../components/shop/ProductCard";
import Loader from "../../components/common/Loader";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review Form state
  const [reviewForm, setReviewForm] = useState({ name: "", email: "", review: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const prod = await productService.getProductById(id);
        setProduct(prod);
        setActiveImage(prod.image);
        setQuantity(1);

        // Fetch related products in the same category
        const allProds = await productService.getProducts({ category: prod.category });
        const related = allProds.filter((p) => String(p.id) !== String(prod.id)).slice(0, 3);
        setRelatedProducts(related);
      } catch (err) {
        setError("The requested product was not found or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 0" }}>
        <Loader message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container text-center" style={{ padding: "80px 20px" }}>
        <i className="fa fa-exclamation-triangle" style={{ fontSize: 54, color: "#d9534f", marginBottom: 20 }}></i>
        <h2>Product Not Found</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>{error || "We couldn't locate this item."}</p>
        <Link to="/shop" className="btn btn-default add-to-cart">
          <i className="fa fa-arrow-left" style={{ marginRight: 6 }}></i> Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const maxStock = product.stock || 1;

  const handleQuantityChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else if (num > maxStock) {
      setQuantity(maxStock);
    } else {
      setQuantity(num);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.email || !reviewForm.review) return;
    setReviewSubmitted(true);
    setReviewForm({ name: "", email: "", review: "" });
  };

  return (
    <div className="container" style={{ marginTop: 20, marginBottom: 50 }}>
      {/* Breadcrumbs & Back Link */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ol className="breadcrumb" style={{ background: "transparent", margin: 0, padding: 0 }}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          <li><Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></li>
          <li className="active">{product.name}</li>
        </ol>

        <Link to="/shop" className="btn-view-details">
          <i className="fa fa-arrow-left" style={{ marginRight: 6 }}></i> Back to Shop
        </Link>
      </div>

      <div className="row">
        {/* Left Side: Product Gallery */}
        <div className="col-sm-5">
          <div className="view-product" style={{ position: "relative", border: "1px solid #f7f7f0", padding: 15, background: "#fff", textAlign: "center" }}>
            <img
              src={activeImage || product.image}
              alt={product.name}
              style={{ maxHeight: 360, width: "100%", objectFit: "contain" }}
            />
            {product.discount && (
              <span className="product-badge-discount" style={{ top: 15, right: 15 }}>
                {product.discount}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="product-gallery-thumbnails">
              {product.gallery.map((imgSrc, idx) => (
                <div
                  key={idx}
                  className={`product-gallery-thumb ${activeImage === imgSrc ? "active" : ""}`}
                  onClick={() => setActiveImage(imgSrc)}
                >
                  <img src={imgSrc} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="col-sm-7">
          <div className="product-information" style={{ border: "1px solid #f7f7f0", padding: "25px 30px", background: "#fff", position: "relative" }}>
            {product.isLatest && (
              <img src="/user/images/product-details/new.jpg" className="newarrival" alt="New" />
            )}

            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#363432", margin: "0 0 10px 0" }}>
              {product.name}
            </h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
              Product ID: #{product.id} &bull; Brand: <strong>{product.brand}</strong>
            </p>

            {/* Rating Stars */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <img src="/user/images/product-details/rating.png" alt="Rating" />
              <span style={{ fontSize: 13, color: "#696763" }}>
                ({product.rating} stars &bull; {product.reviewsCount} reviews)
              </span>
            </div>

            {/* Price & Quantity & Actions */}
            <div style={{ borderTop: "1px solid #f5f5ed", borderBottom: "1px solid #f5f5ed", padding: "18px 0", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 15 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#FE980F" }}>
                  ${product.price}
                </span>

                {product.originalPrice && product.originalPrice > product.price && (
                  <span style={{ textDecoration: "line-through", color: "#999", fontSize: 18 }}>
                    ${product.originalPrice}
                  </span>
                )}

                <div className="product-qty-selector">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    disabled={isOutOfStock}
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxStock || isOutOfStock}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-fefault cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{ backgroundColor: "#FE980F", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 0 }}
                >
                  <i className="fa fa-shopping-cart" style={{ marginRight: 6 }}></i>
                  Add to cart
                </button>

                <button
                  type="button"
                  className="btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  <i className="fa fa-bolt" style={{ marginRight: 6 }}></i>
                  Buy Now
                </button>
              </div>
            </div>

            {/* Stock, Category, Condition */}
            <p style={{ margin: "8px 0", fontSize: 14 }}>
              <b>Availability:</b>{" "}
              <span style={{ color: isOutOfStock ? "#d9534f" : "#5cb85c", fontWeight: 600 }}>
                {isOutOfStock ? "Out of Stock" : `In Stock (${product.stock} items remaining)`}
              </span>
            </p>
            <p style={{ margin: "8px 0", fontSize: 14 }}>
              <b>Category:</b> {product.category}
            </p>
            <p style={{ margin: "8px 0", fontSize: 14 }}>
              <b>Condition:</b> New &bull; 100% Genuine
            </p>
            <p style={{ margin: "8px 0", fontSize: 14 }}>
              <b>Brand:</b> {product.brand}
            </p>

            <div style={{ marginTop: 14 }}>
              <img src="/user/images/product-details/share.png" className="share img-responsive" alt="Share" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Details, Reviews */}
      <div className="category-tab shop-details-tab" style={{ marginTop: 30 }}>
        <div className="col-sm-12">
          <ul className="nav nav-tabs">
            <li className={activeTab === "details" ? "active" : ""}>
              <a href="#details" onClick={(e) => { e.preventDefault(); setActiveTab("details"); }}>
                Description
              </a>
            </li>
            <li className={activeTab === "company" ? "active" : ""}>
              <a href="#company" onClick={(e) => { e.preventDefault(); setActiveTab("company"); }}>
                Shipping &amp; Delivery
              </a>
            </li>
            <li className={activeTab === "reviews" ? "active" : ""}>
              <a href="#reviews" onClick={(e) => { e.preventDefault(); setActiveTab("reviews"); }}>
                Reviews ({product.reviewsCount})
              </a>
            </li>
          </ul>
        </div>

        <div className="tab-content" style={{ padding: "20px 15px", background: "#fff", border: "1px solid #ddd", borderTop: "none" }}>
          {activeTab === "details" && (
            <div className="tab-pane fade active in">
              <h4 style={{ fontWeight: 600, color: "#363432" }}>Product Overview</h4>
              <p style={{ lineHeight: 1.7, color: "#555" }}>{product.description}</p>
              <ul style={{ color: "#666", lineHeight: 1.8, marginTop: 10 }}>
                <li>Crafted with high quality materials for long-lasting wear.</li>
                <li>Designed according to standard international sizing.</li>
                <li>Machine washable with cold water; gentle cycle recommended.</li>
              </ul>
            </div>
          )}

          {activeTab === "company" && (
            <div className="tab-pane fade active in">
              <h4 style={{ fontWeight: 600, color: "#363432" }}>Shipping &amp; Return Policies</h4>
              <p style={{ color: "#666", lineHeight: 1.6 }}>
                Fast standard delivery available nationwide. Orders placed before 2:00 PM EST are dispatched the same business day.
              </p>
              <ul style={{ color: "#666", lineHeight: 1.8 }}>
                <li>Standard Shipping: 3 - 5 business days ($10 flat or free on orders over $150).</li>
                <li>Hassle-free 30-day return policy for unused items in original packaging.</li>
              </ul>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="tab-pane fade active in">
              <h4 style={{ fontWeight: 600, color: "#363432", marginBottom: 15 }}>
                Customer Reviews ({product.reviewsCount})
              </h4>

              <div style={{ marginBottom: 25, borderBottom: "1px solid #eee", paddingBottom: 15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <strong>Michael S.</strong>
                  <span style={{ fontSize: 12, color: "#999" }}>November 2, 2026</span>
                </div>
                <div style={{ color: "#fe980f", fontSize: 12, marginBottom: 6 }}>
                  <i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i>
                </div>
                <p style={{ color: "#555", margin: 0 }}>
                  Excellent quality! Exactly as shown in the picture. Fits perfectly and fabric feels great.
                </p>
              </div>

              {/* Review Submit Form */}
              <div style={{ background: "#f9f9f6", padding: 20, borderRadius: 6 }}>
                <h5 style={{ fontWeight: 700, margin: "0 0 12px 0" }}>Write Your Review</h5>

                {reviewSubmitted ? (
                  <div className="alert alert-success">
                    <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
                    Thank you! Your review has been submitted for approval.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit}>
                    <div className="row">
                      <div className="col-sm-6 form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Your Name *"
                          required
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                        />
                      </div>
                      <div className="col-sm-6 form-group">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email Address *"
                          required
                          value={reviewForm.email}
                          onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                        />
                      </div>
                      <div className="col-sm-12 form-group">
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Your Review & Rating Comments *"
                          required
                          value={reviewForm.review}
                          onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                        ></textarea>
                      </div>
                      <div className="col-sm-12">
                        <button type="submit" className="btn btn-default pull-right add-to-cart" style={{ margin: 0 }}>
                          Submit Review
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 className="title text-center">Related Products</h2>
          <div className="row">
            {relatedProducts.map((relProduct) => (
              <ProductCard
                key={relProduct.id}
                product={relProduct}
                columnClass="col-sm-4"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;

