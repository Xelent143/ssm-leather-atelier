const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createAdminIdentity } = require('../admin-identity');
const {
  createAdminOwnerRecovery,
  digest,
} = require('../admin-owner-recovery');

const ownerInput = {
  email: 'info@motogripgear.com',
  displayName: 'Chand Rizvi',
  password: 'Initial unique owner passphrase 2026!',
};

async function fixture(overrides = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-owner-browser-recovery-'));
  let clock = Date.parse('2026-07-27T10:00:00.000Z');
  const identity = createAdminIdentity({
    dataDir,
    now: () => clock,
    logger: { info() {}, error() {} },
  });
  const owner = await identity.bootstrapOwner(ownerInput);
  const env = {
    APP_ENV: 'staging',
    STAGING_OWNER_BROWSER_RECOVERY_ENABLED: 'true',
    STAGING_OWNER_BROWSER_RECOVERY_CODE: 'single-use-code-known-only-to-owner',
    STAGING_OWNER_BROWSER_RECOVERY_EXPIRES_AT: '2026-07-27T10:30:00.000Z',
    ...overrides,
  };
  const recovery = createAdminOwnerRecovery({ identity, env, now: () => clock });
  const storePath = path.join(dataDir, 'admin-identities.json');
  return {
    dataDir,
    env,
    identity,
    owner,
    recovery,
    writeStore(store) {
      fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
    },
    advance(ms) { clock += ms; },
    cleanup() { fs.rmSync(dataDir, { recursive: true, force: true }); },
  };
}

test('browser recovery is staging-only, explicit, and time-limited', async () => {
  for (const overrides of [
    { APP_ENV: 'production' },
    { STAGING_OWNER_BROWSER_RECOVERY_ENABLED: 'false' },
    { STAGING_OWNER_BROWSER_RECOVERY_CODE: '' },
  ]) {
    const context = await fixture(overrides);
    assert.equal(context.recovery.status().enabled, false);
    context.cleanup();
  }
  const context = await fixture();
  assert.equal(context.recovery.status().enabled, true);
  context.advance(31 * 60 * 1000);
  assert.equal(context.recovery.status().enabled, false);
  assert.equal(context.recovery.status().expired, true);
  context.cleanup();
});

test('recovery requires exactly one matching active Owner and never creates one', async () => {
  const context = await fixture();
  const store = context.identity.readStore();
  store.users.push({ ...store.users[0], id: 'duplicate-owner-record' });
  context.writeStore(store);
  assert.equal(context.recovery.status().ownerMatches, false);
  await assert.rejects(
    context.recovery.complete({
      recoveryCode: context.env.STAGING_OWNER_BROWSER_RECOVERY_CODE,
      newPassword: 'Replacement unique passphrase 2026!',
      confirmNewPassword: 'Replacement unique passphrase 2026!',
    }),
    { code: 'OWNER_RECOVERY_UNAVAILABLE' },
  );
  assert.equal(context.identity.readStore().users.length, 2);
  context.cleanup();
});

test('successful recovery is single-use, clears lockout, and preserves exact password bytes', async () => {
  const context = await fixture();
  const before = context.identity.readStore();
  before.users[0].failedLoginCount = 5;
  before.users[0].lockedUntil = '2099-01-01T00:00:00.000Z';
  context.writeStore(before);
  const exactPassword = '  Exact unique owner phrase 2026!  ';

  await assert.rejects(
    context.recovery.complete({
      recoveryCode: 'incorrect-code',
      newPassword: exactPassword,
      confirmNewPassword: exactPassword,
    }),
    { code: 'OWNER_RECOVERY_INVALID' },
  );

  const recovered = await context.recovery.complete({
    recoveryCode: context.env.STAGING_OWNER_BROWSER_RECOVERY_CODE,
    newPassword: exactPassword,
    confirmNewPassword: exactPassword,
  });
  assert.equal(recovered.accountType, 'owner');
  assert.equal(context.recovery.status().enabled, false);
  assert.equal(context.recovery.status().consumed, true);

  const stored = context.identity.readStore();
  assert.equal(stored.users.length, 1);
  assert.equal(stored.users[0].failedLoginCount, 0);
  assert.equal(stored.users[0].lockedUntil, null);
  assert.equal(stored.bootstrapMetadata.browserRecoveryCodeHash,
    digest(context.env.STAGING_OWNER_BROWSER_RECOVERY_CODE));
  assert.equal(JSON.stringify(stored).includes(context.env.STAGING_OWNER_BROWSER_RECOVERY_CODE), false);
  assert.equal(JSON.stringify(stored).includes(exactPassword), false);

  const exactLogin = await context.identity.authenticate(
    '  INFO@MOTOGRIPGEAR.COM  ',
    exactPassword,
    { headers: { 'x-forwarded-for': '198.51.100.80' }, socket: {} },
  );
  assert.equal(exactLogin.ok, true);
  const trimmedLogin = await context.identity.authenticate(
    ownerInput.email,
    exactPassword.trim(),
    { headers: { 'x-forwarded-for': '198.51.100.81' }, socket: {} },
  );
  assert.equal(trimmedLogin.ok, false);

  await assert.rejects(
    context.recovery.complete({
      recoveryCode: context.env.STAGING_OWNER_BROWSER_RECOVERY_CODE,
      newPassword: 'Another unique owner phrase 2026!',
      confirmNewPassword: 'Another unique owner phrase 2026!',
    }),
    { code: 'OWNER_RECOVERY_UNAVAILABLE' },
  );
  context.cleanup();
});

test('recovery preserves Listing Editor identity and password', async () => {
  const context = await fixture();
  const editorPassword = 'Copper canyon workshop phrase 2026!';
  const editor = await context.identity.createManagedUser({
    email: 'listing.editor@example.com',
    displayName: 'Listing Editor',
    password: editorPassword,
    active: true,
  }, context.owner.id);

  await context.recovery.complete({
    recoveryCode: context.env.STAGING_OWNER_BROWSER_RECOVERY_CODE,
    newPassword: 'Replacement unique owner phrase 2026!',
    confirmNewPassword: 'Replacement unique owner phrase 2026!',
  });
  const editorLogin = await context.identity.authenticate(
    editor.email,
    editorPassword,
    { headers: { 'x-forwarded-for': '198.51.100.82' }, socket: {} },
  );
  assert.equal(editorLogin.ok, true);
  assert.equal(context.identity.readStore().users.length, 2);
  context.cleanup();
});
