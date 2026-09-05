import { describe, expect, it } from "vitest";
import { closedActionRate, uniqueHeatmapRows } from "./analyticsMetrics";

describe("analytics metrics", () => {
  it("uses the backend closed status", () => {
    expect(closedActionRate(8, 3)).toBe(37.5);
    expect(closedActionRate(0, 0)).toBe(0);
  });

  it("derives heatmap rows from real data", () => {
    expect(uniqueHeatmapRows([{ row: "CAPA" }, { row: "Achats" }, { row: "CAPA" }])).toEqual(["CAPA", "Achats"]);
  });
});
