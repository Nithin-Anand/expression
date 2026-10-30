export function formatDate(date: Date | string, monthOnly = false): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: monthOnly ? undefined : "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
