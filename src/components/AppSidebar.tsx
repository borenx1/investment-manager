import { Suspense } from 'react';
import {
  Banknote,
  CircleDollarSign,
  ChevronsUpDown,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  NotebookPen,
  Settings,
  User,
} from 'lucide-react';

import { auth, signOut } from '@/auth';
import { getPortfolioAccounts } from '@/db/queries';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import AccountSwitcher from '@/components/AccountSwitcher';
import AppSidebarLink from '@/components/AppSidebarLink';

export default async function AppSidebar() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const portfolioAccounts = getPortfolioAccounts(userId);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Suspense
          fallback={
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="py-6">
                  <Landmark />
                  <Loader2 className="animate-spin" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          }
        >
          <AccountSwitcher accounts={portfolioAccounts} />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <AppSidebarLink
                url="/"
                title="Dashboard"
                icon={<LayoutDashboard />}
              />
              <AppSidebarLink
                url="/journal"
                title="Journal"
                icon={<NotebookPen />}
              />
              <AppSidebarLink
                url="/capital"
                title="Capital Changes"
                icon={<Banknote />}
              />
              <AppSidebarLink
                url="/financials"
                title="Financials"
                icon={<CircleDollarSign />}
              />
              <AppSidebarLink
                url="/settings"
                title="Settings"
                icon={<Settings />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User />
                  <span className="truncate">{session?.user?.email}</span>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/login' });
                  }}
                >
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut />
                      Log out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
