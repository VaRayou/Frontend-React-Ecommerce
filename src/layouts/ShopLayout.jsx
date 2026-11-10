import React from "react";
import { Outlet } from "react-router-dom";
import ShopNavbar from "../components/shop/ShopNavbar";
import Footer from "../components/user/Footer";
import { useCart } from "../context/CartContext";

function ShopLayout() {
  const { toastMessage } = useCart();

  return (
    <div className="shop-layout">
      {/* Toast notification */}
      {toastMessage && (
        <div className="eshopper-toast">
          <i className="fa fa-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main E-Shopper Navigation Bar */}
      <ShopNavbar />

      {/* Main Dynamic Route Content */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* Authentic E-Shopper Footer */}
      <Footer />
    </div>
  );
}

export default ShopLayout;

