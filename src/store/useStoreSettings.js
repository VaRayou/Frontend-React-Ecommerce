import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";
import { useCartStore } from "./useCartStore";

const env = import.meta.env || {};

// In-memory throttle timestamp to protect Supabase Egress (5 minutes cache)
let _lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL = 300000; // 5 minutes

export const useStoreSettings = create(
  persist(
    (set, get) => ({
      storeName: "STEAV PARIS — Flagship Studio",
      storeEmail: "concierge@steav.com",
      storePhone: "+855 96 835 0317",
      storeAddress: "Phnom Penh • Paris • Global Flagship",
      storeTaxId: "VAT REG: KH-8840291-A",
      receiptFooterMessage: "*** THANK YOU FOR PATRONIZING STEAV ***",
      currency: "USD ($)",
      orderNotification: true,
      stockAlertNotification: true,
      standardShippingFee: 15,
      freeShippingThreshold: 200,
      shippingCarrierName: "DHL Express Courier",
      enableFreeShipping: true,
      resendSenderEmail: String(env.VITE_RESEND_SENDER_EMAIL || "onboarding@resend.dev").trim(),
      brevoSenderEmail: String(env.VITE_BREVO_SENDER_EMAIL || "varayouk@gmail.com").trim(),
      brevoSenderName: String(env.VITE_BREVO_SENDER_NAME || "STEAV PARIS").trim(),
      emailJsServiceId: String(env.VITE_EMAILJS_SERVICE_ID || "").trim(),
      emailJsTemplateId: String(env.VITE_EMAILJS_TEMPLATE_ID || "").trim(),
      emailJsPublicKey: String(env.VITE_EMAILJS_PUBLIC_KEY || "").trim(),
      customerEmailNotification: true,

      updateStoreSettings: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
        })),

      fetchCloudSettings: async (force = false) => {
        const now = Date.now();
        if (!force && now - _lastSettingsFetch < SETTINGS_CACHE_TTL) {
          return get();
        }

        try {
          const { data, error } = await supabase
            .from("store_settings")
            .select("settings")
            .eq("id", "default")
            .maybeSingle();

          if (!error && data?.settings) {
            _lastSettingsFetch = now;
            const s = { ...data.settings };
            // Security sanitizer: Strip any legacy secret tokens from state
            delete s.telegramBotToken;
            delete s.telegramChatId;
            delete s.brevoApiKey;
            delete s.resendApiKey;

            set((state) => ({
              ...state,
              ...s,
            }));

            // Authoritative shipping synchronization across all devices
            if (s.standardShippingFee !== undefined) {
              const fee = Number(s.standardShippingFee ?? 0);
              const threshold =
                s.enableFreeShipping !== false && s.freeShippingThreshold !== undefined
                  ? Number(s.freeShippingThreshold)
                  : 999999;
              const carrier = s.shippingCarrierName || "DHL Express Courier";

              useCartStore.getState().setShippingConfig({
                fee,
                threshold,
                carrierName: carrier,
              });
            }

            return s;
          }
        } catch (err) {
          console.warn("[StoreSettings] Offline or fallback to local storage:", err);
        }
        return get();
      },
    }),
    {
      name: "atelier_store_settings_v1",
    }
  )
);
