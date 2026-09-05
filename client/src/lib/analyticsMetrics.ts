export function closedActionRate(totalActions: unknown, closedActions: unknown): number {
  const total = Number(totalActions);
  const closed = Number(closedActions);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(closed)) return 0;
  return Math.round(Math.min(100, Math.max(0, closed * 100 / total)) * 10) / 10;
}

export function uniqueHeatmapRows(items: Array<{ row: string }>): string[] {
  return Array.from(new Set(items.map((item) => item.row).filter(Boolean)));
}
