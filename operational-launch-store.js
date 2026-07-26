const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OPERATIONAL_SCHEMA_VERSION = 1;

function createOperationalLaunchStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'operational-launch.json');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: OPERATIONAL_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      workflows: [],
      publications: [],
      auditEvents: [],
      idempotencyKeys: [],
    };
  }

  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const value = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (value.schemaVersion !== OPERATIONAL_SCHEMA_VERSION ||
          !Number.isInteger(value.storeRevision) ||
          !Array.isArray(value.workflows) ||
          !Array.isArray(value.publications) ||
          !Array.isArray(value.auditEvents) ||
          !Array.isArray(value.idempotencyKeys)) throw new Error('invalid');
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('Operational workflow store is unavailable.'), {
        code: 'OPERATIONAL_STORE_UNAVAILABLE',
      });
    }
  }

  function mutate(task, expectedRevision) {
    const run = queue.then(() => {
      const current = read();
      if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('Operational record changed. Refresh and try again.'), {
          code: 'REVISION_CONFLICT',
          currentRevision: current.storeRevision,
        });
      }
      const result = task(structuredClone(current));
      const next = {
        ...result.store,
        schemaVersion: OPERATIONAL_SCHEMA_VERSION,
        storeRevision: current.storeRevision + 1,
        createdAt: current.createdAt,
        updatedAt: new Date(now()).toISOString(),
      };
      const temporaryPath = `${storePath}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
      fs.writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(temporaryPath, storePath);
      return { store: next, value: result.value };
    });
    queue = run.catch(() => {});
    return run;
  }

  return { read, mutate, path: storePath };
}

module.exports = { OPERATIONAL_SCHEMA_VERSION, createOperationalLaunchStore };
