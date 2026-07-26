const STAGING_BOOTSTRAP_VERSION = 1;
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
  let activeRun = null;

  function readMetadata() {
    const parsed = identity.readStore().bootstrapMetadata;
    if (!parsed) return null;
    return {
      bootstrapVersion: Number(parsed.bootstrapVersion) || null,
      bootstrapTimestamp: parsed.bootstrapTimestamp || null,
      bootstrapReason: parsed.bootstrapReason || null,
      bootstrapSource: parsed.bootstrapSource || null,
    };
  }

  function status() {
    const metadata = readMetadata();
    return {
      bootstrapEnabled: stagingGatesMatch(env),
      ownerExists: Boolean(identity.owner()),
      bootstrapVersion: metadata?.bootstrapVersion || null,
      lastBootstrapTime: metadata?.bootstrapTimestamp || null,
    };
  }

  async function run() {
    if (!stagingGatesMatch(env)) return { ...status(), action: 'disabled' };
    const password = String(env.STAGING_OWNER_PASSWORD || '');
    const existingOwner = identity.owner();
    const passwordSyncEnabled = env.STAGING_OWNER_PASSWORD_SYNC_ENABLED === 'true';

    if (existingOwner && !passwordSyncEnabled) {
      return { ...status(), action: 'owner_exists' };
    }
    if (!password) {
      const unavailable = new Error('Staging Owner bootstrap is not configured.');
      unavailable.code = 'STAGING_BOOTSTRAP_CONFIGURATION';
      throw unavailable;
    }
    if (existingOwner) {
      const exactOwner = existingOwner.displayName === STAGING_OWNER_DISPLAY_NAME &&
        existingOwner.email === STAGING_OWNER_EMAIL &&
        existingOwner.accountType === 'owner' &&
        existingOwner.status === 'active';
      if (!exactOwner) {
        const mismatch = new Error('Staging Owner identity does not match the approved recovery account.');
        mismatch.code = 'STAGING_BOOTSTRAP_IDENTITY_MISMATCH';
        throw mismatch;
      }
      const ownerRecord = identity.readStore().users.find((item) => item.id === existingOwner.id);
      const loginStateNeedsReset = Number(ownerRecord?.failedLoginCount || 0) > 0 ||
        Boolean(ownerRecord?.lockedUntil);
      if (await identity.passwordMatches(existingOwner.id, password) && !loginStateNeedsReset) {
        return { ...status(), action: 'owner_exists' };
      }
      const requested = await identity.requestPasswordReset(existingOwner.email);
      const reset = requested && await identity.resetPassword(requested.rawToken, password);
      if (!reset?.ok) {
        const failed = new Error('Staging Owner password synchronization failed.');
        failed.code = 'STAGING_BOOTSTRAP_PASSWORD_SYNC';
        throw failed;
      }
      logger.info('Staging Named Owner password synchronized');
      return { ...status(), action: 'password_synchronized', userId: existingOwner.id };
    }

    const metadata = {
      bootstrapVersion: STAGING_BOOTSTRAP_VERSION,
      bootstrapTimestamp: new Date(now()).toISOString(),
      bootstrapReason: 'missing_staging_owner',
      bootstrapSource: 'staging_startup',
    };
    const user = await identity.bootstrapOwner({
      displayName: STAGING_OWNER_DISPLAY_NAME,
      email: STAGING_OWNER_EMAIL,
      password,
    }, { bootstrapMetadata: metadata });
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
  createAdminStagingBootstrap,
  stagingGatesMatch,
};
