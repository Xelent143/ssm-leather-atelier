const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-admin-identity-api-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'legacy-test-password-only';
process.env.NODE_ENV = 'test';

const seedStore = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'admin-store.json'), 'utf8'));
fs.writeFileSync(path.join(tempDir, 'admin-store.json'), `${JSON.stringify(seedStore, null, 2)}\n`);

const { server, adminIdentity } = require('../server');
const {
  FAILED_LOGIN_LIMIT,
  LOCKOUT_MS,
  createAdminIdentity,
  tokenHash,
  validatePassword,
} = require('../admin-identity');

const ownerInput = {
  email: 'owner.phase2a@example.com',
  displayName: 'Phase Two Owner',
  password: 'A unique workshop passphrase 2026',
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
  return { response, data };
}

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('no Owner exists and bootstrap requires legacy authentication', async () => {
  assert.equal(adminIdentity.bootstrapAvailable(), true);
  const unauthorizedStatus = await request('/api/admin/bootstrap/status', { origin: false });
  assert.equal(unauthorizedStatus.response.status, 401);
  const unauthorizedCreate = await request('/api/admin/bootstrap/owner', {
    method: 'POST',
    body: JSON.stringify(ownerInput),
  });
  assert.equal(unauthorizedCreate.response.status, 403);

  const legacy = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  legacyCookie = cookieValue(legacy.response.headers.get('set-cookie'));
  legacyCsrf = legacy.data.csrfToken;
  assert.equal(legacy.response.status, 200);
  const status = await request('/api/admin/bootstrap/status', {
    headers: { Cookie: legacyCookie },
    origin: false,
  });
  assert.equal(status.data.available, true);
});

