const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-api-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'plm-legacy-test-password';
process.env.NODE_ENV = 'test';

const adminStoreSource = fs.readFileSync(path.join(__dirname, '..', 'data', 'admin-store.json'));
const merchantSource = fs.readFileSync(path.join(__dirname, '..', 'merchant-catalog.json'));
fs.writeFileSync(path.join(tempDir, 'admin-store.json'), adminStoreSource);

const {
  adminIdentity,
  productPlmStore,
  server,
} = require('../server');

const ownerInput = {
  email: 'plm.owner@example.com',
  displayName: 'PLM Test Owner',
  password: 'A unique PLM test passphrase 2026',
};

let baseUrl;
let legacyCookie;
let legacyCsrf;
let namedCookie;
let namedCsrf;

function cookieValue(setCookie) {
  return String(setCookie || '').split(';')[0];
}

async function request(route, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.origin !== false) headers.Origin = baseUrl;
  const response = await fetch(`${baseUrl}${route}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  return { data, response };
}

test.before(async () => {
  await adminIdentity.bootstrapOwner(ownerInput);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const legacy = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  legacyCookie = cookieValue(legacy.response.headers.get('set-cookie'));
  legacyCsrf = legacy.data.csrfToken;

  const named = await request('/api/admin/auth/named-login', {
    method: 'POST',
    body: JSON.stringify({ email: ownerInput.email, password: ownerInput.password }),
  });
  namedCookie = cookieValue(named.response.headers.get('set-cookie'));
  namedCsrf = named.data.csrfToken;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('PLM routes require authentication and migration requires named Owner', async () => {
  const unauthorized = await request('/api/admin/plm/status', { origin: false });
  assert.equal(unauthorized.response.status, 401);

  const legacyPreview = await request('/api/admin/plm/migrations/preview', {
    method: 'POST',
    headers: { Cookie: legacyCookie, 'X-CSRF-Token': legacyCsrf },
    body: JSON.stringify({ expectedRevision: 0 }),
  });
  assert.equal(legacyPreview.response.status, 403);
  assert.match(legacyPreview.data.error, /Named Owner/);
});

test('PLM mutation rejects missing CSRF for named Owner', async () => {
  const rejected = await request('/api/admin/plm/migrations/preview', {
    method: 'POST',
    headers: { Cookie: namedCookie },
    body: JSON.stringify({ expectedRevision: 0 }),
  });
  assert.equal(rejected.response.status, 403);
  assert.match(rejected.data.error, /verified/);
});

test('named Owner can preview and explicitly apply default migration', async () => {
  const adminHashBefore = crypto.createHash('sha256').update(fs.readFileSync(path.join(tempDir, 'admin-store.json'))).digest('hex');
  const merchantHashBefore = crypto.createHash('sha256').update(merchantSource).digest('hex');
  const preview = await request('/api/admin/plm/migrations/preview', {
    method: 'POST',
    headers: { Cookie: namedCookie, 'X-CSRF-Token': namedCsrf },
    body: JSON.stringify({ expectedRevision: 0 }),
  });
  assert.equal(preview.response.status, 201);
  assert.equal(preview.data.preview.adminProductCount, 6);
  assert.equal(preview.data.preview.merchantProductCount, 14);
  assert.equal(preview.data.preview.candidates.filter((item) => item.disposition === 'merchant_only').length, 8);

  const applied = await request('/api/admin/plm/migrations/apply', {
    method: 'POST',
    headers: { Cookie: namedCookie, 'X-CSRF-Token': namedCsrf },
    body: JSON.stringify({
      previewId: preview.data.preview.id,
      expectedRevision: preview.data.storeRevision,
      merchantOnlyLegacyIds: [],
      confirmMerchantOnly: false,
    }),
  });
  assert.equal(applied.response.status, 200);
  assert.equal(applied.data.batch.importedProductUuids.length, 6);

  const dna = await request(`/api/admin/plm/products/${applied.data.batch.importedProductUuids[0]}/dna`, {
    headers: { Cookie: namedCookie },
    origin: false,
  });
  assert.equal(dna.response.status, 200);
  assert.equal(dna.data.productUuid, applied.data.batch.importedProductUuids[0]);
  assert.equal(dna.data.completeness.productHierarchy, false);

  const adminHashAfter = crypto.createHash('sha256').update(fs.readFileSync(path.join(tempDir, 'admin-store.json'))).digest('hex');
  const merchantHashAfter = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, '..', 'merchant-catalog.json'))).digest('hex');
  assert.equal(adminHashAfter, adminHashBefore);
  assert.equal(merchantHashAfter, merchantHashBefore);
  assert.equal(productPlmStore.read().productIdentities.length, 6);
});
