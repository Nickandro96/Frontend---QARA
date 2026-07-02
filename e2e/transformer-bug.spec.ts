import { test, expect } from "@playwright/test";

// Régression pour un bug critique découvert pendant l'audit (voir docs/audit/02-audit-technique.md, C-07) :
// client/src/lib/trpc.ts déclare `transformer: superjson`, mais server/_core/trpc.ts n'utilise
// explicitement AUCUN transformer ("We DO NOT use superjson transformer here"). superjson.deserialize()
// appelé sur un objet JSON brut (non enveloppé en {json, meta}) retourne silencieusement `undefined`
// (vérifié indépendamment). Résultat : `trpc.auth.me.useQuery()` (et donc `useAuth().isAuthenticated`)
// renvoie systématiquement "non authentifié" côté client, MÊME quand la session serveur est
// parfaitement valide. Ce test le prouve en comparant un fetch brut (qui voit la vraie session)
// à l'état réellement affiché par l'UI React (qui ne la voit jamais).
test("BUG CRITIQUE (C-07) : une session serveur valide n'est jamais reconnue par l'UI (mismatch transformer superjson)", async ({
  page,
}) => {
  const email = `e2e-transformer-${Date.now()}@example.com`;
  const password = "TestE2E1234!";

  await page.goto("/register");
  await page.fill("#name", "Transformer Bug User");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 15_000 });
  await page.waitForTimeout(1500);

  // 1) Le serveur confirme une session valide pour cet utilisateur (preuve que
  //    l'inscription + le cookie fonctionnent correctement à la couche HTTP/session).
  const meViaRawFetch = await page.evaluate(async () => {
    const r = await fetch("http://127.0.0.1:3001/trpc/auth.me", { credentials: "include" });
    return r.json();
  });
  expect(meViaRawFetch?.result?.data?.email, "le serveur doit confirmer une session valide").toBe(email);

  // 2) Pourtant l'UI (qui passe par trpc.auth.me.useQuery(), donc par le transformer
  //    superjson cassé) n'affiche jamais l'utilisateur comme connecté.
  const userMenu = page.locator(`text=${email}`);
  await expect(
    userMenu,
    "si ce test échoue ici alors que l'étape 1 a réussi, c'est la preuve du mismatch de transformer : " +
      "la session est valide côté serveur mais invisible côté client React"
  ).toBeVisible({ timeout: 8_000 });
});
