import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const APP_URL = 'http://127.0.0.1:3000/';
const settle = (page) => page.waitForTimeout(650);

await fs.mkdir('artifacts/immo-smoke', { recursive: true });
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

async function testMobile() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => pageErrors.push(`mobile: ${error.message}`));
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  const button = page.getByRole('button', { name: 'Navigation Immobilier' });
  await button.waitFor({ state: 'visible' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Nzela Immobilier' });
  await dialog.waitFor({ state: 'visible' });
  await page.getByText('Trouvez ou publiez un logement simplement').waitFor();
  await settle(page);
  assert.equal(await page.getByRole('navigation', { name: 'Navigation principale Nzela' }).isVisible(), true);
  await page.screenshot({ path: 'artifacts/immo-smoke/mobile-immobilier.png', fullPage: false });
  await page.getByRole('button', { name: 'Fermer l’immobilier' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.close();
}

async function testDesktop() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => pageErrors.push(`desktop: ${error.message}`));
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  const button = page.getByRole('button', { name: 'Immobilier', exact: true }).first();
  await button.waitFor({ state: 'visible' });
  await button.click();
  await page.getByRole('dialog', { name: 'Nzela Immobilier' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /Publier une annonce/i }).first().waitFor();
  await settle(page);
  await page.screenshot({ path: 'artifacts/immo-smoke/desktop-immobilier.png', fullPage: false });
  await page.close();
}

await testMobile();
await testDesktop();
await browser.close();

if (pageErrors.length) {
  throw new Error(`Browser errors:\n${pageErrors.join('\n')}`);
}

console.log('Nzela Immobilier smoke test passed.');
