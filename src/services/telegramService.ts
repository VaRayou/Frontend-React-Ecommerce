const env = (import.meta as any).env || {};

const DEFAULT_BOT_TOKEN =
  env.VITE_TELEGRAM_BOT_TOKEN ||
  "9048372338:AAHADX6G3fszbnyUTF58AEn0X2BSRbptx8A";

const DEFAULT_CHAT_ID = env.VITE_TELEGRAM_CHAT_ID || "1389246582";

const ADMIN_PRODUCTS_URL =
  typeof window !== "undefined" && window.location.origin.startsWith("http")
    ? `${window.location.origin}/admin/products`
    : "https://frontend-react-ecommerce-inky.vercel.app/admin/products";

const ADMIN_ORDERS_URL =
  typeof window !== "undefined" && window.location.origin.startsWith("http")
    ? `${window.location.origin}/admin/orders`
    : "https://frontend-react-ecommerce-inky.vercel.app/admin/orders";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  orderNotification: boolean;
  stockAlertNotification: boolean;
}

export interface LowStockAlertOptions {
  productName: string;
  remainingStock: number;
  previousStock?: number;
  productId?: string | number;
  category?: string;
  brand?: string;
  price?: number;
  triggerSource?: string;
  forceSend?: boolean;
}

function getStoredTelegramConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem("atelier_store_settings_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      const st = parsed?.state || parsed || {};
      return {
        botToken: String(st.telegramBotToken ?? DEFAULT_BOT_TOKEN).trim(),
        chatId: String(st.telegramChatId ?? DEFAULT_CHAT_ID).trim(),
        orderNotification: st.orderNotification !== false,
        stockAlertNotification: st.stockAlertNotification !== false,
      };
    }
  } catch {
    // ignore storage read errors
  }
  return {
    botToken: DEFAULT_BOT_TOKEN,
    chatId: DEFAULT_CHAT_ID,
    orderNotification: true,
    stockAlertNotification: true,
  };
}

function escapeHtml(str: any): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatCambodiaTimestamp(): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Phnom_Penh",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date()) + " ICT";
  } catch {
    return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  }
}

// Deduplication guard so identical order/payment alerts aren't sent twice in one session
const sentAlertsCache = new Set<string>();

