"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Apenas redireciona se não estiver carregando, não houver usuário logado, e não for a tela de signin
    if (!loading && !user && !pathname.startsWith("/signin")) {
      router.push("/signin");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-500">Verificando sessão...</div>
      </div>
    );
  }

  if (!user && !pathname.startsWith("/signin")) {
    return null; // Evita piscar a tela protegida antes do redirecionamento
  }

  return <>{children}</>;
}
