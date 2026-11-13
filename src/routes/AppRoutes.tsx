import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import Loader from "../components/common/Loader";

// Primary Landing & Catalog Pages (Eagerly loaded for instant 0ms initial navigation)
import { Home } from "../pages/Home/Index";
import { Shop } from "../pages/shop/Index";

// Lazy-loaded Customer Secondary Pages (Loaded on demand to keep initial JS bundle ultra-lean)
const ProductDetails = lazy(() =>
  import("../pages/ProductDetails/Index").then((m) => ({ default: m.ProductDetails || m.default }))
);
const Categories = lazy(() =>
  import("../pages/Categories/Index").then((m) => ({ default: m.Categories || m.default }))
);
const Cart = lazy(() =>
  import("../pages/Cart/Index").then((m) => ({ default: m.Cart || m.default }))
);
const Checkout = lazy(() =>
  import("../pages/Checkout/Index").then((m) => ({ default: m.Checkout || m.default }))
);
const Wishlist = lazy(() =>
  import("../pages/Wishlist/Index").then((m) => ({ default: m.Wishlist || m.default }))
);
const Login = lazy(() =>
  import("../pages/Login/Index").then((m) => ({ default: m.Login || m.default }))
);
const Register = lazy(() =>
  import("../pages/Register/Index").then((m) => ({ default: m.Register || m.default }))
);
const Profile = lazy(() =>
  import("../pages/Profile/Index").then((m) => ({ default: m.Profile || m.default }))
);
const Orders = lazy(() =>
  import("../pages/Orders/Index").then((m) => ({ default: m.Orders || m.default }))
);
const TrackOrder = lazy(() =>
  import("../pages/TrackOrder/Index").then((m) => ({ default: m.TrackOrder || m.default }))
);
const InvoicePage = lazy(() =>
  import("../pages/Invoice/Index").then((m) => ({ default: m.InvoicePage || m.default }))
);
const About = lazy(() =>
  import("../pages/About/Index").then((m) => ({ default: m.About || m.default }))
);
const Contact = lazy(() =>
  import("../pages/Contact/Index").then((m) => ({ default: m.Contact || m.default }))
);
const NotFound = lazy(() =>
  import("../pages/NotFound/Index").then((m) => ({ default: m.NotFound || m.default }))
);

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
