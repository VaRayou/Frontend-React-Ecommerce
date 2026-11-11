import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X, ChevronRight, LogOut, Package, UserCheck, ShieldCheck } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { useUIStore } from "../../store/useUIStore";
import { useCurrencyStore } from "../../store/useCurrencyStore";

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { getItemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isAdminAuthenticated } = useAdminAuthStore();
  const { currency, setCurrency } = useCurrencyStore();
  const {
    openCartDrawer,
    openSearchModal,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  } = useUIStore();

  const cartCount = getItemCount();
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    closeMobileMenu();
    setIsUserMenuOpen(false);
  }, [location.pathname, closeMobileMenu]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Categories", path: "/categories" },
    { label: "Track Order", path: "/track" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100 py-2.5 sm:py-3.5"
          : "bg-white/90 backdrop-blur-sm border-b border-gray-100/60 py-3 sm:py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-black hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <Link to="/" className="flex items-center gap-1.5 group">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#D6FF00] inline-block shadow-xs group-hover:scale-125 transition-transform" />
            <span className="font-extrabold tracking-[-0.05em] text-lg sm:text-2xl text-black">
              ATELIER
            </span>
            <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase hidden sm:inline ml-1">
              PARIS
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-widest uppercase">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.path}
              className={({ isActive }) =>
                `transition-colors relative py-1.5 ${
                  isActive ? "text-black" : "text-gray-500 hover:text-black"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navbarActiveUnderline"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111111] rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions (Search, Wishlist, Bag, Profile, Currency) */}
        <div className="flex items-center gap-0.5 sm:gap-2">
          {/* Currency Switcher */}
          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "KHR" : "USD")}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider border border-gray-200 hover:border-black bg-gray-50/80 hover:bg-black hover:text-[#D6FF00] transition-all cursor-pointer shadow-2xs mr-0.5 sm:mr-1"
            title="Switch Currency between USD ($) and Khmer Riel (៛)"
          >
            <span className={currency === "USD" ? "text-emerald-600 font-black" : "text-gray-400"}>$</span>
            <span className="text-gray-300">/</span>
            <span className={currency === "KHR" ? "text-emerald-600 font-black" : "text-gray-400"}>៛</span>
            <span className="hidden xs:inline ml-0.5 uppercase text-[10px]">{currency}</span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={openSearchModal}
            className="p-1.5 sm:p-2 text-black hover:bg-gray-100 rounded-full transition-colors relative"
            title="Search Products (Press ESC)"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
          </button>

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className="p-1.5 sm:p-2 text-black hover:bg-gray-100 rounded-full transition-colors relative"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black text-[#D6FF00] text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Drawer Trigger */}
          <button
            onClick={openCartDrawer}
            className="p-1.5 sm:p-2 text-black hover:bg-gray-100 rounded-full transition-colors relative"
            title="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#D6FF00] text-black text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1.5"
              title="Account"
            >
              {isAuthenticated && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-black/20"
                />
              ) : (
                <UserIcon className="w-5 h-5 stroke-[1.8]" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                {isAuthenticated && user ? (
                  <>
                    <div className="p-3 border-b border-gray-100 mb-1">
                      <p className="font-bold text-black truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-100 font-semibold text-gray-700 hover:text-black transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-100 font-semibold text-gray-700 hover:text-black transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Order History</span>
                    </Link>
                    {((user as any).role === "admin" ||
                      (user as any).isAdmin === true ||
                      user.email.toLowerCase() === "controller@atelier.com" ||
                      user.email.toLowerCase() === "admin@atelier.com") && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center justify-between p-2 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase tracking-wider my-1 shadow-xs hover:bg-neutral-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Studio Controller</span>
                        </span>
                        <span className="text-[9px] bg-[#D6FF00] text-black px-1.5 py-0.5 rounded font-black">
                          ADMIN
                        </span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 border-b border-gray-100 mb-1">
                      <p className="font-bold text-black text-sm">Welcome to Atelier</p>
                      <p className="text-[11px] text-gray-500">Sign in to view orders & wishlist</p>
                    </div>
                    <Link
                      to="/login"
                      className="block w-full py-2.5 text-center bg-[#111111] text-white font-bold rounded-xl hover:bg-black transition-colors text-xs uppercase tracking-wider mb-1"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full py-2 text-center text-gray-600 hover:text-black font-semibold text-xs"
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-5 py-6 space-y-5 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center justify-between text-sm font-bold tracking-wider uppercase py-2 border-b border-gray-50 ${
                    isActive ? "text-black" : "text-gray-500"
                  }`
                }
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </NavLink>
            ))}
          </nav>

          <div className="pt-2 border-t border-gray-100 flex gap-2">
            <Link
              to={isAuthenticated ? "/profile" : "/login"}
              className="flex-1 py-3 text-center bg-[#111111] text-white font-bold rounded-xl text-xs uppercase tracking-wider"
            >
              {isAuthenticated ? "My Profile" : "Sign In / Register"}
            </Link>
            <Link
              to="/wishlist"
              className="px-4 py-3 text-center border border-gray-200 text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1"
            >
              <Heart className="w-4 h-4" />
              <span>({wishlistCount})</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

