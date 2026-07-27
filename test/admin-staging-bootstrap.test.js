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
    bootstrapVersion: 2,
    bootstrapTimestamp: '2026-07-26T12:00:00.000Z',
    bootstrapReason: 'missing_staging_owner',
    bootstrapSource: 'staging_startup',
    recoveryVersion: null,
    recoveryTimestamp: null,
    recoveryReceiptHash: null,
    recoveryOwnerId: null,
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

test('explicit staging recovery synchronizes only the approved existing Owner password', async () => {
  const current = fixture();
  await current.bootstrap.ensure();
  const before = current.identity.owner();
  const beforeRevision = before.sessionRevocationVersion;
  const replacementPassword = 'A replacement staging workshop phrase 2026';
  const recovery = createAdminStagingBootstrap({
    dataDir: current.dataDir,
    env: enabledEnvironment({
      STAGING_OWNER_PASSWORD: replacementPassword,
      STAGING_OWNER_RECOVERY_ENABLED: 'true',
      STAGING_OWNER_RECOVERY_NONCE: 'recovery-2026-07-27-a',
      STAGING_OWNER_RECOVERY_TOKEN: 'protected-recovery-token-a',
      STAGING_OWNER_RECOVERY_EXPECTED_USER_ID: before.id,
    }),
    identity: current.identity,
    logger: {
      error(message) { current.log.push(`error:${message}`); },
      info(message) { current.log.push(`info:${message}`); },
    },
    now: () => Date.parse('2026-07-26T13:00:00.000Z'),
  });

  const result = await recovery.ensure();
  const after = current.identity.owner();
  assert.equal(result.action, 'recovered');
  assert.equal(current.identity.readStore().users.length, 1);
  assert.equal(after.id, before.id);
  assert.equal(after.displayName, STAGING_OWNER_DISPLAY_NAME);
  assert.equal(after.email, STAGING_OWNER_EMAIL);
  assert.equal(after.accountType, 'owner');
  assert.equal(after.status, 'active');
  assert.equal(after.sessionRevocationVersion, beforeRevision + 1);

  const oldLogin = await current.identity.authenticate(STAGING_OWNER_EMAIL, stagingPassword, {
    headers: { 'x-forwarded-for': '192.0.2.50' },
    socket: {},
  });
  const newLogin = await current.identity.authenticate(STAGING_OWNER_EMAIL, replacementPassword, {
    headers: { 'x-forwarded-for': '192.0.2.51' },
    socket: {},
  });
  assert.equal(oldLogin.ok, false);
  assert.equal(newLogin.ok, true);

  const second = await recovery.ensure();
  assert.equal(second.action, 'owner_exists');
  assert.equal(current.identity.owner().sessionRevocationVersion, beforeRevision + 1);
  const serialized = JSON.stringify(current.identity.readStore());
  assert.doesNotMatch(current.log.join('\n'), /replacement|workshop phrase|argon2|token/i);
  assert.doesNotMatch(serialized, new RegExp(replacementPassword, 'i'));
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('staging password synchronization rejects an unexpected Owner identity', async () => {
  const current = fixture();
  await current.identity.bootstrapOwner({
    displayName: 'Unexpected Owner',
    email: 'unexpected@example.com',
    password: stagingPassword,
  });
  const recovery = createAdminStagingBootstrap({
    dataDir: current.dataDir,
    env: enabledEnvironment({
      STAGING_OWNER_RECOVERY_ENABLED: 'true',
      STAGING_OWNER_RECOVERY_NONCE: 'recovery-2026-07-27-b',
      STAGING_OWNER_RECOVERY_TOKEN: 'protected-recovery-token-b',
      STAGING_OWNER_RECOVERY_EXPECTED_USER_ID: current.identity.owner().id,
    }),
    identity: current.identity,
    logger: { error() {}, info() {} },
  });
  await assert.rejects(recovery.ensure(), (error) =>
    error.code === 'STAGING_BOOTSTRAP_IDENTITY_MISMATCH');
  assert.equal(current.identity.readStore().users.length, 1);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('explicit staging recovery clears persisted failed-login state without changing identity', async () => {
  const current = fixture();
  await current.bootstrap.ensure();
  const before = current.identity.owner();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await current.identity.authenticate(STAGING_OWNER_EMAIL, 'Incorrect recovery phrase', {
      headers: { 'x-forwarded-for': `192.0.2.${60 + attempt}` },
      socket: {},
    });
  }
  const locked = current.identity.readStore().users[0];
  assert.equal(locked.failedLoginCount, 5);
  assert.ok(locked.lockedUntil);

  const recovery = createAdminStagingBootstrap({
    dataDir: current.dataDir,
    env: enabledEnvironment({
      STAGING_OWNER_RECOVERY_ENABLED: 'true',
      STAGING_OWNER_RECOVERY_NONCE: 'recovery-2026-07-27-c',
      STAGING_OWNER_RECOVERY_TOKEN: 'protected-recovery-token-c',
      STAGING_OWNER_RECOVERY_EXPECTED_USER_ID: before.id,
    }),
    identity: current.identity,
    logger: { error() {}, info() {} },
  });
  const result = await recovery.ensure();
  const after = current.identity.readStore().users[0];
  assert.equal(result.action, 'recovered');
  assert.equal(after.id, before.id);
  assert.equal(current.identity.readStore().users.length, 1);
  assert.equal(after.failedLoginCount, 0);
  assert.equal(after.lockedUntil, null);
  assert.equal(after.sessionRevocationVersion, before.sessionRevocationVersion + 1);
  const login = await current.identity.authenticate(STAGING_OWNER_EMAIL, stagingPassword, {
    headers: { 'x-forwarded-for': '192.0.2.70' },
    socket: {},
  });
  assert.equal(login.ok, true);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('legacy synchronization flag cannot overwrite an Owner-managed password', async () => {
  const current = fixture();
  await current.bootstrap.ensure();
  const before = structuredClone(current.identity.readStore().users[0]);
  const attempted = createAdminStagingBootstrap({
    dataDir: current.dataDir,
    env: enabledEnvironment({
      STAGING_OWNER_PASSWORD: 'A mismatched environment secret phrase 2028',
      STAGING_OWNER_PASSWORD_SYNC_ENABLED: 'true',
    }),
    identity: current.identity,
    logger: { error() {}, info() {} },
  });
  assert.equal((await attempted.ensure()).action, 'owner_exists');
  assert.deepEqual(current.identity.readStore().users[0], before);
  assert.equal(attempted.status().automaticSecretSynchronization, false);
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
