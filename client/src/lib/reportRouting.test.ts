import { describe, expect, it } from "vitest";
import { parseReportAuditId, reportGenerationHref } from "./reportRouting";

describe("report routing", () => {
  it("preserves a valid audit selection", () => {
    expect(parseReportAuditId("34")).toBe(34);
    expect(reportGenerationHref(34)).toBe("/reports/generate?auditId=34");
  });

  it("rejects invalid identifiers", () => {
    expect(parseReportAuditId(null)).toBeNull();
    expect(parseReportAuditId("34x")).toBeNull();
    expect(parseReportAuditId("0")).toBeNull();
    expect(reportGenerationHref(Number.NaN)).toBe("/reports/generate");
  });
});
