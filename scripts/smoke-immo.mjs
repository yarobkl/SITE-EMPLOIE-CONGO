import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const APP_URL = 'http://127.0.0.1:3000/';
const cases = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'desktop-1440', width: 1440, height: 1000, desktop: true },
];

await fs.mkdir('artifacts/immo-smoke', { recursive: true });
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => {
    const dialog = document.querySelector('.nz2-root');
    const scroll = document.querySelector('.nz2-scroll');
    const tabs = [...document.querySelectorAll('.nz2-tabs button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.scrollWidth || 0,
      dialogClientWidth: dialog?.clientWidth || 0,
      scrollWidth: scroll?.scrollWidth || 0,
      scrollClientWidth: scroll?.clientWidth || 0,
      tabs,
    };
  });
  assert.ok(metrics.documentWidth <= metrics.viewport + 1, `${label}: document overflows horizontally`);
  assert.ok(metrics.dialogWidth <= metrics.dialogClientWidth + 1, `${label}: immobilier root overflows horizontally`);
  assert.ok(metrics.scrollWidth <= metrics.scrollClientWidth + 1, `${label}: immobilier content overflows horizontally`);
  assert.equal(metrics.tabs.length, 4, `${label}: four immobilier tabs expected`);
  metrics.tabs.forEach((tab, index) => {
    assert.ok(tab.left >= -1 && tab.right <= metrics.viewport + 1 && tab.width > 0, `${label}: tab ${index + 1} is clipped`);
  });
}

async function runCase(testCase) {
  const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => pageErrors.push(`${testCase.name}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon|Failed to load resource.*400/i.test(message.text())) {
      pageErrors.push(`${testCase.name} console: ${message.text()}`);
    }
  });

  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  let navButton;
  if (testCase.desktop) {
    navButton = page.getByRole('button', { name: 'Immobilier', exact: true }).first();
  } else {
    navButton = page.locator('nav[aria-label="Navigation mobile"] button').nth(2);
    await navButton.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelectorAll('nav[aria-label="Navigation mobile"] button')[2]?.getAttribute('aria-label') === 'Navigation Immobilier');
  }
  await navButton.waitFor({ state: 'visible' });
  await navButton.click();

  const dialog = page.getByRole('dialog', { name: 'Nzela Immobilier' });
  await dialog.waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: /Un logement à trouver ou à publier/i }).waitFor();
  await page.waitForTimeout(500);

  assert.equal(await page.locator('#root').getAttribute('aria-hidden'), 'true', `${testCase.name}: background application must be hidden from assistive technology`);
  assert.equal(await page.locator('.nz2-root').isVisible(), true, `${testCase.name}: immobilier root must be visible`);
  await assertNoHorizontalOverflow(page, testCase.name);

  if (!testCase.desktop) {
    const filterButton = page.getByRole('button', { name: /Filtres/ });
    await filterButton.click();
    assert.equal(await filterButton.getAttribute('aria-expanded'), 'true', `${testCase.name}: filters must open`);
    await page.getByText('Budget maximum', { exact: true }).waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `${testCase.name}-filters`);
    assert.equal(await page.getByRole('navigation', { name: 'Navigation principale Nzela' }).isVisible(), true, `${testCase.name}: bottom navigation must be visible`);
  } else {
    assert.equal(await page.getByRole('button', { name: /Publier une annonce/i }).first().isVisible(), true, 'desktop publish action must be visible');
  }

  await page.screenshot({ path: `artifacts/immo-smoke/${testCase.name}.png`, fullPage: false });
  await page.getByRole('button', { name: 'Fermer l’immobilier' }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.notEqual(await page.locator('#root').getAttribute('aria-hidden'), 'true', `${testCase.name}: background application must be restored after closing`);
  await page.close();
}

for (const testCase of cases) await runCase(testCase);
await browser.close();

if (pageErrors.length) throw new Error(`Browser errors:\n${pageErrors.join('\n')}`);
console.log('Nzela Immobilier responsive stability smoke test passed.');
