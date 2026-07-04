import { test, expect } from "@playwright/test";
import { registerAndAuthenticate } from "./helpers";

// Parcours "création d'un audit MDR" : inscription, création d'un site,
// création d'un audit, arrivée sur les questions réelles du référentiel MDR.
test("création d'un audit MDR jusqu'à l'affichage de questions réelles", async ({ page }) => {
  await registerAndAuthenticate(page, { name: "E2E MDR User" });

  await page.goto("/mdr/audit", { waitUntil: "domcontentloaded" });

  // Aucun site n'existe encore pour ce nouvel utilisateur -> un bouton dédié ouvre la
  // modale de création de site (attendre le rendu complet du SPA avant de chercher le bouton).
  const createSiteButton = page.getByRole("button", { name: /créer un nouveau site/i }).first();
  await expect(createSiteButton).toBeVisible({ timeout: 15_000 });
  await createSiteButton.click();

  await page.fill("#site-name", "Site E2E Test");
  await page.getByRole("button", { name: "Créer le site" }).click();

  // Une fois le site créé, on doit revenir sur le wizard avec le site sélectionné.
  await expect(page.locator("text=/Nom de l'audit/i")).toBeVisible({ timeout: 15_000 });

  await page.fill('input[placeholder*="Audit MDR"]', "Audit MDR E2E");

  // Champs obligatoires de l'étape 1 (voir isStep1Valid() dans MDRAudit.tsx) : méthode
  // et rôle économique ont déjà une valeur par défaut, il manque scope/date/contacts.
  await page.fill('textarea[placeholder*="périmètre"]', "Périmètre de test E2E");
  await page.fill('input[type="date"]', "2026-08-01");
  await page.fill('input[placeholder*="auditeur responsable" i]', "Auditeur E2E");
  await page.fill('input[placeholder*="contact principal" i]', "Contact E2E");
  await page.fill('input[placeholder*="email" i]', "contact-e2e@example.com");

  // Étape 1 -> 2.
  const step1NextButton = page.getByRole("button", { name: /suivant|continuer/i }).first();
  await expect(step1NextButton).toBeEnabled({ timeout: 10_000 });
  await step1NextButton.click();

  // Étape 2 ("facultatif") -> 3.
  const step2NextButton = page.getByRole("button", { name: /continuer vers l'étape 3/i });
  await expect(step2NextButton).toBeVisible({ timeout: 10_000 });
  await step2NextButton.click();

  // Étape 3 : lancement effectif de l'audit -> on doit finir par voir de vraies questions
  // MDR (826 questions importées en base de test), pas un état vide silencieux.
  const startAuditButton = page.getByRole("button", { name: /créer l'audit|démarrer|lancer/i }).first();
  if (await startAuditButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await startAuditButton.click();
  }

  await expect(page.locator("text=/article|clause|question/i").first()).toBeVisible({ timeout: 20_000 });
});
