import { ReactNode } from "react";
import HubSidebar from "@/components/hub/hub-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <HubSidebar />
      <div className="flex flex-1 flex-col w-full h-screen bg-background">
        {children}
      </div>
    </SidebarProvider>
  );
}
