import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "@tanstack/react-router";

/**
 * Three-pane application shell: fixed sidebar, header with breadcrumb and
 * search, and a fluid content area rendered through the router Outlet.
 */
export function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
