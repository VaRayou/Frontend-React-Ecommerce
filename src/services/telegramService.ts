const env = (import.meta as any).env || {};

const DEFAULT_BOT_TOKEN =
  env.VITE_TELEGRAM_BOT_TOKEN ||
  "9048372338:AAHADX6G3fszbnyUTF58AEn0X2BSRbptx8A";

const DEFAULT_CHAT_ID = env.VITE_TELEGRAM_CHAT_ID || "1389246582";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  orderNotification: boolean;
  stockAlertNotification: boolean;
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

// Deduplication guard so the same order/payment alert isn't sent twice in one session
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

    // 1. Direct Telegram Bot API call (supports browser CORS natively)
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
   * All the user needs to do is send "/start" or "hello" to their bot in Telegram.
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

      // Search from newest update to oldest for a chat object
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
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Items (${items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)}):</b>\n` +
      `${itemsSummary}`;

    const res = await telegramService.sendMessage(msg);
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
      `━━━━━━━━━━━━━━━━━━━━━━`;

    const res = await telegramService.sendMessage(msg);
    return res.ok;
  },

  /**
   * Dispatches a low-stock or out-of-stock alert when inventory drops to <= 5 units.
   */
  sendLowStockAlert: async (
    productName: string,
    remainingStock: number,
    productId?: string | number
  ): Promise<boolean> => {
    const cfg = getStoredTelegramConfig();
    if (!cfg.stockAlertNotification || !cfg.botToken || !cfg.chatId) return false;

    const statusText =
      remainingStock <= 0
        ? "OUT OF STOCK"
        : `LOW STOCK (${remainingStock} left)`;
    const icon = remainingStock <= 0 ? "🚨" : "⚠️";

    const msg =
      `${icon} <b>INVENTORY ALERT: ${statusText}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Piece:</b> ${escapeHtml(productName)}\n` +
      `<b>Remaining Stock:</b> <b>${remainingStock} units</b>\n` +
      (productId ? `<b>Catalog ID:</b> <code>#${escapeHtml(String(productId).slice(-6).toUpperCase())}</code>\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Please restock via the Atelier Admin Portal.`;

    const res = await telegramService.sendMessage(msg);
    return res.ok;
  },
};

export default telegramService;
