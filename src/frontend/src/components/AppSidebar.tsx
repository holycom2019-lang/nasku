import { StorageGauge } from "@/components/StorageGauge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useFolderContents } from "@/hooks/useQueries";
import { ROOT_FOLDER_ID } from "@/types";
import { Link, useLocation } from "@tanstack/react-router";
import { Activity, FolderOpen, HardDrive, Home, Share2 } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/files", label: "File Saya", icon: FolderOpen },
  { to: "/sharing", label: "Berbagi", icon: Share2 },
  { to: "/activity", label: "Riwayat Aktivitas", icon: Activity },
] as const;

const TOTAL_STORAGE = 4n * 1024n * 1024n * 1024n * 1024n; // 4 TB

export function AppSidebar() {
  const { pathname } = useLocation();
  const { data } = useFolderContents(ROOT_FOLDER_ID);
  const used = (data?.files ?? []).reduce((acc, file) => acc + file.size, 0n);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="gradient-primary flex size-8 items-center justify-center rounded-lg">
            <HardDrive className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">Nasku</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={pathname === item.to}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg border bg-card p-3">
          <StorageGauge used={used} total={TOTAL_STORAGE} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
