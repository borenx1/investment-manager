import { createStore } from 'zustand/vanilla';

import type { SelectPortfolioAccount, SelectAsset } from '@/db/schema';

export type ResourceState = {
  portfolioAccounts: SelectPortfolioAccount[];
  isPortfolioAccountsLoaded: boolean;
  assets: SelectAsset[];
  isAssetsLoaded: boolean;
  activeAccount: number | null;
};

export type ResourceActions = {
  reset: () => void;
  setPortfolioAccounts: (accounts: ResourceState['portfolioAccounts']) => void;
  setAssets: (assets: ResourceState['assets']) => void;
  /**
   * Set the active portfolio account. Set to `null` to select all accounts.
   * @param accountId The active portfolio account ID (or `null` for all accounts).
   */
  setActiveAccount: (accountId: ResourceState['activeAccount']) => void;
};

export type ResourceStore = ResourceState & ResourceActions;

function getInitialState(): ResourceState {
  return {
    portfolioAccounts: [],
    isPortfolioAccountsLoaded: false,
    assets: [],
    isAssetsLoaded: false,
    activeAccount: null,
  };
}

export function createResourceStore(initialState?: Partial<ResourceState>) {
  return createStore<ResourceStore>((set) => ({
    ...getInitialState(),
    ...initialState,
    reset() {
      set(getInitialState());
    },
    setPortfolioAccounts(portfolioAccounts) {
      set({ portfolioAccounts, isPortfolioAccountsLoaded: true });
    },
    setAssets(assets) {
      set({ assets, isAssetsLoaded: true });
    },
    setActiveAccount(accountId) {
      set({ activeAccount: accountId });
    },
  }));
}
