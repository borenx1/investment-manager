'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import {
  createCurrencyStore,
  type CurrencyStore,
} from '@/stores/currency-store';

type CurrencyStoreApi = ReturnType<typeof createCurrencyStore>;

const CurrencyStoreContext = createContext<CurrencyStoreApi | null>(null);

export function CurrencyStoreProvider({
  children,
  supportedCurrencies,
}: {
  children: React.ReactNode;
  supportedCurrencies?: CurrencyStore['supportedCurrencies'];
}) {
  const storeRef = useRef<CurrencyStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createCurrencyStore();
  }

  useEffect(() => {
    if (supportedCurrencies) {
      storeRef.current?.getState().setSupportedCurrencies(supportedCurrencies);
    }
  }, [supportedCurrencies]);

  return (
    <CurrencyStoreContext.Provider value={storeRef.current}>
      {children}
    </CurrencyStoreContext.Provider>
  );
}

export function useCurrencyStore<T>(selector: (store: CurrencyStore) => T) {
  const currencyStoreContext = useContext(CurrencyStoreContext);
  if (!currencyStoreContext) {
    throw new Error(
      'useCurrencyStore must be used within a CurrencyStoreProvider',
    );
  }
  return useStore(currencyStoreContext, selector);
}
