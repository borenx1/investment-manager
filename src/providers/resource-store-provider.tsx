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
}: {
  children: React.ReactNode;
  portfolioAccounts?: ResourceStore['portfolioAccounts'];
  assets?: ResourceStore['assets'];
}) {
  const storeRef = useRef<ResourceStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createResourceStore();
  }

  useEffect(() => {
    if (portfolioAccounts) {
      storeRef.current?.getState().setPortfolioAccounts(portfolioAccounts);
    }
    if (assets) {
      storeRef.current?.getState().setAssets(assets);
    }
  }, [portfolioAccounts, assets]);

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
