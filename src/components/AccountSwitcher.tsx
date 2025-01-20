import { ChevronsUpDown, Landmark, Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getPortfolioAccounts } from '@/db/queries';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import AddEditPortfolioAccountDialog from '@/components/AddEditPortfolioAccountDialog';

export default async function AccountSwitcher() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const portfolioAccounts = await getPortfolioAccounts(userId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AddEditPortfolioAccountDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="py-6">
                <Landmark />
                <div className="grid">
                  <span className="truncate text-xs font-bold">Account</span>
                  <span className="truncate">All</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            >
              <DropdownMenuItem>
                <Landmark />
                All
              </DropdownMenuItem>
              {portfolioAccounts.map((account) => (
                <DropdownMenuItem key={account.id}>
                  <div className="size-4"></div>
                  {account.name}
                </DropdownMenuItem>
              ))}
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Plus />
                  New account
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </AddEditPortfolioAccountDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
