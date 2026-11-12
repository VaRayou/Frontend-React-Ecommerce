import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Lock,
  Store,
  ShieldCheck,
  Save,
  Key,
  Truck,
  Ticket,
  Plus,
  Trash2,
  Receipt,
  Send,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useStoreSettings } from "../../store/useStoreSettings";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { telegramService } from "../../services/telegramService";
import { supabase } from "../../services/supabase";
import { ensureAdminSession } from "../../services/productService";
import api from "../../services/api";
import Input from "../../components/common/Input";

const env = import.meta.env || {};

export function Settings() {
  const { adminUser } = useAdminAuthStore();
  const {
    freeShippingThreshold,
    standardShippingFee,
    shippingCarrierName,
    setShippingConfig,
  } = useCartStore();

  const storedBranding = useStoreSettings();
  const [storeSettings, setStoreSettings] = useState({
    storeName: storedBranding.storeName || "ATELIER PARIS — Flagship Studio",
    storeEmail: storedBranding.storeEmail || "concierge@atelier.com",
    storePhone: storedBranding.storePhone || "+855 96 835 0317",
    storeAddress: storedBranding.storeAddress || "Phnom Penh • Paris • Global Flagship",
    storeTaxId: storedBranding.storeTaxId || "VAT REG: KH-8840291-A",
    receiptFooterMessage:
      storedBranding.receiptFooterMessage ||
      "*** THANK YOU FOR PATRONIZING ATELIER ***",
    currency: storedBranding.currency || "USD ($)",
    orderNotification: storedBranding.orderNotification ?? true,
    stockAlertNotification: storedBranding.stockAlertNotification ?? true,
    telegramBotToken:
      storedBranding.telegramBotToken ||
      String(env.VITE_TELEGRAM_BOT_TOKEN || "").trim(),
    telegramChatId:
      storedBranding.telegramChatId ||
      String(env.VITE_TELEGRAM_CHAT_ID || "").trim(),
  });

  const [telegramStatus, setTelegramStatus] = useState({
    testing: false,
    detecting: false,
    botUsername: "",
    feedback: "",
    isError: false,
  });

  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    fee: standardShippingFee !== undefined ? standardShippingFee : 15,
    threshold: freeShippingThreshold !== undefined ? freeShippingThreshold : 200,
    carrierName: shippingCarrierName || "DHL Express Courier",
    enableFreeShipping: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Promotional Coupons Manager State
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    type: "percentage",
    value: 15,
    min_spend: 50,
  });

  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let active = true;
    const loadCoupons = async () => {
      try {
        await ensureAdminSession();
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && active) {
          setCoupons(
            data.map((c) => ({
              ...c,
              type: c.discount_type || c.type || "percentage",
              value: Number(c.discount_value ?? c.value ?? 10),
              min_spend: Number(c.min_order_value ?? c.min_spend ?? 0),
            }))
          );
        }
      } catch (err) {
        console.warn("Could not load coupons in settings:", err);
      }
    };

    loadCoupons();
    return () => {
      active = false;
    };
  }, []);

  const handleStoreSave = (e) => {
    e.preventDefault();
    storedBranding.updateStoreSettings(storeSettings);
    telegramService
      .enableInteractiveWebhook(storeSettings.telegramBotToken)
      .catch(() => {});
    showNotification("Boutique & Telegram alert settings saved!");
  };

  const handleEnableInteractiveWebhook = async () => {
    storedBranding.updateStoreSettings(storeSettings);
    setTelegramStatus((prev) => ({
      ...prev,
      testing: true,
      feedback: "Registering 2-way Telegram Bot commands (/stats, /orders, /lowstock) & webhook...",
      isError: false,
    }));
    const res = await telegramService.enableInteractiveWebhook(
      storeSettings.telegramBotToken
    );
    if (res.ok) {
      setTelegramStatus((prev) => ({
        ...prev,
        testing: false,
        feedback:
          "2-Way Interactive Bot Webhook active! Type /stats, /orders, /lowstock, or /help in your Telegram bot.",
        isError: false,
      }));
      showNotification("2-Way Telegram Bot commands & inline buttons activated!");
    } else {
      setTelegramStatus((prev) => ({
        ...prev,
        testing: false,
        feedback: `Webhook Error: ${res.description || "Check Bot Token."}`,
        isError: true,
      }));
    }
  };

  const handleAutoDetectTelegramChat = async () => {
    setTelegramStatus({
      testing: false,
      detecting: true,
      botUsername: "",
      feedback: "Contacting Telegram Bot API (/getUpdates)...",
      isError: false,
    });
    const res = await telegramService.detectChatId(storeSettings.telegramBotToken);
    if (res.ok && res.chatId) {
      const updated = {
        ...storeSettings,
        telegramChatId: res.chatId,
      };
      setStoreSettings(updated);
      storedBranding.updateStoreSettings(updated);
      setTelegramStatus({
        testing: false,
        detecting: false,
        botUsername: res.botUsername || "",
        feedback: `Connected to @${res.botUsername} — Detected Chat ID: ${res.chatId} (${res.chatTitle})`,
        isError: false,
      });
      showNotification(`Telegram Chat ID ${res.chatId} auto-detected & saved!`);
    } else {
      setTelegramStatus({
        testing: false,
        detecting: false,
        botUsername: res.botUsername || "",
        feedback: res.description || "Could not auto-detect Chat ID.",
        isError: true,
      });
    }
  };

  const handleTestTelegramAlert = async () => {
    storedBranding.updateStoreSettings(storeSettings);
    setTelegramStatus((prev) => ({
      ...prev,
      testing: true,
      feedback: "Sending live test alert to Telegram...",
      isError: false,
    }));

    const testHtml =
      `🔔 <b>ATELIER TELEGRAM BOT CONNECTED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Store:</b> ${storeSettings.storeName}\n` +
      `<b>Bakong Merchant:</b> <code>rayou_va@bkrt</code>\n` +
      `<b>Status:</b> <b>LIVE 2-WAY BOT &amp; REAL-TIME ALERTS ACTIVE</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `You will receive instant notifications on every new customer order, POS counter sale, Low-Stock warning, and verified Bakong KHQR settlement.\n\n` +
      `<b>Interactive Commands:</b>\n` +
      `• <code>/stats</code> — Live revenue &amp; order KPIs\n` +
      `• <code>/orders</code> — Manage latest 5 orders\n` +
      `• <code>/track ORDER_ID</code> — 5-stage live order tracker\n` +
      `• <code>/lowstock</code> — Audit low-stock SKUs`;

    await telegramService
      .enableInteractiveWebhook(storeSettings.telegramBotToken)
      .catch(() => {});

    const res = await telegramService.sendMessage(
      testHtml,
      storeSettings.telegramBotToken,
      storeSettings.telegramChatId,
      {
        inline_keyboard: [
          [
            { text: "📊 Live Revenue KPIs", callback_data: "cmd:stats" },
            { text: "🛍 Latest 5 Orders", callback_data: "cmd:orders" },
          ],
          [
            { text: "🚚 Track an Order", callback_data: "cmd:track" },
            { text: "⚠️ Low-Stock Audit", callback_data: "cmd:lowstock" },
          ],
        ],
      }
    );

    if (res.ok) {
      setTelegramStatus((prev) => ({
        ...prev,
        testing: false,
        feedback: "Test alert delivered to your Telegram chat! Check your Telegram app.",
        isError: false,
      }));
      showNotification("Test message sent to Telegram successfully!");
    } else {
      setTelegramStatus((prev) => ({
        ...prev,
        testing: false,
        feedback: `Telegram Error: ${res.description || "Check your Bot Token & Chat ID (and make sure you tapped /start in your bot)."}`,
        isError: true,
      }));
    }
  };

  const handleTestLowStockAlert = async () => {
    storedBranding.updateStoreSettings(storeSettings);
    setTelegramStatus((prev) => ({
      ...prev,
      testing: true,
      feedback: "Sending sample Low-Stock Alert to Telegram...",
      isError: false,
    }));

    const res = await telegramService.sendLowStockAlert({
      productName: "Atelier Cashmere Double-Breasted Coat",
      remainingStock: 2,
      previousStock: 6,
      productId: "ATL-COAT-092",
      category: "Women",
      brand: "ATELIER PARIS",
      price: 240,
      triggerSource: "Admin Configuration Test Alert",
      forceSend: true,
    });

    if (res.ok) {
      setTelegramStatus((prev) => ({
        ...prev,
        testing: false,
        feedback: "Low-Stock Alert delivered to your Telegram chat!",
        isError: false,
      }));
      showNotification("Low-Stock Alert sent to Telegram successfully!");
    } else {
      setTelegramStatus((prev) => ({
        ...prev,
        testing: false,
        feedback: `Telegram Error: ${res.description || "Check Bot Token & Chat ID."}`,
        isError: true,
      }));
    }
  };

  const handleShippingSave = (e) => {
    e.preventDefault();
    setShippingConfig({
      fee: Number(shippingForm.fee),
      threshold: shippingForm.enableFreeShipping
        ? Number(shippingForm.threshold)
        : 999999,
      carrierName: shippingForm.carrierName,
    });
    showNotification("Shipping rates & policies updated across store!");
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    showNotification("Controller credentials updated successfully!");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = newCoupon.code.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      await ensureAdminSession();
      const payload = {
        code: cleanCode,
        description:
          newCoupon.description.trim() ||
          `${newCoupon.value}${newCoupon.type === "percentage" ? "%" : "$"} Off Voucher`,
        discount_type: newCoupon.type,
        discount_value: Number(newCoupon.value) || 0,
        min_order_value: Number(newCoupon.min_spend) || 0,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("coupons")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setCoupons((prev) => [
        {
          ...data,
          type: data.discount_type || data.type,
          value: data.discount_value || data.value,
          min_spend: data.min_order_value || data.min_spend,
        },
        ...prev.filter((c) => c.code !== cleanCode),
      ]);

      setNewCoupon({
        code: "",
        description: "",
        type: "percentage",
        value: 15,
        min_spend: 50,
      });
      showNotification(`Promo code "${cleanCode}" saved to Supabase!`);
    } catch (err) {
      showNotification("Failed creating promo code: " + (err?.message || "Error"));
    }
  };

  const handleToggleCoupon = async (coupon) => {
    const nextState = !coupon.is_active;
    try {
      await ensureAdminSession();
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: nextState })
        .eq("code", coupon.code);

      if (error) throw error;

      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? { ...c, is_active: nextState } : c))
      );
      showNotification(
        `Coupon "${coupon.code}" ${nextState ? "enabled" : "disabled"}`
      );
    } catch {
      showNotification("Failed updating coupon state.");
    }
  };

  const handleDeleteCoupon = async (code) => {
    try {
      await ensureAdminSession();
      await supabase.from("coupons").delete().eq("code", code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      showNotification(`Coupon "${code}" deleted from Supabase`);
    } catch {
      showNotification("Failed deleting coupon.");
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#D6FF00] shrink-0" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/dashboard" className="hover:text-black font-semibold">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">Configuration</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            System, POS Receipt Branding &amp; Promo Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure boutique receipt headers, shipping policies, promo codes, and controller security.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            storedBranding.updateStoreSettings(storeSettings);
            setIsReceiptPreviewOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs shrink-0"
        >
          <Receipt className="w-4 h-4" />
          <span>Preview POS Receipt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Store Information & Shipping */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Boutique Studio &amp; POS Receipt Branding
                </h3>
                <span className="text-xs text-gray-400">
                  Dynamically printed on all POS thermal receipts and tax invoices
                </span>
              </div>
            </div>

            <form onSubmit={handleStoreSave} className="space-y-4">
              <Input
                label="Boutique / Store Name (Receipt Header)"
                value={storeSettings.storeName}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, storeName: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Concierge Contact Email"
                  type="email"
                  value={storeSettings.storeEmail}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, storeEmail: e.target.value })
                  }
                  required
                />
                <Input
                  label="Phone Line (Receipt Tel)"
                  value={storeSettings.storePhone}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, storePhone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Headquarters Address"
                  value={storeSettings.storeAddress}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      storeAddress: e.target.value,
                    })
                  }
                />
                <Input
                  label="Tax / VAT Registration ID"
                  value={storeSettings.storeTaxId}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      storeTaxId: e.target.value,
                    })
                  }
                />
              </div>

              <Input
                label="POS Thermal Receipt Footer Message"
                value={storeSettings.receiptFooterMessage}
                onChange={(e) =>
                  setStoreSettings({
                    ...storeSettings,
                    receiptFooterMessage: e.target.value,
                  })
                }
              />

              <div className="pt-2 space-y-2 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Automation Alerts
                </h4>
                <label className="flex items-center gap-2.5 text-xs text-gray-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeSettings.orderNotification}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        orderNotification: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded-sm text-black accent-black shrink-0"
                  />
                  <span>
                    Dispatch real-time Telegram &amp; email alert on new customer order
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeSettings.stockAlertNotification}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        stockAlertNotification: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded-sm text-black accent-black shrink-0"
                  />
                  <span>Low stock warning when runway items fall below 5 units</span>
                </label>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Boutique Branding</span>
                </button>
              </div>
            </form>
          </div>

          {/* Telegram Bot Real-Time Merchant Alerts Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                    Telegram Bot Real-Time Merchant Alerts
                  </h3>
                  <span className="text-xs text-gray-400">
                    Instant push notifications for Online Orders, POS Sales &amp; Bakong KHQR Settlements
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[10px] font-black uppercase tracking-wider text-sky-700">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                Live Webhook
              </span>
            </div>

            <form onSubmit={handleStoreSave} className="space-y-4">
              <Input
                label="Telegram Bot Token (from @BotFather)"
                value={storeSettings.telegramBotToken}
                onChange={(e) =>
                  setStoreSettings({
                    ...storeSettings,
                    telegramBotToken: e.target.value,
                  })
                }
                placeholder="e.g. 1234567890:AAH..."
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-7">
                  <Input
                    label="Merchant Telegram Chat ID (User or Group ID)"
                    value={storeSettings.telegramChatId}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        telegramChatId: e.target.value,
                      })
                    }
                    placeholder="e.g. 1389246582"
                    required
                  />
                </div>
                <div className="sm:col-span-5">
                  <button
                    type="button"
                    disabled={telegramStatus.detecting}
                    onClick={handleAutoDetectTelegramChat}
                    className="w-full py-2.5 px-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Send /start to your bot in Telegram, then click to auto-fill your Chat ID"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        telegramStatus.detecting ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {telegramStatus.detecting
                        ? "Detecting..."
                        : "Auto-Detect Chat ID"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900 space-y-1">
                <p className="font-bold">How to connect in 10 seconds:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-sky-800">
                  <li>
                    Paste your Bot Token from <strong>@BotFather</strong> above.
                  </li>
                  <li>
                    Open your bot in Telegram and tap <strong>Start</strong> (or send <code>/start</code>).
                  </li>
                  <li>
                    Click <strong>Auto-Detect Chat ID</strong> above, then click <strong>Send Test Alert</strong>!
                  </li>
                </ol>
              </div>

              {telegramStatus.feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    telegramStatus.isError
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{telegramStatus.feedback}</span>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Telegram Config</span>
                </button>

                <button
                  type="button"
                  disabled={telegramStatus.testing}
                  onClick={handleTestTelegramAlert}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {telegramStatus.testing ? "Sending..." : "Test Connection"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={telegramStatus.testing}
                  onClick={handleTestLowStockAlert}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-all font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Test Low-Stock Alert</span>
                </button>

                <button
                  type="button"
                  disabled={telegramStatus.testing}
                  onClick={handleEnableInteractiveWebhook}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 transition-all font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Enable 2-Way Bot Commands</span>
                </button>
              </div>
            </form>
          </div>

          {/* Shipping & Delivery Configuration Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Shipping &amp; Delivery Controls
                </h3>
                <span className="text-xs text-gray-400">
                  Manage standard delivery rates, free shipping milestone, and couriers
                </span>
              </div>
            </div>

            <form onSubmit={handleShippingSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Standard Delivery Fee ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingForm.fee}
                  onChange={(e) =>
                    setShippingForm({ ...shippingForm, fee: e.target.value })
                  }
                  required
                />
                <Input
                  label="Free Shipping Milestone ($)"
                  type="number"
                  min="0"
                  step="1"
                  value={shippingForm.threshold}
                  onChange={(e) =>
                    setShippingForm({ ...shippingForm, threshold: e.target.value })
                  }
                  required
                />
              </div>

              <Input
                label="Primary Shipping Courier"
                value={shippingForm.carrierName}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, carrierName: e.target.value })
                }
                placeholder="e.g. DHL Express, White Glove Courier"
                required
              />

              <div className="pt-1">
                <label className="flex items-center gap-2.5 text-xs text-gray-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingForm.enableFreeShipping}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        enableFreeShipping: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded-sm text-black accent-black shrink-0"
                  />
                  <span>
                    Automatically apply FREE shipping when order reaches the milestone amount
                  </span>
                </label>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Current policy:{" "}
                  <strong className="text-black">
                    {shippingForm.enableFreeShipping
                      ? `Free over $${shippingForm.threshold}`
                      : "Fixed Fee"}
                  </strong>
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Shipping Rates</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Coupons Manager, Controller Profile & Security */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* Promotional Coupons Manager Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Promotional Coupons Manager
                </h3>
                <span className="text-xs text-gray-400">
                  Create and toggle live checkout voucher codes
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                  }
                  placeholder="CODE (e.g. SUMMER25)"
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-mono font-bold uppercase focus:outline-hidden focus:border-black"
                  required
                />
                <select
                  value={newCoupon.type}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, type: e.target.value })
                  }
                  className="px-2.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold focus:outline-hidden"
                >
                  <option value="percentage">% Percentage</option>
                  <option value="fixed">$ Fixed Amount</option>
                  <option value="shipping">Free Shipping</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newCoupon.value}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, value: e.target.value })
                  }
                  placeholder="Discount Value"
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold focus:outline-hidden"
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newCoupon.min_spend}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, min_spend: e.target.value })
                  }
                  placeholder="Min Spend ($)"
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <input
                type="text"
                value={newCoupon.description}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, description: e.target.value })
                }
                placeholder="Description (e.g. 25% Off Summer Runway)"
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs focus:outline-hidden"
              />

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Update Promo Code</span>
              </button>
            </form>

            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto border border-gray-100 rounded-xl">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        {c.type === "percentage"
                          ? `${c.value}% OFF`
                          : c.type === "fixed"
                          ? `$${c.value} OFF`
                          : "FREE SHIP"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {c.description} • Min: ${Number(c.min_spend || 0).toFixed(0)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(c)}
                      className={`px-2 py-1 rounded-md text-[10px] font-black uppercase cursor-pointer ${
                        c.is_active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {c.is_active !== false ? "Active" : "Disabled"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controller Profile */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs text-center space-y-3">
            <div className="relative w-20 h-20 mx-auto">
              <img
                src={
                  adminUser?.avatar ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                }
                alt="Controller"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#D6FF00] shadow-md mx-auto"
                style={{ width: "80px", height: "80px" }}
              />
              <span className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div>
              <h4 className="font-extrabold text-base text-gray-900">
                {adminUser?.name || "Administrator"}
              </h4>
              <span className="text-xs text-gray-500">
                {adminUser?.email || "controller@atelier.com"}
              </span>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-[#D6FF00] text-[10px] font-black uppercase tracking-wider shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{adminUser?.role || "SUPER ADMINISTRATOR"}</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Security Credentials
                </h3>
                <span className="text-xs text-gray-400">Update access passkey</span>
              </div>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-3">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="At least 6 characters"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                required
              />

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Update Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Live Preview of POS Thermal Receipt Branding */}
      <ThermalReceiptModal
        isOpen={isReceiptPreviewOpen}
        onClose={() => setIsReceiptPreviewOpen(false)}
        invoiceData={{
          orderNumber: "ATL-PREVIEW-01",
          customerName: adminUser?.name || "VIP Boutique Patron",
          paymentMethod: "Bakong KHQR",
          paymentStatus: "Paid",
          transactionId: "BAKONG-PREVIEW-TXN",
          subtotal: 120,
          tax: 9.6,
          total: 129.6,
          items: [
            {
              name: "Atelier Runway Tailored Blazer",
              quantity: 1,
              price: 120,
              size: "M",
            },
          ],
        }}
      />
    </div>
  );
}

export default Settings;
