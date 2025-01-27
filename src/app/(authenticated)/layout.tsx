import { auth } from '@/auth';
import { getAssets, getPortfolioAccounts } from '@/db/queries';
import { ResourceStoreProvider } from '@/providers/resource-store-provider';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import AppSidebar from '@/components/AppSidebar';
import DarkModeToggle from '@/components/DarkModeToggle';

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const [portfolioAccounts, assets] = await Promise.all([
    getPortfolioAccounts(userId),
    getAssets(userId),
  ]);

  return (
    <ResourceStoreProvider
      portfolioAccounts={portfolioAccounts}
      assets={assets}
    >
      <SidebarProvider>
        <AppSidebar />
        {/* Flex makes min width auto, must override to 0 again to preserve behaviour. */}
        <SidebarInset className="min-w-0">
          <header className="flex items-center border-b px-4 py-2 sm:px-16 sm:pl-4">
            <SidebarTrigger />
            <NavigationMenu className="ml-auto">
              <NavigationMenuList className="ml-2">
                <NavigationMenuItem>
                  <DarkModeToggle />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ResourceStoreProvider>
  );
}
