const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createAdminIdentity } = require('../admin-identity');
const {
  APPROVED_STAGING_PROJECT_ID,
  APPROVED_STAGING_SERVICE_ID,
  STAGING_OWNER_DISPLAY_NAME,
  STAGING_OWNER_EMAIL,
  createAdminStagingBootstrap,
} = require('../admin-staging-bootstrap');

const stagingPassword = 'A permanent workshop passphrase 2026';

function enabledEnvironment(overrides = {}) {
  return {
    APP_ENV: 'staging',
    STAGING_OWNER_BOOTSTRAP_ENABLED: 'true',
    STAGING_EXPECTED_RAILWAY_PROJECT_ID: APPROVED_STAGING_PROJECT_ID,
    STAGING_EXPECTED_RAILWAY_SERVICE_ID: APPROVED_STAGING_SERVICE_ID,
    RAILWAY_PROJECT_ID: APPROVED_STAGING_PROJECT_ID,
    RAILWAY_SERVICE_ID: APPROVED_STAGING_SERVICE_ID,
    STAGING_OWNER_PASSWORD: stagingPassword,
    ...overrides,
  };
}

function fixture(env = enabledEnvironment()) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-staging-bootstrap-'));
  const log = [];
  const logger = {
    error(message) { log.push(`error:${message}`); },
    info(message) { log.push(`info:${message}`); },
  };
  const identity = createAdminIdentity({ dataDir, logger });
  const bootstrap = createAdminStagingBootstrap({
    dataDir,
    env,
    identity,
    logger,
    now: () => Date.parse('2026-07-26T12:00:00.000Z'),
  });
  return { bootstrap, dataDir, identity, log };
}

test('production and mismatched Railway identities never bootstrap', async () => {
  for (const env of [
    enabledEnvironment({ APP_ENV: 'production' }),
    enabledEnvironment({ RAILWAY_PROJECT_ID: 'production-project' }),
    enabledEnvironment({ RAILWAY_SERVICE_ID: 'production-service' }),
    enabledEnvironment({ STAGING_OWNER_BOOTSTRAP_ENABLED: 'false' }),
  ]) {
    const current = fixture(env);
    const result = await current.bootstrap.ensure();
    assert.equal(result.action, 'disabled');
    assert.equal(current.identity.owner(), null);
    assert.equal(current.bootstrap.readMetadata(), null);
    fs.rmSync(current.dataDir, { recursive: true, force: true });
  }
});

test('approved staging creates exactly one active Named Owner and safe metadata', async () => {
  const current = fixture();
  const [first, concurrent] = await Promise.all([
    current.bootstrap.ensure(),
    current.bootstrap.ensure(),
  ]);
  assert.equal(first.action, 'created');
  assert.equal(concurrent.action, 'created');

  const store = current.identity.readStore();
  assert.equal(store.users.length, 1);
  assert.equal(store.users[0].displayName, STAGING_OWNER_DISPLAY_NAME);
  assert.equal(store.users[0].email, STAGING_OWNER_EMAIL);
  assert.equal(store.users[0].accountType, 'owner');
  assert.equal(store.users[0].status, 'active');
  assert.match(store.users[0].passwordHash, /^\$argon2id\$/);
  assert.notEqual(store.users[0].passwordHash, stagingPassword);

  const metadata = current.bootstrap.readMetadata();
  assert.deepEqual(metadata, {
    bootstrapVersion: 1,
    bootstrapTimestamp: '2026-07-26T12:00:00.000Z',
    bootstrapReason: 'missing_staging_owner',
    bootstrapSource: 'staging_startup',
  });
  const serialized = JSON.stringify(metadata);
  assert.doesNotMatch(serialized, /password|argon2|passphrase/i);
  assert.doesNotMatch(current.log.join('\n'), /password|argon2|passphrase/i);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('existing Owner is never duplicated, updated, or password-reset', async () => {
  const current = fixture();
  await current.bootstrap.ensure();
  const before = structuredClone(current.identity.readStore().users[0]);

  const secondBootstrap = createAdminStagingBootstrap({
    dataDir: current.dataDir,
    env: enabledEnvironment({ STAGING_OWNER_PASSWORD: 'A different staging passphrase 2027' }),
    identity: current.identity,
    logger: { error() {}, info() {} },
  });
  const result = await secondBootstrap.ensure();
  const after = current.identity.readStore().users[0];
  assert.equal(result.action, 'owner_exists');
  assert.equal(current.identity.readStore().users.length, 1);
  assert.deepEqual(after, before);

  const originalLogin = await current.identity.authenticate(STAGING_OWNER_EMAIL, stagingPassword, {
    headers: { 'x-forwarded-for': '192.0.2.40' },
    socket: {},
  });
  const replacementLogin = await current.identity.authenticate(
    STAGING_OWNER_EMAIL,
    'A different staging passphrase 2027',
    { headers: { 'x-forwarded-for': '192.0.2.41' }, socket: {} },
  );
  assert.equal(originalLogin.ok, true);
  assert.equal(replacementLogin.ok, false);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('enabled staging fails closed when the protected password is absent', async () => {
  const current = fixture(enabledEnvironment({ STAGING_OWNER_PASSWORD: '' }));
  await assert.rejects(current.bootstrap.ensure(), (error) =>
    error.code === 'STAGING_BOOTSTRAP_CONFIGURATION');
  assert.equal(current.identity.owner(), null);
  assert.equal(current.bootstrap.readMetadata(), null);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});
