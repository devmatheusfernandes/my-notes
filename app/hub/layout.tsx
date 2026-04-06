import { ReactNode } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { SWRProvider } from "@/components/providers/swr-provider";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <SWRProvider>{children}</SWRProvider>
    </RouteGuard>
  );
}
