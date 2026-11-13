import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "../types";
import { supabase } from "../services/supabase";
import { productService } from "../services/productService";

interface CartState {
  items: CartItem[];
  promoCode: string;
  discountPercent: number;
  discountAmount: number;
  discountType: "percentage" | "fixed" | "shipping";
  minSpend: number;
  promoDescription: string;
  promoError: string | null;
  freeShippingThreshold: number;
  standardShippingFee: number;
  shippingCarrierName: string;
  setShippingConfig: (config: {
    threshold?: number;
    fee?: number;
    carrierName?: string;
  }) => void;
  addToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: { name: string; hex: string },
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  syncCartWithLiveStock: () => Promise<{
    valid: boolean;
    adjustments: string[];
  }>;
  applyPromoCode: (
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
  removePromoCode: () => void;
  getSubtotal: () => number;
  getShipping: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const FREE_SHIPPING_THRESHOLD = 200;
const STANDARD_SHIPPING_FEE = 15;

let _cartMutationVersion = 0;

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80";

function revalidatePromoDiscount(state: CartState, newItems: CartItem[]) {
  if (!state.promoCode) return {};

  const subtotal = newItems.reduce((sum, item) => {
    if (!item) return sum;
    const price = Number(item.product?.price ?? (item as any)?.price ?? 0);
    const qty = Number(item.quantity) || 1;
    return sum + price * qty;
  }, 0);

  const minSpend = Number(state.minSpend || 0);
  if (subtotal === 0 || (minSpend > 0 && subtotal < minSpend)) {
    return {
      promoCode: "",
      discountPercent: 0,
      discountAmount: 0,
      minSpend: 0,
      promoDescription: "",
      promoError:
        minSpend > 0 && subtotal > 0
          ? `Promo code ${state.promoCode} removed: Minimum spend of $${minSpend} is no longer met.`
          : null,
    };
  }

  // Recalculate percentage discount on updated subtotal
  if (state.discountType === "percentage" && state.discountPercent > 0) {
    const nextDisc = Number(
      ((subtotal * state.discountPercent) / 100).toFixed(2),
    );
    return { discountAmount: nextDisc, promoError: null };
  }

  // Fixed discount: ensure it doesn't exceed new subtotal
  if (state.discountType === "fixed" && state.discountAmount > 0) {
    return {
      discountAmount: Math.min(subtotal, state.discountAmount),
      promoError: null,
    };
  }

  return { promoError: null };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: "",
      discountPercent: 0,
      discountAmount: 0,
      discountType: "percentage",
      minSpend: 0,
      promoDescription: "",
      promoError: null,
      freeShippingThreshold: 200,
      standardShippingFee: 15,
      shippingCarrierName: "DHL Express Courier",

      setShippingConfig: (config) => {
        set((state) => ({
          freeShippingThreshold:
            config.threshold !== undefined
              ? Number(config.threshold)
              : state.freeShippingThreshold,
          standardShippingFee:
            config.fee !== undefined
              ? Number(config.fee)
              : state.standardShippingFee,
          shippingCarrierName: config.carrierName || state.shippingCarrierName,
        }));
      },

      addToCart: (product, quantity = 1, selectedSize, selectedColor) => {
        if (!product) return;
        _cartMutationVersion++;
        const rawStock =
          product.stock !== undefined
            ? Number(product.stock)
            : product.quantity !== undefined
              ? Number(product.quantity)
              : product.stockCount !== undefined
                ? Number(product.stockCount)
                : 10;
        const isOut =
          String(product.status || "")
            .trim()
            .toLowerCase() === "out of stock" ||
          product.inStock === false ||
          isNaN(rawStock) ||
          rawStock <= 0;
        if (isOut) return;
        const maxStock = Math.max(1, rawStock);
        const mainImg =
          product.image ||
          (Array.isArray(product.images) && product.images[0]) ||
          DEFAULT_IMG;
        const images =
          Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : [mainImg];
        const sizes =
          Array.isArray(product.sizes) && product.sizes.length > 0
            ? product.sizes
            : ["S", "M", "L", "XL"];
        const colors =
          Array.isArray(product.colors) && product.colors.length > 0
            ? product.colors
            : [
                { name: "Obsidian Black", hex: "#111111" },
                { name: "Chalk Ecru", hex: "#F3EDE2" },
              ];

        const normalizedProduct: Product = {
          ...product,
          id: String(product.id || (product as any)._id || "prod-item"),
          name: product.name || "Fashion Piece",
          price: Number(product.price) || 0,
          originalPrice:
            Number(product.originalPrice) || Number(product.price) || 0,
          image: mainImg,
          images,
          sizes,
          colors,
          category: product.category || "Apparel",
          stock: maxStock,
          quantity: maxStock,
          stockCount: maxStock,
          inStock: true,
        };

        const size = selectedSize || sizes[0] || "M";
        const color = selectedColor ||
          colors[0] || { name: "Obsidian Black", hex: "#111111" };
        const colorName =
          typeof color === "object" && color?.name
            ? color.name
            : String(color || "Standard");
        const itemId = `${normalizedProduct.id}-${size}-${colorName.toLowerCase().replace(/\s+/g, "-")}`;

        set((state) => {
          const currentItems = state.items || [];
          const existingIndex = currentItems.findIndex(
            (item) => item.id === itemId,
          );
          if (existingIndex > -1) {
            const updatedItems = [...currentItems];
            const nextQty =
              (Number(updatedItems[existingIndex].quantity) || 1) + quantity;
            updatedItems[existingIndex].quantity = Math.min(maxStock, nextQty);
            updatedItems[existingIndex].product = normalizedProduct;
            return { items: updatedItems };
          } else {
            return {
              items: [
                ...currentItems,
                {
                  id: itemId,
                  product: normalizedProduct,
                  quantity: Math.min(maxStock, quantity),
                  selectedSize: size,
                  selectedColor: color,
                },
              ],
            };
          }
        });
      },

      removeFromCart: (itemId) => {
        _cartMutationVersion++;
        const targetId = String(itemId || "").trim();
        if (!targetId) return;

        set((state) => {
          const nextItems = (state.items || []).filter((item) => {
            const currentId = String(item.id || "").trim();
            const currentProdId = String(item.product?.id || (item.product as any)?._id || "").trim();
            // Match against unique cart item ID or product ID if single item
            return currentId !== targetId && (currentProdId !== targetId || currentId.includes("-"));
          });
          const promoUpdates = revalidatePromoDiscount(state, nextItems);
          return {
            items: nextItems,
            ...promoUpdates,
          };
        });
      },

      updateQuantity: (itemId, quantity) => {
        _cartMutationVersion++;
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        set((state) => {
          const nextItems = (state.items || []).map((item) => {
            if (item.id !== itemId) return item;
            const maxStock = Number(
              item.product?.stock ??
                item.product?.quantity ??
                item.product?.stockCount ??
                99,
            );
            const cappedQty =
              maxStock > 0 ? Math.min(quantity, maxStock) : quantity;
            return { ...item, quantity: cappedQty };
          });
          const promoUpdates = revalidatePromoDiscount(state, nextItems);
          return {
            items: nextItems,
            ...promoUpdates,
          };
        });
      },

      clearCart: () => {
        _cartMutationVersion++;
        set({
          items: [],
          promoCode: "",
          discountPercent: 0,
          discountAmount: 0,
          discountType: "percentage",
          minSpend: 0,
          promoDescription: "",
          promoError: null,
        });
      },

      syncCartWithLiveStock: async () => {
        const startVersion = ++_cartMutationVersion;
        const initialItems = get().items || [];
        if (initialItems.length === 0) return { valid: true, adjustments: [] };

        try {
          const liveProducts = await productService.getProducts({ forceRefresh: true });

          // If cart was modified during the network fetch, abandon this sync to prevent stale overwrites
          if (startVersion !== _cartMutationVersion) {
            return { valid: true, adjustments: [] };
          }
          if (!Array.isArray(liveProducts)) {
            return { valid: true, adjustments: [] };
          }

          const liveMap = new Map<string, any>();
          for (const p of liveProducts) {
            if (p.id) liveMap.set(String(p.id), p);
            if ((p as any)._id) liveMap.set(String((p as any)._id), p);
          }

          // Fresh read of items right now - ensures deleted items are never resurrected
          const liveItems = get().items || [];
          if (liveItems.length === 0) {
            return { valid: true, adjustments: [] };
          }

          const adjustments: string[] = [];
          const nextItems: CartItem[] = [];

          for (const item of liveItems) {
            const prodId = String(
              item.product?.id || (item.product as any)?._id || "",
            );
            const liveProd = liveMap.get(prodId);
            if (!liveProd) {
              nextItems.push(item);
              continue;
            }

            const rawStock =
              liveProd.stock !== undefined
                ? Number(liveProd.stock)
                : liveProd.quantity !== undefined
                  ? Number(liveProd.quantity)
                  : 10;
            const isOut =
              String(liveProd.status || "")
                .trim()
                .toLowerCase() === "out of stock" ||
              liveProd.inStock === false ||
              rawStock <= 0;

            if (isOut) {
              adjustments.push(
                `"${item.product.name}" is now Out of Stock and was removed from your bag.`,
              );
              continue;
            }

            const cappedQty = Math.min(item.quantity, rawStock);
            if (cappedQty < item.quantity) {
              adjustments.push(
                `"${item.product.name}" quantity adjusted to ${cappedQty} (only ${rawStock} left in stock).`,
              );
            }

            nextItems.push({
              ...item,
              quantity: cappedQty,
              product: {
                ...item.product,
                stock: rawStock,
                quantity: rawStock,
                stockCount: rawStock,
                inStock: true,
                status: liveProd.status || "Active",
              },
            });
          }

          // Final guard: check mutation version right before applying state
          if (startVersion !== _cartMutationVersion) {
            return { valid: true, adjustments: [] };
          }

          set({ items: nextItems });
          return { valid: adjustments.length === 0, adjustments };
        } catch {
          return { valid: true, adjustments: [] };
        }
      },

      applyPromoCode: async (code) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
          set({ promoError: "Please enter a coupon code." });
          return { success: false, message: "Please enter a coupon code." };
        }

        const subtotal = get().getSubtotal();
        const shipping = get().getShipping();

        // 1. Direct Supabase Query (0ms Cold Start)
        try {
          const { data: coupon, error } = await supabase
            .from("coupons")
            .select("*")
            .ilike("code", cleanCode)
            .eq("is_active", true)
            .maybeSingle();

          if (!error && coupon) {
            if (
              coupon.min_order_value &&
              subtotal < Number(coupon.min_order_value)
            ) {
              const msg = `Minimum spend of $${coupon.min_order_value} required.`;
              set({ promoError: msg });
              return { success: false, message: msg };
            }

            let disc = 0;
            const type = coupon.discount_type || coupon.type || "percentage";
            const val = Number(coupon.discount_value ?? coupon.value ?? 0);

            if (type === "percentage") {
              disc = Number(((subtotal * val) / 100).toFixed(2));
            } else if (type === "fixed") {
              disc = Math.min(subtotal, val);
            } else if (type === "shipping") {
              disc = shipping;
            }

            const minOrder = Number(
              coupon.min_order_value ?? coupon.min_spend ?? 0,
            );
            set({
              promoCode: cleanCode,
              discountAmount: disc,
              discountPercent: type === "percentage" ? val : 0,
              discountType: type,
              minSpend: minOrder,
              promoDescription: coupon.description || `Coupon ${cleanCode}`,
              promoError: null,
            });
            return {
              success: true,
              message: `Promo code ${cleanCode} applied!`,
            };
          }
        } catch (err: any) {
          console.warn("[Supabase] coupon check error:", err.message);
        }

        // 2. Offline fallback validation
        if (cleanCode === "ATELIER20" || cleanCode === "VIP20") {
          const disc = Math.round(subtotal * 0.2);
          set({
            promoCode: cleanCode,
            discountPercent: 20,
            discountAmount: disc,
            discountType: "percentage",
            minSpend: 50,
            promoDescription: "20% Off Runway Collection",
            promoError: null,
          });
          return { success: true, message: "20% discount applied!" };
        } else if (cleanCode === "WELCOME10") {
          set({
            promoCode: cleanCode,
            discountPercent: 0,
            discountAmount: 10,
            discountType: "fixed",
            minSpend: 30,
            promoDescription: "$10 Welcome Patron Gift",
            promoError: null,
          });
          return { success: true, message: "$10 discount applied!" };
        } else if (cleanCode === "FREESHIP") {
          set({
            promoCode: cleanCode,
            discountPercent: 0,
            discountAmount: shipping,
            discountType: "shipping",
            minSpend: 0,
            promoDescription: "Complimentary White-Glove Shipping",
            promoError: null,
          });
          return { success: true, message: "Free shipping applied!" };
        } else {
          const msg = "Invalid or expired coupon code.";
          set({ promoError: msg });
          return { success: false, message: msg };
        }
      },

