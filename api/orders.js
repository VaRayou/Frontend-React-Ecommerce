export const config = {
  regions: ["sin1"],
};

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://awcgcpoibputqrtuvrms.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_UGc-TpOB6-ONOpUNlqYFhA_XuyDiSbv";

// Admin credentials for secure server-side database access
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "controller@atelier.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass123";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.app") ||
      host === "frontend-react-ecommerce-inky.vercel.app"
    ) {
      return true;
    }
  } catch {}
  return false;
}

let cachedAdminToken = null;
let tokenExpiresAt = 0;

async function getAdminToken() {
  const now = Date.now();
  if (cachedAdminToken && tokenExpiresAt > now + 60000) {
    return cachedAdminToken;
  }

  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (authRes.ok) {
      const data = await authRes.json();
      if (data?.access_token) {
        cachedAdminToken = data.access_token;
        tokenExpiresAt = now + (data.expires_in ? data.expires_in * 1000 : 3600000);
        return cachedAdminToken;
      }
    }
  } catch (e) {
    console.warn("[api/orders] Admin token acquisition error:", e);
  }

  return SUPABASE_ANON_KEY;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://frontend-react-ecommerce-inky.vercel.app"
    );
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const token = await getAdminToken();
  const dbHeaders = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // -----------------------------------------------------------------
  // GET /api/orders — Fetch orders with line items (Admin & Fallback)
  // -----------------------------------------------------------------
  if (req.method === "GET") {
    try {
      const { order_number, id, limit = 100 } = req.query || {};

      let queryUrl = `${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=${limit}`;
      if (order_number) {
        queryUrl += `&order_number=eq.${encodeURIComponent(order_number)}`;
      } else if (id) {
        queryUrl += `&id=eq.${encodeURIComponent(id)}`;
      } else {
        queryUrl += `&notes=neq.DELETED`;
      }

      const ordersRes = await fetch(queryUrl, { headers: dbHeaders });
      if (!ordersRes.ok) {
        const errJson = await ordersRes.json().catch(() => ({}));
        return res.status(ordersRes.status).json({
          success: false,
          error: errJson.message || "Failed to fetch orders from database",
        });
      }

      const orders = await ordersRes.json();
      return res.status(200).json({
        success: true,
        orders,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error fetching orders",
      });
    }
  }

  // -----------------------------------------------------------------
  // POST /api/orders — Create Order & Order Items with Admin Clearance
  // -----------------------------------------------------------------
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const orderNumber =
        String(body.orderNumber || body.order_number || "").trim() ||
        `ATL-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const customerName = body.customerName || body.customer_name || "Patron Client";
      const customerEmail = body.customerEmail || body.customer_email || "patron@atelier.com";
      const customerPhone = body.customerPhone || body.customer_phone || "+855 23 888 999";
      
      const shippingAddress =
        typeof body.shippingAddress === "object"
          ? body.shippingAddress
          : typeof body.shipping_address === "object"
          ? body.shipping_address
          : { street: String(body.shippingAddress || body.shipping_address || "Phnom Penh, Cambodia") };

      const subtotal = Number(body.subtotal || body.total || 0);
      const shippingFee = Number(body.shippingFee ?? body.shipping_fee ?? 0);
      const tax = Number(body.tax || 0);
      const discount = Number(body.discount || 0);
      const total = Number(body.total || (subtotal + shippingFee + tax - discount));
      const currency = body.currency || "USD";
      const paymentMethod = body.paymentMethod || body.payment_method || "Bakong KHQR";
      const paymentStatus = body.paymentStatus || body.payment_status || "Paid";
      const orderStatus = body.orderStatus || body.order_status || "Processing";
      const notes = body.notes || "";

      const rawItems = Array.isArray(body.items) ? body.items : (Array.isArray(body.order_items) ? body.order_items : []);

      // 1. Insert order record using admin clearance
      const orderPayload = {
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        subtotal,
        shipping_fee: shippingFee,
        tax,
        discount,
        total,
        currency,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_status: orderStatus,
        notes,
      };

      const orderInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: dbHeaders,
        body: JSON.stringify(orderPayload),
      });

      if (!orderInsertRes.ok) {
        const orderErr = await orderInsertRes.json().catch(() => ({}));
        console.error("[api/orders] Order insert failed:", orderErr);
        return res.status(orderInsertRes.status).json({
          success: false,
          error: orderErr.message || "Database order insertion failed",
          details: orderErr,
        });
      }

      const insertedOrders = await orderInsertRes.json();
      const newOrder = Array.isArray(insertedOrders) ? insertedOrders[0] : insertedOrders;

      // 2. Insert order items if present
      let insertedItems = [];
      if (rawItems.length > 0 && newOrder?.id) {
        const itemRows = rawItems.map((item) => ({
          order_id: newOrder.id,
          product_id:
            item.productId && String(item.productId).includes("-")
              ? item.productId
              : item.product_id && String(item.product_id).includes("-")
              ? item.product_id
              : null,
          product_name:
            item.productName || item.product_name || item.name || "Haute Couture Piece",
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

        const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify(itemRows),
        });

        if (itemsRes.ok) {
          insertedItems = await itemsRes.json().catch(() => itemRows);
        }

        // 3. Update inventory stock for each ordered product
        for (const item of rawItems) {
          const rawId = item.productId || item.product_id || item.id;
          if (rawId && String(rawId).includes("-")) {
            try {
              const pRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${rawId}&select=id,stock`, {
                headers: dbHeaders,
              });
              if (pRes.ok) {
                const prods = await pRes.json();
                if (prods?.[0]) {
                  const currentStock = Math.max(0, Number(prods[0].stock ?? 10));
                  const qty = Math.max(1, Number(item.quantity || 1));
                  const newStock = Math.max(0, currentStock - qty);
                  await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${rawId}`, {
                    method: "PATCH",
                    headers: dbHeaders,
                    body: JSON.stringify({
                      stock: newStock,
                      status: newStock <= 0 ? "Out of Stock" : "Active",
                    }),
                  });
                }
              }
            } catch (e) {
              console.warn("[api/orders] Stock update note:", e);
            }
          }
        }
      }

      // 4. If matching payment exists, update payment status to PAID
      if (paymentMethod.includes("Bakong") || paymentMethod.includes("QR")) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/payments?order_number=eq.${encodeURIComponent(orderNumber)}`, {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({
              status: "PAID",
              paid_at: new Date().toISOString(),
              transaction_id: body.transactionId || `NBC-${Date.now()}`,
            }),
          });
        } catch (e) {
          console.warn("[api/orders] Payment link note:", e);
        }
      }

      const fullOrder = {
        ...newOrder,
        order_items: insertedItems,
        items: insertedItems,
      };

      return res.status(200).json({
        success: true,
        order: fullOrder,
        order_number: orderNumber,
        message: "Order placed and persisted successfully into Supabase Cloud database",
      });
    } catch (err) {
      console.error("[api/orders] POST handler error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to process order",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}

