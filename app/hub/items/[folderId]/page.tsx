import { Suspense } from "react";
import HubItemsPage from "@/components/hub/hub-items-page";
import { Loading } from "@/components/ui/loading";

export default function FolderItemsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HubItemsPage />
    </Suspense>
  );
}
