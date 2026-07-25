const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_RATE_LIMIT = 20;
const FAILED_LOGIN_LIMIT = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const COOKIE_NAME = 'mg_admin';

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  const length = Math.max(leftBuffer.length, rightBuffer.length, 1);
  const paddedLeft = Buffer.alloc(length);
  const paddedRight = Buffer.alloc(length);
  leftBuffer.copy(paddedLeft);
  rightBuffer.copy(paddedRight);
  return crypto.timingSafeEqual(paddedLeft, paddedRight) && leftBuffer.length === rightBuffer.length;
}

function atomicWriteJson(filePath, value) {
  const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, filePath);
}

function createAdminSecurity(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const logger = options.logger || console;
  const validateSession = options.validateSession || (() => true);
  const statePath = path.join(dataDir, 'admin-security.json');
  const auditPath = path.join(dataDir, 'admin-audit.ndjson');
  const securityEventsPath = path.join(dataDir, 'admin-security-events.ndjson');
  const loginAttempts = new Map();

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }

  function readState() {
    ensureDataDir();
    try {
      const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return {
        version: 1,
        sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
        lockout: parsed.lockout && typeof parsed.lockout === 'object' ? parsed.lockout : null,
      };
    } catch (error) {
      if (error.code !== 'ENOENT') logger.error('Admin security state could not be read');
      return { version: 1, sessions: {}, lockout: null };
    }
  }

  function writeState(state) {
    ensureDataDir();
    atomicWriteJson(statePath, state);
  }

  function tokenHash(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
  }

  function actorId(session) {
    if (!session) return 'anonymous';
    if (session.actorType === 'named_user' && session.userId) return `user:${session.userId}`;
    return 'legacy_owner';
  }

  function clientIp(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return forwarded || req.socket?.remoteAddress || 'unknown';
  }

  function maskedIp(req) {
    const ip = clientIp(req).replace(/^::ffff:/, '');
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    if (ip.includes(':')) return `${ip.split(':').slice(0, 4).join(':')}::/64`;
    return 'unknown';
  }

  function ipKey(req) {
    return tokenHash(clientIp(req));
  }

  function audit(req, event) {
    ensureDataDir();
    const record = {
      timestamp: new Date(now()).toISOString(),
      action: String(event.action),
      result: String(event.result),
      actorId: event.actorId || actorId(event.session),
      ip: maskedIp(req),
      entityType: event.entityType || null,
      entityId: event.entityId || null,
    };
    fs.appendFileSync(auditPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    logger.info(`Admin security event: ${record.action} ${record.result}`);
    return record;
  }

  function securityEvent(req, event) {
    ensureDataDir();
    const record = {
      timestamp: new Date(now()).toISOString(),
      severity: String(event.severity || 'medium'),
      action: String(event.action),
      result: String(event.result),
      actorId: event.actorId || actorId(event.session),
      ip: maskedIp(req),
      entityType: event.entityType || null,
      entityId: event.entityId || null,
    };
    fs.appendFileSync(securityEventsPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    logger.info(`Admin security alert: ${record.severity} ${record.action} ${record.result}`);
    return record;
  }

  function cleanup(state) {
    const currentTime = now();
    for (const [hash, session] of Object.entries(state.sessions)) {
      if (!session || session.expiresAt <= currentTime) delete state.sessions[hash];
    }
    if (state.lockout && state.lockout.until > 0 && state.lockout.until <= currentTime) state.lockout = null;
    return state;
  }

  function getSession(req) {
    const token = parseCookies(req)[COOKIE_NAME];
    if (!token) return null;
    const state = cleanup(readState());
    const session = state.sessions[tokenHash(token)];
    if (!session || session.expiresAt <= now() || session.revokedAt || !validateSession(session)) {
      if (session && !session.revokedAt) session.revokedAt = now();
      writeState(state);
      return null;
    }
    session.lastActivityAt = now();
    writeState(state);
    return { ...session, token };
  }

  function createSession(req, previousToken, identity = {}) {
    const state = cleanup(readState());
    if (previousToken && state.sessions[tokenHash(previousToken)]) {
      state.sessions[tokenHash(previousToken)].revokedAt = now();
    }
    const token = crypto.randomBytes(32).toString('base64url');
    const hash = tokenHash(token);
    const actorType = identity.actorType || 'legacy_owner';
    const session = {
      id: crypto.randomUUID(),
      actorType,
      userId: identity.userId || null,
      provider: actorType === 'named_user' ? 'named-user' : 'legacy-compatibility',
      subject: identity.userId || 'legacy_owner',
      sessionRevocationVersion: Number(identity.sessionRevocationVersion || 0),
      authMethod: identity.authMethod || (actorType === 'named_user' ? 'email_password' : 'legacy_password'),
      csrfToken: crypto.randomBytes(32).toString('base64url'),
      createdAt: now(),
      lastActivityAt: now(),
      absoluteExpiresAt: now() + SESSION_TTL_MS,
      expiresAt: now() + SESSION_TTL_MS,
      revokedAt: null,
    };
    state.sessions[hash] = session;
    writeState(state);
    return { ...session, token };
  }

  function revokeSession(token) {
    if (!token) return false;
    const state = cleanup(readState());
    const hash = tokenHash(token);
    const existed = Boolean(state.sessions[hash] && !state.sessions[hash].revokedAt);
    if (state.sessions[hash]) state.sessions[hash].revokedAt = now();
    writeState(state);
    return existed;
  }

  function revokeUserSessions(userId) {
    const state = cleanup(readState());
    let revoked = 0;
    for (const session of Object.values(state.sessions)) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = now();
        revoked += 1;
      }
    }
    writeState(state);
    return revoked;
  }

  function cookie(session, secure) {
    const expires = new Date(session.expiresAt).toUTCString();
    return `${COOKIE_NAME}=${encodeURIComponent(session.token)}; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; Expires=${expires}`;
  }

  function clearCookie(secure) {
    return `${COOKIE_NAME}=; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  function isSecureRequest(req) {
    return process.env.NODE_ENV === 'production' || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  }

  function loginStatus(req) {
    const currentTime = now();
    const key = ipKey(req);
    const recent = (loginAttempts.get(key) || []).filter((time) => currentTime - time < LOGIN_WINDOW_MS);
    loginAttempts.set(key, recent);
    const state = cleanup(readState());
    if (state.lockout && state.lockout.until > currentTime) return { allowed: false, reason: 'lockout' };
    if (recent.length >= LOGIN_RATE_LIMIT) return { allowed: false, reason: 'rate_limit' };
    return { allowed: true };
  }

  function recordLoginAttempt(req) {
    const key = ipKey(req);
    const recent = (loginAttempts.get(key) || []).filter((time) => now() - time < LOGIN_WINDOW_MS);
    recent.push(now());
    loginAttempts.set(key, recent);
  }

  function recordFailedLogin() {
    const state = cleanup(readState());
    const failures = (state.lockout?.failures || 0) + 1;
    if (failures >= FAILED_LOGIN_LIMIT) {
      state.lockout = { failures, until: now() + LOCKOUT_MS };
      writeState(state);
      return true;
    }
    state.lockout = { failures, until: 0 };
    writeState(state);
    return false;
  }

  function recordSuccessfulLogin() {
    const state = cleanup(readState());
    state.lockout = null;
    writeState(state);
  }

  function validOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
      const originUrl = new URL(origin);
      const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
      return originUrl.host === (forwardedHost || req.headers.host);
    } catch {
      return false;
    }
  }

  function validCsrf(req, session) {
    return Boolean(session && safeEqual(req.headers['x-csrf-token'], session.csrfToken));
  }

  return {
    audit,
    clearCookie,
    cookie,
    createSession,
    getSession,
    isSecureRequest,
    loginStatus,
    recordFailedLogin,
    recordLoginAttempt,
    recordSuccessfulLogin,
    revokeSession,
    revokeUserSessions,
    securityEvent,
    validCsrf,
    validOrigin,
    actorId,
    parseCookies,
    readState,
    paths: { statePath, auditPath, securityEventsPath },
  };
}

function parseCookies(req) {
  const cookies = {};
  for (const item of String(req.headers.cookie || '').split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    try {
      const key = decodeURIComponent(item.slice(0, separator).trim());
      const value = decodeURIComponent(item.slice(separator + 1).trim());
      cookies[key] = value;
    } catch {
      // Ignore malformed cookie segments.
    }
  }
  return cookies;
}

module.exports = {
  COOKIE_NAME,
  FAILED_LOGIN_LIMIT,
  LOGIN_RATE_LIMIT,
  LOCKOUT_MS,
  SESSION_TTL_MS,
  createAdminSecurity,
  parseCookies,
  safeEqual,
};
