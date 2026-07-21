import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:5173";
const results = [];
const dir = "/tmp/claude-0/-home-user/4499258c-b00c-5c14-8589-d80b08bf524f/scratchpad/pw-test/results";

function record(name, status, detail) {
  results.push({ name, status, detail });
  console.log(`[${status}] ${name} — ${detail}`);
}
async function shot(page, name) {
  try { await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true }); } catch {}
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();
const networkTrpcErrors = [];
page.on("response", (res) => {
  if (res.url().includes("/trpc/") && res.status() >= 400) networkTrpcErrors.push(`${res.status()} ${res.url()}`);
});

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "test-reconciliation@example.com");
  await page.fill('input[type="password"]', "TestPassword123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  record("Login compte existant (avec audits réels)", "INFO", `Redirection initiale: ${page.url()} (onboarding = état client-only, localStorage vide dans ce contexte navigateur frais — pas un bug, contournement ci-dessous)`);
  if (page.url().includes("/onboarding")) {
    await page.waitForTimeout(800);
    await page.locator("text=MDR").first().click();
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Fabricant")');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("UE")');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Ouvrir le dashboard")');
    await page.waitForTimeout(1500);
  }

  // Mes Audits
  await page.goto(`${BASE}/audits`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "20-mes-audits-real-account");
  const rows = await page.locator("table tbody tr").count();
  const bodyTxt = (await page.textContent("body")) || "";
  record("Mes Audits (compte avec 2 audits réels en base)", rows > 0 ? "PASS" : "FAIL", `${rows} lignes trouvées. Erreurs tRPC: ${JSON.stringify(networkTrpcErrors)}. Extrait texte: ${bodyTxt.slice(0,300)}`);

  // Audit history / resume
  await page.goto(`${BASE}/audit-history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "21-audit-history-real-account");
  const histRows = await page.locator("table tbody tr, [class*='card']").count();
  const resumeBtn = page.locator('button:has-text("Reprendre"), button:has-text("Continuer"), a:has-text("Reprendre")').first();
  const hasResume = (await resumeBtn.count()) > 0;
  record("Audit History — affichage", histRows > 0 ? "PASS" : "FAIL", `éléments détectés: ${histRows}`);

  if (hasResume) {
    const respPromise = page.waitForResponse(r => r.url().includes("createOrUpdateAuditDraft") || r.url().includes("getAuditContext"), { timeout: 5000 }).catch(() => null);
    await resumeBtn.click();
    await page.waitForTimeout(1500);
    const resp = await respPromise;
    await shot(page, "22-resume-clicked");
    // Check: did the MDR wizard show step1 EMPTY (bug: treated as new) or did it jump to step 2/3 with existing data?
    const stepText = (await page.textContent("body")) || "";
    const onStep1WithEmptyFields = await page.locator('input[placeholder="Nom de l\'auditeur responsable"]').count();
    record(
      "Reprendre un audit en cours (bouton réel cliqué)",
      "INFO",
      `URL après clic: ${page.url()}. Champ 'auditeur responsable' vide encore présent (signe de ré-init step1): ${onStep1WithEmptyFields > 0 ? "OUI (suspect)" : "NON"}. Réponse réseau: ${resp ? resp.url() : "aucune capturée"}`
    );
  } else {
    record("Reprendre un audit en cours", "FAIL", "Aucun bouton Reprendre trouvé malgré des audits existants en base");
  }

  // Direct navigation to the known audit-history query-string bug
  await page.goto(`${BASE}/mdr/audit?auditId=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "23-direct-query-string-nav");
  const auditNameField = page.locator('input').filter({ hasText: "" });
  const nameFieldValue = await page.locator('input').nth(2).inputValue().catch(() => "");
  record(
    "Navigation directe /mdr/audit?auditId=1 (reproduit le lien AuditHistory.tsx)",
    "INFO",
    `Le formulaire démarre-t-il vide (bug: query string ignoré) ou pré-rempli avec l'audit existant ? Valeur d'un champ nom: "${nameFieldValue}". Voir 23-direct-query-string-nav.png`
  );

  // Reports page with real data
  await page.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const excelBtn = page.locator('button:has-text("Excel")').first();
  let excelClickError = null;
  page.once("dialog", async (d) => { excelClickError = d.message(); await d.dismiss(); });
  if ((await excelBtn.count()) > 0) {
    const respPromise2 = page.waitForResponse(r => r.url().includes("questions.list") || r.url().includes("getResponses"), { timeout: 4000 }).catch(() => "TIMEOUT_NO_MATCHING_REQUEST");
    await excelBtn.click();
    await page.waitForTimeout(2500);
    const r2 = await respPromise2;
    await shot(page, "24-reports-excel-real-account");
    record("Génération rapport Excel (compte avec audit réel)", typeof r2 === "string" ? "FAIL" : (r2.status() >= 400 ? "FAIL" : "PASS"), `Résultat requête questions.list/getResponses: ${typeof r2 === "string" ? r2 : r2.status() + " " + r2.url()}`);
  }
} catch (e) {
  record("EXCEPTION", "FAIL", e.message);
} finally {
  fs.writeFileSync(`${dir}/results2.json`, JSON.stringify({ results, networkTrpcErrors }, null, 2));
  await browser.close();
}
