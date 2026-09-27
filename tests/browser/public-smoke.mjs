import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Run only against the isolated, built local worker. Never target production.
const origin = new URL(process.env.SWAY_QA_BASE_URL || 'http://127.0.0.1:8787');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname), 'QA must target localhost');
assert.equal(origin.protocol, 'http:');
assert.ok(process.env.PLAYWRIGHT_MODULE, 'Set PLAYWRIGHT_MODULE to the CI-pinned Playwright entry');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const output = path.resolve('qa-artifacts');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
const contexts = [];
const runtimeErrors = [];
const sheets = ['brands', 'retailers', 'influencers', 'distributors'];

async function context(options = {}) {
  const ctx = await browser.newContext({ baseURL: origin.origin, ...options });
  contexts.push(ctx);
  ctx.on('page', page => {
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /hydration|hydrating|minified react error|server rendered html/i.test(message.text())) runtimeErrors.push(message.text());
    });
  });
  return ctx;
}
async function check(name, fn) {
  try { await fn(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, error: String(error.stack || error) }); console.error(`FAIL ${name}: ${error.message}`); }
}
async function visible(page, text) { await page.getByText(text, { exact: true }).waitFor({ state: 'visible' }); }
async function visit(page, route) {
  const response = await page.goto(route, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200, `${route} must return 200 without authentication`);
  assert.equal(new URL(page.url()).pathname, route);
  await page.locator('main h1').waitFor();
  assert.equal(await page.locator('h1').count(), 1);
  await page.evaluate(() => document.fonts.ready);
}
async function storeCount(page, count) {
  await page.waitForFunction(expected => document.querySelectorAll('main article h3').length === expected, count);
}

