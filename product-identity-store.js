const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRODUCT_IDENTITY_SCHEMA_VERSION = 1;

function createProductIdentityStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'product-identities.json');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: PRODUCT_IDENTITY_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      sequences: { productSku: {}, internalProductCode: {}, factoryCode: {} },
      identities: [],
      auditEvents: [],
    };
  }

  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const value = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (value?.schemaVersion !== PRODUCT_IDENTITY_SCHEMA_VERSION ||
          !Number.isInteger(value.storeRevision) || !value.sequences ||
          !Array.isArray(value.identities) || !Array.isArray(value.auditEvents)) {
        throw new Error('invalid');
      }
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      const safe = new Error('Product Identity store is unavailable.');
      safe.code = 'IDENTITY_STORE_UNAVAILABLE';
      throw safe;
    }
  }

  function mutate(task, expectedRevision) {
    const run = queue.then(() => {
      const current = read();
      if (expectedRevision !== undefined &&
          Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('Product Identity changed. Refresh and try again.'), {
          code: 'REVISION_CONFLICT',
        });
      }
      const result = task(structuredClone(current));
      if (result.store.auditEvents.length < current.auditEvents.length ||
          current.auditEvents.some((event, index) =>
            JSON.stringify(event) !== JSON.stringify(result.store.auditEvents[index]))) {
        throw Object.assign(new Error('Product Identity audit events are append-only.'), {
          code: 'IMMUTABLE_RECORD',
        });
      }
      const next = {
        ...result.store,
        schemaVersion: PRODUCT_IDENTITY_SCHEMA_VERSION,
        storeRevision: current.storeRevision + 1,
        createdAt: current.createdAt,
        updatedAt: new Date(now()).toISOString(),
      };
      const tmp = `${storePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(tmp, storePath);
      return { store: next, value: result.value };
    });
    queue = run.catch(() => {});
    return run;
  }

  return { read, mutate, paths: { storePath } };
}

module.exports = { PRODUCT_IDENTITY_SCHEMA_VERSION, createProductIdentityStore };
