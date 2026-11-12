import { supabase } from "./supabase";
import { productService, ensureAdminSession } from "./productService";
import { telegramService } from "./telegramService";

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
  } else if (
    order.shipping_address &&
    typeof order.shipping_address === "object"
  ) {
    const sa = order.shipping_address;
    customerName = customerName || sa.fullName || sa.name;
    customerEmail = customerEmail || sa.email;
    customerPhone = customerPhone || sa.phone;
    shippingAddressStr = [sa.street, sa.city, sa.postalCode, sa.country]
      .filter(Boolean)
      .join(", ");
  } else if (
    order.shippingAddress &&
    typeof order.shippingAddress === "object"
  ) {
    const sa = order.shippingAddress;
    customerName = customerName || sa.fullName || sa.name;
    customerEmail = customerEmail || sa.email;
    customerPhone = customerPhone || sa.phone;
    shippingAddressStr = [sa.street, sa.city, sa.postalCode, sa.country]
      .filter(Boolean)
      .join(", ");
  }

  customerName = customerName || "Patron Client";
  customerEmail = customerEmail || "patron@atelier.com";
  customerPhone = customerPhone || "";
  shippingAddressStr = shippingAddressStr || "Phnom Penh, Cambodia";

  // Date normalization
  const dateStr =
    order.date ||
    (order.created_at
      ? String(order.created_at).split("T")[0]
      : new Date().toISOString().split("T")[0]);
  const createdAtStr =
    order.created_at || order.createdAt || new Date().toISOString();

  // Statuses (Standard e-commerce alignment between order_status and payment_status)
  const orderStatus =
    order.order_status || order.orderStatus || order.status || "Processing";
  const paymentMethod =
    order.payment_method || order.paymentMethod || "Bakong KHQR";
  const rawPayStatus =
    order.payment_status ||
    order.paymentStatus ||
    (String(orderStatus).toLowerCase() === "pending"
      ? "Pending"
      : String(orderStatus).toLowerCase() === "cancelled"
        ? "Cancelled"
        : "Paid");
  const paymentStatus =
    String(orderStatus).toLowerCase() === "cancelled"
      ? "Cancelled"
      : String(orderStatus).toLowerCase() === "pending" &&
          String(paymentMethod).toLowerCase().includes("cash")
        ? "Pending"
        : rawPayStatus;

  // Order Items normalization
  const rawItems = order.order_items || order.items || [];
  const items = Array.isArray(rawItems)
    ? rawItems.map((item, iIdx) => {
        const pId = String(
          item.product_id || item.productId || item.id || `item-${iIdx}`,
        );
        const pName =
          item.product_name ||
          item.productName ||
          item.name ||
          "Haute Couture Piece";
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const itemSubtotal = Number(item.subtotal || price * qty);
        const img =
          item.image ||
          (Array.isArray(item.images) && item.images[0]) ||
          "/uploads/8a82fc7bb76c.jpg";
        const size =
          item.size || item.selected_size || item.selectedSize || "M";
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

/**
 * Standard E-Commerce Rule:
 * An order counts toward Paid / Settled Revenue ONLY when:
 * 1) Order status is NOT "Cancelled" and NOT "Pending"
 * 2) Payment status is explicitly "Paid" (or Order status is "Delivered")
 */
export const isOrderPaid = (order) => {
  if (!order) return false;
  const ordStatus = String(
    order.orderStatus || order.order_status || order.status || "",
  )
    .trim()
    .toLowerCase();
  const payStatus = String(order.paymentStatus || order.payment_status || "")
    .trim()
    .toLowerCase();

  if (
    ordStatus === "cancelled" ||
    ordStatus === "pending" ||
    payStatus === "cancelled" ||
    payStatus === "refunded" ||
    payStatus === "pending" ||
    payStatus === "unpaid" ||
    payStatus === "failed"
  ) {
    return false;
  }

  return payStatus === "paid" || ordStatus === "delivered";
};

/**
 * Computes standard e-commerce financial metrics from an array of orders:
 * - paidRevenue: Sum of totals for verified PAID (non-pending, non-cancelled) orders
 * - pendingAmount: Sum of totals for PENDING / UNPAID (non-cancelled) orders
 * - cancelledAmount: Sum of totals for CANCELLED orders
 */
export const calculateOrderFinancials = (orders = []) => {
  const list = Array.isArray(orders) ? orders : [];
  let paidRevenue = 0;
  let paidCount = 0;
  let pendingAmount = 0;
  let pendingCount = 0;
  let cancelledAmount = 0;
  let cancelledCount = 0;
  let activeFulfillmentCount = 0;

  for (const o of list) {
    const amt = Number(o?.total || 0);
    const ordStatus = String(
      o?.orderStatus || o?.order_status || o?.status || "Pending",
    )
      .trim()
      .toLowerCase();

    if (ordStatus === "cancelled") {
      cancelledAmount += amt;
      cancelledCount += 1;
      continue;
    }

    if (ordStatus === "processing" || ordStatus === "shipped") {
      activeFulfillmentCount += 1;
    }

    if (isOrderPaid(o)) {
      paidRevenue += amt;
      paidCount += 1;
    } else {
      pendingAmount += amt;
      pendingCount += 1;
    }
  }

  return {
    paidRevenue: Number(paidRevenue.toFixed(2)),
    paidCount,
    pendingAmount: Number(pendingAmount.toFixed(2)),
    pendingCount,
    cancelledAmount: Number(cancelledAmount.toFixed(2)),
    cancelledCount,
    activeFulfillmentCount,
    totalOrders: list.length,
  };
};

let _memoryOrders = null;
const DELETED_ORDERS_KEY = "atelier_deleted_order_ids_v1";

const getDeletedOrderIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {}
  return new Set();
};

const addDeletedOrderIds = (ids) => {
  const current = getDeletedOrderIds();
  (Array.isArray(ids) ? ids : [ids]).forEach((id) => {
    if (id) current.add(String(id).trim());
  });
  try {
    localStorage.setItem(
      DELETED_ORDERS_KEY,
      JSON.stringify(Array.from(current)),
    );
  } catch {}
};

const getOrdersStorage = () => {
  const deletedIds = getDeletedOrderIds();
  const isDeleted = (o) =>
    !o ||
    o.notes === "DELETED" ||
    deletedIds.has(String(o.id)) ||
    deletedIds.has(String(o.orderNumber)) ||
    deletedIds.has(String(o.order_number));

  if (_memoryOrders && Array.isArray(_memoryOrders)) {
    return _memoryOrders.filter((o) => !isDeleted(o));
  }
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _memoryOrders = parsed.map(normalizeOrder).filter((o) => !isDeleted(o));
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
   * Synchronously returns cached Supabase orders for instant 0ms render
   */
  getCachedOrders: () => {
    return getOrdersStorage();
  },

  /**
   * Retrieves all customer orders directly from Supabase
   */
  getOrders: async () => {
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .neq("notes", "DELETED")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] getOrders note:", error.message);
      } else if (Array.isArray(data)) {
        const deletedIds = getDeletedOrderIds();
        const normalized = data
          .map(normalizeOrder)
          .filter(
            (o) =>
              o &&
              o.notes !== "DELETED" &&
              !deletedIds.has(String(o.id)) &&
              !deletedIds.has(String(o.orderNumber)),
          );
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
    const found = cached.find(
      (o) => o.id === cleanId || o.orderNumber === cleanId,
    );
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
    return cached.filter(
      (o) => (o.customerEmail || "").toLowerCase() === targetEmail,
    );
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

      let total = Number(orderData.total || 0);
      let subtotal = Number(orderData.subtotal ?? total);
      const shippingFee = Number(
        orderData.shipping_fee ?? orderData.shippingFee ?? 0,
      );
      const tax = Number(orderData.tax || 0);
      const discount = Number(orderData.discount || 0);

      // --- SECURITY LAYER: Anti-Tamper Price & Stock Revalidation ---
      const rawItems = orderData.items || orderData.order_items || [];
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const itemIds = rawItems
          .map((i) => i.productId || i.product_id || i.id)
          .filter(Boolean);

        if (itemIds.length > 0) {
          try {
            const { data: dbProducts } = await supabase
              .from("products")
              .select("id, price, stock, name")
              .in("id", itemIds);

            if (Array.isArray(dbProducts) && dbProducts.length > 0) {
              const priceMap = new Map(
                dbProducts.map((p) => [String(p.id), Number(p.price || 0)]),
              );

              let computedSubtotal = 0;
              for (const item of rawItems) {
                const id = String(
                  item.productId || item.product_id || item.id || "",
                );
                const truePrice = priceMap.get(id);
                if (truePrice !== undefined && truePrice > 0) {
                  // Protect against client-side price tampering
                  item.price = truePrice;
                  computedSubtotal += truePrice * (Number(item.quantity) || 1);
                } else {
                  computedSubtotal +=
                    Number(item.price || 0) * (Number(item.quantity) || 1);
                }
              }

              // Compute verified expected total
              const expectedTotal = Math.max(
                0,
                computedSubtotal + shippingFee + tax - discount,
              );
              // If discrepancy > $0.50 (tampering or stale price), enforce verified database price
              if (Math.abs(expectedTotal - total) > 0.5) {
                console.warn(
                  `[Security Verification] Client total ${total} superseded by verified database total ${expectedTotal}`,
                );
                subtotal = computedSubtotal;
                total = expectedTotal;
              }
            }
          } catch (secErr) {
            console.warn(
              "[Security Verification] Price validation notice:",
              secErr.message,
            );
          }
        }
      }

      const orderRow = {
        order_number: orderNumber,
        customer_id: orderData.customerId || orderData.customer_id || null,
        customer_name:
          orderData.customerName || orderData.customer_name || "Patron Client",
        customer_email:
          orderData.customerEmail ||
          orderData.customer_email ||
          "patron@atelier.com",
        customer_phone:
          orderData.customerPhone ||
          orderData.customer_phone ||
          "+855 23 888 999",
        shipping_address: shippingAddressObj,
        subtotal,
        shipping_fee: shippingFee,
        tax,
        discount,
        total,
        currency: orderData.currency || "USD",
        payment_method:
          orderData.paymentMethod || orderData.payment_method || "Bakong KHQR",
        payment_status:
          orderData.paymentStatus || orderData.payment_status || "Paid",
        order_status:
          orderData.orderStatus || orderData.order_status || "Processing",
        notes: orderData.notes || "",
      };

      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert([orderRow])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Insert line items
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const itemRows = rawItems.map((item) => ({
          order_id: newOrder.id,
          product_id:
            item.productId && item.productId.includes("-")
              ? item.productId
              : item.product_id && item.product_id.includes("-")
                ? item.product_id
                : null,
          product_name:
            item.productName ||
            item.product_name ||
            item.name ||
            "Haute Couture Piece",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image:
            item.image ||
            (Array.isArray(item.images) && item.images[0]) ||
            "/uploads/8a82fc7bb76c.jpg",
          size: item.size || item.selected_size || item.selectedSize || "M",
          color:
            item.color ||
            (typeof item.selected_color === "string"
              ? item.selected_color
              : item.selectedColor?.name || "Obsidian Black"),
        }));

        const { error: itemsErr } = await supabase
          .from("order_items")
          .insert(itemRows);
        if (itemsErr)
          console.warn("[Supabase] order_items insert note:", itemsErr.message);

        // Decrement catalog stock for each ordered item and dispatch Telegram Low-Stock Alert if <= 5
        await Promise.allSettled(
          rawItems.map(async (item) => {
            const rawProdId = String(
              item.productId || item.product_id || item.id || "",
            ).trim();
            if (!rawProdId || !rawProdId.includes("-")) return;

            const orderedQty = Math.max(1, Number(item.quantity || 1));
            const { data: prodRow } = await supabase
              .from("products")
              .select("id, name, stock, brand, price")
              .eq("id", rawProdId)
              .maybeSingle();

            if (!prodRow) return;
            const prevStock = Math.max(0, Number(prodRow.stock ?? 10));
            const nextStock = Math.max(0, prevStock - orderedQty);
            const nextStatus = nextStock <= 0 ? "Out of Stock" : "Active";

            await supabase
              .from("products")
              .update({ stock: nextStock, status: nextStatus })
              .eq("id", rawProdId);

            if (nextStock <= 5) {
              await telegramService.sendLowStockAlert({
                productName:
                  prodRow.name ||
                  item.productName ||
                  item.name ||
                  "Atelier Piece",
                remainingStock: nextStock,
                previousStock: prevStock,
                productId: rawProdId,
                brand: prodRow.brand || "ATELIER",
                price: Number(prodRow.price ?? item.price ?? 0),
                triggerSource: `Order #${orderNumber} Purchase (${orderedQty} sold)`,
              });
            }
          }),
        );
        window.dispatchEvent(new Event("atelier_products_updated"));
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

      // Dispatch real-time Telegram Bot alert asynchronously
      telegramService
        .sendOrderAlert({
          ...normalized,
          transactionId: orderData.transactionId || "",
        })
        .catch(() => {});

      return normalized;
    } catch (err) {
      console.error("Supabase createOrder failed:", err);
      throw err;
    }
  },

  /**
   * Updates an order status by UUID id or order_number
   */
  updateOrderStatus: async (id, newStatus) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();
      const isUUID = cleanId.includes("-") && cleanId.length > 20;

      const sLower = String(newStatus || "").toLowerCase();
      const autoPaymentPatch =
        sLower === "delivered"
          ? { payment_status: "Paid" }
          : sLower === "pending"
            ? { payment_status: "Pending" }
            : sLower === "cancelled"
              ? { payment_status: "Cancelled" }
              : {};

      let query = supabase.from("orders").update({
        order_status: newStatus,
        ...autoPaymentPatch,
      });

      if (isUUID) {
        query = query.eq("id", cleanId);
      } else {
        query = query.eq("order_number", cleanId);
      }

      const { data, error } = await query.select("*, order_items(*)").single();

      if (error) throw error;
      const normalized = normalizeOrder(data);

      // Automatic Inventory Restock on Order Cancellation
      if (sLower === "cancelled" && Array.isArray(data?.order_items)) {
        await Promise.allSettled(
          data.order_items.map(async (item) => {
            const rawProdId = String(
              item.product_id || item.productId || "",
            ).trim();
            if (!rawProdId || !rawProdId.includes("-")) return;
            const returnQty = Math.max(1, Number(item.quantity || 1));

            const { data: prodRow } = await supabase
              .from("products")
              .select("id, stock, name")
              .eq("id", rawProdId)
              .maybeSingle();

            if (prodRow) {
              const currentStock = Math.max(0, Number(prodRow.stock || 0));
              const restoredStock = currentStock + returnQty;
              await supabase
                .from("products")
                .update({ stock: restoredStock, status: "Active" })
                .eq("id", rawProdId);
            }
          }),
        );
        // Refresh cached catalog immediately
        productService.getProducts().catch(() => {});
      }

      const current = getOrdersStorage();
      const updated = current.map((o) =>
        o.id === cleanId || o.orderNumber === cleanId ? normalized : o,
      );
      saveOrdersStorage(updated);
      window.dispatchEvent(new Event("atelier_order_updated"));

      // Dispatch Telegram Bot status update alert asynchronously
      telegramService
        .sendOrderStatusAlert(
          normalized.orderNumber,
          newStatus,
          normalized.customerName,
        )
        .catch(() => {});

      return normalized;
    } catch (err) {
      console.error("Supabase updateOrderStatus failed:", err);
      throw err;
    }
  },

  /**
   * Updates an order's payment status ("Paid", "Pending", "Refunded", "Cancelled")
   */
  updatePaymentStatus: async (id, newPaymentStatus) => {
    try {
      await ensureAdminSession();
      const cleanId = String(id).trim();
      const isUUID = cleanId.includes("-") && cleanId.length > 20;

      let query = supabase.from("orders").update({
        payment_status: newPaymentStatus,
      });

      if (isUUID) {
        query = query.eq("id", cleanId);
      } else {
        query = query.eq("order_number", cleanId);
      }

      const { data, error } = await query.select("*, order_items(*)").single();
      if (error) throw error;
      const normalized = normalizeOrder(data);

      const current = getOrdersStorage();
      const updated = current.map((o) =>
        o.id === cleanId || o.orderNumber === cleanId ? normalized : o,
      );
      saveOrdersStorage(updated);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return normalized;
    } catch (err) {
      console.error("Supabase updatePaymentStatus failed:", err);
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
      if (updatedFields.orderStatus !== undefined)
        patch.order_status = updatedFields.orderStatus;
      if (updatedFields.order_status !== undefined)
        patch.order_status = updatedFields.order_status;
      if (updatedFields.paymentStatus !== undefined)
        patch.payment_status = updatedFields.paymentStatus;
      if (updatedFields.payment_status !== undefined)
        patch.payment_status = updatedFields.payment_status;
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
      addDeletedOrderIds([cleanId]);

      // 1. Soft-delete in Supabase by marking status Cancelled & notes DELETED
      const isUUID = cleanId.includes("-") && cleanId.length > 20;
      let query = supabase.from("orders").update({
        order_status: "Cancelled",
        notes: "DELETED",
      });
      if (isUUID) {
        query = query.eq("id", cleanId);
      } else {
        query = query.eq("order_number", cleanId);
      }
      await query;

      // 2. Also attempt hard delete
      try {
        await supabase.from("order_items").delete().eq("order_id", cleanId);
        await supabase
          .from("orders")
          .delete()
          .eq(isUUID ? "id" : "order_number", cleanId);
      } catch {}

      const current = getOrdersStorage();
      const filtered = current.filter(
        (o) => o.id !== cleanId && o.orderNumber !== cleanId,
      );
      saveOrdersStorage(filtered);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return true;
    } catch (err) {
      console.warn("deleteOrder notice:", err);
      addDeletedOrderIds([id]);
      const current = getOrdersStorage();
      const filtered = current.filter(
        (o) => o.id !== id && o.orderNumber !== id,
      );
      saveOrdersStorage(filtered);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return true;
    }
  },

  /**
   * Permanently clears all order records for a fresh start (Admin)
   */
  clearAllOrders: async () => {
    try {
      await ensureAdminSession();
      const current = getOrdersStorage();
      const ids = current.map((o) => o.id).filter(Boolean);
      const nums = current.map((o) => o.orderNumber).filter(Boolean);
      addDeletedOrderIds([...ids, ...nums]);

      // 1. Update all non-deleted orders to Cancelled with notes = 'DELETED'
      await supabase
        .from("orders")
        .update({ order_status: "Cancelled", notes: "DELETED" })
        .neq("notes", "DELETED");

      // 2. Also attempt hard delete in Supabase
      try {
        await supabase
          .from("order_items")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase
          .from("orders")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
      } catch {}

      saveOrdersStorage([]);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return true;
    } catch (err) {
      console.warn("clearAllOrders note:", err);
      saveOrdersStorage([]);
      window.dispatchEvent(new Event("atelier_order_updated"));
      return true;
    }
  },
};
