import { ReactNode } from "react";
import Header from "@/components/hub/hub-header";
import HubSidebar from "@/components/hub/hub-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RouteGuard } from "@/components/auth/route-guard";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <SidebarProvider>
        <HubSidebar />
        <SidebarInset className="min-h-svh">
          <div className="sm:mx-8 mx-2 mt-2">
            <Header />
              {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RouteGuard>
  );
}
