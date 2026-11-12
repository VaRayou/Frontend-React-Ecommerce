export const config = {
  regions: ["sin1"],
};

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://awcgcpoibputqrtuvrms.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_UGc-TpOB6-ONOpUNlqYFhA_XuyDiSbv";

const DEFAULT_BOT_TOKEN =
  process.env.VITE_TELEGRAM_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  "9048372338:AAHADX6G3fszbnyUTF58AEn0X2BSRbptx8A";

const STOREFRONT_URL = "https://frontend-react-ecommerce-inky.vercel.app";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getSupabaseAuthHeaders() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  try {
    const authRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "controller@atelier.com",
          password: "adminpass123",
        }),
      }
    );
    if (authRes.ok) {
      const data = await authRes.json();
      if (data?.access_token) {
        headers.Authorization = `Bearer ${data.access_token}`;
      }
    }
  } catch {
    // fallback to anon key
  }
  return headers;
}

async function tgApi(botToken, method, payload) {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return res.json();
}

async function buildStatsMessage(sbHeaders) {
  const [ordersRes, productsRes, paymentsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
      headers: sbHeaders,
    }),
    fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: sbHeaders,
    }),
    fetch(`${SUPABASE_URL}/rest/v1/payments?select=*`, {
      headers: sbHeaders,
    }),
  ]);

  const orders = ordersRes.ok ? await ordersRes.json() : [];
  const products = productsRes.ok ? await productsRes.json() : [];
  const payments = paymentsRes.ok ? await paymentsRes.json() : [];

  const activeOrders = (Array.isArray(orders) ? orders : []).filter(
    (o) => String(o.order_status || "").toLowerCase() !== "cancelled"
  );
  const grossRevenue = activeOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );
  const pendingOrders = activeOrders.filter((o) => {
    const s = String(o.order_status || "Pending").toLowerCase();
    return s === "pending" || s === "processing";
  }).length;

  const prodList = Array.isArray(products) ? products : [];
  const lowStockCount = prodList.filter(
    (p) => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= 5
  ).length;
  const outStockCount = prodList.filter(
    (p) =>
      Number(p.stock ?? 0) <= 0 ||
      String(p.status || "").toLowerCase() === "out of stock"
  ).length;

  const paidKhqrCount = (Array.isArray(payments) ? payments : []).filter(
    (p) => String(p.status || "").toUpperCase() === "PAID"
  ).length;

  const text =
    `📊 <b>ATELIER LIVE EXECUTIVE DASHBOARD</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 <b>Gross Revenue:</b> <b>$${grossRevenue.toFixed(2)} USD</b> (៛ ${Math.round(
      grossRevenue * 4100
    ).toLocaleString()} KHR)\n` +
    `🛍 <b>Total Orders:</b> <b>${orders.length}</b> (${pendingOrders} Processing)\n` +
    `✅ <b>Settled KHQR Transfers:</b> <b>${paidKhqrCount}</b>\n` +
    `📦 <b>Catalog SKUs:</b> <b>${prodList.length} pieces</b>\n` +
    `⚠️ <b>Low Stock (1–5):</b> <b>${lowStockCount} pieces</b>\n` +
    `🚨 <b>Out of Stock (0):</b> <b>${outStockCount} pieces</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;

  const reply_markup = {
    inline_keyboard: [
      [
        { text: "🛍 Recent Orders", callback_data: "cmd:orders" },
        { text: "⚠️ Low-Stock Radar", callback_data: "cmd:lowstock" },
      ],
      [
        {
          text: "🌐 Open Admin Dashboard",
          url: `${STOREFRONT_URL}/admin/dashboard`,
        },
      ],
    ],
  };

  return { text, reply_markup };
}

async function buildOrdersMessage(sbHeaders) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=5`,
    { headers: sbHeaders }
  );
  const orders = res.ok ? await res.json() : [];
  const list = Array.isArray(orders) ? orders : [];

  if (list.length === 0) {
    return {
      text: `🛍 <b>RECENT ORDERS</b>\n━━━━━━━━━━━━━━━━━━━━━━\nNo orders found in Supabase ledger.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Live Stats", callback_data: "cmd:stats" }],
        ],
      },
    };
  }

  const lines = list.map((o, idx) => {
    const num = o.order_number || o.id;
    const cust = escapeHtml(o.customer_name || "Patron");
    const total = Number(o.total || 0).toFixed(2);
    const status = escapeHtml(o.order_status || "Processing");
    const pay = escapeHtml(o.payment_status || "Paid");
    return `${idx + 1}. <code>${escapeHtml(num)}</code> — <b>$${total}</b>\n   👤 ${cust} • 📦 <b>${status}</b> (${pay})`;
  });

  const actionRows = list.slice(0, 3).map((o) => {
    const num = o.order_number || o.id;
    return [
      { text: `🚚 Ship ${num}`, callback_data: `ship:${num}` },
      { text: `✅ Deliver ${num}`, callback_data: `deliver:${num}` },
    ];
  });

  actionRows.push([
    { text: "🔄 Refresh Orders", callback_data: "cmd:orders" },
    { text: "🌐 Manage All", url: `${STOREFRONT_URL}/admin/orders` },
  ]);

  return {
    text:
      `🛍 <b>5 MOST RECENT ATELIER ORDERS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      lines.join("\n\n") +
      `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Tap a button below to update order status in real time:`,
    reply_markup: { inline_keyboard: actionRows },
  };
}

