export function previewPageItems(currentPage: number, totalPages: number): Array<number | null> {
  if (!Number.isInteger(totalPages) || totalPages <= 0) return [];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const current = Math.min(totalPages, Math.max(1, Math.trunc(currentPage) || 1));
  const pages = new Set([1, totalPages]);
  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page);
  }
  const ordered = [...pages].sort((left, right) => left - right);
  const items: Array<number | null> = [];
  ordered.forEach((page, index) => {
    if (index && page - ordered[index - 1] > 1) items.push(null);
    items.push(page);
  });
  return items;
}
