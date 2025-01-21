'use client';

import { createContext, useContext, useState } from 'react';

export const ActiveAccountContext = createContext<number | null>(null);
export const SelectAccountContext = createContext<
  ((accountId: number | null) => void) | null
>(null);

export function ActiveAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accountId, setAccountId] = useState<number | null>(null);

  return (
    <ActiveAccountContext.Provider value={accountId}>
      <SelectAccountContext.Provider value={setAccountId}>
        {children}
      </SelectAccountContext.Provider>
    </ActiveAccountContext.Provider>
  );
}

/**
 * Hook to get the active portfolio account and a function to set it. Set to
 * `null` to select all accounts.
 * @returns The active portfolio account ID (or `null` for all accounts) and a
 * function to set it.
 */
export function useActiveAccount() {
  const activeAccount = useContext(ActiveAccountContext);
  const selectAccount = useContext(SelectAccountContext);
  if (!selectAccount) {
    throw new Error(
      'useActiveAccount must be used within an ActiveAccountProvider',
    );
  }
  return [activeAccount, selectAccount] as const;
}
