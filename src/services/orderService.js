import api from "./api";
import { initialOrders } from "../data/demoOrders.js";

const ORDERS_STORAGE_KEY = "eshopper_orders";
const AUTH_STORAGE_KEY = "atelier_auth_v3";

// Known legacy demo order identifiers to actively purge so only real orders appear
const DEMO_ORDER_NUMBERS = new Set([
  "ORD-9021",
  "ORD-9022",
  "ORD-9023",
  "ORD-9024",
  "ord-9821",
  "ord-8710",
  "101",
  "102",
  "103",
  "104",
]);

/**
 * Checks if an order is a sample/demo seed order.
 * Any real order created during checkout (e.g. starting with "ATL-") is NEVER considered demo.
 */
export const isDemoOrder = (order) => {
  if (!order) return true;
  const num = String(order.orderNumber || order.order_number || order.id || "").trim();
  if (num.startsWith("ATL-")) return false;
  return DEMO_ORDER_NUMBERS.has(num);
};

/**
 * Normalizes an order from any source (Django API, useAuthStore, or client storage)
 * so that both frontend components (ManageOrders & Customer Orders) can access all required fields safely.
 */
export const normalizeOrder = (order, idx = 0) => {
  if (!order) return null;

  const rawId = order.id || order._id || `ord-${Date.now()}-${idx}`;
  const orderNumber =
    order.orderNumber ||
    order.order_number ||
    (order.id ? `ORD-${order.id}` : `ATL-${Date.now().toString().slice(-6)}`);

  // Customer info extraction
  let customerName = order.customerName || order.customer_name;
  let customerEmail = order.customerEmail || order.customer_email;
  let customerPhone = order.customerPhone || order.customer_phone;
  let shippingAddressStr = "";

  if (typeof order.shippingAddress === "string") {
    shippingAddressStr = order.shippingAddress;
  } else if (order.shippingAddress && typeof order.shippingAddress === "object") {
    const sa = order.shippingAddress;
    customerName = customerName || sa.fullName || sa.name;
    customerEmail = customerEmail || sa.email;
    customerPhone = customerPhone || sa.phone;
    shippingAddressStr = [sa.street, sa.city, sa.postalCode, sa.country].filter(Boolean).join(", ");
  }

  customerName = customerName || "Patron Client";
  customerEmail = customerEmail || "patron@atelier.com";
  customerPhone = customerPhone || "";
  shippingAddressStr = shippingAddressStr || "Phnom Penh, Cambodia";

  // Date normalization
  const dateStr =
    order.date ||
    (order.createdAt ? String(order.createdAt).split("T")[0] : new Date().toISOString().split("T")[0]);
  const createdAtStr =
    order.createdAt || (order.date ? new Date(order.date).toISOString() : new Date().toISOString());

  // Statuses
  const orderStatus =
    order.orderStatus || order.order_status || order.status || "Processing";
  const paymentMethod =
    order.paymentMethod || order.payment_method || "Bakong KHQR";
  let paymentStatus =
    order.paymentStatus || order.payment_status;
  if (!paymentStatus) {
    paymentStatus =
      paymentMethod.toLowerCase().includes("khqr") ||
      paymentMethod.toLowerCase().includes("paypal") ||
      paymentMethod.toLowerCase().includes("transfer") ||
      paymentMethod.toLowerCase().includes("card")
        ? "Paid"
        : "Pending";
  }

  // Items normalization
  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items = rawItems.map((item, itemIdx) => {
    const name =
      item.name ||
      item.productName ||
      item.product_name ||
      item.title ||
      "Fashion Piece";
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    const image =
      item.image ||
      item.images?.[0] ||
      "/user/images/home/product1.jpg";
    const size = item.size || item.selectedSize || "M";
    const color =
      typeof item.color === "object" && item.color?.name
        ? item.color.name
        : (item.color || "Standard");

    return {
      id: item.id || item.productId || `item-${itemIdx}`,
      productId: item.productId || item.id || `prod-${itemIdx}`,
      name,
      productName: name,
      price,
      quantity,
      image,
      size,
      color,
    };
  });

  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const shippingFee = Number(order.shippingFee ?? order.shipping ?? 0);
  const tax = Number(order.tax) || 0;

  return {
    id: rawId,
    _id: rawId,
    orderNumber,
    order_number: orderNumber,
    customerId: order.customerId || order.customer_id || null,
    customerName,
    customer_name: customerName,
    customerEmail,
    customer_email: customerEmail,
    customerPhone,
    customer_phone: customerPhone,
    shippingAddress: shippingAddressStr,
    date: dateStr,
    createdAt: createdAtStr,
    items,
    subtotal,
    shippingFee,
    tax,
    total,
    paymentMethod,
    payment_method: paymentMethod,
    paymentStatus,
    payment_status: paymentStatus,
    orderStatus,
    order_status: orderStatus,
    status: orderStatus,
    notes: order.notes || "",
  };
};

