const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AI_PRODUCT_COPILOT_SCHEMA_VERSION = 1;

function createAiProductCopilotStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'ai-product-copilot.json');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: AI_PRODUCT_COPILOT_SCHEMA_VERSION, storeRevision: 0,
      createdAt: timestamp, updatedAt: timestamp, analyses: [], auditEvents: [],
      dailyUsage: {},
    };
  }
  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const value = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (value.schemaVersion !== AI_PRODUCT_COPILOT_SCHEMA_VERSION ||
          !Number.isInteger(value.storeRevision) || !Array.isArray(value.analyses) ||
          !Array.isArray(value.auditEvents)) throw new Error('invalid');
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('AI Product Copilot store is unavailable.'), { code: 'AI_STORE_UNAVAILABLE' });
    }
  }
  function mutate(task, expectedRevision) {
    const run = queue.then(async () => {
      const current = read();
      if (expectedRevision != null && Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('AI analysis history changed. Refresh before continuing.'), { code: 'REVISION_CONFLICT' });
      }
      const result = await task(structuredClone(current));
      if (result.store.analyses.length < current.analyses.length ||
          current.analyses.some((record, index) => JSON.stringify(record) !== JSON.stringify(result.store.analyses[index])) ||
          result.store.auditEvents.length < current.auditEvents.length ||
          current.auditEvents.some((event, index) => JSON.stringify(event) !== JSON.stringify(result.store.auditEvents[index]))) {
        throw Object.assign(new Error('AI analysis and audit history are append-only.'), { code: 'IMMUTABLE_RECORD' });
      }
      const next = {
        ...result.store, schemaVersion: AI_PRODUCT_COPILOT_SCHEMA_VERSION,
        storeRevision: current.storeRevision + 1, createdAt: current.createdAt,
        updatedAt: new Date(now()).toISOString(),
      };
      const tmp = `${storePath}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
      fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(tmp, storePath);
      return { store: next, value: result.value };
    });
    queue = run.catch(() => {});
    return run;
  }
  return { read, mutate, paths: { storePath } };
}

module.exports = { AI_PRODUCT_COPILOT_SCHEMA_VERSION, createAiProductCopilotStore };
