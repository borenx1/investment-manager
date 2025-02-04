'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import {
  createResourceStore,
  type ResourceStore,
} from '@/stores/resource-store';

type ResourceStoreApi = ReturnType<typeof createResourceStore>;

export const ResourceStoreContext = createContext<ResourceStoreApi | null>(
  null,
);

export function ResourceStoreProvider({
  children,
  portfolioAccounts,
  assets,
  accountingCurrency,
}: {
  children: React.ReactNode;
  portfolioAccounts?: ResourceStore['portfolioAccounts'];
  assets?: ResourceStore['assets'];
  accountingCurrency?: ResourceStore['accountingCurrency'];
}) {
  const storeRef = useRef<ResourceStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createResourceStore();
  }

  useEffect(() => {
    if (portfolioAccounts) {
      storeRef.current?.getState().setPortfolioAccounts(portfolioAccounts);
    }
  }, [portfolioAccounts]);
  useEffect(() => {
    if (assets) {
      storeRef.current?.getState().setAssets(assets);
    }
  }, [assets]);
  useEffect(() => {
    if (accountingCurrency !== undefined) {
      storeRef.current?.getState().setAccountingCurrency(accountingCurrency);
    }
  }, [accountingCurrency]);

  return (
    <ResourceStoreContext.Provider value={storeRef.current}>
      {children}
    </ResourceStoreContext.Provider>
  );
}

export function useResourceStore<T>(selector: (store: ResourceStore) => T) {
  const resourceStoreContext = useContext(ResourceStoreContext);
  if (!resourceStoreContext) {
    throw new Error(
      'useResourceStore must be used within a ResourceStoreProvider',
    );
  }
  return useStore(resourceStoreContext, selector);
}
