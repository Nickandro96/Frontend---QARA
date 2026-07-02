import { test, expect } from "@playwright/test";
import { registerAndAuthenticate } from "./helpers";

// Teste le moteur de classification MDR (server/classification-router.ts) au niveau API
// directement (plutôt qu'en pilotant le wizard multi-étapes de Classification.tsx, trop
// fragile pour un test de non-régression fiable) avec des cas dont la classe attendue est
// connue au regard de l'Annexe VIII du règlement (UE) 2017/745. Utilise fetch direct
// (pas le client trpc/superjson du front) pour ne pas dépendre du bug C-07 documenté dans
// 02-audit-technique.md.
//
// NB : le code de classification-router.ts implémente sa propre lecture des règles
// (commentaires citant les numéros de règle Annexe VIII) — la conformité exacte de ce
// mapping au texte réglementaire est traitée séparément dans 04-contenu-reglementaire.md.
// Ces tests vérifient la classe RENVOYÉE PAR LE CODE pour des cas caractéristiques, comme
// socle de non-régression (si quelqu'un modifie la logique et change silencieusement une
// classe attendue, ce test doit le détecter).

const API_BASE = process.env.E2E_API_URL || "http://127.0.0.1:3001/trpc";

async function classify(page: import("@playwright/test").Page, answers: Record<string, unknown>) {
  const result = await page.evaluate(
    async ({ apiBase, answers }) => {
      const r = await fetch(`${apiBase}/classification.classify`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      });
      return { status: r.status, body: await r.json() };
    },
    { apiBase: API_BASE, answers }
  );
  return result;
}

test.describe("Classification DM (MDR Annexe VIII) — cas connus", () => {
  test("dispositif non invasif simple, sans fonction spéciale -> Classe I", async ({ page }) => {
    await registerAndAuthenticate(page);
    const res = await classify(page, {
      device_type: "dm",
      is_active: false,
      is_software: false,
      invasiveness: "non-invasif",
      implantable: false,
      contact_nervous_system: false,
      contact_circulatory_system: false,
      function: [],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body?.result?.data?.resultingClass).toBe("I");
  });

  test("logiciel d'aide à la décision clinique, impact non critique -> Classe IIa (Règle 11)", async ({ page }) => {
    await registerAndAuthenticate(page);
    const res = await classify(page, {
      device_type: "dm",
      is_active: true,
      is_software: true,
      danger_level: "normal",
      software_purpose: ["diagnostic"],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body?.result?.data?.resultingClass).toBe("IIa");
  });

  test("logiciel dont les décisions peuvent causer un préjudice grave -> au moins Classe IIb (Règle 11)", async ({
    page,
  }) => {
    await registerAndAuthenticate(page);
    const res = await classify(page, {
      device_type: "dm",
      is_active: true,
      is_software: true,
      danger_level: "potentiellement_dangereux",
      software_purpose: ["diagnostic"],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body?.result?.data?.resultingClass).toBe("IIb");
  });

  test("dispositif implantable -> au moins Classe IIb (Règle 8)", async ({ page }) => {
    await registerAndAuthenticate(page);
    const res = await classify(page, {
      device_type: "dm",
      is_active: false,
      is_software: false,
      invasiveness: "chirurgical",
      implantable: true,
      contact_nervous_system: false,
      contact_circulatory_system: false,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(["IIb", "III"]).toContain(res.body?.result?.data?.resultingClass);
  });

  test("dispositif en contact avec le système nerveux central -> Classe III (Règle 8)", async ({ page }) => {
    await registerAndAuthenticate(page);
    const res = await classify(page, {
      device_type: "dm",
      is_active: false,
      is_software: false,
      invasiveness: "chirurgical",
      implantable: true,
      contact_nervous_system: true,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body?.result?.data?.resultingClass).toBe("III");
  });
});
