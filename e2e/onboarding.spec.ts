import { test, expect } from "@playwright/test";
import { registerAndAuthenticate } from "./helpers";

// Parcours onboarding complet : sélection des référentiels (raccourci "DM Europe"),
// sélection du rôle, aperçu chiffré, lancement -> arrivée sur de vraies questions.
test("onboarding : sélection du périmètre jusqu'au démarrage de l'audit filtré", async ({ page }) => {
  await registerAndAuthenticate(page, { name: "E2E Onboarding User" });

  await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

  await expect(page.locator("text=/Quels référentiels visez-vous/i")).toBeVisible({ timeout: 15_000 });

  // Raccourci "DM Europe" -> MDR + ISO13485 + ISO14971.
  await page.getByRole("button", { name: "DM Europe" }).click();

  // Le compteur live doit refléter une sélection non vide avant de continuer.
  const step1Continue = page.getByRole("button", { name: "Continuer" });
  await expect(step1Continue).toBeEnabled({ timeout: 10_000 });
  await step1Continue.click();

  await expect(page.locator("text=/Quel est votre rôle/i")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Fabricant/i }).first().click();

  const step2Continue = page.getByRole("button", { name: "Continuer" });
  await expect(step2Continue).toBeEnabled({ timeout: 10_000 });
  await step2Continue.click();

  // Pas de MDSAP sélectionné -> étape Marchés sautée -> direction Aperçu.
  await expect(page.locator("text=/Votre audit personnalisé est prêt/i")).toBeVisible({ timeout: 10_000 });

  const startButton = page.getByRole("button", { name: /Démarrer mon audit/i });
  await expect(startButton).toBeEnabled({ timeout: 10_000 });
  await startButton.click();

  // Redirection vers le parcours de questions réelles (audit multi-référentiel filtré).
  await expect(page).toHaveURL(/\/mdr\/audit\/\d+/, { timeout: 15_000 });
  await expect(page.locator("text=/article|clause|question/i").first()).toBeVisible({ timeout: 20_000 });
});
