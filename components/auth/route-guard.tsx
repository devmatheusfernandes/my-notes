"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loading } from "../ui/loading";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith("/signin")) {
      router.push("/signin");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!user && !pathname.startsWith("/signin")) {
    return null;
  }

  return <>{children}</>;
}
