import { ReactNode } from "react";
import { RouteGuard } from "@/components/auth/route-guard";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      {children}
    </RouteGuard>
  );
}
