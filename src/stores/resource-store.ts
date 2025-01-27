import { createStore } from 'zustand/vanilla';

import type { SelectPortfolioAccount, SelectAsset } from '@/db/schema';

export type ResourceState = {
  portfolioAccounts: SelectPortfolioAccount[];
  isPortfolioAccountsLoaded: boolean;
  assets: SelectAsset[];
  isAssetsLoaded: boolean;
  activeAccountId: number | null;
  activeAccount: SelectPortfolioAccount | null;
};

export type ResourceActions = {
  reset: () => void;
  setPortfolioAccounts: (accounts: ResourceState['portfolioAccounts']) => void;
  setAssets: (assets: ResourceState['assets']) => void;
  /**
   * Set the active portfolio account. Set to `null` to select all accounts. If
   * the account ID is does not exist, the active account will be set to `null`.
   * @param accountId The active portfolio account ID (or `null` for all accounts).
   */
  setActiveAccount: (accountId: ResourceState['activeAccountId']) => void;
};

export type ResourceStore = ResourceState & ResourceActions;

function getInitialState(): ResourceState {
  return {
    portfolioAccounts: [],
    isPortfolioAccountsLoaded: false,
    assets: [],
    isAssetsLoaded: false,
    activeAccountId: null,
    activeAccount: null,
  };
}

export function createResourceStore() {
  return createStore<ResourceStore>((set, get) => ({
    ...getInitialState(),
    reset() {
      set(getInitialState());
    },
    setPortfolioAccounts(portfolioAccounts) {
      set({ portfolioAccounts, isPortfolioAccountsLoaded: true });
      const activeAccountId = get().activeAccountId;
      if (activeAccountId !== null) {
        get().setActiveAccount(activeAccountId);
      }
    },
    setAssets(assets) {
      set({ assets, isAssetsLoaded: true });
    },
    setActiveAccount(accountId) {
      if (accountId === null) {
        set({ activeAccountId: null, activeAccount: null });
        return;
      }
      const accounts = get().portfolioAccounts;
      const activeAccount = accounts.find(
        (account) => account.id === accountId,
      );
      if (activeAccount) {
        set({ activeAccountId: accountId, activeAccount });
      } else {
        set({ activeAccountId: null, activeAccount: null });
      }
    },
  }));
}
