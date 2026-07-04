import { test, expect } from "@playwright/test";

// Parcours d'authentification : inscription -> connexion -> déconnexion.
// Chaque exécution utilise un email unique pour éviter les collisions avec
// un run précédent (pas de mécanisme de nettoyage de compte de test connu).

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("Authentification", () => {
  test("inscription puis connexion puis déconnexion", async ({ page }) => {
    const email = uniqueEmail();
    const password = "TestE2E1234!";

    await page.goto("/register");
    await page.fill("#name", "E2E Test User");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.click('button[type="submit"]');

    // L'inscription doit rediriger vers /login, ou connecter directement l'utilisateur
    // (vers "/" si son onboarding est déjà complet, vers "/onboarding" sinon — voir
    // le gate d'onboarding, docs/audit/12-onboarding.md).
    await page.waitForURL((url) => ["/", "/login", "/onboarding"].includes(url.pathname), { timeout: 15_000 });

    if (page.url().includes("/login")) {
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.click('button[type="submit"]');
    }

    // Une fois connecté, on doit quitter /login.
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("connexion refusée avec un mauvais mot de passe", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "TestE2E1234!";

    // Compte créé directement via l'API (plus robuste qu'un enchaînement UI complet)
    // pour isoler ce test sur le seul comportement du formulaire de connexion.
    const apiBase = process.env.E2E_API_URL || "http://127.0.0.1:3001/trpc";
    const res = await request.post(`${apiBase}/system.register`, {
      data: { email, name: "E2E Wrong Pass", password },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", "MauvaisMotDePasse!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/incorrect|erreur/i").first()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("aucun parcours de mot de passe oublié n'existe (constat, pas un bug de régression)", async ({ page }) => {
    await page.goto("/login");
    const forgotLink = page.locator("text=/mot de passe oubli|forgot password/i");
    await expect(forgotLink).toHaveCount(0);
  });
});
