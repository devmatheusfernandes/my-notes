import { Suspense } from "react";
import HubItemsPage from "@/components/hub/hub-items-page";

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <HubItemsPage />
    </Suspense>
  );
}
