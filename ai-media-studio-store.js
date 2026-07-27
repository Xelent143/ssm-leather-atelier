const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AI_MEDIA_STUDIO_SCHEMA_VERSION = 1;

function createAiMediaStudioStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'ai-media-studio.json');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: AI_MEDIA_STUDIO_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      plans: [],
      auditEvents: [],
    };
  }

  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (parsed.schemaVersion !== AI_MEDIA_STUDIO_SCHEMA_VERSION ||
          !Number.isInteger(parsed.storeRevision) ||
          !Array.isArray(parsed.plans) ||
          !Array.isArray(parsed.auditEvents)) throw new Error('invalid');
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('AI Media Studio store is unavailable.'), {
        code: 'AI_MEDIA_STORE_UNAVAILABLE',
      });
    }
  }

  function mutate(task, expectedRevision) {
    const run = queue.then(async () => {
      const current = read();
      if (expectedRevision != null && Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('Media plan changed. Refresh before continuing.'), {
          code: 'REVISION_CONFLICT',
        });
      }
      const result = await task(structuredClone(current));
      const next = {
        ...result.store,
        schemaVersion: AI_MEDIA_STUDIO_SCHEMA_VERSION,
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

  return { read, mutate, paths: { storePath } };
}

module.exports = { AI_MEDIA_STUDIO_SCHEMA_VERSION, createAiMediaStudioStore };
