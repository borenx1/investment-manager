'use client';

import { ChevronsUpDown, Landmark, Loader2, Plus } from 'lucide-react';

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
  const activeAccount = useResourceStore((state) => state.activeAccount);
  const setActiveAccount = useResourceStore((state) => state.setActiveAccount);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AddEditPortfolioAccountDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                disabled={!isPortfolioAccountsLoaded}
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
                <DropdownMenuItem onClick={() => setActiveAccount(null)}>
                  <Landmark />
                  All
                </DropdownMenuItem>
                {portfolioAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => setActiveAccount(account.id)}
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
