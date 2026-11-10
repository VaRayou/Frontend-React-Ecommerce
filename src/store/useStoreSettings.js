import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStoreSettings = create(
  persist(
    (set) => ({
      storeName: "ATELIER PARIS — Flagship Studio",
      storeEmail: "concierge@atelier.com",
      storePhone: "+855 96 835 0317",
      storeAddress: "Phnom Penh • Paris • Global Flagship",
      storeTaxId: "VAT REG: KH-8840291-A",
      receiptFooterMessage: "*** THANK YOU FOR PATRONIZING ATELIER ***",
      currency: "USD ($)",
      orderNotification: true,
      stockAlertNotification: true,

      updateStoreSettings: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
        })),
    }),
    {
      name: "atelier_store_settings_v1",
    }
  )
);

