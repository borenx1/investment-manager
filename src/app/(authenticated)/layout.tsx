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

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
  );
}
