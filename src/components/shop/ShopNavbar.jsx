import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

function ShopNavbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/shop");
    }
  };

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return "active";
    if (path !== "/" && location.pathname.startsWith(path)) return "active";
    return "";
  };

  return (
    <header id="header">
      {/* header_top */}
      <div className="header_top">
        <div className="container">
          <div className="row">
            <div className="col-sm-6">
              <div className="contactinfo">
                <ul className="nav nav-pills">
                  <li>
                    <a href="tel:+2950188821">
                      <i className="fa fa-phone"></i> +2 95 01 88 821
                    </a>
                  </li>
                  <li>
                    <a href="mailto:info@domain.com">
                      <i className="fa fa-envelope"></i> info@domain.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="social-icons pull-right">
                <ul className="nav navbar-nav">
                  <li><a href="#facebook"><i className="fa fa-facebook"></i></a></li>
                  <li><a href="#twitter"><i className="fa fa-twitter"></i></a></li>
                  <li><a href="#linkedin"><i className="fa fa-linkedin"></i></a></li>
                  <li><a href="#dribbble"><i className="fa fa-dribbble"></i></a></li>
                  <li><a href="#google-plus"><i className="fa fa-google-plus"></i></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /header_top */}

      {/* header-middle */}
      <div className="header-middle">
        <div className="container">
          <div className="row">
            <div className="col-sm-4">
              <div className="logo pull-left">
                <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <img
                    src="/user/images/home/veayor-logo.jpg"
                    alt="VEAYOR"
                    style={{
                      height: 46,
                      width: 46,
                      objectFit: "cover",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "1.5px", color: "#1e293b", fontFamily: "serif" }}>
                      VEAYOR
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", color: "#fe980f", textTransform: "uppercase" }}>
                      Luxury Fashion
                    </span>
                  </div>
                </Link>
              </div>
              <div className="btn-group pull-right">
                <div className="btn-group">
                  <button type="button" className="btn btn-default dropdown-toggle usa" data-toggle="dropdown">
                    USA <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#canada">Canada</a></li>
                    <li><a href="#uk">UK</a></li>
                  </ul>
                </div>

                <div className="btn-group">
                  <button type="button" className="btn btn-default dropdown-toggle usa" data-toggle="dropdown">
                    DOLLAR <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#cad">Canadian Dollar</a></li>
                    <li><a href="#gbp">Pound</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-sm-8">
              <div className="shop-menu pull-right">
                <ul className="nav navbar-nav">
                  {/* Admin Direct Access Pill if logged in as Admin */}
                  {isAdmin && (
                    <li>
                      <Link
                        to="/admin/dashboard"
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#fe980f",
                          borderRadius: 4,
                          padding: "6px 12px",
                          fontWeight: 600,
                          marginRight: 6,
                        }}
                      >
                        <i className="fa fa-tachometer"></i> Admin Panel
                      </Link>
                    </li>
                  )}

                  {isAuthenticated ? (
                    <>
                      <li>
                        <Link to="/profile" className={isActive("/profile")}>
                          <i className="fa fa-user"></i> {user?.name?.split(" ")[0] || "Account"}
                        </Link>
                      </li>
                      <li>
                        <Link to="/checkout" className={isActive("/checkout")}>
                          <i className="fa fa-crosshairs"></i> Checkout
                        </Link>
                      </li>
                      <li>
                        <Link to="/cart" className={isActive("/cart")}>
                          <i className="fa fa-shopping-cart"></i> Cart
                          {cartCount > 0 && (
                            <span
                              style={{
                                marginLeft: 4,
                                backgroundColor: "#fe980f",
                                color: "#fff",
                                borderRadius: 10,
                                padding: "2px 6px",
                                fontSize: 11,
                                fontWeight: "bold",
                              }}
                            >
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={logout}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#696763",
                            padding: "10px 10px",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          <i className="fa fa-sign-out"></i> Logout
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link to="/checkout" className={isActive("/checkout")}>
                          <i className="fa fa-crosshairs"></i> Checkout
                        </Link>
                      </li>
                      <li>
                        <Link to="/cart" className={isActive("/cart")}>
                          <i className="fa fa-shopping-cart"></i> Cart
                          {cartCount > 0 && (
                            <span
                              style={{
                                marginLeft: 4,
                                backgroundColor: "#fe980f",
                                color: "#fff",
                                borderRadius: 10,
                                padding: "2px 6px",
                                fontSize: 11,
                                fontWeight: "bold",
                              }}
                            >
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </li>
                      <li>
                        <Link to="/login" className={isActive("/login")}>
                          <i className="fa fa-lock"></i> Login
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /header-middle */}

      {/* header-bottom */}
      <div className="header-bottom">
        <div className="container">
          <div className="row">
            <div className="col-sm-9">
              <div className="navbar-header">
                <button
                  type="button"
                  className="navbar-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <span className="sr-only">Toggle navigation</span>
                  <span className="icon-bar"></span>
                  <span className="icon-bar"></span>
                  <span className="icon-bar"></span>
                </button>
              </div>
              <div className={`mainmenu pull-left ${isMobileMenuOpen ? "open" : ""}`}>
                <ul className="nav navbar-nav collapse navbar-collapse" style={{ display: isMobileMenuOpen ? "block" : "" }}>
                  <li>
                    <Link to="/" className={isActive("/")}>
                      Home
                    </Link>
                  </li>
                  <li className="dropdown">
                    <Link to="/shop" className={isActive("/shop")}>
                      Shop <i className="fa fa-angle-down"></i>
                    </Link>
                    <ul role="menu" className="sub-menu">
                      <li><Link to="/shop">All Products</Link></li>
                      <li><Link to="/shop?category=sportswear">Sportswear</Link></li>
                      <li><Link to="/shop?category=mens">Mens</Link></li>
                      <li><Link to="/shop?category=womens">Womens</Link></li>
                      <li><Link to="/cart">Cart</Link></li>
                      <li><Link to="/checkout">Checkout</Link></li>
                    </ul>
                  </li>
                  <li>
                    <Link to="/cart" className={isActive("/cart")}>
                      Shopping Cart
                    </Link>
                  </li>
                  <li>
                    <Link to="/checkout" className={isActive("/checkout")}>
                      Checkout
                    </Link>
                  </li>
                  {isAuthenticated && (
                    <li>
                      <Link to="/profile" className={isActive("/profile")}>
                        My Account
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to="/contact" className={isActive("/contact")}>
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-sm-3">
              <form onSubmit={handleSearch} className="search_box pull-right" style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingRight: 30,
                    width: "100%",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#696763",
                    cursor: "pointer",
                  }}
                  title="Search"
                >
                  <i className="fa fa-search"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /header-bottom */}
    </header>
  );
}

export default ShopNavbar;