try {
  const ctx = await context({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await ctx.tracing.start({ screenshots: true, snapshots: true });

  await check('actual public endpoint excludes full/draft/paused stores and all private fields', async () => {
    const response = await ctx.request.get('/api/open-retailers');
    assert.equal(response.status(), 200);
    const body = await response.json();
    assert.equal(body.stores.length, 2);
    assert.deepEqual(body.stores.map(store => store.id).sort(), ['qa-cedar', 'qa-harbor']);
    const allowed = ['city', 'description', 'id', 'name', 'state', 'type'];
    for (const store of body.stores) assert.deepEqual(Object.keys(store).sort(), allowed);
    assert.doesNotMatch(JSON.stringify(body), /qa-owner-private|qa-request-private|qa-full|qa-draft|qa-paused/);
  });
  await check('workspace API stays protected while sales material is public', async () => {
    const response = await ctx.request.get('/api/workspace');
    assert.equal(response.status(), 401);
  });
  const routes = ['/', '/open-retailers', '/sales-sheets', '/boost', ...sheets.map(slug => `/sales-sheets/${slug}`)];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) await check(`built route ${route} at ${width}px`, async () => {
      await visit(page, route);
      if (route === '/' || route === '/open-retailers') await visible(page, 'QA Cedar Market');
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, broken: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src) }));
      assert.ok(dimensions.scroll <= dimensions.width + 1, JSON.stringify(dimensions));
      assert.deepEqual(dimensions.broken, [], 'Repository PNG assets must load, not placeholders');
      if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, `${route.replaceAll('/', '-') || 'home'}-${width}.png`), fullPage: true });
    });
  }
  await check('directory search, region/type filters, no-match state and reset are hydrated', async () => {
    await visit(page, '/open-retailers'); await storeCount(page, 2);
    await page.getByRole('searchbox').fill('Harbor'); await storeCount(page, 1); await visible(page, 'QA Harbor Shop');
    await page.getByRole('searchbox').fill('');
    await page.getByLabel('State / region', { exact: true }).selectOption('MO'); await storeCount(page, 1); await visible(page, 'QA Cedar Market');
    await page.getByLabel('State / region', { exact: true }).selectOption('');
    await page.getByLabel('Store type', { exact: true }).selectOption('Grocery'); await storeCount(page, 1); await visible(page, 'QA Harbor Shop');
    await page.getByRole('searchbox').fill('does-not-exist'); await visible(page, 'No retailers match these filters.');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click(); await storeCount(page, 2);
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    assert.equal(await page.getByLabel('State / region', { exact: true }).inputValue(), '');
    assert.equal(await page.getByLabel('Store type', { exact: true }).inputValue(), '');
  });
  await check('public descriptions render as text and request action goes to sign-in', async () => {
    await visit(page, '/open-retailers'); await storeCount(page, 2);
    const card = page.locator('main article').filter({ has: page.getByRole('heading', { name: 'QA Cedar Market', exact: true }) });
    await card.getByText('About this retailer', { exact: true }).click();
    assert.match(await card.innerText(), /<img/);
    assert.equal(await page.evaluate(() => window.__qaXss), undefined);
    await card.getByRole('link', { name: 'Sign in to request' }).click();
    await page.waitForURL('**/login');
  });
  await check('mobile navigation exposes and opens public sheets without login', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await visit(page, '/');
    await page.locator('header summary').click();
    const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
    for (const label of ['How it works', 'Open retailers', 'Sales sheets', 'SWAY Boost', 'Log in', 'Join SWAY']) assert.ok(await nav.getByRole('link', { name: label, exact: true }).isVisible());
    await nav.getByRole('link', { name: 'Sales sheets', exact: true }).click();
    await page.waitForURL('**/sales-sheets'); assert.equal(await page.locator('main h1').count(), 1);
  });
  await check('keyboard skip link reaches the main content', async () => {
    await visit(page, '/sales-sheets');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#main-content');
  });
  await check('real clipboard write/read works after clicking Copy pitch', async () => {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: origin.origin });
    await visit(page, '/sales-sheets/brands');
    await page.getByRole('button', { name: 'Copy pitch', exact: true }).click();
    await visible(page, 'Pitch copied.');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(text, /SWAY/i); assert.match(text, /120/); assert.ok(text.length > 100);
  });
  await check('denied clipboard offers selectable pitch rather than false success', async () => {
    const denied = await context(); const deniedPage = await denied.newPage();
    await deniedPage.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied for QA', 'NotAllowedError'); } } }));
    await visit(deniedPage, '/sales-sheets/influencers');
    await deniedPage.getByRole('button', { name: 'Copy pitch', exact: true }).click();
    const fallback = deniedPage.getByRole('textbox'); await fallback.waitFor({ state: 'visible' });
    assert.ok((await fallback.inputValue()).length > 100);
    assert.equal(await deniedPage.getByText('Pitch copied.', { exact: true }).count(), 0);
  });
  for (const slug of sheets) await check(`${slug} print button invokes print and actual PDF has one page`, async () => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await visit(page, `/sales-sheets/${slug}`);
    await page.evaluate(() => { window.__qaPrints = 0; window.print = () => { window.__qaPrints += 1; }; });
    await page.getByRole('button', { name: 'Print / Save PDF', exact: true }).click();
    await page.waitForFunction(() => window.__qaPrints === 1);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.getByRole('button', { name: 'Print / Save PDF', exact: true }).isVisible(), false);
    assert.ok(await page.getByRole('heading', { name: 'Before we launch', exact: true }).isVisible());
    const pdf = await page.pdf({ path: path.join(output, `${slug}.pdf`), format: 'Letter', printBackground: true, preferCSSPageSize: true });
    assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 1, 'Expected exactly one printed page');
    await page.emulateMedia({ media: 'screen' });
  });
  await check('unavailable directory and retry are real React state transitions', async () => {
    const errorCtx = await context(); const errorPage = await errorCtx.newPage(); let attempts = 0;
    await errorPage.route('**/api/open-retailers', async route => {
      attempts += 1;
      if (attempts === 1) await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Controlled QA outage' }) });
      else await route.continue();
    });
    await visit(errorPage, '/open-retailers'); await visible(errorPage, 'Availability is temporarily unavailable.');
    await errorPage.getByRole('button', { name: 'Try again', exact: true }).click();
    await storeCount(errorPage, 2); await visible(errorPage, 'QA Cedar Market'); assert.ok(attempts >= 2);
  });
  await check('loading and empty directory states are distinct', async () => {
    const emptyCtx = await context(); const emptyPage = await emptyCtx.newPage(); let release;
    const gate = new Promise(resolve => { release = resolve; });
    await emptyPage.route('**/api/open-retailers', async route => { await gate; await route.fulfill({ status: 200, contentType: 'application/json', body: '{"stores":[]}' }); });
    try {
      await emptyPage.goto('/open-retailers', { waitUntil: 'domcontentloaded' });
      await visible(emptyPage, 'Checking retailer availability…');
      release(); await visible(emptyPage, 'No retailers are accepting new placements right now.');
      assert.equal(await emptyPage.getByRole('alert').count(), 0);
    } finally { release(); }
  });
  await check('invalid sales-sheet slug returns 404', async () => {
    const response = await ctx.request.get('/sales-sheets/not-a-sheet'); assert.equal(response.status(), 404);
  });
  await check('no browser runtime or React hydration errors', async () => assert.deepEqual(runtimeErrors, []));
  await ctx.tracing.stop({ path: path.join(output, 'public-browser-trace.zip') });
} finally {
  await writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ baseURL: origin.origin, results, runtimeErrors }, null, 2));
  for (const ctx of contexts) await ctx.close();
  await browser.close();
}
const failed = results.filter(result => !result.passed);
console.log(`${results.length - failed.length}/${results.length} real-browser checks passed`);
if (failed.length) process.exitCode = 1;
