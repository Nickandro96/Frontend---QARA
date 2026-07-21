import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:5173";
const results = [];
const screenshotDir = "/tmp/claude-0/-home-user/4499258c-b00c-5c14-8589-d80b08bf524f/scratchpad/pw-test/results";

function record(name, status, detail) {
  results.push({ name, status, detail });
  console.log(`[${status}] ${name} — ${detail}`);
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true });
  } catch {}
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
const networkFailures = [];
page.on("response", (res) => {
  if (res.status() >= 400 && res.url().includes("/trpc/")) {
    networkFailures.push(`${res.status()} ${res.url()}`);
  }
});

const email = `inv-test-${Date.now()}@example.com`;
const password = "TestPassword123";

try {
  // ---- 1. Inscription ----
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  const hasRegisterForm = (await page.locator('input[type="email"]').count()) > 0;
  if (!hasRegisterForm) {
    record("Inscription — page /register", "FAIL", "Aucun formulaire email trouvé sur /register");
  } else {
    await page.fill('input[type="email"]', email);
    const pwFields = await page.locator('input[type="password"]').all();
    for (const f of pwFields) await f.fill(password);
    const nameField = page.locator('input[name="name"], input[placeholder*="nom" i]').first();
    if ((await nameField.count()) > 0) await nameField.fill("Inventaire Test");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes("/onboarding") || url.includes("/dashboard")) {
      record("Inscription", "PASS", `Redirigé vers ${url}`);
    } else {
      record("Inscription", "FAIL", `Toujours sur ${url} après soumission`);
      await shot(page, "01-register-fail");
    }
  }

  // ---- 2. Onboarding ----
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
    if (page.url().includes("/dashboard")) {
      record("Onboarding — parcours complet", "PASS", "Arrivée sur /dashboard après les 4 étapes");
    } else {
      record("Onboarding — parcours complet", "FAIL", `URL finale: ${page.url()}`);
      await shot(page, "02-onboarding-fail");
    }
  }

  // ---- 3. Dashboard ----
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "03-dashboard");
  const dashboardText = await page.textContent("body");
  record(
    "Dashboard — chargement",
    dashboardText && dashboardText.length > 100 ? "PASS" : "FAIL",
    "Page chargée, capture 03-dashboard.png"
  );

  // ---- 4. Sidebar links inventory ----
  const sidebarLinks = await page.locator("a[href]").evaluateAll((els) =>
    els.map((e) => e.getAttribute("href")).filter((h) => h && h.startsWith("/"))
  );
  record("Sidebar — liens détectés", "INFO", JSON.stringify([...new Set(sidebarLinks)]));

  // ---- 5. Créer un audit MDR ----
  await page.goto(`${BASE}/mdr/audit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const siteTrigger = page.locator('button, select').filter({ hasText: "Sélectionnez un site" }).first();
  if ((await siteTrigger.count()) > 0) {
    await siteTrigger.click();
    await page.waitForTimeout(300);
    const opt = page.locator('[role="option"]').first();
    if ((await opt.count()) > 0) await opt.click();
    else {
      const createSiteBtn = page.locator('button:has-text("Créer un nouveau site")');
      if ((await createSiteBtn.count()) > 0) {
        await createSiteBtn.click();
        await page.waitForTimeout(500);
        const siteNameInput = page.locator('input').first();
        await siteNameInput.fill("Site Inventaire");
        const confirmBtn = page.locator('button:has-text("Créer")').last();
        if ((await confirmBtn.count()) > 0) await confirmBtn.click();
        await page.waitForTimeout(800);
      }
    }
  }
  await page.fill('textarea', "Test inventaire bugs").catch(() => {});
  const dateInputs = await page.locator('input[type="date"]').all();
  if (dateInputs[0]) await dateInputs[0].fill("2026-08-01");
  const textInputs = await page.locator('input[type="text"]:visible, input:not([type]):visible').all();
  const namedInputs = {
    "Nom de l'auditeur responsable": "Testeur",
    "Nom du contact principal": "Contact",
    "email@example.com": "contact@example.com",
  };
  for (const [placeholder, val] of Object.entries(namedInputs)) {
    const f = page.locator(`input[placeholder="${placeholder}"]`);
    if ((await f.count()) > 0) await f.fill(val);
  }
  await shot(page, "04-mdr-audit-form");
  const submitBtn = page.locator('button:has-text("Continuer vers l\'étape 2")');
  let auditId = null;
  if ((await submitBtn.count()) > 0 && !(await submitBtn.isDisabled())) {
    const respPromise = page.waitForResponse((r) => r.url().includes("mdr.createOrUpdateAuditDraft"), { timeout: 10000 }).catch(() => null);
    await submitBtn.click();
    const resp = await respPromise;
    if (resp) {
      const body = await resp.json().catch(() => null);
      auditId = body?.result?.data?.auditId;
      record("Créer un audit MDR", "PASS", `auditId créé = ${auditId}`);
    } else {
      record("Créer un audit MDR", "FAIL", "Pas de réponse réseau détectée pour createOrUpdateAuditDraft");
    }
  } else {
    record("Créer un audit MDR", "FAIL", "Bouton de soumission désactivé ou introuvable");
    await shot(page, "04-mdr-audit-form-fail");
  }

  // ---- 6. "Mes Audits" list ----
  await page.goto(`${BASE}/audits`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "05-mes-audits");
  const tableRows = await page.locator("table tbody tr").count();
  const bodyTextAudits = await page.textContent("body");
  record(
    "Onglet Mes Audits — affichage liste",
    tableRows > 0 ? "PASS" : "FAIL",
    `${tableRows} ligne(s) de tableau trouvée(s). Erreurs réseau tRPC jusqu'ici: ${JSON.stringify(networkFailures)}`
  );

  // ---- 7. Reprendre un audit en cours (depuis l'historique) ----
  await page.goto(`${BASE}/audit-history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "06-audit-history");
  const resumeBtn = page.locator('button:has-text("Reprendre"), button:has-text("Continuer")').first();
  if ((await resumeBtn.count()) > 0) {
    await resumeBtn.click();
    await page.waitForTimeout(1500);
    const urlAfterResume = page.url();
    // Check whether the wizard shows step 1 empty (bug) or resumed with data
    const auditNameField = page.locator('input').filter({ hasText: "" }).first();
    await shot(page, "07-audit-resume-result");
    record(
      "Reprendre un audit en cours",
      "INFO",
      `URL après clic: ${urlAfterResume} — capture 07-audit-resume-result.png à inspecter`
    );
  } else {
    record("Reprendre un audit en cours", "FAIL", "Aucun bouton Reprendre/Continuer trouvé sur /audit-history");
  }

  // ---- 8. Rapports (Excel/PDF) ----
  await page.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "08-reports-page");
  const excelBtn = page.locator('button:has-text("Excel")').first();
  const pdfBtn = page.locator('button:has-text("PDF")').first();
  const errsBefore = consoleErrors.length;
  if ((await excelBtn.count()) > 0) {
    await excelBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
  }
  await shot(page, "09-reports-after-excel-click");
  record(
    "Génération rapport Excel",
    consoleErrors.length > errsBefore ? "FAIL" : "INFO",
    `Erreurs console après clic: ${JSON.stringify(consoleErrors.slice(errsBefore))}`
  );

  // ---- 9. Navigation retour (bare /mdr known bug) ----
  await page.goto(`${BASE}/mdr`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "10-bare-mdr-route");
  const bareMdrText = (await page.textContent("body"))?.trim() || "";
  record(
    "Navigation — route bare /mdr (bouton 'Liste audits')",
    bareMdrText.length < 50 ? "FAIL" : "PASS",
    `Longueur texte visible: ${bareMdrText.length}. Voir 10-bare-mdr-route.png`
  );

  // ---- 10. F5 reload on a deep route ----
  await page.goto(`${BASE}/mdr/audit`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "11-reload-mdr-audit");
  const reloadText = (await page.textContent("body"))?.trim() || "";
  record(
    "F5 reload sur /mdr/audit",
    reloadText.length > 50 ? "PASS" : "FAIL",
    `Longueur texte après reload: ${reloadText.length}`
  );

  // ---- 11. Classification/FDA/Veille pages (Free account => locked) ----
  for (const [path, label] of [
    ["/classification", "Classification"],
    ["/fda-classification", "FDA Classification"],
    ["/regulatory-watch", "Veille réglementaire"],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1000);
    const txt = (await page.textContent("body")) || "";
    const looksLocked = /verrouill|plan pro|réservé|upgrade|abonnement/i.test(txt);
    await shot(page, `12-${label.replace(/\s/g, "-")}`);
    record(`Page ${label} (compte Free)`, looksLocked ? "PASS" : "INFO", looksLocked ? "Message de verrouillage détecté" : "Pas de message de verrouillage détecté visuellement — à vérifier");
  }
} catch (e) {
  record("EXCEPTION GLOBALE", "FAIL", e.message);
  await shot(page, "99-exception");
} finally {
  fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify({ results, consoleErrors, networkFailures }, null, 2));
  await browser.close();
}