/**
 * Reads and merges orders from all local client storage keys,
 * automatically filtering out demo orders.
 */
const getLocalMergedOrders = () => {
  const mergedMap = new Map();

  // 1. Initial orders (clean empty array in real mode)
  if (Array.isArray(initialOrders)) {
    for (const demo of initialOrders) {
      if (isDemoOrder(demo)) continue;
      const norm = normalizeOrder(demo);
      if (norm && !isDemoOrder(norm)) mergedMap.set(norm.orderNumber, norm);
    }
  }

  // 2. eshopper_orders (clean out demo entries if present)
  let cleanedEshopper = false;
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        for (const o of parsed) {
          if (isDemoOrder(o)) {
            cleanedEshopper = true;
            continue;
          }
          const norm = normalizeOrder(o);
          if (norm && !isDemoOrder(norm)) mergedMap.set(norm.orderNumber, norm);
        }
      }
    }
  } catch (e) {
    console.warn("Failed reading eshopper_orders:", e);
  }

  // 3. atelier_auth_v2 (clean out demo entries if present)
  let cleanedAuth = false;
  try {
    const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authStored) {
      const parsedAuth = JSON.parse(authStored);
      const authOrders = parsedAuth?.state?.orders;
      if (Array.isArray(authOrders)) {
        const remainingAuth = [];
        for (const o of authOrders) {
          if (isDemoOrder(o)) {
            cleanedAuth = true;
            continue;
          }
          remainingAuth.push(o);
          const norm = normalizeOrder(o);
          if (norm && !isDemoOrder(norm)) {
            const existing = mergedMap.get(norm.orderNumber);
            mergedMap.set(norm.orderNumber, existing ? { ...existing, ...norm } : norm);
          }
        }
        if (cleanedAuth) {
          parsedAuth.state.orders = remainingAuth;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsedAuth));
        }
      }
    }
  } catch (e) {
    console.warn("Failed reading atelier_auth_v2 orders:", e);
  }

  const list = Array.from(mergedMap.values()).filter((o) => !isDemoOrder(o));
  if (cleanedEshopper) {
    saveOrdersStorage(list);
  }

  list.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime() || 0;
    const timeB = new Date(b.createdAt || b.date).getTime() || 0;
    return timeB - timeA;
  });

  return list;
};

/**
 * Saves orders list back to localStorage.
 */
const saveOrdersStorage = (orders) => {
  try {
    const cleanList = orders.filter((o) => !isDemoOrder(o));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(cleanList));
  } catch (e) {
    console.warn("Failed writing eshopper_orders:", e);
  }
};

/**
 * Syncs an order into atelier_auth_v2 so Customer Orders (/orders) stays in sync.
 */
const syncToAuthStore = (order) => {
  if (isDemoOrder(order)) return;
  try {
    const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authStored) {
      const parsedAuth = JSON.parse(authStored);
      if (parsedAuth && parsedAuth.state) {
        const currentOrders = (parsedAuth.state.orders || []).filter((o) => !isDemoOrder(o));
        const exists = currentOrders.some((o) => o.orderNumber === order.orderNumber);
        if (!exists) {
          parsedAuth.state.orders = [order, ...currentOrders];
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsedAuth));
        }
      }
    }
  } catch (e) {
    console.warn("Failed syncing to atelier_auth_v2:", e);
  }
};

