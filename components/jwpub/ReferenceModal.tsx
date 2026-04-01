"use client";

import { Info } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useReaderStore } from "@/store/readerStore";

export function ReferenceModal() {
  const activeReference = useReaderStore((s) => s.activeReference);
  const setActiveReference = useReaderStore((s) => s.setActiveReference);

  return (
    <Drawer
      open={!!activeReference}
      onOpenChange={(open) => !open && setActiveReference(null)}
    >
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg p-6">
          <DrawerHeader>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DrawerTitle className="text-xl">{activeReference?.label}</DrawerTitle>
          </DrawerHeader>
          <div className="py-4">
            {activeReference?.url.startsWith("jwpub://b/") ? (
              <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl my-4">
                <p className="text-sm">
                  O conteúdo da referência Bíblica{" "}
                  <strong>{activeReference?.label}</strong> será exibido aqui em
                  uma atualização futura.
                </p>
              </div>
            ) : (
              <div
                className="jwpub-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: activeReference?.url || "" }}
              />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
