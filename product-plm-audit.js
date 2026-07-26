const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createProductPlmAudit(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const auditPath = path.join(dataDir, 'product-audit.ndjson');

  function maskedIp(req) {
    const raw = String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '').split(',')[0].trim().replace(/^::ffff:/, '');
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) {
      const parts = raw.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    if (raw.includes(':')) return `${raw.split(':').slice(0, 4).join(':')}::/64`;
    return 'unknown';
  }

  function append(req, event) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const record = {
      id: crypto.randomUUID(),
      timestamp: new Date(now()).toISOString(),
      actorType: String(event.actorType || 'system'),
      actorId: String(event.actorId || 'system'),
      sessionId: event.sessionId ? String(event.sessionId) : null,
      action: String(event.action),
      result: String(event.result),
      entityType: event.entityType ? String(event.entityType) : null,
      entityId: event.entityId ? String(event.entityId) : null,
      changedFields: Array.isArray(event.changedFields) ? event.changedFields.map(String).slice(0, 100) : [],
      previousHash: event.previousHash ? String(event.previousHash) : null,
      newHash: event.newHash ? String(event.newHash) : null,
      migrationBatchId: event.migrationBatchId ? String(event.migrationBatchId) : null,
      correlationId: event.correlationId ? String(event.correlationId) : crypto.randomUUID(),
      ip: maskedIp(req),
    };
    fs.appendFileSync(auditPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    return record;
  }

  return { append, paths: { auditPath } };
}

module.exports = { createProductPlmAudit };
