import { createStore } from 'zustand/vanilla';

export type CurrencyState = {
  supportedCurrencies: Record<string, string>;
  isCurrenciesLoaded: boolean;
};

export type CurrencyActions = {
  reset: () => void;
  setSupportedCurrencies: (
    currencies: CurrencyState['supportedCurrencies'],
  ) => void;
};

export type CurrencyStore = CurrencyState & CurrencyActions;

function getInitialState(): CurrencyState {
  return {
    supportedCurrencies: {},
    isCurrenciesLoaded: false,
  };
}

export function createCurrencyStore() {
  return createStore<CurrencyStore>()((set) => ({
    ...getInitialState(),
    reset() {
      set(getInitialState());
    },
    setSupportedCurrencies(currencies) {
      set({
        supportedCurrencies: currencies,
        isCurrenciesLoaded: true,
      });
    },
  }));
}
