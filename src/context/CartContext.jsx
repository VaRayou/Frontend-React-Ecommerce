import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

const CART_STORAGE_KEY = "eshopper_cart";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getProductId = (p) => String(p?.id || p?._id || "");

  const addToCart = (product, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const prodId = getProductId(product);
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => getProductId(item.product) === prodId
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = Math.min(
          updated[existingIndex].quantity + qty,
          product.stock || 99
        );
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        showToast(`Updated "${product.name}" quantity to ${newQty}!`);
        return updated;
      } else {
        const itemQty = Math.min(qty, product.stock || 99);
        showToast(`Added "${product.name}" to cart!`);
        return [...prevCart, { product, quantity: itemQty }];
      }
    });
  };

  const removeFromCart = (productId) => {
    const targetId = String(productId);
    setCart((prevCart) => {
      const item = prevCart.find((i) => getProductId(i.product) === targetId);
      if (item) {
        showToast(`Removed "${item.product.name}" from cart.`);
      }
      return prevCart.filter((item) => getProductId(item.product) !== targetId);
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    const targetId = String(productId);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (getProductId(item.product) === targetId) {
          const maxStock = item.product.stock || 99;
          return { ...item, quantity: Math.min(qty, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyPromoCode = (code) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === "DISCOUNT10" || trimmed === "ESHOPPER10") {
      setPromoCode(trimmed);
      setDiscountPercent(10);
      showToast("Coupon applied! 10% discount added.");
      return { success: true, message: "10% discount applied successfully!" };
    } else if (trimmed === "SAVE20") {
      setPromoCode(trimmed);
      setDiscountPercent(20);
      showToast("Coupon applied! 20% discount added.");
      return { success: true, message: "20% discount applied successfully!" };
    } else {
      return { success: false, message: "Invalid coupon code. Try 'DISCOUNT10' or 'SAVE20'." };
    }
  };

  // Calculations
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartSubtotal = cart.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0
  );

  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);

  // Demo shipping rule: $10 shipping, or Free over $150
  const shippingFee = cart.length === 0 ? 0 : cartSubtotal > 150 ? 0 : 10;

  // Demo Eco Tax
  const tax = cart.length === 0 ? 0 : 2;

  const cartTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee + tax);

  const value = {
    cart,
    cartCount,
    cartSubtotal,
    discountAmount,
    discountPercent,
    shippingFee,
    tax,
    cartTotal,
    promoCode,
    toastMessage,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyPromoCode,
    showToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

