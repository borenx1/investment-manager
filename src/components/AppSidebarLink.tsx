'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export default function AppSidebarLink({
  url,
  title,
  icon,
}: {
  url: string;
  title: string;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === url}>
        <Link href={url}>
          {icon || <div className="size-4"></div>}
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
