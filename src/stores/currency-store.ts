import { createStore } from 'zustand/vanilla';

export type CurrencyState = {
  apiCurrencies: Record<string, string>;
  isCurrenciesLoaded: boolean;
};

export type CurrencyActions = {
  reset: () => void;
  setApiCurrencies: (currencies: CurrencyState['apiCurrencies']) => void;
  isCurrencySupported: (ticker: string | null | undefined) => boolean;
};

export type CurrencyStore = CurrencyState & CurrencyActions;

function getInitialState(): CurrencyState {
  return {
    apiCurrencies: {},
    isCurrenciesLoaded: false,
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
  }));
}
