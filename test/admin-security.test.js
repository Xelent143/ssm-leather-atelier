const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-admin-security-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'test-only-password';
process.env.NODE_ENV = 'test';

const seedStore = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'admin-store.json'), 'utf8'));
fs.writeFileSync(path.join(tempDir, 'admin-store.json'), `${JSON.stringify(seedStore, null, 2)}\n`);
const { server } = require('../server');
const { FAILED_LOGIN_LIMIT, LOGIN_RATE_LIMIT, createAdminSecurity } = require('../admin-security');

let baseUrl;

function cookieValue(setCookie) {
  return String(setCookie || '').split(';')[0];
}

async function request(route, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.origin !== false) headers.Origin = baseUrl;
  const response = await fetch(`${baseUrl}${route}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function login(password = process.env.ADMIN_PASSWORD, extra = {}) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
    ...extra,
  });
}

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('missing ADMIN_PASSWORD fails closed with a safe error', async () => {
  const original = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  const { response, data } = await login('anything');
  process.env.ADMIN_PASSWORD = original;
  assert.equal(response.status, 503);
  assert.match(data.error, /not configured/i);
  assert.doesNotMatch(JSON.stringify(data), /motogrip-admin|default password/i);
});

test('valid login issues an HttpOnly session and CSRF token', async () => {
  const { response, data } = await login();
  const cookie = response.headers.get('set-cookie');
  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
  assert.ok(data.csrfToken);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Max-Age=\d+/i);
  assert.match(cookie, /Expires=/i);
});

test('production cookie is Secure', async () => {
  process.env.NODE_ENV = 'production';
  const { response } = await login();
  process.env.NODE_ENV = 'test';
  assert.match(response.headers.get('set-cookie'), /;\s*Secure;/i);
});

test('invalid login uses a generic response and creates an audit event', async () => {
  const { response, data } = await login('incorrect');
  assert.equal(response.status, 401);
  assert.match(data.error, /unable to sign in/i);
  assert.doesNotMatch(JSON.stringify(data), /incorrect|password is/i);
  const audit = fs.readFileSync(path.join(tempDir, 'admin-audit.ndjson'), 'utf8');
  assert.match(audit, /"action":"login"/);
  assert.doesNotMatch(audit, /test-only-password|incorrect/);
});

test('login rate limiter blocks excessive requests per IP', async () => {
  for (let index = 0; index < LOGIN_RATE_LIMIT; index += 1) {
    const result = await login(undefined, { headers: { 'X-Forwarded-For': '198.51.100.9' } });
    assert.equal(result.response.status, 200);
  }
  const blocked = await login(undefined, { headers: { 'X-Forwarded-For': '198.51.100.9' } });
  assert.equal(blocked.response.status, 429);
});

test('temporary lockout follows repeated failed attempts', async () => {
  for (let index = 0; index < FAILED_LOGIN_LIMIT; index += 1) {
    const result = await login('wrong', { headers: { 'X-Forwarded-For': `203.0.113.${index + 1}` } });
    assert.equal(result.response.status, 401);
  }
  const blocked = await login();
  assert.equal(blocked.response.status, 429);
});

test('logout revokes the session immediately', async () => {
  const securityPath = path.join(tempDir, 'admin-security.json');
  fs.writeFileSync(securityPath, JSON.stringify({ version: 1, sessions: {}, lockout: null }));
  const signedIn = await login();
  const cookie = cookieValue(signedIn.response.headers.get('set-cookie'));
  const logout = await request('/api/admin/logout', {
    method: 'POST',
    headers: { Cookie: cookie, 'X-CSRF-Token': signedIn.data.csrfToken },
  });
  assert.equal(logout.response.status, 200);
  assert.match(logout.response.headers.get('set-cookie'), /Max-Age=0/);
  const session = await request('/api/admin/session', { headers: { Cookie: cookie } });
  assert.equal(session.data.authenticated, false);
});

test('expired or revoked sessions are rejected', () => {
  let clock = 1000;
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-session-expiry-'));
  const security = createAdminSecurity({ dataDir: isolated, now: () => clock, logger: { info() {}, error() {} } });
  const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
  const session = security.createSession(req);
  req.headers.cookie = `mg_admin=${session.token}`;
  assert.ok(security.getSession(req));
  const afterRestart = createAdminSecurity({ dataDir: isolated, now: () => clock, logger: { info() {}, error() {} } });
  assert.equal(afterRestart.getSession(req).id, session.id);
  security.revokeSession(session.token);
  assert.equal(security.getSession(req), null);
  const expiring = security.createSession(req);
  req.headers.cookie = `mg_admin=${expiring.token}`;
  clock = expiring.expiresAt + 1;
  assert.equal(security.getSession(req), null);
  fs.rmSync(isolated, { recursive: true, force: true });
});

test('unauthorized admin API request is rejected', async () => {
  const { response } = await request('/api/admin/store', { origin: false });
  assert.equal(response.status, 401);
});

test('staging indexing safeguard blocks crawlers when enabled', async () => {
  process.env.DISABLE_INDEXING = 'true';
  const page = await fetch(`${baseUrl}/`);
  const robots = await fetch(`${baseUrl}/robots.txt`);
  delete process.env.DISABLE_INDEXING;
  assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  assert.equal(await robots.text(), 'User-agent: *\nDisallow: /\n');
});

test('login rotates an existing session token', async () => {
  fs.writeFileSync(path.join(tempDir, 'admin-security.json'), JSON.stringify({ version: 1, sessions: {}, lockout: null }));
  const first = await login();
  const oldCookie = cookieValue(first.response.headers.get('set-cookie'));
  const second = await login(undefined, { headers: { Cookie: oldCookie } });
  const newCookie = cookieValue(second.response.headers.get('set-cookie'));
  assert.notEqual(newCookie, oldCookie);
  const oldSession = await request('/api/admin/session', { headers: { Cookie: oldCookie }, origin: false });
  assert.equal(oldSession.data.authenticated, false);
  const newSession = await request('/api/admin/session', { headers: { Cookie: newCookie }, origin: false });
  assert.equal(newSession.data.authenticated, true);
});

test('admin mutation without CSRF token is rejected', async () => {
  fs.writeFileSync(path.join(tempDir, 'admin-security.json'), JSON.stringify({ version: 1, sessions: {}, lockout: null }));
  const signedIn = await login();
  const cookie = cookieValue(signedIn.response.headers.get('set-cookie'));
  const { response } = await request('/api/admin/store', {
    method: 'PUT',
    headers: { Cookie: cookie },
    body: JSON.stringify(seedStore),
  });
  assert.equal(response.status, 403);
});

test('existing admin store format remains read/write compatible', async () => {
  fs.writeFileSync(path.join(tempDir, 'admin-security.json'), JSON.stringify({ version: 1, sessions: {}, lockout: null }));
  const signedIn = await login();
  const cookie = cookieValue(signedIn.response.headers.get('set-cookie'));
  const read = await request('/api/admin/store', { headers: { Cookie: cookie }, origin: false });
  assert.equal(read.response.status, 200);
  assert.ok(Array.isArray(read.data.products));
  assert.ok(Array.isArray(read.data.orders));
  const write = await request('/api/admin/store', {
    method: 'PUT',
    headers: { Cookie: cookie, 'X-CSRF-Token': signedIn.data.csrfToken },
    body: JSON.stringify(read.data),
  });
  assert.equal(write.response.status, 200);
  assert.equal(write.data.products.length, read.data.products.length);
  assert.deepEqual(write.data.products.map((product) => product.id), read.data.products.map((product) => product.id));
  assert.deepEqual(write.data.orders.map((order) => order.id), read.data.orders.map((order) => order.id));
  assert.equal(write.data.settings.storeName, read.data.settings.storeName);
  assert.ok(Array.isArray(write.data.returnRequests));
  const auditLines = fs.readFileSync(path.join(tempDir, 'admin-audit.ndjson'), 'utf8').trim().split('\n');
  const storeEvent = auditLines.map(JSON.parse).find((event) => event.action === 'store_update');
  assert.equal(storeEvent.entityType, 'admin_store');
  assert.equal(storeEvent.entityId, 'primary');
  assert.match(storeEvent.ip, /\/24|\/64|unknown/);
});