      removePromoCode: () => {
        set({
          promoCode: "",
          discountPercent: 0,
          discountAmount: 0,
          discountType: "percentage",
          minSpend: 0,
          promoDescription: "",
          promoError: null,
        });
      },

      getSubtotal: () => {
        const items = get().items || [];
        return items.reduce((sum, item) => {
          if (!item) return sum;
          const price = Number(
            item.product?.price ?? (item as any)?.price ?? 0,
          );
          const qty = Number(item.quantity) || 1;
          return sum + price * qty;
        }, 0);
      },

      getShipping: () => {
        const subtotal = get().getSubtotal();
        const threshold =
          get().freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;
        const fee = get().standardShippingFee ?? STANDARD_SHIPPING_FEE;
        if (subtotal === 0 || subtotal >= threshold) {
          return 0;
        }
        return fee;
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const discType = get().discountType;
        const discAmount = get().discountAmount || 0;
        const discPercent = get().discountPercent || 0;

        if (discType === "percentage" && discPercent > 0) {
          return Math.round((subtotal * discPercent) / 100);
        }
        if (discAmount > 0) {
          return Math.min(subtotal, discAmount);
        }
        return 0;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().getShipping();
        const discount = get().getDiscount();
        return Math.max(0, subtotal + shipping - discount);
      },

