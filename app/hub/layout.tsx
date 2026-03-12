import { Suspense, type ReactNode } from "react";
import Header from "@/components/hub/hub-header";
import HubSidebar from "@/components/hub/hub-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <HubSidebar />
      <SidebarInset className="min-h-svh">
        <div className="sm:mx-8 mx-2 mt-2">
          <Header />
          <Suspense fallback={<div className="py-6">Carregando...</div>}>
            {children}
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
