"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Building2,
  Factory,
  Truck,
  Receipt,
  BadgeCheck,
} from "lucide-react";
import LogoutButton from "@/app/logout-button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";

const navLinks = [
  { href: "/", label: "受注", icon: ClipboardList },
  { href: "/work-orders", label: "製造指示書", icon: Factory },
  { href: "/deliveries", label: "納品書", icon: Truck },
  { href: "/invoices", label: "請求書", icon: Receipt },
  { href: "/receipts", label: "領収書", icon: BadgeCheck },
  { href: "/companies", label: "顧客", icon: Building2 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="print:hidden">
      <SidebarHeader>
        <p className="px-2 py-1 text-sm font-bold">受発注管理</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <SidebarMenuItem key={link.href}>
                <Link
                  href={link.href}
                  data-active={isActive}
                  className={cn(sidebarMenuButtonVariants())}
                >
                  <Icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LogoutButton className={cn(sidebarMenuButtonVariants())} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
