import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "USD" | "KHR";

interface CurrencyState {
  currency: Currency;
  exchangeRate: number; // 1 USD = 4100 KHR
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountInUsd: number) => string;
  convertAmount: (amountInUsd: number) => number;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      exchangeRate: 4100,

      setCurrency: (currency: Currency) => set({ currency }),

      convertAmount: (amountInUsd: number) => {
        const amt = Number(amountInUsd) || 0;
        if (get().currency === "KHR") {
          return Math.round(amt * get().exchangeRate);
        }
        return Number(amt.toFixed(2));
      },

      formatPrice: (amountInUsd: number) => {
        const amt = Number(amountInUsd) || 0;
        if (get().currency === "KHR") {
          const khr = Math.round(amt * get().exchangeRate);
          return `${khr.toLocaleString()} ៛`;
        }
        return `$${amt.toFixed(2)}`;
      },
    }),
    {
      name: "atelier_currency",
    }
  )
);

