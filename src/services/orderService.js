import { supabase } from "./supabase";
import { ensureAdminSession } from "./productService";

const ORDERS_STORAGE_KEY = "atelier_orders_v3";

/**
 * Normalizes an order record from Supabase or memory for frontend consumption
 */
export const normalizeOrder = (order, idx = 0) => {
  if (!order) return null;

  const rawId = String(order.id || order._id || `ord-${Date.now()}-${idx}`);
  const orderNumber =
    order.order_number ||
    order.orderNumber ||
    (order.id ? `ORD-${order.id}` : `ATL-${Date.now().toString().slice(-6)}`);

  // Customer info extraction
  let customerName = order.customer_name || order.customerName;
  let customerEmail = order.customer_email || order.customerEmail;
  let customerPhone = order.customer_phone || order.customerPhone;
  let shippingAddressStr = "";

  if (typeof order.shipping_address === "string") {
    shippingAddressStr = order.shipping_address;
  } else if (typeof order.shippingAddress === "string") {
    shippingAddressStr = order.shippingAddress;
  } else if (order.shipping_address && typeof order.shipping_address === "object") {
    const sa = order.shipping_address;
    customerName = customerName || sa.fullName || sa.name;
    customerEmail = customerEmail || sa.email;
    customerPhone = customerPhone || sa.phone;
    shippingAddressStr = [sa.street, sa.city, sa.postalCode, sa.country].filter(Boolean).join(", ");
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
    (order.created_at ? String(order.created_at).split("T")[0] : new Date().toISOString().split("T")[0]);
  const createdAtStr = order.created_at || order.createdAt || new Date().toISOString();

  // Statuses
  const orderStatus = order.order_status || order.orderStatus || order.status || "Processing";
  const paymentMethod = order.payment_method || order.paymentMethod || "Bakong KHQR";
  const paymentStatus = order.payment_status || order.paymentStatus || "Paid";

  // Order Items normalization
  const rawItems = order.order_items || order.items || [];
  const items = Array.isArray(rawItems)
    ? rawItems.map((item, iIdx) => {
        const pId = String(item.product_id || item.productId || item.id || `item-${iIdx}`);
        const pName = item.product_name || item.productName || item.name || "Haute Couture Piece";
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const itemSubtotal = Number(item.subtotal || price * qty);
        const img = item.image || (Array.isArray(item.images) && item.images[0]) || "/uploads/8a82fc7bb76c.jpg";
        const size = item.size || item.selected_size || item.selectedSize || "M";
        const color =
          item.color ||
          (typeof item.selected_color === "string"
            ? item.selected_color
            : item.selectedColor?.name || "Obsidian Black");

        return {
          id: String(item.id || `item-${iIdx}`),
          productId: pId,
          product_id: pId,
          productName: pName,
          product_name: pName,
          name: pName,
          price,
          quantity: qty,
          subtotal: itemSubtotal,
          image: img,
          size,
          color,
        };
      })
    : [];

  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const shippingFee = Number(order.shipping_fee ?? order.shippingFee ?? 0);
  const tax = Number(order.tax) || 0;
  const discount = Number(order.discount) || 0;

  return {
    id: rawId,
    _id: rawId,
    orderNumber,
    order_number: orderNumber,
    customerId: order.customer_id || order.customerId || null,
    customerName,
    customer_name: customerName,
    customerEmail,
    customer_email: customerEmail,
    customerPhone,
    customer_phone: customerPhone,
    shippingAddress: shippingAddressStr,
    shipping_address: order.shipping_address || { street: shippingAddressStr },
    date: dateStr,
    createdAt: createdAtStr,
    created_at: createdAtStr,
    items,
    order_items: items,
    subtotal,
    shippingFee,
    shipping_fee: shippingFee,
    tax,
    discount,
    total,
    currency: order.currency || "USD",
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

let _memoryOrders = null;

const getOrdersStorage = () => {
  if (_memoryOrders && _memoryOrders.length > 0) return _memoryOrders;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _memoryOrders = parsed.map(normalizeOrder);
        return _memoryOrders;
      }
    }
  } catch {}
  return [];
};

const saveOrdersStorage = (orders) => {
  _memoryOrders = orders;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {}
};

