import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { parsePublicStores, filterPublicStores, publicStoresQuery } from '../lib/public-network.ts';
import { salesSheets, findSalesSheet, salesPitch } from '../lib/public-sales.ts';

const example = { id: 'a', name: 'Test Bottle Shop', city: 'Sample City', state: 'MO', type: 'Bottle shop', description: 'Test fixture, not production data.' };

test('public parser projects only allowed retailer fields', () => {
  const [row] = parsePublicStores({ stores: [{ ...example, open: 7, capacity: 30, used: 23, partner_id: 'private', rate_cents: 12000 }] });
  assert.deepEqual(row, example);
  assert.equal('open' in row, false);
});
test('empty network is valid, error responses are not empty networks', () => {
  assert.deepEqual(parsePublicStores({ stores: [] }), []);
  for (const payload of [null, {}, { error: 'unavailable' }, { stores: [{ id: 'a' }] }, { stores: 'bad' }]) assert.throws(() => parsePublicStores(payload));
});
test('filters combine query, region and category without modifying inputs', () => {
  const stores = [example, { ...example, id: 'b', name: 'Other', city: 'Elsewhere', state: 'TN', type: 'Grocery' }];
  assert.equal(filterPublicStores(stores, { query: ' sample ', state: 'MO', type: 'Bottle shop' }).length, 1);
  assert.equal(filterPublicStores(stores, { query: 'Sample', state: 'TN', type: '' }).length, 0);
  assert.equal(filterPublicStores(stores, { query: '', state: '', type: 'Grocery' })[0].id, 'b');
  assert.equal(stores.length, 2);
});
test('public SQL includes only published retailers with actual confirmed capacity available', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE stores(id TEXT,name TEXT,city TEXT,state TEXT,type TEXT,description TEXT,status TEXT,capacity INTEGER,partner_id TEXT);
      CREATE TABLE requests(id TEXT,store_id TEXT,status TEXT);
      INSERT INTO stores VALUES('open','Open','City','MO','Bottle shop','','published',2,'secret');
      INSERT INTO stores VALUES('full','Full','City','MO','Bottle shop','','published',1,'secret');
      INSERT INTO stores VALUES('draft','Draft','City','MO','Bottle shop','','draft',30,'secret');
      INSERT INTO stores VALUES('paused','Paused','City','MO','Bottle shop','','paused',30,'secret');
      INSERT INTO requests VALUES('r1','open','confirmed'),('r2','open','requested'),('r3','full','confirmed');`);
    const rows = db.prepare(publicStoresQuery).all();
    assert.deepEqual(rows.map(r => r.id), ['open']);
    assert.deepEqual(Object.keys(rows[0]).sort(), ['city','description','id','name','state','type']);
    db.exec("UPDATE requests SET status='cancelled' WHERE store_id='full'");
    assert.equal(db.prepare(publicStoresQuery).all().length, 2);
  } finally { db.close(); }
});
test('all four public sales sheets have full proposed terms and exact lookup', () => {
  assert.deepEqual(salesSheets.map(s => s.slug), ['brands','retailers','influencers','distributors']);
  assert.equal(new Set(salesSheets.map(s => s.slug)).size, 4);
  for (const sheet of salesSheets) {
    assert.equal(findSalesSheet(sheet.slug), sheet);
    assert.equal(sheet.benefits.length, 3);
    assert.equal(sheet.steps.length, 3);
    assert.ok(salesPitch(sheet).includes(sheet.terms));
  }
  assert.equal(findSalesSheet('__proto__'), undefined);
  assert.equal(findSalesSheet('unknown'), undefined);
  assert.equal(findSalesSheet('brands').offer, '$120');
  assert.equal(findSalesSheet('influencers').offer, '5%');
});
test('public page routes have no authentication or database dependency', () => {
  for (const path of ['app/page.tsx','app/sales-sheets/page.tsx','app/sales-sheets/[audience]/page.tsx','app/open-retailers/page.tsx','app/boost/page.tsx']) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /getChatGPTUser|chatgpt-auth|redirect\(|database\(/);
  }
});
test('UI has explicit loading/error/empty states and honest action wording', () => {
  const source = readFileSync(new URL('../app/public-experience.tsx', import.meta.url), 'utf8');
  assert.match(source, /credentials: "omit"/);
  assert.match(source, /cache: "no-store"/);
  assert.match(source, /This does not mean every store is full/);
  assert.match(source, /Print \/ Save PDF/);
  assert.match(source, /navigator.clipboard.writeText/);
  assert.match(source, /aria-label="Mobile navigation"/);
  assert.doesNotMatch(source, /Claim a spot|spots left|dangerouslySetInnerHTML/);
});
test('public API returns unavailable errors rather than pretending the network is empty', () => {
  const source = readFileSync(new URL('../app/api/open-retailers/route.ts', import.meta.url), 'utf8');
  assert.match(source, /status: 503/);
  assert.match(source, /publicStoresQuery/);
  assert.doesNotMatch(source, /getChatGPTUser|SELECT s\.\*/);
});
