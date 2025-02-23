import { createStore } from 'zustand/vanilla';
import { z } from 'zod';

import { getLatestDate } from '@/lib/actions/api';

export type CurrencyState = {
  apiCurrencies: Record<string, string>;
  isCurrenciesLoaded: boolean;
  /**
   * The latest date of the currency exchange API, in YYYY-MM-DD format. This
   * is the empty string if not checked yet.
   */
  latestDate: string;
};

export type CurrencyActions = {
  reset: () => void;
  setApiCurrencies: (currencies: CurrencyState['apiCurrencies']) => void;
  isCurrencySupported: (ticker: string | null | undefined) => boolean;
  setLatestDate: (date: string) => void;
  fetchLatestDate: () => Promise<string>;
};

export type CurrencyStore = CurrencyState & CurrencyActions;

function getInitialState(): CurrencyState {
  return {
    apiCurrencies: {},
    isCurrenciesLoaded: false,
    latestDate: '',
  };
}

export function createCurrencyStore() {
  return createStore<CurrencyStore>()((set, get) => ({
    ...getInitialState(),
    reset() {
      set(getInitialState());
    },
    setApiCurrencies(currencies) {
      set({
        apiCurrencies: currencies,
        isCurrenciesLoaded: true,
      });
    },
    /**
     * Check if a currency is supported by the currency API.
     * @param ticker The ticker of the currency to check.
     * @returns The currency is supported.
     */
    isCurrencySupported(ticker) {
      if (!ticker) {
        return false;
      }
      return ticker.toLowerCase() in get().apiCurrencies;
    },
    setLatestDate(date) {
      // YYYY-MM-DD format.
      const parsedDate = z.string().date().safeParse(date);
      if (parsedDate.success) {
        set({ latestDate: parsedDate.data });
      }
    },
    async fetchLatestDate() {
      const latestDate = await getLatestDate();
      set({ latestDate });
      return latestDate;
    },
  }));
}
