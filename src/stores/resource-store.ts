import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

import type { SelectPortfolioAccount, SelectAsset } from '@/db/schema';

export type ResourceState = {
  isResourcesLoaded: boolean;
  portfolioAccounts: SelectPortfolioAccount[];
  isPortfolioAccountsLoaded: boolean;
  assets: SelectAsset[];
  isAssetsLoaded: boolean;
  accountingCurrency: SelectAsset | null;
  isAccountingCurrencyLoaded: boolean;
  activeAccountId: number | null;
  activeAccount: SelectPortfolioAccount | null;
};

export type ResourceActions = {
  reset: () => void;
  setPortfolioAccounts: (accounts: ResourceState['portfolioAccounts']) => void;
  setAssets: (assets: ResourceState['assets']) => void;
  setAccountingCurrency: (asset: ResourceState['accountingCurrency']) => void;
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
    isResourcesLoaded: false,
    portfolioAccounts: [],
    isPortfolioAccountsLoaded: false,
    assets: [],
    isAssetsLoaded: false,
    accountingCurrency: null,
    isAccountingCurrencyLoaded: false,
    activeAccountId: null,
    activeAccount: null,
  };
}

export function createResourceStore() {
  return createStore<ResourceStore>()(
    persist(
      (set, get) => ({
        ...getInitialState(),
        reset() {
          set(getInitialState());
        },
        setPortfolioAccounts(portfolioAccounts) {
          set((state) => ({
            portfolioAccounts,
            isPortfolioAccountsLoaded: true,
            isResourcesLoaded: state.isAssetsLoaded && state.isAccountingCurrencyLoaded,
          }));
          // Reset the active account to deselect an account that doesn't exist.
          const activeAccountId = get().activeAccountId;
          if (activeAccountId !== null) {
            get().setActiveAccount(activeAccountId);
          }
        },
        setAssets(assets) {
          set((state) => ({
            assets,
            isAssetsLoaded: true,
            isResourcesLoaded: state.isPortfolioAccountsLoaded && state.isAccountingCurrencyLoaded,
          }));
        },
        setAccountingCurrency(asset) {
          set((state) => ({
            accountingCurrency: asset,
            isAccountingCurrencyLoaded: true,
            isResourcesLoaded: state.isPortfolioAccountsLoaded && state.isAssetsLoaded,
          }));
        },
        setActiveAccount(accountId) {
          if (accountId === null) {
            set({ activeAccountId: null, activeAccount: null });
            return;
          }
          set((state) => {
            const accounts = state.portfolioAccounts;
            const activeAccount = accounts.find((account) => account.id === accountId);
            if (activeAccount) {
              return { activeAccountId: accountId, activeAccount };
            }
            return { activeAccountId: null, activeAccount: null };
          });
        },
      }),
      {
        name: 'resource-store',
        partialize: (state) => ({
          activeAccountId: state.activeAccountId,
          activeAccount: state.activeAccount,
        }),
      },
    ),
  );
}
