import { test, expect } from "@playwright/test";

// Régression pour un bug critique découvert pendant l'audit (voir docs/audit/02-audit-technique.md, C-07) :
// client/src/lib/trpc.ts déclarait `transformer: superjson`, alors que server/_core/trpc.ts n'utilise
// explicitement aucun transformer. superjson.deserialize() appelé sur un objet JSON brut (non enveloppé
// en {json, meta}) retournait silencieusement `undefined` — `trpc.auth.me.useQuery()` (et donc
// `useAuth().isAuthenticated`) renvoyait alors systématiquement "non authentifié" côté client, MÊME
// quand la session serveur était parfaitement valide. Corrigé en retirant le transformer du client.
// Ce test vérifie qu'une session serveur valide est bien reflétée dans l'UI (nom d'utilisateur visible
// dans le menu de la sidebar) — s'il se remet à échouer, c'est que la régression est revenue.
test("une session serveur valide est bien reconnue par l'UI (non-régression C-07)", async ({ page }) => {
  const email = `e2e-transformer-${Date.now()}@example.com`;
  const password = "TestE2E1234!";
  const name = "Transformer Bug User";

  await page.goto("/register");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.click('button[type="submit"]');
  // Un nouvel utilisateur sans périmètre configuré atterrit sur /onboarding (gate
  // d'onboarding, voir docs/audit/12-onboarding.md) — pas de sidebar là-bas ; on
  // navigue explicitement vers "/" pour vérifier la reconnaissance de session
  // dans la sidebar, qui est l'objet réel de ce test de non-régression.
  await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 15_000 });
  await page.waitForTimeout(1500);

  // Le serveur confirme une session valide pour cet utilisateur.
  const meViaRawFetch = await page.evaluate(async () => {
    const r = await fetch("http://127.0.0.1:3001/trpc/auth.me", { credentials: "include" });
    return r.json();
  });
  expect(meViaRawFetch?.result?.data?.email, "le serveur doit confirmer une session valide").toBe(email);

  // L'UI (via trpc.auth.me.useQuery()) doit refléter la même session : le nom de
  // l'utilisateur doit apparaître dans le menu de la sidebar (toujours visible quand
  // isAuthenticated est vrai, contrairement à l'email qui n'apparaît que dropdown ouvert).
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 8_000 });
});