export const telegramService = {
  getConfig: getStoredTelegramConfig,

  /**
   * Sends an HTML-formatted message to the configured Telegram Bot & Chat ID.
   */
  sendMessage: async (
    text: string,
    overrideToken?: string,
    overrideChatId?: string,
    replyMarkup?: Record<string, any>
  ): Promise<{ ok: boolean; description?: string }> => {
    const cfg = getStoredTelegramConfig();
    const token = (overrideToken !== undefined ? overrideToken : cfg.botToken).trim();
    const chatId = (overrideChatId !== undefined ? overrideChatId : cfg.chatId).trim();

    if (!token || !chatId) {
      return {
        ok: false,
        description: "Missing Telegram Bot Token or Chat ID.",
      };
    }

    const bodyPayload: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      bodyPayload.reply_markup = replyMarkup;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data && data.ok) {
        return { ok: true };
      }
      return {
        ok: false,
        description: data?.description || `Telegram API error (${res.status})`,
      };
    } catch (err: any) {
      console.warn("[TelegramService] Direct send notice:", err?.message || err);
      return {
        ok: false,
        description: err?.message || "Network error reaching api.telegram.org",
      };
    }
  },

  /**
   * Verifies a Bot Token via getMe and returns the bot's username and name.
   */
  verifyBotToken: async (
    botToken: string
  ): Promise<{ ok: boolean; username?: string; firstName?: string; description?: string }> => {
    const cleanToken = String(botToken || "").trim();
    if (!cleanToken) {
      return { ok: false, description: "Please enter a Bot Token from @BotFather." };
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await res.json();
      if (data?.ok && data.result) {
        return {
          ok: true,
          username: data.result.username,
          firstName: data.result.first_name,
        };
      }
      return {
        ok: false,
        description: data?.description || "Invalid Telegram Bot Token.",
      };
    } catch (err: any) {
      return {
        ok: false,
        description: err?.message || "Could not connect to Telegram API.",
      };
    }
  },

  /**
   * Auto-detects the most recent Chat ID by querying /getUpdates on the Bot Token.
   */
  detectChatId: async (
    botToken: string
  ): Promise<{
    ok: boolean;
    chatId?: string;
    chatTitle?: string;
    botUsername?: string;
    description?: string;
  }> => {
    const cleanToken = String(botToken || "").trim();
    if (!cleanToken) {
      return { ok: false, description: "Please enter your Telegram Bot Token first." };
    }

    try {
      const meCheck = await telegramService.verifyBotToken(cleanToken);
      if (!meCheck.ok) {
        return { ok: false, description: meCheck.description };
      }

      const res = await fetch(
        `https://api.telegram.org/bot${cleanToken}/getUpdates?limit=20&allowed_updates=["message","channel_post","my_chat_member"]`
      );
      const data = await res.json();
      if (!data?.ok || !Array.isArray(data.result)) {
        return {
          ok: false,
          botUsername: meCheck.username,
          description: data?.description || "Could not fetch updates from Telegram.",
        };
      }

      for (let i = data.result.length - 1; i >= 0; i--) {
        const upd = data.result[i];
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
          return {
            ok: true,
            chatId: String(chat.id),
            chatTitle: title,
            botUsername: meCheck.username,
          };
        }
      }

      return {
        ok: false,
        botUsername: meCheck.username,
        description: `Connected to @${meCheck.username}, but no recent messages found. Open @${meCheck.username} in Telegram, tap Start (or send "hi"), then click Auto-Detect again!`,
      };
    } catch (err: any) {
      return {
        ok: false,
        description: err?.message || "Failed querying Telegram getUpdates.",
      };
    }
  },

  /**
   * Dispatches a rich HTML alert when a new customer or POS order is created.
   */
  sendOrderAlert: async (orderData: any): Promise<boolean> => {
    if (!orderData) return false;
    const cfg = getStoredTelegramConfig();
    if (!cfg.orderNotification || !cfg.botToken || !cfg.chatId) return false;

    const orderNum =
      orderData.orderNumber || orderData.order_number || orderData.id || "N/A";
    const dedupeKey = `order:${orderNum}`;
    if (sentAlertsCache.has(dedupeKey)) return true;
    sentAlertsCache.add(dedupeKey);

    const customer =
      orderData.customerName ||
      orderData.customer_name ||
      orderData.shippingAddress?.fullName ||
      "Patron Client";
    const phone =
      orderData.customerPhone ||
      orderData.customer_phone ||
      orderData.shippingAddress?.phone ||
      "N/A";
    const email =
      orderData.customerEmail ||
      orderData.customer_email ||
      orderData.shippingAddress?.email ||
      "N/A";
    const method =
      orderData.paymentMethod || orderData.payment_method || "Bakong KHQR";
    const payStatus =
      orderData.paymentStatus || orderData.payment_status || "Paid";
    const totalUsd = Number(orderData.total || 0);
    const totalKhr = Math.round(totalUsd * 4100);

    let addressStr = "Phnom Penh, Cambodia";
    if (typeof orderData.shippingAddress === "string" && orderData.shippingAddress) {
      addressStr = orderData.shippingAddress;
    } else if (
      orderData.shippingAddress &&
      typeof orderData.shippingAddress === "object"
    ) {
      const sa = orderData.shippingAddress;
      addressStr =
        [sa.street, sa.city, sa.country].filter(Boolean).join(", ") ||
        "Phnom Penh, Cambodia";
    }

    const items = Array.isArray(orderData.items)
      ? orderData.items
      : Array.isArray(orderData.order_items)
      ? orderData.order_items
      : [];

    const itemLines = items.slice(0, 10).map((it: any) => {
      const name = escapeHtml(it.name || it.productName || it.product_name || "Piece");
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;
      const sz = it.size ? ` [${escapeHtml(it.size)}]` : "";
      return `  • ${name}${sz} ×${qty} — <b>$${(price * qty).toFixed(2)}</b>`;
    });

    const itemsSummary =
      itemLines.length > 0 ? itemLines.join("\n") : "  • Atelier Runway Piece";

    const isPos =
      String(method).toLowerCase().includes("pos") ||
      String(email).toLowerCase().includes("pos-counter");

    const headerTitle = isPos
      ? "🧾 <b>NEW POS COUNTER SALE</b>"
      : "🛍 <b>NEW ATELIER ORDER RECEIVED</b>";

    const msg =
      `${headerTitle}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Order ID:</b> <code>${escapeHtml(orderNum)}</code>\n` +
      `<b>Patron:</b> ${escapeHtml(customer)}\n` +
      `<b>Phone:</b> ${escapeHtml(phone)}\n` +
      `<b>Email:</b> ${escapeHtml(email)}\n` +
      `<b>Delivery:</b> ${escapeHtml(addressStr)}\n` +
      `<b>Payment:</b> ${escapeHtml(method)} (<b>${escapeHtml(payStatus)}</b>)\n` +
      (orderData.transactionId
        ? `<b>Txn Ref:</b> <code>${escapeHtml(orderData.transactionId)}</code>\n`
        : "") +
      `<b>Total:</b> <b>$${totalUsd.toFixed(2)} USD</b> (៛ ${totalKhr.toLocaleString()} KHR)\n` +
      `<b>Time:</b> ${formatCambodiaTimestamp()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Items (${items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)}):</b>\n` +
      `${itemsSummary}`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "📋 Manage Order in Admin Portal",
            url: ADMIN_ORDERS_URL,
          },
        ],
      ],
    };

    const res = await telegramService.sendMessage(msg, undefined, undefined, replyMarkup);
    return res.ok;
  },

  /**
   * Dispatches an instant alert when NBC Bakong verifies a KHQR payment.
   */
  sendKhqrPaymentAlert: async (params: {
    orderNumber: string;
    amount: number;
    currency?: string;
    transactionId?: string;
    customerName?: string;
  }): Promise<boolean> => {
    const cfg = getStoredTelegramConfig();
    if (!cfg.orderNotification || !cfg.botToken || !cfg.chatId) return false;

    const dedupeKey = `khqr:${params.orderNumber}:${params.transactionId || "paid"}`;
    if (sentAlertsCache.has(dedupeKey)) return true;
    sentAlertsCache.add(dedupeKey);

    const amt = Number(params.amount || 0);
    const curr = (params.currency || "USD").toUpperCase();
    const khrEquiv = curr === "USD" ? Math.round(amt * 4100) : Math.round(amt);

    const msg =
      `✅ <b>BAKONG KHQR PAYMENT VERIFIED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Order Ref:</b> <code>${escapeHtml(params.orderNumber)}</code>\n` +
      `<b>Amount:</b> <b>$${amt.toFixed(2)} ${curr}</b> (៛ ${khrEquiv.toLocaleString()} KHR)\n` +
      `<b>Bakong Txn ID:</b> <code>${escapeHtml(params.transactionId || "VERIFIED")}</code>\n` +
      (params.customerName
        ? `<b>Patron:</b> ${escapeHtml(params.customerName)}\n`
        : "") +
      `<b>Merchant:</b> <code>rayou_va@bkrt</code> (Rayou Va)\n` +
      `<b>Settled At:</b> ${formatCambodiaTimestamp()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`;

    const res = await telegramService.sendMessage(msg);
    return res.ok;
  },

  /**
   * Dispatches an alert when an admin updates an order status (e.g. Shipped, Delivered, Cancelled).
   */
  sendOrderStatusAlert: async (
    orderNumber: string,
    newStatus: string,
    customerName?: string
  ): Promise<boolean> => {
    const cfg = getStoredTelegramConfig();
    if (!cfg.orderNotification || !cfg.botToken || !cfg.chatId) return false;

    const icon =
      newStatus === "Delivered"
        ? "✅"
        : newStatus === "Shipped"
        ? "🚚"
        : newStatus === "Cancelled"
        ? "❌"
        : "📦";

    const msg =
      `${icon} <b>ORDER STATUS UPDATED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Order ID:</b> <code>${escapeHtml(orderNumber)}</code>\n` +
      (customerName ? `<b>Patron:</b> ${escapeHtml(customerName)}\n` : "") +
      `<b>New Status:</b> <b>${escapeHtml(newStatus.toUpperCase())}</b>\n` +
      `<b>Updated At:</b> ${formatCambodiaTimestamp()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`;

    const res = await telegramService.sendMessage(msg);
    return res.ok;
  },

  /**
   * Dispatches an executive, standard-compliant Low-Stock or Out-of-Stock alert to Telegram.
   * Accepts either (productName, remainingStock, productId) or a rich LowStockAlertOptions object.
   */
  sendLowStockAlert: async (
    productOrName: string | LowStockAlertOptions,
    remainingStockArg?: number,
    productIdArg?: string | number
  ): Promise<{ ok: boolean; description?: string }> => {
    const cfg = getStoredTelegramConfig();
    const opts: LowStockAlertOptions =
      typeof productOrName === "object" && productOrName !== null
        ? productOrName
        : {
            productName: String(productOrName || "Atelier Piece"),
            remainingStock: Number(remainingStockArg ?? 0),
            productId: productIdArg,
          };

    if (!opts.forceSend && !cfg.stockAlertNotification) {
      return { ok: false, description: "Low-stock notifications are disabled in settings." };
    }
    if (!cfg.botToken || !cfg.chatId) {
      return { ok: false, description: "Missing Telegram Bot Token or Chat ID." };
    }

    const remaining = Math.max(0, Number(opts.remainingStock ?? 0));
    const isOut = remaining <= 0;
    const shortId = opts.productId
      ? String(opts.productId).slice(-8).toUpperCase()
      : "CAT-SKU";

    const header = isOut
      ? "🚨 <b>CRITICAL INVENTORY ALERT: OUT OF STOCK</b>"
      : "⚠️ <b>LOW STOCK THRESHOLD WARNING (≤ 5 UNITS)</b>";

    const statusBadge = isOut
      ? "🔴 OUT OF STOCK (0 AVAILABLE)"
      : `🟠 LOW STOCK (${remaining} ${remaining === 1 ? "UNIT" : "UNITS"} LEFT)`;

    const stockTransition =
      opts.previousStock !== undefined && Number(opts.previousStock) !== remaining
        ? `${opts.previousStock} units → <b>${remaining} units</b>`
        : `<b>${remaining} ${remaining === 1 ? "unit" : "units"} remaining</b>`;

    const priceLine =
      opts.price !== undefined && Number(opts.price) > 0
        ? `<b>Unit Price:</b> <b>$${Number(opts.price).toFixed(2)} USD</b> (៛ ${Math.round(
            Number(opts.price) * 4100
          ).toLocaleString()} KHR)\n`
        : "";

    const categoryLine =
      opts.category || opts.brand
        ? `<b>Collection:</b> ${escapeHtml(opts.category || "Runway")} • ${escapeHtml(
            opts.brand || "ATELIER"
          )}\n`
        : "";

    const triggerLine = opts.triggerSource
      ? `<b>Trigger:</b> ${escapeHtml(opts.triggerSource)}\n`
      : "";

    const msg =
      `${header}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Piece:</b> <b>${escapeHtml(opts.productName)}</b>\n` +
      `<b>Catalog SKU:</b> <code>#${escapeHtml(shortId)}</code>\n` +
      categoryLine +
      priceLine +
      `<b>Stock Level:</b> ${stockTransition}\n` +
      `<b>Status:</b> <b>${statusBadge}</b>\n` +
      triggerLine +
      `<b>Time:</b> ${formatCambodiaTimestamp()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      (isOut
        ? `Immediate restock required — piece is currently marked <b>Sold Out</b> on the storefront.`
        : `Inventory has fallen to or below the 5-unit safety threshold. Please replenish stock soon.`);

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "📦 Restock in Admin Inventory Portal",
            url: ADMIN_PRODUCTS_URL,
          },
        ],
      ],
    };

    return telegramService.sendMessage(msg, undefined, undefined, replyMarkup);
  },

  /**
   * Dispatches a comprehensive Inventory Health & Low-Stock Summary Report to Telegram.
   */
  sendInventoryAuditReport: async (
    products: any[]
  ): Promise<{ ok: boolean; description?: string; lowCount: number; outCount: number }> => {
    const list = Array.isArray(products) ? products : [];
    const outOfStockItems = list.filter(
      (p) =>
        Number(p.stock ?? p.quantity ?? 0) <= 0 ||
        String(p.status || "").toLowerCase() === "out of stock"
    );
    const lowStockItems = list.filter((p) => {
      const s = Number(p.stock ?? p.quantity ?? 0);
      const isOut = String(p.status || "").toLowerCase() === "out of stock";
      return !isOut && s > 0 && s <= 5;
    });
    const healthyItems = list.filter((p) => {
      const s = Number(p.stock ?? p.quantity ?? 0);
      const isOut = String(p.status || "").toLowerCase() === "out of stock";
      return !isOut && s > 5;
    });

    const outLines = outOfStockItems.slice(0, 12).map((p) => {
      const sku = String(p.id || "").slice(-6).toUpperCase();
      return `  🔴 <b>${escapeHtml(p.name)}</b> (<code>#${sku}</code>) — <b>0 left</b> ($${Number(
        p.price || 0
      ).toFixed(2)})`;
    });

    const lowLines = lowStockItems.slice(0, 12).map((p) => {
      const sku = String(p.id || "").slice(-6).toUpperCase();
      const s = Number(p.stock ?? p.quantity ?? 0);
      return `  🟠 <b>${escapeHtml(p.name)}</b> (<code>#${sku}</code>) — <b>${s} left</b> ($${Number(
        p.price || 0
      ).toFixed(2)})`;
    });

    const msg =
      `📊 <b>ATELIER INVENTORY HEALTH &amp; LOW-STOCK AUDIT</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Total Catalog SKUs:</b> <b>${list.length} pieces</b>\n` +
      `✅ <b>Healthy Stock (&gt;5):</b> ${healthyItems.length} pieces\n` +
      `⚠️ <b>Low Stock (1–5):</b> <b>${lowStockItems.length} pieces</b>\n` +
      `🚨 <b>Out of Stock (0):</b> <b>${outOfStockItems.length} pieces</b>\n` +
      `<b>Audited At:</b> ${formatCambodiaTimestamp()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      (outLines.length > 0
        ? `<b>🚨 Out of Stock (${outOfStockItems.length}):</b>\n${outLines.join("\n")}\n\n`
        : "") +
      (lowLines.length > 0
        ? `<b>⚠️ Low Stock ≤ 5 Units (${lowStockItems.length}):</b>\n${lowLines.join("\n")}`
        : outLines.length === 0
        ? `✨ <b>All catalog pieces are well-stocked above the 5-unit safety threshold!</b>`
        : "");

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "📦 Open Admin Inventory Portal",
            url: ADMIN_PRODUCTS_URL,
          },
        ],
      ],
    };

    const res = await telegramService.sendMessage(msg, undefined, undefined, replyMarkup);
    return {
      ok: res.ok,
      description: res.description,
      lowCount: lowStockItems.length,
      outCount: outOfStockItems.length,
    };
  },
};

export default telegramService;
