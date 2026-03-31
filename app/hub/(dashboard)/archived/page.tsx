import { Suspense } from "react";
import ArchivedClientPage from "./archived-client-page";
import { Loading } from "@/components/ui/loading";

export default async function ArchivedPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ArchivedClientPage />
    </Suspense>
  );
}
