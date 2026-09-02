import { describe, expect, it } from "vitest";
import { calculateChecklistProgress, formatCountdown } from "./PreparationDashboard";

describe("PreparationDashboard",()=>{
  it("affiche correctement les semaines et jours",()=>expect(formatCountdown(45)).toBe("6 sem. 3 j."));
  it("calcule la progression sur les seuls items OK",()=>expect(calculateChecklistProgress([{statut:"ok"},{statut:"attention"},{statut:"ok"},{statut:"non_verifie"}])).toBe(50));
  it("gère une checklist vide",()=>expect(calculateChecklistProgress([])).toBe(0));
});
