const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRODUCT_EDITOR_V2_SCHEMA_VERSION = 1;

function createProductEditorV2Store(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'product-editor-v2.json');
  const mediaDir = path.join(dataDir, 'product-editor-media');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: PRODUCT_EDITOR_V2_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      products: [],
      auditEvents: [],
      idempotencyKeys: [],
    };
  }

  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(mediaDir, { recursive: true, mode: 0o700 });
    try {
      const value = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (value?.schemaVersion !== PRODUCT_EDITOR_V2_SCHEMA_VERSION ||
          !Number.isInteger(value.storeRevision) ||
          !Array.isArray(value.products) ||
          !Array.isArray(value.auditEvents) ||
          !Array.isArray(value.idempotencyKeys)) throw new Error('invalid');
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('Product Editor store is unavailable.'), {
        code: 'PRODUCT_EDITOR_STORE_UNAVAILABLE',
      });
    }
  }

  function mutate(task, expectedRevision) {
    const run = queue.then(async () => {
      const current = read();
      if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('Product draft changed. Refresh before saving.'), {
          code: 'REVISION_CONFLICT',
          currentRevision: current.storeRevision,
        });
      }
      const result = await task(structuredClone(current));
      if (result.store.auditEvents.length < current.auditEvents.length ||
          current.auditEvents.some((event, index) =>
            JSON.stringify(event) !== JSON.stringify(result.store.auditEvents[index]))) {
        throw Object.assign(new Error('Product Editor audit history is append-only.'), {
          code: 'IMMUTABLE_RECORD',
        });
      }
      const next = {
        ...result.store,
        schemaVersion: PRODUCT_EDITOR_V2_SCHEMA_VERSION,
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

  return { read, mutate, paths: { storePath, mediaDir } };
}

module.exports = { PRODUCT_EDITOR_V2_SCHEMA_VERSION, createProductEditorV2Store };
