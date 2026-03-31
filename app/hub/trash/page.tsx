import { Suspense } from "react";
import TrashClientPage from "./trash-client-page";
import { Loading } from "@/components/ui/loading";

export default async function TrashPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TrashClientPage />
    </Suspense>
  );
}
