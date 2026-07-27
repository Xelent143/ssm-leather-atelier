const crypto = require('crypto');

const STAGING_BOOTSTRAP_VERSION = 2;
const STAGING_RECOVERY_VERSION = 1;
const STAGING_OWNER_EMAIL = 'info@motogripgear.com';
const STAGING_OWNER_DISPLAY_NAME = 'Chand Rizvi';
const APPROVED_STAGING_PROJECT_ID = 'd5c47465-86d7-4238-91d9-4525ac74f4fa';
const APPROVED_STAGING_SERVICE_ID = '59f8b31e-19eb-4119-a4eb-b24fb5e13569';

function stagingGatesMatch(env = process.env) {
  return env.APP_ENV === 'staging' &&
    env.STAGING_OWNER_BOOTSTRAP_ENABLED === 'true' &&
    env.STAGING_EXPECTED_RAILWAY_PROJECT_ID === APPROVED_STAGING_PROJECT_ID &&
    env.STAGING_EXPECTED_RAILWAY_SERVICE_ID === APPROVED_STAGING_SERVICE_ID &&
    env.RAILWAY_PROJECT_ID === APPROVED_STAGING_PROJECT_ID &&
    env.RAILWAY_SERVICE_ID === APPROVED_STAGING_SERVICE_ID;
}

