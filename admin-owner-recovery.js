const crypto = require('crypto');

const OWNER_EMAIL = 'info@motogripgear.com';
const OWNER_DISPLAY_NAME = 'Chand Rizvi';

function digest(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createAdminOwnerRecovery(options = {}) {
  const identity = options.identity;
  const env = options.env || process.env;
  const now = options.now || (() => Date.now());

  function matchingOwner() {
    const matches = identity.readStore().users.filter((user) =>
      user.email === OWNER_EMAIL &&
      user.displayName === OWNER_DISPLAY_NAME &&
      user.accountType === 'owner' &&
      user.status === 'active');
    return matches.length === 1 ? matches[0] : null;
  }

  function status() {
    const store = identity.readStore();
    const code = String(env.STAGING_OWNER_BROWSER_RECOVERY_CODE || '');
    const expiresAt = Date.parse(String(env.STAGING_OWNER_BROWSER_RECOVERY_EXPIRES_AT || ''));
    const configured = env.APP_ENV === 'staging' &&
      env.STAGING_OWNER_BROWSER_RECOVERY_ENABLED === 'true' &&
      Boolean(code) &&
      Number.isFinite(expiresAt);
    const codeHash = configured ? digest(code) : '';
    const consumed = Boolean(codeHash && store.bootstrapMetadata?.browserRecoveryCodeHash === codeHash);
    return {
      enabled: configured && !consumed && expiresAt > now(),
      configured,
      consumed,
      expired: configured && expiresAt <= now(),
      ownerMatches: Boolean(matchingOwner()),
      codeHash,
    };
  }

  async function complete(input = {}) {
    const current = status();
    if (!current.enabled || !current.ownerMatches) {
      throw Object.assign(new Error('Owner recovery is unavailable.'), {
        code: 'OWNER_RECOVERY_UNAVAILABLE',
      });
    }
    if (!safeEqual(digest(input.recoveryCode), current.codeHash)) {
      throw Object.assign(new Error('Owner recovery could not be verified.'), {
        code: 'OWNER_RECOVERY_INVALID',
      });
    }
    if (String(input.newPassword || '') !== String(input.confirmNewPassword || '')) {
      throw Object.assign(new Error('New password confirmation does not match.'), {
        code: 'PASSWORD_POLICY',
      });
    }
    const owner = matchingOwner();
    return identity.completeBrowserOwnerRecovery(
      owner.id,
      OWNER_EMAIL,
      input.newPassword,
      {
        browserRecoveryCodeHash: current.codeHash,
        browserRecoveryCompletedAt: new Date(now()).toISOString(),
      },
    );
  }

  return { complete, status };
}

module.exports = {
  OWNER_DISPLAY_NAME,
  OWNER_EMAIL,
  createAdminOwnerRecovery,
  digest,
};
