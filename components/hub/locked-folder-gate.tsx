"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";

export default function LockedFolderGate({ folderId }: { folderId: string }) {
  const router = useRouter();
  const [unlockOpen, setUnlockOpen] = useState(true);

  return (
    <>
      <div className="mt-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Pasta trancada. Destranque para acessar o conteúdo.
      </div>
      <UnlockDrawer
        open={unlockOpen}
        onOpenChange={(open) => {
          if (open) {
            setUnlockOpen(true);
            return;
          }

          setUnlockOpen(false);
          router.push("/hub/items");
        }}
        item={{ kind: "folder", id: folderId }}
        onUnlocked={() => {}}
      />
    </>
  );
}
