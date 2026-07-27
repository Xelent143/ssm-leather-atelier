const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hash, verify, Algorithm } = require('@node-rs/argon2');

const USER_STATUSES = new Set(['invited', 'active', 'suspended', 'disabled', 'recovery_hold']);
const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 128;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_RATE_LIMIT = 20;
const FAILED_LOGIN_LIMIT = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function tokenHash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function atomicWriteJson(filePath, value) {
  const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, filePath);
}

function validatePassword(password, context = {}) {
  const value = String(password || '');
  const compact = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = normalizeEmail(context.email);
  const localPart = email.split('@')[0] || '';
  const displayName = String(context.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const blocked = [
    'motogrip',
    'motogripgear',
    'motogripadmin',
    'administrator',
    'password',
    'password123',
    localPart,
    displayName,
  ].filter((item) => item.length >= 5);

  if (Array.from(value).length < PASSWORD_MIN_LENGTH || Array.from(value).length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: 'Choose a unique passphrase between 15 and 128 characters.' };
  }
  if (blocked.some((item) => compact === item || compact.includes(item))) {
    return { valid: false, error: 'Choose a less predictable passphrase that is not based on account or company details.' };
  }
  return { valid: true };
}

function passwordHashNeedsUpgrade(encodedHash) {
  const match = String(encodedHash || '').match(/\$argon2id\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)\$/);
  if (!match) return true;
  return Number(match[1]) < ARGON2_OPTIONS.memoryCost ||
    Number(match[2]) < ARGON2_OPTIONS.timeCost ||
    Number(match[3]) < ARGON2_OPTIONS.parallelism;
}

function passwordHashIsValid(encodedHash) {
  return /^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$/.test(
    String(encodedHash || ''),
  );
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    accountType: user.accountType,
    emailVerifiedAt: user.emailVerifiedAt,
    mfaStatus: user.mfaStatus,
    locale: user.locale,
    timezone: user.timezone,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    disabledAt: user.disabledAt,
    passwordChangedAt: user.passwordChangedAt,
    sessionRevocationVersion: user.sessionRevocationVersion,
  };
}

