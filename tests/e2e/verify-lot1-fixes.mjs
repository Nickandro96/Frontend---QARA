import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();
const dir = "/tmp/claude-0/-home-user/4499258c-b00c-5c14-8589-d80b08bf524f/scratchpad/pw-test/results";

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "test-reconciliation@example.com");
  await page.fill('input[type="password"]', "TestPassword123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
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

  // --- Test 1: Reprendre un audit MDR ---
  await page.goto(`${BASE}/audit-history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const resumeBtn = page.locator('button:has-text("Reprendre")').first();
  const count = await resumeBtn.count();
  console.log("Boutons Reprendre trouvés:", count);
  if (count > 0) {
    await resumeBtn.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    const bodyTxt = (await page.textContent("body")) || "";
    console.log("TEST 1 - URL après clic Reprendre:", url);
    console.log("TEST 1 - Contient un questionnaire MDR (mot 'question' présent)?", /question/i.test(bodyTxt));
    await page.screenshot({ path: `${dir}/fix-01-resume-result.png`, fullPage: true });
  }

  // --- Test 2: bouton Liste audits / Retour depuis MDRAuditReview ---
  // Naviguer directement vers la page de review d'un audit existant
  await page.goto(`${BASE}/mdr/audit/1/review`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${dir}/fix-02-review-page.png`, fullPage: true });
  const listAuditsBtn = page.locator('button:has-text("Liste audits")').first();
  if ((await listAuditsBtn.count()) > 0) {
    await listAuditsBtn.click();
    await page.waitForTimeout(1500);
    const url2 = page.url();
    const bodyTxt2 = (await page.textContent("body")) || "";
    console.log("TEST 2 - URL après clic 'Liste audits':", url2);
    console.log("TEST 2 - Longueur texte visible (doit être riche, pas une page blanche):", bodyTxt2.length);
    await page.screenshot({ path: `${dir}/fix-03-after-liste-audits-click.png`, fullPage: true });
  } else {
    console.log("TEST 2 - Bouton 'Liste audits' non trouvé sur la page de review (vérifier capture fix-02)");
  }
} catch (e) {
  console.error("EXCEPTION:", e.message);
} finally {
  await browser.close();
}
