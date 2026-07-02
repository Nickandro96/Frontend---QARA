import { test, expect } from "@playwright/test";
import { registerAndAuthenticate } from "./helpers";

// Parcours "création d'un audit MDR" : inscription, création d'un site,
// création d'un audit, arrivée sur les questions réelles du référentiel MDR.
//
// ÉTAT CONNU : ce test échoue actuellement dès l'arrivée sur /mdr/audit, qui affiche
// "Authentification requise" malgré une session serveur valide. Ce n'est pas un défaut
// du test : c'est une conséquence directe du bug critique C-07 documenté dans
// docs/audit/02-audit-technique.md et reproduit isolément dans transformer-bug.spec.ts
// (mismatch du transformer tRPC superjson entre client et serveur). Ce test sert de
// socle de non-régression pour le parcours de création d'audit MDR : il doit se remettre
// à passer automatiquement une fois C-07 corrigé, sans modification nécessaire ici.
test("création d'un audit MDR jusqu'à l'affichage de questions réelles", async ({ page }) => {
  await registerAndAuthenticate(page, { name: "E2E MDR User" });

  await page.goto("/mdr/audit", { waitUntil: "domcontentloaded" });

  // Aucun site n'existe encore pour ce nouvel utilisateur -> la modale de création de site
  // doit apparaître (soit automatiquement, soit via le bouton dédié).
  const createSiteButton = page.getByRole("button", { name: /créer.*site/i }).first();
  if (await createSiteButton.isVisible().catch(() => false)) {
    await createSiteButton.click();
  }

  await page.fill("#site-name", "Site E2E Test");
  await page.getByRole("button", { name: "Créer le site" }).click();

  // Une fois le site créé, on doit revenir sur le wizard avec le site sélectionné.
  await expect(page.locator("text=/Nom de l'audit/i")).toBeVisible({ timeout: 15_000 });

  await page.fill('input[placeholder*="Audit MDR"]', "Audit MDR E2E");

  // Étape suivante du wizard.
  const nextButton = page.getByRole("button", { name: /suivant|continuer|créer l'audit/i }).first();
  await nextButton.click();

  // On doit finir par voir de vraies questions MDR (826 questions importées en base de test),
  // pas un état vide silencieux.
  await expect(page.locator("text=/article|clause|question/i").first()).toBeVisible({ timeout: 20_000 });
});
