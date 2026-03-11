export function formatDateToLocale(isoString?: string) {
  if (!isoString) return "HOJE";
  const date = new Date(isoString);
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}
