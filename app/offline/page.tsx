"use client";

import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleHome = () => {
    router.push("/hub/items");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md space-y-8"
      >
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 rounded-3xl bg-muted flex items-center justify-center border border-border shadow-2xl">
            <WifiOff className="w-12 h-12 text-muted-foreground/50" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Você está offline</h1>
          <p className="text-muted-foreground text-lg">
            Parece que sua conexão com a internet caiu. Algumas funcionalidades 
            podem não estar disponíveis no momento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4">
          <Button 
            onClick={handleRetry} 
            className="h-12 rounded-xl gap-2 shadow-lg hover:shadow-primary/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Button 
            variant="outline" 
            onClick={handleHome}
            className="h-12 rounded-xl gap-2"
          >
            <Home className="w-4 h-4" />
            Ver Notas Salvas
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-8">
          Suas notas e vídeos visualizados recentemente são salvos automaticamente 
          para acesso offline.
        </p>
      </motion.div>
    </div>
  );
}