      getItemCount: () => {
        const items = get().items || [];
        return items.reduce(
          (count, item) => count + (Number(item?.quantity) || 1),
          0,
        );
      },
    }),
    {
      name: "atelier_cart_v2",
      migrate: (persistedState: any) => {
        if (!persistedState || !Array.isArray(persistedState.items)) {
          return {
            items: [],
            promoCode: "",
            discountPercent: 0,
            promoError: null,
          };
        }
        const sanitizedItems = persistedState.items.map((item: any) => {
          const prod = item.product || item || {};
          const mainImg =
            prod.image ||
            (Array.isArray(prod.images) && prod.images[0]) ||
            DEFAULT_IMG;
          const images =
            Array.isArray(prod.images) && prod.images.length > 0
              ? prod.images
              : [mainImg];
          const colors =
            Array.isArray(prod.colors) && prod.colors.length > 0
              ? prod.colors
              : [{ name: "Obsidian Black", hex: "#111111" }];
          const sizes =
            Array.isArray(prod.sizes) && prod.sizes.length > 0
              ? prod.sizes
              : ["M"];

          const safeColor =
            typeof item.selectedColor === "object" && item.selectedColor?.name
              ? item.selectedColor
              : {
                  name: String(item.selectedColor || colors[0].name),
                  hex: colors[0].hex,
                };

          return {
            id:
              item.id || `${prod.id || Date.now()}-${item.selectedSize || "M"}`,
            product: {
              ...prod,
              id: String(prod.id || prod._id || "prod-1"),
              name: prod.name || "Fashion Piece",
              price: Number(prod.price) || 0,
              originalPrice:
                Number(prod.originalPrice) || Number(prod.price) || 0,
              image: mainImg,
              images,
              colors,
              sizes,
              category: prod.category || "Apparel",
            },
            quantity: Number(item.quantity) || 1,
            selectedSize: item.selectedSize || sizes[0] || "M",
            selectedColor: safeColor,
          };
        });
        return {
          ...persistedState,
          items: sanitizedItems,
        };
      },
    },
  ),
);
