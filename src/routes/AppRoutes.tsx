import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import Loader from "../components/common/Loader";

// High-Fashion Customer Storefront Pages (Eagerly loaded for 0ms instant navigation)
import { Home } from "../pages/Home/Index";
import { Shop } from "../pages/shop/Index";
import { ProductDetails } from "../pages/ProductDetails/Index";
import { Categories } from "../pages/Categories/Index";
import { Cart } from "../pages/Cart/Index";
import { Checkout } from "../pages/Checkout/Index";
import { Wishlist } from "../pages/Wishlist/Index";
import { Login } from "../pages/Login/Index";
import { Register } from "../pages/Register/Index";
import { Profile } from "../pages/Profile/Index";
import { Orders } from "../pages/Orders/Index";
import { TrackOrder } from "../pages/TrackOrder/Index";
import { InvoicePage } from "../pages/Invoice/Index";
import { About } from "../pages/About/Index";
import { Contact } from "../pages/Contact/Index";
import { NotFound } from "../pages/NotFound/Index";

// Lazy-loaded Admin Management Portal Pages
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminLogin = lazy(() => import("../pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const ManageProducts = lazy(() => import("../pages/admin/ManageProducts"));
const ManageCategories = lazy(() => import("../pages/admin/ManageCategories"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders"));
const ManagePayments = lazy(() => import("../pages/admin/ManagePayments"));
const ManageCoupons = lazy(() => import("../pages/admin/ManageCoupons"));
const Settings = lazy(() => import("../pages/admin/Settings"));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Loader message="Loading Atelier Experience..." />}>
      <Routes>
        {/* 1. Customer Storefront (Wrapped in MainLayout) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* User Authentication & Account */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/track/:orderNumber" element={<TrackOrder />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/track-order/:orderNumber" element={<TrackOrder />} />
          <Route path="/invoice" element={<InvoicePage />} />
          <Route path="/invoice/:orderNumber" element={<InvoicePage />} />

          {/* Brand Information */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Redirect aliases */}
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/products/:id" element={<Navigate to="/shop/:id" replace />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* 2. Admin Controller Authentication */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 3. Admin Management Portal (Protected in AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="payments" element={<ManagePayments />} />
          <Route path="coupons" element={<ManageCoupons />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