async function buildLowStockMessage(sbHeaders) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=*&order=stock.asc`,
    { headers: sbHeaders }
  );
  const products = res.ok ? await res.json() : [];
  const list = (Array.isArray(products) ? products : []).filter(
    (p) =>
      Number(p.stock ?? 0) <= 5 ||
      String(p.status || "").toLowerCase() === "out of stock"
  );

  if (list.length === 0) {
    return {
      text:
        `✅ <b>INVENTORY RADAR: ALL HEALTHY</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Every catalog piece currently has more than 5 units in stock!`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Live Stats", callback_data: "cmd:stats" }],
        ],
      },
    };
  }

  const lines = list.slice(0, 8).map((p) => {
    const s = Math.max(0, Number(p.stock ?? 0));
    const icon = s <= 0 ? "🔴" : "🟠";
    const sku = String(p.id || "").slice(-6).toUpperCase();
    return `${icon} <b>${escapeHtml(p.name)}</b> (<code>#${sku}</code>)\n   Stock: <b>${s} left</b> • Price: $${Number(
      p.price || 0
    ).toFixed(2)}`;
  });

  const restockButtons = list.slice(0, 4).map((p) => [
    {
      text: `➕ Restock +10: ${String(p.name || "Piece").slice(0, 18)}`,
      callback_data: `restock:${p.id}:10`,
    },
  ]);

  restockButtons.push([
    { text: "🔄 Refresh Radar", callback_data: "cmd:lowstock" },
    { text: "📦 Open Catalog", url: `${STOREFRONT_URL}/admin/products` },
  ]);

  return {
    text:
      `⚠️ <b>ATELIER LOW-STOCK &amp; OUT-OF-STOCK RADAR</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      lines.join("\n\n") +
      `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Tap any piece below to add <b>+10 units</b> in Supabase immediately:`,
    reply_markup: { inline_keyboard: restockButtons },
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Atelier Paris Two-Way Interactive Telegram Bot Webhook",
      commands: ["/start", "/stats", "/orders", "/lowstock", "/help"],
    });
  }

  const botToken = String(req.query?.token || DEFAULT_BOT_TOKEN).trim();
  const update =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  try {
    const sbHeaders = await getSupabaseAuthHeaders();

    // 1. Handle Inline Button Callback Queries
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = String(cb.data || "");

      if (data === "cmd:stats" && chatId) {
        await tgApi(botToken, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: "Loading live store statistics...",
        });
        const msg = await buildStatsMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: msg.text,
          parse_mode: "HTML",
          reply_markup: msg.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (data === "cmd:orders" && chatId) {
        await tgApi(botToken, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: "Fetching recent orders...",
        });
        const msg = await buildOrdersMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: msg.text,
          parse_mode: "HTML",
          reply_markup: msg.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (data === "cmd:lowstock" && chatId) {
        await tgApi(botToken, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: "Scanning inventory radar...",
        });
        const msg = await buildLowStockMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: msg.text,
          parse_mode: "HTML",
          reply_markup: msg.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      // Order Status Actions: ship:<orderNum> | deliver:<orderNum> | cancel:<orderNum>
      if (
        data.startsWith("ship:") ||
        data.startsWith("deliver:") ||
        data.startsWith("cancel:")
      ) {
        const [action, orderRef] = data.split(":");
        const newStatus =
          action === "ship"
            ? "Shipped"
            : action === "deliver"
            ? "Delivered"
            : "Cancelled";

        const isUuid = orderRef.includes("-") && orderRef.length > 20;
        const filterParam = isUuid
          ? `id=eq.${encodeURIComponent(orderRef)}`
          : `order_number=eq.${encodeURIComponent(orderRef)}`;

        const patchBody = {
          order_status: newStatus,
          ...(newStatus === "Delivered" ? { payment_status: "Paid" } : {}),
        };

        await fetch(`${SUPABASE_URL}/rest/v1/orders?${filterParam}`, {
          method: "PATCH",
          headers: { ...sbHeaders, Prefer: "return=representation" },
          body: JSON.stringify(patchBody),
        });

        await tgApi(botToken, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: `Order ${orderRef} marked ${newStatus}!`,
        });

        if (chatId) {
          const icon =
            newStatus === "Delivered"
              ? "✅"
              : newStatus === "Shipped"
              ? "🚚"
              : "❌";
          await tgApi(botToken, "sendMessage", {
            chat_id: chatId,
            parse_mode: "HTML",
            text:
              `${icon} <b>ORDER UPDATED VIA TELEGRAM BOT</b>\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `<b>Order Ref:</b> <code>${escapeHtml(orderRef)}</code>\n` +
              `<b>New Status:</b> <b>${newStatus.toUpperCase()}</b>\n` +
              `━━━━━━━━━━━━━━━━━━━━━━`,
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Product Quick Restock Action: restock:<productId>:<qty>
      if (data.startsWith("restock:")) {
        const parts = data.split(":");
        const prodId = parts[1];
        const addQty = Number(parts[2] || 10);

        const getRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(prodId)}&select=*`,
          { headers: sbHeaders }
        );
        const rows = getRes.ok ? await getRes.json() : [];
        const prod = Array.isArray(rows) ? rows[0] : null;

        if (prod) {
          const prevStock = Math.max(0, Number(prod.stock ?? 0));
          const nextStock = prevStock + addQty;
          await fetch(
            `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(prodId)}`,
            {
              method: "PATCH",
              headers: sbHeaders,
              body: JSON.stringify({
                stock: nextStock,
                status: "Active",
              }),
            }
          );

          await tgApi(botToken, "answerCallbackQuery", {
            callback_query_id: cb.id,
            text: `Restocked ${prod.name} → ${nextStock} units!`,
          });

          if (chatId) {
            await tgApi(botToken, "sendMessage", {
              chat_id: chatId,
              parse_mode: "HTML",
              text:
                `📦 <b>INVENTORY RESTOCKED VIA TELEGRAM</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `<b>Piece:</b> <b>${escapeHtml(prod.name)}</b>\n` +
                `<b>Stock Updated:</b> ${prevStock} → <b>${nextStock} units</b>\n` +
                `<b>Status:</b> <b>ACTIVE IN STOREFRONT</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━`,
            });
          }
        } else {
          await tgApi(botToken, "answerCallbackQuery", {
            callback_query_id: cb.id,
            text: "Product not found in catalog.",
          });
        }
        return res.status(200).json({ ok: true });
      }

      await tgApi(botToken, "answerCallbackQuery", { callback_query_id: cb.id });
      return res.status(200).json({ ok: true });
    }

    // 2. Handle Incoming Text Commands (/start, /help, /stats, /orders, /lowstock)
    const msg = update.message || update.channel_post;
    if (msg && msg.chat?.id) {
      const chatId = msg.chat.id;
      const text = String(msg.text || "").trim().toLowerCase();

      if (text.startsWith("/stats")) {
        const reply = await buildStatsMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith("/orders")) {
        const reply = await buildOrdersMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith("/lowstock") || text.startsWith("/stock")) {
        const reply = await buildLowStockMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith("/start") || text.startsWith("/help")) {
        const welcomeText =
          `✨ <b>ATELIER PARIS — EXECUTIVE CONTROLLER BOT</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Your Telegram chat (ID: <code>${chatId}</code>) is linked to the live <b>Atelier Studio</b> platform.\n\n` +
          `<b>Available Bot Commands:</b>\n` +
          `• /stats — Live revenue, order &amp; KHQR summary\n` +
          `• /orders — View &amp; update recent patron orders\n` +
          `• /lowstock — View &amp; restock low-inventory pieces\n` +
          `• /help — Show this interactive command menu`;

        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: welcomeText,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "📊 Live Store Stats", callback_data: "cmd:stats" },
                { text: "🛍 Recent Orders", callback_data: "cmd:orders" },
              ],
              [
                { text: "⚠️ Low-Stock Radar", callback_data: "cmd:lowstock" },
                {
                  text: "🌐 Admin Portal",
                  url: `${STOREFRONT_URL}/admin/dashboard`,
                },
              ],
            ],
          },
        });
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook Error]:", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
