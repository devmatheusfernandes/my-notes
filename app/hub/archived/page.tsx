import ArchivedClientPage from "./archived-client-page";

export default async function ArchivedPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50/50 dark:bg-[#121212]">
      <ArchivedClientPage />
    </div>
  );
}
