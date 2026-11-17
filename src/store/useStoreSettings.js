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
      storeName: "ATELIER PARIS — Flagship Studio",
      storeEmail: "concierge@atelier.com",
      storePhone: "+855 96 835 0317",
      storeAddress: "Phnom Penh • Paris • Global Flagship",
      storeTaxId: "VAT REG: KH-8840291-A",
      receiptFooterMessage: "*** THANK YOU FOR PATRONIZING ATELIER ***",
      currency: "USD ($)",
      orderNotification: true,
      stockAlertNotification: true,
      telegramBotToken: String(env.VITE_TELEGRAM_BOT_TOKEN || "").trim(),
      telegramChatId: String(env.VITE_TELEGRAM_CHAT_ID || "").trim(),
      standardShippingFee: 15,
      freeShippingThreshold: 200,
      shippingCarrierName: "DHL Express Courier",
      enableFreeShipping: true,

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
            const s = data.settings;

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
