"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function SignIn() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      router.push("/hub/items");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      await authService.logInWithGoogle();
      toast.success("Login successful!");
      router.push("/hub/items");
    } catch {
      toast.error("Failed to sign in with Google.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Sign In
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Welcome back! Please sign in to continue.
        </p>
        <Button
          variant="default"
          size="lg"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Entrar com Google"}
        </Button>
      </div>
    </div>
  );
}
