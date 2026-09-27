import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const origin = new URL(process.env.SWAY_QA_BASE_URL || 'http://127.0.0.1:8787');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname));
assert.equal(origin.protocol, 'http:');
assert.ok(process.env.PLAYWRIGHT_MODULE);
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch();
const results = [];
try {
  const page = await browser.newPage({ baseURL: origin.origin });
  for (const width of [320, 390, 1440]) for (const route of ['/', '/brands', '/sales-sheets']) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    const logo = page.locator('header a[aria-label="SWAY IRL home"]');
    const box = await logo.boundingBox();
    const image = await logo.locator('img').boundingBox();
    assert.ok(box && image, `${route}: logo must be visible`);
    const natural = await logo.locator('img').evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight, fit: getComputedStyle(img).objectFit }));
    assert.ok(natural.width > 0 && natural.height > 0);
    assert.equal(natural.fit, 'contain');
    assert.ok(image.x >= box.x - 1 && image.y >= box.y - 1, 'Logo top/left must not be cropped');
    assert.ok(image.x + image.width <= box.x + box.width + 1 && image.y + image.height <= box.y + box.height + 1, 'Logo bottom/right must not be cropped');
    assert.ok(Math.abs(image.width / image.height - natural.width / natural.height) < 0.03, 'Keep the original aspect ratio');
    await mkdir('qa-artifacts', { recursive: true });
    await page.locator('header').screenshot({ path: `qa-artifacts/header-${route.replaceAll('/', '-')}-${width}.png` });
    results.push({ route, width, passed: true });
    console.log(`PASS complete header logo ${route} at ${width}px`);
  }
  assert.equal(results.length, 9);
} finally {
  await mkdir('qa-artifacts', { recursive: true });
  await writeFile('qa-artifacts/header-results.json', JSON.stringify(results, null, 2));
  await browser.close();
}
