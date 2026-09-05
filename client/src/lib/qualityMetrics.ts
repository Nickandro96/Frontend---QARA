export function boundedPercentage(value: unknown): number {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed * 10) / 10));
}

export function auditProgress(audit: any): number {
  if (audit?.progression != null) return boundedPercentage(audit.progression);
  if (typeof audit?.progress === "number" || typeof audit?.progress === "string") {
    return boundedPercentage(audit.progress);
  }
  return boundedPercentage(audit?.progress?.percentage);
}

export function qualityDashboardMetrics(kpis: any, capaDashboard: any) {
  const stats = capaDashboard?.stats ?? {};
  return {
    scoreGlobal: boundedPercentage(kpis?.scoreGlobal),
    averageProgression: boundedPercentage(kpis?.progression),
    openNonConformities: Math.max(0, Number(stats.ncOuvertes ?? kpis?.openFindings ?? kpis?.nonConformitiesCount ?? 0) || 0),
    openCapas: Math.max(0, Number(stats.capaOuvertes ?? 0) || 0),
    overdueActions: Math.max(0, Number(stats.enRetard ?? kpis?.overdueActions ?? 0) || 0),
  };
}
