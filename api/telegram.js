import crypto from "crypto";

export const config = {
  regions: ["sin1"],
};

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://awcgcpoibputqrtuvrms.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_UGc-TpOB6-ONOpUNlqYFhA_XuyDiSbv";

const BOT_TOKEN = (
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.VITE_TELEGRAM_BOT_TOKEN ||
  ""
).trim();

const DEFAULT_CHAT_ID = String(
  process.env.TELEGRAM_CHAT_ID ||
  process.env.VITE_TELEGRAM_CHAT_ID ||
  "1389246582"
).trim();

const AUTHORIZED_CHAT_IDS = new Set(
  [
    DEFAULT_CHAT_ID,
    ...(process.env.TELEGRAM_AUTHORIZED_CHATS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ].filter(Boolean)
);

// Strict CORS allowlist
const ALLOWED_ORIGINS = new Set([
  "https://youngsteav.site",
  "https://www.youngsteav.site",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    : []),
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const originNormalized = `${parsed.protocol}//${parsed.host}`;
    return ALLOWED_ORIGINS.has(originNormalized);
  } catch {
    return false;
  }
}

const STOREFRONT_URL = (
  process.env.VITE_STOREFRONT_URL || "https://www.youngsteav.site"
).replace(/^https:\/\/youngsteav\.site/i, "https://www.youngsteav.site");

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getSupabaseAuthHeaders() {
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function tgApi(botToken, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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

  const allOrders = (Array.isArray(orders) ? orders : []).filter(
    (o) => o && o.notes !== "DELETED"
  );

  const isPaidOrder = (o) => {
    const ordSt = String(o?.order_status || o?.orderStatus || o?.status || "Pending")
      .trim()
      .toLowerCase();
    const paySt = String(o?.payment_status || o?.paymentStatus || "Paid")
      .trim()
      .toLowerCase();
    if (
      ordSt === "cancelled" ||
      ordSt === "pending" ||
      paySt === "cancelled" ||
      paySt === "refunded" ||
      paySt === "pending" ||
      paySt === "unpaid" ||
      paySt === "failed"
    ) {
      return false;
    }
    return paySt === "paid" || ordSt === "delivered";
  };

  const paidOrders = allOrders.filter(isPaidOrder);
  const pendingUnpaidOrders = allOrders.filter((o) => {
    const ordSt = String(o?.order_status || o?.orderStatus || o?.status || "Pending")
      .trim()
      .toLowerCase();
    return ordSt !== "cancelled" && !isPaidOrder(o);
  });
  const activeFulfillmentOrders = allOrders.filter((o) => {
    const ordSt = String(o?.order_status || o?.orderStatus || o?.status || "")
      .trim()
      .toLowerCase();
    return ordSt === "processing" || ordSt === "shipped";
  });

  const paidRevenue = paidOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0,
  );
  const pendingVolume = pendingUnpaidOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0,
  );

  const prodList = Array.isArray(products) ? products : [];
  const lowStockCount = prodList.filter(
    (p) => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= 5,
  ).length;
  const outStockCount = prodList.filter(
    (p) =>
      Number(p.stock ?? 0) <= 0 ||
      String(p.status || "").toLowerCase() === "out of stock",
  ).length;

  const paidKhqrCount =
    (Array.isArray(payments) ? payments : []).filter(
      (p) => String(p.status || "").toUpperCase() === "PAID",
    ).length ||
    paidOrders.filter((o) => {
      const pm = String(o?.payment_method || o?.paymentMethod || "").toLowerCase();
      return pm.includes("khqr") || pm.includes("qr") || pm.includes("bakong");
    }).length;

  const text =
    `📊 <b>STEAV LIVE EXECUTIVE DASHBOARD</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 <b>Paid Revenue (Settled):</b> <b>$${paidRevenue.toFixed(2)} USD</b> (៛ ${Math.round(
      paidRevenue * 4100,
    ).toLocaleString()} KHR)\n` +
    `⏳ <b>Pending (Unpaid):</b> $${pendingVolume.toFixed(2)} USD (${pendingUnpaidOrders.length} excluded)\n` +
    `🛍 <b>Total Orders:</b> <b>${allOrders.length}</b> (${paidOrders.length} Paid)\n` +
    `🚚 <b>In Fulfillment:</b> <b>${activeFulfillmentOrders.length} Active</b>\n` +
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
    { headers: sbHeaders },
  );
  const orders = res.ok ? await res.json() : [];
  const list = (Array.isArray(orders) ? orders : []).filter(
    (o) => o && o.notes !== "DELETED"
  );

  if (list.length === 0) {
    return {
      text: `🛍 <b>RECENT STEAV ORDERS</b>\n━━━━━━━━━━━━━━━━━━━━━━\nNo orders found in Supabase ledger.`,
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
      { text: `🔍 Track ${num}`, callback_data: `track:${num}` },
      { text: `🚚 Ship`, callback_data: `ship:${num}` },
      { text: `✅ Deliver`, callback_data: `deliver:${num}` },
    ];
  });

  actionRows.push([
    { text: "🔄 Refresh Orders", callback_data: "cmd:orders" },
    { text: "🌐 Manage All", url: `${STOREFRONT_URL}/admin/orders` },
  ]);

  return {
    text:
      `🛍 <b>5 MOST RECENT STEAV ORDERS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      lines.join("\n\n") +
      `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Tap a button below to track or update order status in real time:`,
    reply_markup: { inline_keyboard: actionRows },
  };
}

async function buildTrackOrderMessage(sbHeaders, rawQuery) {
  const cleanQuery = String(rawQuery || "").trim();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=50`,
    { headers: sbHeaders },
  );
  const orders = res.ok ? await res.json() : [];
  const list = (Array.isArray(orders) ? orders : []).filter(
    (o) => o && o.notes !== "DELETED"
  );

  if (!cleanQuery) {
    const recentButtons = list.slice(0, 4).map((o) => {
      const num = o.order_number || o.id;
      const status = o.order_status || "Processing";
      return [
        {
          text: `🔍 Track ${num} (${status})`,
          callback_data: `track:${num}`,
        },
      ];
    });
    recentButtons.push([
      {
        text: "🌐 Open Web Order Tracker",
        url: `${STOREFRONT_URL}/track`,
      },
    ]);

    return {
      text:
        `🚚 <b>STEAV LIVE ORDER TRACKER</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Send <code>/track ORDER_ID</code> (e.g. <code>/track ORD-1001</code>), customer email, or phone number to inspect real-time dispatch milestones.\n\n` +
        `Or tap one of the recent orders below:`,
      reply_markup: { inline_keyboard: recentButtons },
    };
  }

  const qLower = cleanQuery.toLowerCase();
  const match = list.find((o) => {
    const ordNum = String(o.order_number || o.id || "").toLowerCase();
    const email = String(o.customer_email || "").toLowerCase();
    const phone = String(o.customer_phone || "").toLowerCase();
    return (
      ordNum === qLower ||
      ordNum.includes(qLower) ||
      email === qLower ||
      (qLower.length >= 5 && phone.includes(qLower))
    );
  });

  if (!match) {
    return {
      text:
        `⚠️ <b>ORDER NOT FOUND</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `No dispatch record found matching <code>${escapeHtml(cleanQuery)}</code>.\n` +
        `Try <code>/orders</code> to view recent order references.`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🛍 View Recent Orders", callback_data: "cmd:orders" },
            { text: "🌐 Web Tracker", url: `${STOREFRONT_URL}/track` },
          ],
        ],
      },
    };
  }

  const ordNum = match.order_number || match.id;
  const status = String(match.order_status || "Processing");
  const sLower = status.toLowerCase();
  const isCancelled = sLower === "cancelled";
  const step =
    sLower === "delivered"
      ? 5
      : sLower === "out for delivery"
        ? 4
        : sLower === "shipped" || sLower === "in transit"
          ? 4
          : sLower === "processing" || sLower === "paid"
            ? 3
            : 2;

  const timelineText = isCancelled
    ? `❌ <b>ORDER CANCELLED</b> — Dispatch halted`
    : `${step >= 1 ? "🟢" : "⚪"} 1. Order Placed\n` +
      `${step >= 2 ? "🟢" : "⚪"} 2. Bakong KHQR Verified\n` +
      `${step >= 3 ? "🟢" : "⚪"} 3. Quality Packaging\n` +
      `${step >= 4 ? "🚚" : "⚪"} 4. In Transit with Courier\n` +
      `${step >= 5 ? "✅" : "⚪"} 5. Delivered to Patron`;

  const items = Array.isArray(match.order_items) ? match.order_items : [];
  const itemLines = items.slice(0, 6).map((it) => {
    const name = escapeHtml(it.product_name || it.name || "STEAV Piece");
    const qty = Number(it.quantity || 1);
    const sz = it.size ? ` [${escapeHtml(it.size)}]` : "";
    return `  • ${name}${sz} ×${qty} — $${(Number(it.price || 0) * qty).toFixed(2)}`;
  });

  const addrObj = match.shipping_address;
  const addressStr =
    typeof addrObj === "string"
      ? addrObj
      : addrObj && typeof addrObj === "object"
        ? [addrObj.street, addrObj.city, addrObj.country]
            .filter(Boolean)
            .join(", ")
        : "Phnom Penh, Cambodia";

  const totalUsd = Number(match.total || 0);
  const totalKhr = Math.round(totalUsd * 4100);
  const awb = `AWB-882-${String(ordNum).replace(/\D/g, "") || "90218"}`;

  const text =
    `🚚 <b>LIVE DISPATCH TRACKING: <code>${escapeHtml(ordNum)}</code></b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Current Status:</b> <b>${escapeHtml(status.toUpperCase())}</b>\n` +
    `<b>Courier AWB:</b> <code>${escapeHtml(awb)}</code>\n` +
    `<b>Patron:</b> ${escapeHtml(match.customer_name || "Patron Client")}\n` +
    `<b>Destination:</b> ${escapeHtml(addressStr || "Phnom Penh, Cambodia")}\n` +
    `<b>Payment:</b> ${escapeHtml(match.payment_method || "Bakong KHQR")} (<b>${escapeHtml(
      match.payment_status || "Paid",
    )}</b>)\n` +
    `<b>Total:</b> <b>$${totalUsd.toFixed(2)} USD</b> (៛ ${totalKhr.toLocaleString()} KHR)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Dispatch Milestones:</b>\n${timelineText}\n` +
    (itemLines.length > 0
      ? `━━━━━━━━━━━━━━━━━━━━━━\n<b>Package Contents (${items.length}):</b>\n${itemLines.join("\n")}`
      : "");

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🚚 Mark Shipped", callback_data: `ship:${ordNum}` },
          { text: "✅ Mark Delivered", callback_data: `deliver:${ordNum}` },
        ],
        [
          { text: "🔄 Refresh Status", callback_data: `track:${ordNum}` },
          {
            text: "🌐 Open Web Tracker",
            url: `${STOREFRONT_URL}/track/${encodeURIComponent(ordNum)}`,
          },
        ],
      ],
    },
  };
}

async function buildLowStockMessage(sbHeaders) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=*&order=stock.asc`,
    { headers: sbHeaders },
  );
  const products = res.ok ? await res.json() : [];
  const list = (Array.isArray(products) ? products : []).filter(
    (p) =>
      Number(p.stock ?? 0) <= 5 ||
      String(p.status || "").toLowerCase() === "out of stock",
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
    const sku = String(p.id || "")
      .slice(-6)
      .toUpperCase();
    return `${icon} <b>${escapeHtml(p.name)}</b> (<code>#${sku}</code>)\n   Stock: <b>${s} left</b> • Price: $${Number(
      p.price || 0,
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
      `⚠️ <b>STEAV LOW-STOCK &amp; OUT-OF-STOCK RADAR</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      lines.join("\n\n") +
      `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Tap any piece below to add <b>+10 units</b> in Supabase immediately:`,
    reply_markup: { inline_keyboard: restockButtons },
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Telegram-Bot-Api-Secret-Token, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const actionToken = String(body.bot_token || "").trim();
  const botToken = actionToken || BOT_TOKEN;

  // 1. Admin Settings & Storefront Proxy Actions (avoids CSP blocks on api.telegram.org)
  if (body.action === "verifyBotToken") {
    if (!botToken) {
      return res.status(400).json({ ok: false, description: "Missing Telegram Bot Token." });
    }
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const meData = await meRes.json();
      if (meData?.ok && meData.result) {
        return res.status(200).json({
          ok: true,
          username: meData.result.username,
          firstName: meData.result.first_name,
        });
      }
      return res.status(200).json({
        ok: false,
        description: meData?.description || "Invalid Telegram Bot Token.",
      });
    } catch (e) {
      return res.status(502).json({ ok: false, description: e.message || "Failed to contact Telegram API." });
    }
  }

  if (body.action === "detectChatId") {
    if (!botToken) {
      return res.status(400).json({ ok: false, description: "Missing Telegram Bot Token." });
    }
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const meData = await meRes.json();
      if (!meData?.ok || !meData.result) {
        return res.status(200).json({ ok: false, description: meData?.description || "Invalid Telegram Bot Token." });
      }
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
      const updRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getUpdates?limit=20&allowed_updates=["message","channel_post","my_chat_member"]`
      );
      const updData = await updRes.json();
      if (!updData?.ok || !Array.isArray(updData.result)) {
        return res.status(200).json({
          ok: false,
          botUsername: meData.result.username,
          description: updData?.description || "Could not fetch updates from Telegram.",
        });
      }
      for (let i = updData.result.length - 1; i >= 0; i--) {
        const upd = updData.result[i];
        const chat =
          upd?.message?.chat ||
          upd?.channel_post?.chat ||
          upd?.my_chat_member?.chat ||
          upd?.edited_message?.chat;
        if (chat && chat.id) {
          const title =
            chat.title ||
            [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
            chat.username ||
            "Telegram User";
          return res.status(200).json({
            ok: true,
            chatId: String(chat.id),
            chatTitle: title,
            botUsername: meData.result.username,
          });
        }
      }
      return res.status(200).json({
        ok: false,
        botUsername: meData.result.username,
        description: `Connected to @${meData.result.username}, but no recent messages found. Open @${meData.result.username} in Telegram, tap Start (or send "hi"), then click Auto-Detect again!`,
      });
    } catch (e) {
      return res.status(502).json({ ok: false, description: e.message || "Failed querying Telegram getUpdates." });
    }
  }

  if (body.action === "enableWebhook") {
    if (!botToken) {
      return res.status(400).json({ ok: false, description: "Missing Telegram Bot Token." });
    }
    const webhookUrl = `${STOREFRONT_URL.replace(/\/$/, "")}/api/telegram`;
    const derivedSecret = (
      process.env.TELEGRAM_WEBHOOK_SECRET ||
      crypto.createHash("sha256").update(`${botToken}:steav-webhook-secret`).digest("hex").slice(0, 32)
    ).trim();
    try {
      await tgApi(botToken, "setMyCommands", {
        commands: [
          { command: "stats", description: "Live revenue, order & stock KPIs" },
          { command: "orders", description: "Manage latest 5 orders with 1-tap actions" },
          { command: "track", description: "Track live order status by Order ID, phone, or email" },
          { command: "lowstock", description: "Audit low-stock & out-of-stock SKUs" },
          { command: "help", description: "Show interactive merchant command menu" },
        ],
      }).catch(() => {});

      const whRes = await tgApi(botToken, "setWebhook", {
        url: webhookUrl,
        secret_token: derivedSecret,
        allowed_updates: ["message", "callback_query"],
      });
      if (whRes?.ok) {
        return res.status(200).json({ ok: true, webhookUrl });
      }
      return res.status(200).json({
        ok: false,
        description: whRes?.description || "Failed to register Telegram webhook.",
      });
    } catch (e) {
      return res.status(502).json({ ok: false, description: e.message || "Network error setting Telegram webhook." });
    }
  }

  if (!botToken) {
    console.error("[CRITICAL] TELEGRAM_BOT_TOKEN environment variable is not configured on server.");
    return res.status(500).json({ error: "Telegram service not configured on server. Set TELEGRAM_BOT_TOKEN in Vercel Environment Variables." });
  }

  // 2. Support Internal Store Notifications (e.g. New Order alerts triggered from storefront / backend)
  if (body.action === "notify_order" || body.action === "sendMessage") {
    const targetChatId = body.chat_id || DEFAULT_CHAT_ID;
    const messageText = body.text || "";
    if (!targetChatId || !messageText) {
      return res.status(400).json({ error: "Missing chat_id or message text." });
    }

    try {
      const payload = {
        chat_id: targetChatId,
        text: messageText,
        parse_mode: body.parse_mode || "HTML",
        disable_web_page_preview: true,
      };
      if (body.reply_markup) {
        payload.reply_markup = body.reply_markup;
      }
      const tgResult = await tgApi(botToken, "sendMessage", payload);
      return res.status(200).json(tgResult);
    } catch (e) {
      return res.status(500).json({ error: e.message || "Failed to dispatch Telegram message" });
    }
  }

  // 3. Incoming Telegram Webhook Validation (Strict Header using env secret or derived token secret)
  const webhookSecret = (
    process.env.TELEGRAM_WEBHOOK_SECRET ||
    crypto.createHash("sha256").update(`${botToken}:steav-webhook-secret`).digest("hex").slice(0, 32)
  ).trim();

  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  if (secretHeader !== webhookSecret) {
    console.warn("[Security Alert] Unauthorized Telegram webhook invocation attempt without matching secret header.");
    return res.status(403).json({ error: "Unauthorized webhook token." });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "STEAV Paris Two-Way Interactive Telegram Bot Webhook",
      commands: ["/start", "/stats", "/orders", "/track", "/lowstock", "/help"],
    });
  }

  const update = body;

  try {
    const sbHeaders = await getSupabaseAuthHeaders();

    // 1. Handle Inline Button Callback Queries
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = String(cb.message?.chat?.id || cb.from?.id || "");
      const data = String(cb.data || "");

      // Enforce strict administrative authorization gate
      if (!chatId || !AUTHORIZED_CHAT_IDS.has(chatId)) {
        console.warn(`[Security Alert] Unauthorized Telegram callback query from chat ${chatId}: ${data}`);
        await tgApi(botToken, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: "⛔ Access Denied: Unauthorized administrative account.",
          show_alert: true,
        });
        return res.status(403).json({ error: "Unauthorized chat ID." });
      }

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

      if ((data === "cmd:track" || data.startsWith("track:")) && chatId) {
        const orderQuery = data.startsWith("track:")
          ? data.slice("track:".length)
          : "";
        await tgApi(botToken, "answerCallbackQuery", {
          callback_query_id: cb.id,
          text: orderQuery
            ? `Tracking order ${orderQuery}...`
            : "Opening live order tracker...",
        });
        const msg = await buildTrackOrderMessage(sbHeaders, orderQuery);
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
          { headers: sbHeaders },
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
            },
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

      await tgApi(botToken, "answerCallbackQuery", {
        callback_query_id: cb.id,
      });
      return res.status(200).json({ ok: true });
    }

    // 2. Handle Incoming Text Commands (/start, /help, /stats, /orders, /track, /lowstock)
    const msg = update.message || update.channel_post;
    if (msg && msg.chat?.id) {
      const chatId = String(msg.chat.id);
      const rawText = String(msg.text || "").trim();
      const text = rawText.toLowerCase();

      // Enforce strict administrative authorization gate
      if (!AUTHORIZED_CHAT_IDS.has(chatId)) {
        console.warn(`[Security Alert] Unauthorized Telegram command from chat ${chatId}: ${rawText}`);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          parse_mode: "HTML",
          text:
            `⛔ <b>ACCESS DENIED</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `You do not possess administrative clearance to access STEAV Paris store records.\n` +
            `Your chat ID (<code>${escapeHtml(chatId)}</code>) has been logged.`,
        });
        return res.status(403).json({ error: "Unauthorized chat ID." });
      }

      if (
        text.startsWith("/stats") ||
        text === "stats" ||
        text === "revenue" ||
        text.startsWith("stats") ||
        text.startsWith("revenue")
      ) {
        const reply = await buildStatsMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith("/orders") || text === "orders" || text.startsWith("orders")) {
        const reply = await buildOrdersMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (
        text.startsWith("/track") ||
        text.startsWith("track") ||
        text.startsWith("steav-") ||
        text.startsWith("atl-") ||
        text.startsWith("ord-") ||
        text.startsWith("pos-")
      ) {
        const queryArg = text.startsWith("/track")
          ? rawText.replace(/^\/track(@\S+)?/i, "").trim()
          : text.startsWith("track")
          ? rawText.replace(/^track\s*/i, "").trim()
          : rawText;
        const reply = await buildTrackOrderMessage(sbHeaders, queryArg);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (
        text.startsWith("/lowstock") ||
        text.startsWith("/stock") ||
        text === "lowstock" ||
        text === "stock" ||
        text.startsWith("lowstock") ||
        text.startsWith("stock")
      ) {
        const reply = await buildLowStockMessage(sbHeaders);
        await tgApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: reply.text,
          parse_mode: "HTML",
          reply_markup: reply.reply_markup,
        });
        return res.status(200).json({ ok: true });
      }

      if (
        text.startsWith("/start") ||
        text.startsWith("/help") ||
        text === "start" ||
        text === "help"
      ) {
        const welcomeText =
          `✨ <b>STEAV PARIS — EXECUTIVE CONTROLLER BOT</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Your Telegram chat (ID: <code>${chatId}</code>) is linked to the live <b>STEAV Studio</b> platform.\n\n` +
          `<b>Available Bot Commands:</b>\n` +
          `• /stats — Live revenue, order &amp; KHQR summary\n` +
          `• /orders — View &amp; update recent patron orders\n` +
          `• /track <code>&lt;ORDER_ID&gt;</code> — Live 5-stage order tracking\n` +
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
                { text: "🚚 Track an Order", callback_data: "cmd:track" },
                { text: "⚠️ Low-Stock Radar", callback_data: "cmd:lowstock" },
              ],
              [
                {
                  text: "🌐 Admin Portal",
                  url: `${STOREFRONT_URL}/admin/dashboard`,
                },
                {
                  text: "🔍 Web Tracker",
                  url: `${STOREFRONT_URL}/track`,
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