export const orderService = {
  /**
   * Retrieves all customer orders directly from Supabase
   */
  getOrders: async () => {
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] getOrders note:", error.message);
      } else if (Array.isArray(data)) {
        const normalized = data.map(normalizeOrder);
        saveOrdersStorage(normalized);
        return normalized;
      }
      return getOrdersStorage();
    } catch (err) {
      console.warn("[Supabase] getOrders exception:", err.message);
      return getOrdersStorage();
    }
  },

  /**
   * Retrieves a single order by UUID or orderNumber
   */
  getOrderById: async (id) => {
    if (!id) return null;
    const cleanId = String(id).trim();

    try {
      await ensureAdminSession();
      const isUUID = cleanId.includes("-") && cleanId.length > 20;

      let query = supabase.from("orders").select("*, order_items(*)");
      if (isUUID) {
        query = query.eq("id", cleanId);
      } else {
        query = query.eq("order_number", cleanId);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return normalizeOrder(data);
      }
    } catch (err) {
      console.warn("[Supabase] getOrderById note:", err.message);
    }

    const cached = getOrdersStorage();
    const found = cached.find((o) => o.id === cleanId || o.orderNumber === cleanId);
    if (found) return found;

    throw new Error(`Order not found: ${cleanId}`);
  },

  /**
   * Retrieves all orders for a specific customer email
   */
  getOrdersByCustomer: async (customerEmail) => {
    if (!customerEmail) return [];
    const targetEmail = String(customerEmail).trim().toLowerCase();

    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .ilike("customer_email", targetEmail)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeOrder);
      }
    } catch (err) {
      console.warn("[Supabase] getOrdersByCustomer note:", err.message);
    }

    const cached = getOrdersStorage();
    return cached.filter((o) => (o.customerEmail || "").toLowerCase() === targetEmail);
  },

  /**
   * Creates a new customer order and its order_items directly in Supabase
   */
  createOrder: async (orderData) => {
    try {
      await ensureAdminSession();

      const orderNumber =
        orderData.order_number ||
        orderData.orderNumber ||
        `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const shippingAddressObj =
        typeof orderData.shipping_address === "object"
          ? orderData.shipping_address
          : typeof orderData.shippingAddress === "object"
          ? orderData.shippingAddress
          : { street: String(orderData.shippingAddress || "Phnom Penh") };

      const total = Number(orderData.total || 0);
      const subtotal = Number(orderData.subtotal ?? total);
      const shippingFee = Number(orderData.shipping_fee ?? orderData.shippingFee ?? 0);
      const tax = Number(orderData.tax || 0);
      const discount = Number(orderData.discount || 0);

      const orderRow = {
        order_number: orderNumber,
        customer_id: orderData.customerId || orderData.customer_id || null,
        customer_name: orderData.customerName || orderData.customer_name || "Patron Client",
        customer_email: orderData.customerEmail || orderData.customer_email || "patron@atelier.com",
        customer_phone: orderData.customerPhone || orderData.customer_phone || "+855 23 888 999",
        shipping_address: shippingAddressObj,
        subtotal,
        shipping_fee: shippingFee,
        tax,
        discount,
        total,
        currency: orderData.currency || "USD",
        payment_method: orderData.paymentMethod || orderData.payment_method || "Bakong KHQR",
        payment_status: orderData.paymentStatus || orderData.payment_status || "Paid",
        order_status: orderData.orderStatus || orderData.order_status || "Processing",
        notes: orderData.notes || "",
      };

      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert([orderRow])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Insert line items
      const rawItems = orderData.items || orderData.order_items || [];
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const itemRows = rawItems.map((item) => ({
          order_id: newOrder.id,
          product_id:
            item.productId && item.productId.includes("-")
              ? item.productId
              : item.product_id && item.product_id.includes("-")
              ? item.product_id
              : null,
          product_name: item.productName || item.product_name || item.name || "Haute Couture Piece",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image: item.image || (Array.isArray(item.images) && item.images[0]) || "/uploads/8a82fc7bb76c.jpg",
          size: item.size || item.selected_size || item.selectedSize || "M",
          color:
            item.color ||
            (typeof item.selected_color === "string"
              ? item.selected_color
              : item.selectedColor?.name || "Obsidian Black"),
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
        if (itemsErr) console.warn("[Supabase] order_items insert note:", itemsErr.message);
      }

      // Fetch freshly composed order with items
      const { data: fullOrder } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", newOrder.id)
        .single();

      const normalized = normalizeOrder(fullOrder || newOrder);
      const current = getOrdersStorage();
      saveOrdersStorage([normalized, ...current]);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return normalized;
    } catch (err) {
      console.error("Supabase createOrder failed:", err);
      throw err;
    }
  },

  /**
   * Updates an order status (Admin)
   */
  updateOrderStatus: async (id, newStatus) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();

      const { data, error } = await supabase
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", cleanId)
        .select("*, order_items(*)")
        .single();

      if (error) throw error;
      const normalized = normalizeOrder(data);

      const current = getOrdersStorage();
      const updated = current.map((o) => (o.id === cleanId ? normalized : o));
      saveOrdersStorage(updated);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return normalized;
    } catch (err) {
      console.error("Supabase updateOrderStatus failed:", err);
      throw err;
    }
  },

  /**
   * Updates an order's full fields (Admin)
   */
  updateOrder: async (id, updatedFields) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();

      const patch = {};
      if (updatedFields.orderStatus !== undefined) patch.order_status = updatedFields.orderStatus;
      if (updatedFields.order_status !== undefined) patch.order_status = updatedFields.order_status;
      if (updatedFields.paymentStatus !== undefined) patch.payment_status = updatedFields.paymentStatus;
      if (updatedFields.payment_status !== undefined) patch.payment_status = updatedFields.payment_status;
      if (updatedFields.notes !== undefined) patch.notes = updatedFields.notes;

      const { data, error } = await supabase
        .from("orders")
        .update(patch)
        .eq("id", cleanId)
        .select("*, order_items(*)")
        .single();

      if (error) throw error;
      const normalized = normalizeOrder(data);

      const current = getOrdersStorage();
      const updated = current.map((o) => (o.id === cleanId ? normalized : o));
      saveOrdersStorage(updated);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return normalized;
    } catch (err) {
      console.error("Supabase updateOrder failed:", err);
      throw err;
    }
  },

  /**
   * Deletes an order and its order_items (Admin)
   */
  deleteOrder: async (id) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();

      await supabase.from("order_items").delete().eq("order_id", cleanId);
      const { error } = await supabase.from("orders").delete().eq("id", cleanId);
      if (error) throw error;

      const current = getOrdersStorage();
      const filtered = current.filter((o) => o.id !== cleanId);
      saveOrdersStorage(filtered);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return true;
    } catch (err) {
      console.error("Supabase deleteOrder failed:", err);
      throw err;
    }
  },
};