test('bootstrap creates exactly one Owner without copying legacy password', async () => {
  const created = await request('/api/admin/bootstrap/owner', {
    method: 'POST',
    headers: { Cookie: legacyCookie, 'X-CSRF-Token': legacyCsrf },
    body: JSON.stringify(ownerInput),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.data.user.accountType, 'owner');
  assert.equal(created.data.user.status, 'active');
  assert.equal(adminIdentity.bootstrapAvailable(), false);

  const stored = adminIdentity.readStore().users[0];
  assert.match(stored.passwordHash, /^\$argon2id\$/);
  assert.notEqual(stored.passwordHash, ownerInput.password);
  assert.notEqual(stored.passwordHash, process.env.ADMIN_PASSWORD);
  const legacyAsNamed = await adminIdentity.authenticate(ownerInput.email, process.env.ADMIN_PASSWORD, {
    headers: { 'x-forwarded-for': '198.51.100.20' },
    socket: {},
  });
  assert.equal(legacyAsNamed.ok, false);

  const duplicate = await request('/api/admin/bootstrap/owner', {
    method: 'POST',
    headers: { Cookie: legacyCookie, 'X-CSRF-Token': legacyCsrf },
    body: JSON.stringify({ ...ownerInput, email: 'second@example.com' }),
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(adminIdentity.readStore().users.filter((user) => user.accountType === 'owner').length, 1);
});

test('concurrent bootstrap is concurrency-safe in an isolated store', async () => {
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-bootstrap-race-'));
  const identity = createAdminIdentity({ dataDir: isolated, logger: { info() {}, error() {} } });
  const results = await Promise.allSettled([
    identity.bootstrapOwner({ ...ownerInput, email: 'one@example.com' }),
    identity.bootstrapOwner({ ...ownerInput, email: 'two@example.com' }),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(identity.readStore().users.filter((user) => user.accountType === 'owner').length, 1);
  fs.rmSync(isolated, { recursive: true, force: true });
});

test('named login succeeds and session is associated with named user', async () => {
  const named = await request('/api/admin/auth/named-login', {
    method: 'POST',
    body: JSON.stringify({ email: ownerInput.email.toUpperCase(), password: ownerInput.password }),
  });
  assert.equal(named.response.status, 200);
  namedCookie = cookieValue(named.response.headers.get('set-cookie'));
  namedCsrf = named.data.csrfToken;
  const session = await request('/api/admin/auth/session', {
    headers: { Cookie: namedCookie },
    origin: false,
  });
  assert.equal(session.data.authenticated, true);
  assert.equal(session.data.actorType, 'named_user');
  const me = await request('/api/admin/me', { headers: { Cookie: namedCookie }, origin: false });
  assert.equal(me.data.user.email, ownerInput.email);
  assert.equal(me.data.activeSessionCount, 1);
  assert.match(me.data.legacyCompatibilityWarning, /Legacy compatibility login is still enabled/);
});

test('wrong email and wrong password produce enumeration-resistant responses', async () => {
  const wrongEmail = await request('/api/admin/auth/named-login', {
    method: 'POST',
    headers: { 'X-Forwarded-For': '198.51.100.21' },
    body: JSON.stringify({ email: 'missing@example.com', password: 'Wrong passphrase that is long' }),
  });
  const wrongPassword = await request('/api/admin/auth/named-login', {
    method: 'POST',
    headers: { 'X-Forwarded-For': '198.51.100.22' },
    body: JSON.stringify({ email: ownerInput.email, password: 'Wrong passphrase that is long' }),
  });
  assert.equal(wrongEmail.response.status, 401);
  assert.equal(wrongPassword.response.status, 401);
  assert.deepEqual(wrongEmail.data, wrongPassword.data);
});

test('invited, suspended, disabled and recovery_hold users cannot log in', async () => {
  const owner = adminIdentity.owner();
  for (const status of ['invited', 'suspended', 'disabled', 'recovery_hold']) {
    adminIdentity.updateUserStatus(owner.id, status);
    const denied = await request('/api/admin/auth/named-login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': `203.0.113.${status.length}` },
      body: JSON.stringify({ email: ownerInput.email, password: ownerInput.password }),
    });
    assert.equal(denied.response.status, 401);
    assert.match(denied.data.error, /Unable to sign in/);
  }
  adminIdentity.updateUserStatus(owner.id, 'active');
});

test('session revocation version invalidates old named sessions', async () => {
  const login = await request('/api/admin/auth/named-login', {
    method: 'POST',
    headers: { 'X-Forwarded-For': '203.0.113.70' },
    body: JSON.stringify({ email: ownerInput.email, password: ownerInput.password }),
  });
  const cookie = cookieValue(login.response.headers.get('set-cookie'));
  adminIdentity.updateUserStatus(adminIdentity.owner().id, 'active');
  const stale = await request('/api/admin/auth/session', { headers: { Cookie: cookie }, origin: false });
  assert.equal(stale.data.authenticated, false);
});

test('password policy accepts passphrases and rejects predictable or short values', () => {
  assert.equal(validatePassword('a spacious uncommon riding phrase', ownerInput).valid, true);
  assert.equal(validatePassword('too short', ownerInput).valid, false);
  assert.equal(validatePassword('motogrip gear password', ownerInput).valid, false);
  assert.equal(validatePassword('x'.repeat(129), ownerInput).valid, false);
});

test('named login lockout follows repeated failures', async () => {
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-named-lockout-'));
  let clock = 1000;
  const identity = createAdminIdentity({
    dataDir: isolated,
    now: () => clock,
    logger: { info() {}, error() {} },
  });
  await identity.bootstrapOwner({ ...ownerInput, email: 'lockout@example.com' });
  const req = { headers: { 'x-forwarded-for': '192.0.2.8' }, socket: {} };
  for (let index = 0; index < FAILED_LOGIN_LIMIT; index += 1) {
    const failed = await identity.authenticate('lockout@example.com', 'wrong password', req);
    assert.equal(failed.ok, false);
  }
  const locked = await identity.authenticate('lockout@example.com', ownerInput.password, req);
  assert.equal(locked.reason, 'lockout');
  clock += LOCKOUT_MS + 1;
  const recovered = await identity.authenticate('lockout@example.com', ownerInput.password, req);
  assert.equal(recovered.ok, true);
  fs.rmSync(isolated, { recursive: true, force: true });
});

test('named login rate limiting blocks excessive attempts per IP', async () => {
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-named-rate-'));
  const identity = createAdminIdentity({ dataDir: isolated, logger: { info() {}, error() {} } });
  await identity.bootstrapOwner({ ...ownerInput, email: 'rate@example.com' });
  const req = { headers: { 'x-forwarded-for': '192.0.2.18' }, socket: {} };
  for (let index = 0; index < 20; index += 1) {
    assert.equal((await identity.authenticate('rate@example.com', ownerInput.password, req)).ok, true);
  }
  assert.equal((await identity.authenticate('rate@example.com', ownerInput.password, req)).reason, 'rate_limit');
  fs.rmSync(isolated, { recursive: true, force: true });
});

test('production-mode reset token is hashed, expires, one-time, and never logged', async () => {
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-reset-token-'));
  let clock = 1000;
  const messages = [];
  const priorNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const identity = createAdminIdentity({
    dataDir: isolated,
    now: () => clock,
    logger: { info: (value) => messages.push(value), error: (value) => messages.push(value) },
  });
  const user = await identity.bootstrapOwner({ ...ownerInput, email: 'reset@example.com' });
  const issued = await identity.requestPasswordReset(user.email);
  const file = fs.readFileSync(identity.paths.storePath, 'utf8');
  assert.doesNotMatch(file, new RegExp(issued.rawToken));
  assert.match(file, new RegExp(tokenHash(issued.rawToken)));
  assert.doesNotMatch(messages.join('\n'), new RegExp(issued.rawToken));
  const concurrentResets = await Promise.all([
    identity.resetPassword(issued.rawToken, 'A second unique workshop phrase 2026'),
    identity.resetPassword(issued.rawToken, 'A third unique workshop phrase 2026'),
  ]);
  assert.equal(concurrentResets.filter((result) => result.ok).length, 1);
  assert.equal((await identity.resetPassword(issued.rawToken, 'A fifth unique workshop phrase 2026')).ok, false);

  const expiring = await identity.requestPasswordReset(user.email);
  clock += 31 * 60 * 1000;
  assert.equal((await identity.resetPassword(expiring.rawToken, 'A fourth unique workshop phrase 2026')).ok, false);
  process.env.NODE_ENV = priorNodeEnv;
  fs.rmSync(isolated, { recursive: true, force: true });
});

test('invitation tokens are hashed, revocable, expiring and single-use', async () => {
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-invitation-token-'));
  let clock = 1000;
  const identity = createAdminIdentity({ dataDir: isolated, now: () => clock, logger: { info() {}, error() {} } });
  const user = await identity.bootstrapOwner({ ...ownerInput, email: 'invite@example.com' });
  const first = await identity.createInvitationToken(user.id);
  assert.doesNotMatch(fs.readFileSync(identity.paths.storePath, 'utf8'), new RegExp(first.rawToken));
  assert.equal((await identity.consumeInvitationToken(first.rawToken)).ok, true);
  assert.equal((await identity.consumeInvitationToken(first.rawToken)).ok, false);
  const revoked = await identity.createInvitationToken(user.id);
  assert.equal(await identity.revokeInvitationToken(revoked.rawToken), true);
  assert.equal((await identity.consumeInvitationToken(revoked.rawToken)).ok, false);
  const expired = await identity.createInvitationToken(user.id);
  clock += 49 * 60 * 60 * 1000;
  assert.equal((await identity.consumeInvitationToken(expired.rawToken)).ok, false);
  fs.rmSync(isolated, { recursive: true, force: true });
});

test('legacy and named sessions remain distinguishable and legacy use alerts after bootstrap', async () => {
  const legacyAgain = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'X-Forwarded-For': '192.0.2.99' },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  assert.equal(legacyAgain.response.status, 200);
  const legacySession = await request('/api/admin/auth/session', {
    headers: { Cookie: cookieValue(legacyAgain.response.headers.get('set-cookie')) },
    origin: false,
  });
  assert.equal(legacySession.data.actorType, 'legacy_owner');
  const securityEvents = fs.readFileSync(path.join(tempDir, 'admin-security-events.ndjson'), 'utf8');
  assert.match(securityEvents, /"action":"legacy_login_after_named_owner"/);
  assert.match(securityEvents, /"severity":"high"/);
});

test('named logout revokes its session', async () => {
  const logout = await request('/api/admin/auth/logout', {
    method: 'POST',
    headers: { Cookie: namedCookie, 'X-CSRF-Token': namedCsrf },
  });
  assert.equal(logout.response.status, 200);
  const session = await request('/api/admin/auth/session', { headers: { Cookie: namedCookie }, origin: false });
  assert.equal(session.data.authenticated, false);
});