function createAdminIdentity(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const logger = options.logger || console;
  const storePath = path.join(dataDir, 'admin-identities.json');
  const bootstrapLockPath = path.join(dataDir, 'admin-identities.bootstrap.lock');
  const loginAttempts = new Map();
  const actionAttempts = new Map();
  const dummyHash = hash('not-a-valid-motogrip-account-passphrase', ARGON2_OPTIONS);
  let mutationQueue = Promise.resolve();

  function serializeMutation(task) {
    const run = mutationQueue.then(task, task);
    mutationQueue = run.catch(() => {});
    return run;
  }

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }

  function emptyStore() {
    return {
      version: 1,
      users: [],
      bootstrapMetadata: null,
      passwordResetTokens: [],
      invitationTokens: [],
      updatedAt: new Date(now()).toISOString(),
    };
  }

  function readStore() {
    ensureDataDir();
    try {
      const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      return {
        ...emptyStore(),
        ...parsed,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
        invitationTokens: Array.isArray(parsed.invitationTokens) ? parsed.invitationTokens : [],
      };
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      logger.error('Admin identity store could not be read');
      const unavailable = new Error('Admin identity service is unavailable.');
      unavailable.code = 'IDENTITY_STORE_UNAVAILABLE';
      throw unavailable;
    }
  }

  function writeStore(store) {
    ensureDataDir();
    atomicWriteJson(storePath, { ...store, updatedAt: new Date(now()).toISOString() });
  }

  function owner() {
    return readStore().users.find((user) => user.accountType === 'owner') || null;
  }

  function bootstrapAvailable() {
    return !owner();
  }

  function findByEmail(email) {
    const normalized = normalizeEmail(email);
    return readStore().users.find((user) => user.email === normalized) || null;
  }

  function findById(id) {
    return readStore().users.find((user) => user.id === id) || null;
  }

  async function bootstrapOwner(input, options = {}) {
    return serializeMutation(async () => {
    ensureDataDir();
    let lock;
    try {
      lock = fs.openSync(bootstrapLockPath, 'wx', 0o600);
    } catch (error) {
      if (error.code === 'EEXIST') {
        const conflict = new Error('Owner bootstrap is already in progress or completed.');
        conflict.code = 'BOOTSTRAP_CONFLICT';
        throw conflict;
      }
      throw error;
    }

    try {
      const store = readStore();
      if (store.users.some((user) => user.accountType === 'owner')) {
        const conflict = new Error('Owner bootstrap is already complete.');
        conflict.code = 'BOOTSTRAP_CONFLICT';
        throw conflict;
      }
      const email = normalizeEmail(input.email);
      const displayName = String(input.displayName || '').trim().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName) {
        const validation = new Error('Enter a valid email address and display name.');
        validation.code = 'VALIDATION';
        throw validation;
      }
      if (store.users.some((user) => user.email === email)) {
        const conflict = new Error('Owner bootstrap cannot be completed.');
        conflict.code = 'BOOTSTRAP_CONFLICT';
        throw conflict;
      }
      const passwordValidation = validatePassword(input.password, { email, displayName });
      if (!passwordValidation.valid) {
        const validation = new Error(passwordValidation.error);
        validation.code = 'PASSWORD_POLICY';
        throw validation;
      }

      const timestamp = new Date(now()).toISOString();
      const user = {
        id: crypto.randomUUID(),
        email,
        displayName,
        status: 'active',
        accountType: 'owner',
        passwordHash: await hash(String(input.password), ARGON2_OPTIONS),
        emailVerifiedAt: timestamp,
        bootstrapVerifiedAt: timestamp,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdBy: 'legacy_owner',
        createdAt: timestamp,
        updatedAt: timestamp,
        disabledAt: null,
        passwordChangedAt: timestamp,
        sessionRevocationVersion: 1,
        mfaStatus: 'not_enrolled',
        locale: null,
        timezone: null,
        recoveryMethods: [],
      };
      store.users.push(user);
      if (options.bootstrapMetadata) {
        store.bootstrapMetadata = {
          bootstrapVersion: Number(options.bootstrapMetadata.bootstrapVersion) || null,
          bootstrapTimestamp: String(options.bootstrapMetadata.bootstrapTimestamp || ''),
          bootstrapReason: String(options.bootstrapMetadata.bootstrapReason || ''),
          bootstrapSource: String(options.bootstrapMetadata.bootstrapSource || ''),
        };
      }
      writeStore(store);
      return publicUser(user);
    } finally {
      if (lock !== undefined) fs.closeSync(lock);
      try {
        fs.unlinkSync(bootstrapLockPath);
      } catch (error) {
        if (error.code !== 'ENOENT') logger.error('Admin bootstrap lock could not be released');
      }
    }
    });
  }

  function loginStatus(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.socket?.remoteAddress || 'unknown';
    const key = tokenHash(ip);
    const currentTime = now();
    const recent = (loginAttempts.get(key) || []).filter((time) => currentTime - time < LOGIN_WINDOW_MS);
    loginAttempts.set(key, recent);
    return recent.length >= LOGIN_RATE_LIMIT ? { allowed: false } : { allowed: true };
  }

  function recordLoginAttempt(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.socket?.remoteAddress || 'unknown';
    const key = tokenHash(ip);
    const recent = (loginAttempts.get(key) || []).filter((time) => now() - time < LOGIN_WINDOW_MS);
    loginAttempts.set(key, [...recent, now()]);
  }

  function allowAction(req, action, limit = 10, windowMs = LOGIN_WINDOW_MS) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.socket?.remoteAddress || 'unknown';
    const key = `${action}:${tokenHash(ip)}`;
    const currentTime = now();
    const recent = (actionAttempts.get(key) || []).filter((time) => currentTime - time < windowMs);
    if (recent.length >= limit) {
      actionAttempts.set(key, recent);
      return false;
    }
    actionAttempts.set(key, [...recent, currentTime]);
    return true;
  }

  async function authenticate(email, password, req) {
    return serializeMutation(async () => {
    const rate = loginStatus(req);
    if (!rate.allowed) return { ok: false, reason: 'rate_limit' };
    recordLoginAttempt(req);

    const normalized = normalizeEmail(email);
    const store = readStore();
    const userIndex = store.users.findIndex((item) => item.email === normalized);
    const user = userIndex >= 0 ? store.users[userIndex] : null;
    const passwordHash = user?.passwordHash || await dummyHash;
    const validPassword = await verify(passwordHash, String(password || '')).catch(() => false);

    if (!user || !validPassword) {
      if (user) {
        user.failedLoginCount = Number(user.failedLoginCount || 0) + 1;
        if (user.failedLoginCount >= FAILED_LOGIN_LIMIT) user.lockedUntil = new Date(now() + LOCKOUT_MS).toISOString();
        user.updatedAt = new Date(now()).toISOString();
        store.users[userIndex] = user;
        writeStore(store);
      }
      return { ok: false, reason: 'credentials' };
    }

    if (user.lockedUntil && Date.parse(user.lockedUntil) > now()) return { ok: false, reason: 'lockout', user };
    if (user.lockedUntil && Date.parse(user.lockedUntil) <= now()) user.lockedUntil = null;
    if (user.status !== 'active') return { ok: false, reason: 'status', user };

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date(now()).toISOString();
    user.updatedAt = user.lastLoginAt;
    if (passwordHashNeedsUpgrade(user.passwordHash)) {
      user.passwordHash = await hash(String(password), ARGON2_OPTIONS);
    }
    store.users[userIndex] = user;
    writeStore(store);
    return { ok: true, user: publicUser(user) };
    });
  }

  function sessionIsValid(session) {
    if (session.actorType !== 'named_user') return true;
    const user = findById(session.userId);
    return Boolean(
      user &&
      user.status === 'active' &&
      Number(user.sessionRevocationVersion) === Number(session.sessionRevocationVersion)
    );
  }

  function updateUserStatus(userId, status) {
    if (!USER_STATUSES.has(status)) throw new Error('Invalid user status');
    const store = readStore();
    const index = store.users.findIndex((user) => user.id === userId);
    if (index < 0) return null;
    store.users[index].status = status;
    store.users[index].disabledAt = status === 'disabled' ? new Date(now()).toISOString() : null;
    store.users[index].sessionRevocationVersion = Number(store.users[index].sessionRevocationVersion || 0) + 1;
    store.users[index].updatedAt = new Date(now()).toISOString();
    writeStore(store);
    return publicUser(store.users[index]);
  }

  function updateManagedUserStatus(userId, status) {
    const user = findById(userId);
    if (!user || user.accountType !== 'listing_editor') return null;
    return updateUserStatus(userId, status);
  }

  async function createManagedUser(input, createdBy) {
    return serializeMutation(async () => {
      const store = readStore();
      const email = normalizeEmail(input.email);
      const displayName = String(input.displayName || '').trim().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName) {
        throw Object.assign(new Error('Enter a valid email address and display name.'), {
          code: 'VALIDATION',
        });
      }
      if (store.users.some((user) => user.email === email)) {
        throw Object.assign(new Error('A user with this email already exists.'), {
          code: 'IDENTITY_CONFLICT',
        });
      }
      const validation = validatePassword(input.password, { email, displayName });
      if (!validation.valid) {
        throw Object.assign(new Error(validation.error), { code: 'PASSWORD_POLICY' });
      }
      const timestamp = new Date(now()).toISOString();
      const user = {
        id: crypto.randomUUID(),
        email,
        displayName,
        status: input.active === false ? 'disabled' : 'active',
        accountType: 'listing_editor',
        passwordHash: await hash(String(input.password), ARGON2_OPTIONS),
        emailVerifiedAt: timestamp,
        bootstrapVerifiedAt: null,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdBy: String(createdBy || 'owner'),
        createdAt: timestamp,
        updatedAt: timestamp,
        disabledAt: input.active === false ? timestamp : null,
        passwordChangedAt: timestamp,
        mustChangePassword: true,
        sessionRevocationVersion: 1,
        mfaStatus: 'not_enrolled',
        locale: null,
        timezone: null,
        recoveryMethods: [],
      };
      store.users.push(user);
      writeStore(store);
      return publicUser(user);
    });
  }

  async function resetManagedUserPassword(userId, password) {
    return serializeMutation(async () => {
      const store = readStore();
      const index = store.users.findIndex((user) =>
        user.id === userId && user.accountType === 'listing_editor');
      if (index < 0) {
        throw Object.assign(new Error('Listing Editor was not found.'), { code: 'VALIDATION' });
      }
      const user = store.users[index];
      const validation = validatePassword(password, user);
      if (!validation.valid) {
        throw Object.assign(new Error(validation.error), { code: 'PASSWORD_POLICY' });
      }
      const timestamp = new Date(now()).toISOString();
      user.passwordHash = await hash(String(password), ARGON2_OPTIONS);
      user.passwordChangedAt = timestamp;
      user.updatedAt = timestamp;
      user.mustChangePassword = true;
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      user.sessionRevocationVersion = Number(user.sessionRevocationVersion || 0) + 1;
      store.users[index] = user;
      writeStore(store);
      return publicUser(user);
    });
  }

  async function changeOwnPassword(userId, currentPassword, newPassword) {
    return serializeMutation(async () => {
      const store = readStore();
      const index = store.users.findIndex((user) =>
        user.id === userId && user.accountType === 'owner' && user.status === 'active');
      if (index < 0) {
        throw Object.assign(new Error('Named Owner access is required.'), { code: 'OWNER_REQUIRED' });
      }
      const user = store.users[index];
      const currentMatches = await verify(user.passwordHash, String(currentPassword || '')).catch(() => false);
      if (!currentMatches) {
        throw Object.assign(new Error('Current password is incorrect.'), {
          code: 'CURRENT_PASSWORD_INVALID',
        });
      }
      if (String(currentPassword || '') === String(newPassword || '')) {
        throw Object.assign(new Error('Choose a new password that differs from the current password.'), {
          code: 'PASSWORD_POLICY',
        });
      }
      const validation = validatePassword(newPassword, user);
      if (!validation.valid) {
        throw Object.assign(new Error(validation.error), { code: 'PASSWORD_POLICY' });
      }
      const timestamp = new Date(now()).toISOString();
      user.passwordHash = await hash(String(newPassword), ARGON2_OPTIONS);
      user.passwordChangedAt = timestamp;
      user.updatedAt = timestamp;
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      user.mustChangePassword = false;
      user.sessionRevocationVersion = Number(user.sessionRevocationVersion || 0) + 1;
      store.users[index] = user;
      writeStore(store);
      return publicUser(user);
    });
  }

  async function recoverStagingOwnerPassword(userId, email, newPassword, recoveryMetadata) {
    return serializeMutation(async () => {
      const store = readStore();
      const index = store.users.findIndex((user) =>
        user.id === userId &&
        user.email === normalizeEmail(email) &&
        user.accountType === 'owner' &&
        user.status === 'active');
      if (index < 0) {
        throw Object.assign(new Error('Approved staging Owner recovery identity was not found.'), {
          code: 'STAGING_RECOVERY_IDENTITY_MISMATCH',
        });
      }
      const user = store.users[index];
      const validation = validatePassword(newPassword, user);
      if (!validation.valid) {
        throw Object.assign(new Error('Staging Owner recovery is not configured.'), {
          code: 'STAGING_RECOVERY_CONFIGURATION',
        });
      }
      const timestamp = new Date(now()).toISOString();
      user.passwordHash = await hash(String(newPassword), ARGON2_OPTIONS);
      user.passwordChangedAt = timestamp;
      user.updatedAt = timestamp;
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      user.sessionRevocationVersion = Number(user.sessionRevocationVersion || 0) + 1;
      store.users[index] = user;
      store.bootstrapMetadata = {
        ...(store.bootstrapMetadata || {}),
        recoveryVersion: Number(recoveryMetadata.recoveryVersion) || 1,
        recoveryTimestamp: timestamp,
        recoveryReason: 'explicit_staging_owner_recovery',
        recoverySource: 'staging_startup_one_time',
        recoveryReceiptHash: String(recoveryMetadata.recoveryReceiptHash || ''),
        recoveryOwnerId: user.id,
      };
      writeStore(store);
      return publicUser(user);
    });
  }

  function managedUsers() {
    return readStore().users
      .filter((user) => user.accountType === 'listing_editor')
      .map(publicUser);
  }

  async function createTokenRecord(kind, userId, ttlMs) {
    return serializeMutation(async () => {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const store = readStore();
    const listKey = kind === 'reset' ? 'passwordResetTokens' : 'invitationTokens';
    for (const record of store[listKey]) {
      if (record.userId === userId && !record.usedAt && !record.revokedAt) record.revokedAt = new Date(now()).toISOString();
    }
    const record = {
      id: crypto.randomUUID(),
      userId,
      tokenHash: tokenHash(rawToken),
      createdAt: new Date(now()).toISOString(),
      expiresAt: new Date(now() + ttlMs).toISOString(),
      usedAt: null,
      revokedAt: null,
    };
    store[listKey].push(record);
    writeStore(store);
    return { rawToken, record: { ...record, tokenHash: undefined } };
    });
  }

  async function requestPasswordReset(email) {
    const user = findByEmail(email);
    if (!user || user.status !== 'active') return null;
    return createTokenRecord('reset', user.id, RESET_TTL_MS);
  }

  async function passwordMatches(userId, password) {
    const user = readStore().users.find((item) => item.id === userId);
    if (!user || user.status !== 'active' || !user.passwordHash) return false;
    try {
      return await verify(user.passwordHash, String(password || ''));
    } catch {
      return false;
    }
  }

  async function createInvitationToken(userId) {
    return createTokenRecord('invitation', userId, INVITATION_TTL_MS);
  }

  async function consumeInvitationToken(rawToken) {
    return serializeMutation(async () => {
    const store = readStore();
    const record = store.invitationTokens.find((item) => item.tokenHash === tokenHash(rawToken));
    if (!record || record.usedAt || record.revokedAt || Date.parse(record.expiresAt) <= now()) {
      return { ok: false };
    }
    record.usedAt = new Date(now()).toISOString();
    writeStore(store);
    return { ok: true, userId: record.userId };
    });
  }

  async function revokeInvitationToken(rawToken) {
    return serializeMutation(async () => {
    const store = readStore();
    const record = store.invitationTokens.find((item) => item.tokenHash === tokenHash(rawToken));
    if (!record || record.usedAt || record.revokedAt) return false;
    record.revokedAt = new Date(now()).toISOString();
    writeStore(store);
    return true;
    });
  }

  async function resetPassword(rawToken, newPassword) {
    return serializeMutation(async () => {
    const store = readStore();
    const hashValue = tokenHash(rawToken);
    const record = store.passwordResetTokens.find((item) => item.tokenHash === hashValue);
    if (!record || record.usedAt || record.revokedAt || Date.parse(record.expiresAt) <= now()) {
      return { ok: false, reason: 'invalid_token' };
    }
    const userIndex = store.users.findIndex((user) => user.id === record.userId);
    if (userIndex < 0) return { ok: false, reason: 'invalid_token' };
    const user = store.users[userIndex];
    const validation = validatePassword(newPassword, user);
    if (!validation.valid) return { ok: false, reason: 'password_policy', error: validation.error };

    user.passwordHash = await hash(String(newPassword), ARGON2_OPTIONS);
    user.passwordChangedAt = new Date(now()).toISOString();
    user.updatedAt = user.passwordChangedAt;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.sessionRevocationVersion = Number(user.sessionRevocationVersion || 0) + 1;
    record.usedAt = user.passwordChangedAt;
    store.users[userIndex] = user;
    writeStore(store);
    return { ok: true, user: publicUser(user) };
    });
  }

  function countActiveSessions(userId, securityState) {
    return Object.values(securityState.sessions || {}).filter((session) =>
      session.actorType === 'named_user' &&
      session.userId === userId &&
      !session.revokedAt &&
      session.expiresAt > now()
    ).length;
  }

  return {
    authenticate,
    allowAction,
    bootstrapAvailable,
    bootstrapOwner,
    changeOwnPassword,
    countActiveSessions,
    createManagedUser,
    consumeInvitationToken,
    createInvitationToken,
    findByEmail,
    findById,
    owner,
    passwordMatches,
    passwordHashIsValid: (value) => passwordHashIsValid(value),
    publicUser,
    readStore,
    resetManagedUserPassword,
    recoverStagingOwnerPassword,
    requestPasswordReset,
    revokeInvitationToken,
    resetPassword,
    sessionIsValid,
    managedUsers,
    updateUserStatus,
    updateManagedUserStatus,
    validatePassword,
    paths: { storePath, bootstrapLockPath },
  };
}

module.exports = {
  ARGON2_OPTIONS,
  FAILED_LOGIN_LIMIT,
  INVITATION_TTL_MS,
  LOCKOUT_MS,
  LOGIN_RATE_LIMIT,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  RESET_TTL_MS,
  USER_STATUSES,
  createAdminIdentity,
  normalizeEmail,
  passwordHashNeedsUpgrade,
  passwordHashIsValid,
  publicUser,
  tokenHash,
  validatePassword,
};