export const orderService = {
  /**
   * Retrieves real customer orders across backend and client storage.
   */
  getOrders: async () => {
    const localOrders = getLocalMergedOrders();
    const orderMap = new Map();

    // Seed map with real local orders
    for (const o of localOrders) {
      if (!isDemoOrder(o)) {
        orderMap.set(o.orderNumber, o);
      }
    }

    try {
      const response = await api.get("/orders/");
      if (Array.isArray(response.data)) {
        for (const backendOrder of response.data) {
          if (isDemoOrder(backendOrder)) continue;
          const norm = normalizeOrder(backendOrder);
          if (norm && !isDemoOrder(norm)) {
            const existing = orderMap.get(norm.orderNumber);
            orderMap.set(norm.orderNumber, existing ? { ...existing, ...norm } : norm);
          }
        }
      }
    } catch (err) {
      console.warn("Backend API offline or unreachable, using unified real local storage:", err.message);
    }

    const mergedList = Array.from(orderMap.values()).filter((o) => !isDemoOrder(o));
    mergedList.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime() || 0;
      const timeB = new Date(b.createdAt || b.date).getTime() || 0;
      return timeB - timeA;
    });

    saveOrdersStorage(mergedList);
    return mergedList;
  },

  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}/`);
      const norm = normalizeOrder(response.data);
      if (norm && !isDemoOrder(norm)) return norm;
      throw new Error("Order not found");
    } catch (err) {
      console.warn("Backend API offline, searching local storage:", err.message);
      const orders = getLocalMergedOrders();
      const order = orders.find(
        (o) => String(o.id) === String(id) || o.orderNumber === String(id)
      );
      if (!order || isDemoOrder(order)) throw new Error("Order not found", { cause: err });
      return order;
    }
  },

  getOrdersByCustomer: async (customerEmail) => {
    if (!customerEmail) return [];
    const targetEmail = String(customerEmail).trim().toLowerCase();
    const all = await orderService.getOrders();
    return all.filter((o) => {
      const email = String(
        o.customerEmail || o.customer_email || o.shippingAddress?.email || ""
      )
        .trim()
        .toLowerCase();
      return email === targetEmail;
    });
  },

  /**
   * Creates a real order, immediately persisting to client cache & syncing to backend.
   */
  createOrder: async (orderData) => {
    // 1. Normalize order data immediately
    const normalized = normalizeOrder({
      ...orderData,
      id: orderData.id || `ord-${Date.now()}`,
      orderNumber:
        orderData.orderNumber ||
        orderData.order_number ||
        `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: orderData.createdAt || new Date().toISOString(),
      date: orderData.date || new Date().toISOString().split("T")[0],
      orderStatus: orderData.orderStatus || orderData.status || "Processing",
      paymentStatus:
        orderData.paymentStatus ||
        (orderData.paymentMethod === "QR Payment" || orderData.paymentMethod === "Bakong KHQR"
          ? "Paid"
          : "Pending"),
    });

    // 2. Persist locally first so UI and Admin DataTable have it instantly (0ms delay)
    const localOrders = getLocalMergedOrders();
    const updatedLocal = [normalized, ...localOrders.filter((o) => o.orderNumber !== normalized.orderNumber)];
    saveOrdersStorage(updatedLocal);
    syncToAuthStore(normalized);

    // Notify any open components in the application
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("atelier_order_updated", { detail: normalized }));
    }

    // 3. Attempt syncing with backend DRF API
    try {
      const response = await api.post("/orders/", {
        orderNumber: normalized.orderNumber,
        customerName: normalized.customerName,
        customerEmail: normalized.customerEmail,
        customerPhone: normalized.customerPhone,
        shippingAddress: normalized.shippingAddress,
        items: normalized.items.map((it) => ({
          id: it.id,
          productId: it.productId || it.id,
          name: it.name,
          productName: it.productName || it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          size: it.size,
          color: it.color,
        })),
        subtotal: normalized.subtotal,
        shippingFee: normalized.shippingFee,
        tax: normalized.tax,
        total: normalized.total,
        paymentMethod: normalized.paymentMethod,
        paymentStatus: normalized.paymentStatus,
        orderStatus: normalized.orderStatus,
        notes: normalized.notes,
      });

      if (response?.data) {
        const syncedOrder = normalizeOrder(response.data);
        const finalList = updatedLocal.map((o) =>
          o.orderNumber === normalized.orderNumber ? { ...o, ...syncedOrder } : o
        );
        saveOrdersStorage(finalList);
        return syncedOrder;
      }
    } catch (err) {
      console.warn("Backend API offline or error during order sync (saved locally):", err.message);
    }

    return normalized;
  },

  /**
   * Updates an order's status and syncs both locally and with backend.
   */
  updateOrderStatus: async (id, newStatus) => {
    // 1. Update local storage
    const orders = getLocalMergedOrders();
    const index = orders.findIndex(
      (o) => String(o.id) === String(id) || o.orderNumber === String(id)
    );

    let updatedOrder = null;
    if (index !== -1) {
      orders[index].orderStatus = newStatus;
      orders[index].order_status = newStatus;
      orders[index].status = newStatus;
      if (newStatus === "Delivered") {
        orders[index].paymentStatus = "Paid";
        orders[index].payment_status = "Paid";
      }
      updatedOrder = orders[index];
      saveOrdersStorage(orders);

      // Also update in atelier_auth_v2 if present
      try {
        const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (authStored) {
          const parsed = JSON.parse(authStored);
          if (parsed?.state?.orders) {
            parsed.state.orders = parsed.state.orders.map((o) =>
              String(o.id) === String(id) || o.orderNumber === String(id)
                ? { ...o, status: newStatus, orderStatus: newStatus }
                : o
            );
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.warn("Error updating status in atelier_auth_v2:", e);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("atelier_order_updated", { detail: updatedOrder }));
      }
    }

    // 2. Sync to Django DRF backend if reachable
    try {
      const response = await api.patch(`/orders/${id}/`, {
        orderStatus: newStatus,
        order_status: newStatus,
        status: newStatus,
      });
      if (typeof window !== "undefined" && String(newStatus).toLowerCase() === "cancelled") {
        window.dispatchEvent(new Event("atelier_products_updated"));
      }
      if (response?.data) {
        return normalizeOrder(response.data);
      }
    } catch (err) {
      console.warn("Backend API offline for status patch, updated locally:", err.message);
    }

    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  },

  /**
   * Deletes an order permanently from local cache and backend.
   */
  deleteOrder: async (targetId) => {
    const orders = getLocalMergedOrders();
    const remaining = orders.filter(
      (o) => String(o.id) !== String(targetId) && o.orderNumber !== String(targetId)
    );
    saveOrdersStorage(remaining);

    try {
      const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authStored) {
        const parsed = JSON.parse(authStored);
        if (parsed?.state?.orders) {
          parsed.state.orders = parsed.state.orders.filter(
            (o) => String(o.id) !== String(targetId) && o.orderNumber !== String(targetId)
          );
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Error deleting order from auth store:", e);
    }

    try {
      await api.delete(`/orders/${targetId}/`);
    } catch (e) {
      console.warn("Backend delete note:", e.message);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("atelier_order_updated"));
    }

    return remaining;
  },

  /**
   * Force purges all remaining demo orders from the user's browser.
   */
  purgeDemoOrders: () => {
    const list = getLocalMergedOrders();
    const realOrders = list.filter((o) => !isDemoOrder(o));
    saveOrdersStorage(realOrders);

    try {
      const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authStored) {
        const parsed = JSON.parse(authStored);
        if (parsed?.state?.orders) {
          parsed.state.orders = parsed.state.orders.filter((o) => !isDemoOrder(o));
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Purge demo orders note:", e);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("atelier_order_updated"));
    }

    return realOrders;
  },

  /**
   * Triggers explicit MongoDB synchronization for orders and payments.
   */
  syncMongoDB: async () => {
    try {
      const response = await api.post("/sync/mongodb/");
      return response.data;
    } catch (e) {
      console.warn("MongoDB sync endpoint note:", e.message);
      return null;
    }
  },
};
