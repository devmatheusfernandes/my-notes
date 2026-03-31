import { ReactNode } from "react";
import HubSidebar from "@/components/hub/hub-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <HubSidebar />
      <SidebarInset className="min-h-svh">
        <div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
