const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { VISION_SCHEMA_VERSION } = require('./ai-vision-schema');

function createAiVisionStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'ai-vision-analysis.json');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: VISION_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      analyses: [],
      productDnaApplications: [],
      auditEvents: [],
    };
  }
  function migrate(parsed) {
    if (parsed.schemaVersion === VISION_SCHEMA_VERSION) return parsed;
    throw new Error('invalid');
  }
  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const parsed = migrate(JSON.parse(fs.readFileSync(storePath, 'utf8')));
      if (!Number.isInteger(parsed.storeRevision) || !Array.isArray(parsed.analyses) ||
          !Array.isArray(parsed.productDnaApplications) || !Array.isArray(parsed.auditEvents)) throw new Error('invalid');
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('AI Vision store is unavailable.'), { code: 'AI_VISION_STORE_UNAVAILABLE' });
    }
  }
  function mutate(task, expectedRevision) {
    const run = queue.then(async () => {
      const current = read();
      if (expectedRevision != null && Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('Vision analysis changed. Refresh before continuing.'), {
          code: 'REVISION_CONFLICT',
        });
      }
      const result = await task(structuredClone(current));
      const next = {
        ...result.store,
        schemaVersion: VISION_SCHEMA_VERSION,
        storeRevision: current.storeRevision + 1,
        createdAt: current.createdAt,
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
  return { emptyStore, mutate, read, paths: { storePath } };
}

module.exports = { createAiVisionStore };
