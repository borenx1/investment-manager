'use client';

import { useEffect, useMemo } from 'react';
import { ChevronsUpDown, Landmark, Loader2, Plus } from 'lucide-react';

import { useActiveAccount } from '@/lib/context/ActiveAccountContext';
import { useResourceStore } from '@/providers/resource-store-provider';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import AddEditPortfolioAccountDialog from '@/components/AddEditPortfolioAccountDialog';

export default function AccountSwitcher() {
  const portfolioAccounts = useResourceStore(
    (state) => state.portfolioAccounts,
  );
  const isPortfolioAccountsLoaded = useResourceStore(
    (state) => state.isPortfolioAccountsLoaded,
  );
  const [activeAccountId, selectAccount] = useActiveAccount();
  const activeAccount = useMemo(() => {
    return activeAccountId !== null
      ? (portfolioAccounts.find((account) => account.id === activeAccountId) ??
          null)
      : null;
  }, [activeAccountId, portfolioAccounts]);

  // Prevent selecting an account that doesn't exist.
  useEffect(() => {
    if (activeAccountId !== null && !activeAccount) {
      selectAccount(null);
    }
  }, [activeAccountId, activeAccount, selectAccount]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AddEditPortfolioAccountDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                disabled={!isPortfolioAccountsLoaded}
                className="py-6"
              >
                <Landmark />
                {isPortfolioAccountsLoaded ? (
                  <>
                    <div className="grid">
                      <span className="truncate text-xs font-bold">
                        Account
                      </span>
                      {activeAccount ? (
                        <span className="truncate italic">
                          {activeAccount.name}
                        </span>
                      ) : (
                        <span className="truncate">All</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </>
                ) : (
                  <Loader2 className="animate-spin" />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => selectAccount(null)}>
                  <Landmark />
                  All
                </DropdownMenuItem>
                {portfolioAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => selectAccount(account.id)}
                  >
                    <div className="size-4"></div>
                    {account.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <Plus />
                    New account
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </AddEditPortfolioAccountDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
