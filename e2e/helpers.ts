import type { Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_URL || "http://127.0.0.1:3001/trpc";
const APP_ORIGIN = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/**
 * Crée un compte et authentifie la page, en passant par un fetch() exécuté
 * dans la page elle-même (page.evaluate) plutôt que par l'API request context
 * de Playwright : c'est le seul mécanisme qui s'est avéré fiable pour que le
 * cookie de session posé par le serveur (Set-Cookie secure=true, sameSite=none)
 * soit ensuite correctement renvoyé par le navigateur sur les requêtes suivantes.
 */
export async function registerAndAuthenticate(page: Page, opts?: { name?: string }) {
  const email = uniqueEmail();
  const password = "TestE2E1234!";
  const name = opts?.name || "E2E Test User";

  await page.goto(APP_ORIGIN, { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(
    async ({ apiBase, email, name, password }) => {
      const r = await fetch(`${apiBase}/system.register`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      return { status: r.status, body: await r.text() };
    },
    { apiBase: API_BASE, email, name, password }
  );

  if (result.status !== 200) {
    throw new Error(`system.register failed: ${result.status} ${result.body}`);
  }

  return { email, password, name, openId: `local_${email}` };
}
