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
  apiCurrencies,
}: {
  children: React.ReactNode;
  apiCurrencies?: CurrencyStore['apiCurrencies'];
}) {
  const storeRef = useRef<CurrencyStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createCurrencyStore();
  }

  useEffect(() => {
    storeRef.current?.getState().fetchLatestDate();
  }, []);

  useEffect(() => {
    if (apiCurrencies) {
      storeRef.current?.getState().setApiCurrencies(apiCurrencies);
    }
  }, [apiCurrencies]);

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
