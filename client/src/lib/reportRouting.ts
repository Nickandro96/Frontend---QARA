export function parseReportAuditId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const auditId = Number(value);
  return Number.isSafeInteger(auditId) && auditId > 0 ? auditId : null;
}

export function reportGenerationHref(auditId: number | null | undefined): string {
  return Number.isSafeInteger(auditId) && Number(auditId) > 0
    ? `/reports/generate?auditId=${auditId}`
    : "/reports/generate";
}
