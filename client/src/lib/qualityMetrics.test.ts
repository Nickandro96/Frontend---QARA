import { describe, expect, it } from "vitest";
import { auditProgress, boundedPercentage, qualityDashboardMetrics } from "./qualityMetrics";

describe("quality metrics", () => {
  it("uses the server progression instead of a conformity score", () => {
    expect(auditProgress({ progression: 1.6, conformityRate: 100 })).toBe(1.6);
    expect(auditProgress({ progress: { percentage: 25 } })).toBe(25);
  });

  it("bounds malformed percentages", () => {
    expect(boundedPercentage(Number.NaN)).toBe(0);
    expect(boundedPercentage(-3)).toBe(0);
    expect(boundedPercentage(104)).toBe(100);
  });

  it("prefers the live CAPA cockpit counts", () => {
    expect(qualityDashboardMetrics(
      { scoreGlobal: 82.4, progression: 33, nonConformitiesCount: 9, overdueActions: 8 },
      { stats: { ncOuvertes: 3, capaOuvertes: 2, enRetard: 1 } },
    )).toEqual({
      scoreGlobal: 82.4,
      averageProgression: 33,
      openNonConformities: 3,
      openCapas: 2,
      overdueActions: 1,
    });
  });
});