function createAdminStagingBootstrap(options = {}) {
  const identity = options.identity;
  const dataDir = options.dataDir;
  const env = options.env || process.env;
  const now = options.now || (() => Date.now());
  const logger = options.logger || console;
  const audit = options.audit || (() => {});
  let activeRun = null;

  function readMetadata() {
    const parsed = identity.readStore().bootstrapMetadata;
    if (!parsed) return null;
    return {
      bootstrapVersion: Number(parsed.bootstrapVersion) || null,
      bootstrapTimestamp: parsed.bootstrapTimestamp || null,
      bootstrapReason: parsed.bootstrapReason || null,
      bootstrapSource: parsed.bootstrapSource || null,
      recoveryVersion: Number(parsed.recoveryVersion) || null,
      recoveryTimestamp: parsed.recoveryTimestamp || null,
      recoveryReceiptHash: parsed.recoveryReceiptHash || null,
      recoveryNonceHash: parsed.recoveryNonceHash || null,
      recoveryTokenHash: parsed.recoveryTokenHash || null,
      recoveryOwnerId: parsed.recoveryOwnerId || null,
    };
  }

  function recoveryState(metadata = readMetadata()) {
    if (env.STAGING_OWNER_RECOVERY_ENABLED !== 'true') return { enabled: false, consumed: false };
    const nonce = String(env.STAGING_OWNER_RECOVERY_NONCE || '');
    const token = String(env.STAGING_OWNER_RECOVERY_TOKEN || '');
    if (!nonce || !token) return { enabled: true, consumed: false, configured: false };
    const receipt = crypto.createHash('sha256').update(`${nonce}:${token}`).digest('hex');
    const nonceHash = crypto.createHash('sha256').update(nonce).digest('hex');
    const recoveryTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const consumed = metadata?.recoveryReceiptHash === receipt ||
      metadata?.recoveryNonceHash === nonceHash ||
      metadata?.recoveryTokenHash === recoveryTokenHash;
    return {
      enabled: !consumed,
      consumed,
      configured: true,
      receipt,
      nonceHash,
      recoveryTokenHash,
    };
  }

  function status() {
    const metadata = readMetadata();
    const existingOwner = identity.owner();
    const ownerRecord = existingOwner
      ? identity.readStore().users.find((item) => item.id === existingOwner.id)
      : null;
    const recovery = recoveryState(metadata);
    return {
      bootstrapEnabled: stagingGatesMatch(env),
      ownerExists: Boolean(existingOwner),
      bootstrapVersion: metadata?.bootstrapVersion || null,
      lastBootstrapTime: metadata?.bootstrapTimestamp || null,
      passwordSource: existingOwner ? 'owner_managed' : 'first_bootstrap',
      storedHashValid: Boolean(ownerRecord && identity.passwordHashIsValid(ownerRecord.passwordHash)),
      ownerActive: existingOwner?.status === 'active',
      automaticSecretSynchronization: false,
      recoveryMode: Boolean(recovery.enabled && recovery.configured),
      lastRecoveryTime: metadata?.recoveryTimestamp || null,
    };
  }

  async function run() {
    if (!stagingGatesMatch(env)) return { ...status(), action: 'disabled' };
    const password = String(env.STAGING_OWNER_PASSWORD || '');
    const existingOwner = identity.owner();
    const metadata = readMetadata();
    const recovery = recoveryState(metadata);

    if (existingOwner && !recovery.enabled) return { ...status(), action: 'owner_exists' };
    if (!existingOwner && !password) {
      const unavailable = new Error('Staging Owner bootstrap is not configured.');
      unavailable.code = 'STAGING_BOOTSTRAP_CONFIGURATION';
      throw unavailable;
    }
    if (existingOwner) {
      const ownerRecords = identity.readStore().users.filter((item) => item.accountType === 'owner');
      const exactOwner = ownerRecords.length === 1 &&
        existingOwner.displayName === STAGING_OWNER_DISPLAY_NAME &&
        existingOwner.email === STAGING_OWNER_EMAIL &&
        existingOwner.accountType === 'owner' &&
        existingOwner.status === 'active';
      if (!exactOwner) {
        const mismatch = new Error('Staging Owner identity does not match the approved recovery account.');
        mismatch.code = 'STAGING_BOOTSTRAP_IDENTITY_MISMATCH';
        throw mismatch;
      }
      if (!recovery.configured ||
          !password) {
        throw Object.assign(new Error('Staging Owner recovery is not configured.'), {
          code: 'STAGING_RECOVERY_CONFIGURATION',
        });
      }
      const recovered = await identity.recoverStagingOwnerPassword(
        existingOwner.id,
        STAGING_OWNER_EMAIL,
        password,
        {
          recoveryVersion: STAGING_RECOVERY_VERSION,
          recoveryReceiptHash: recovery.receipt,
          recoveryNonceHash: recovery.nonceHash,
          recoveryTokenHash: recovery.recoveryTokenHash,
        },
      );
      audit({
        action: 'staging_owner_recovery',
        result: 'success',
        entityType: 'admin_user',
        entityId: existingOwner.id,
      });
      logger.info('Explicit one-time staging Named Owner recovery completed');
      return { ...status(), action: 'recovered', userId: recovered.id };
    }

    const bootstrapMetadata = {
      bootstrapVersion: STAGING_BOOTSTRAP_VERSION,
      bootstrapTimestamp: new Date(now()).toISOString(),
      bootstrapReason: 'missing_staging_owner',
      bootstrapSource: 'staging_startup',
    };
    const user = await identity.bootstrapOwner({
      displayName: STAGING_OWNER_DISPLAY_NAME,
      email: STAGING_OWNER_EMAIL,
      password,
    }, { bootstrapMetadata });
    logger.info('Staging Named Owner bootstrap completed');
    return { ...status(), action: 'created', userId: user.id };
  }

  function ensure() {
    if (!activeRun) activeRun = run().finally(() => { activeRun = null; });
    return activeRun;
  }

  return {
    ensure,
    readMetadata,
    status,
  };
}

module.exports = {
  APPROVED_STAGING_PROJECT_ID,
  APPROVED_STAGING_SERVICE_ID,
  STAGING_BOOTSTRAP_VERSION,
  STAGING_OWNER_DISPLAY_NAME,
  STAGING_OWNER_EMAIL,
  STAGING_RECOVERY_VERSION,
  createAdminStagingBootstrap,
  stagingGatesMatch,
};
