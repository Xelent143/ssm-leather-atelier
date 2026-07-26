const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LISTING_STUDIO_SCHEMA_VERSION = 2;

function createListingStudioStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'listing-studio.json');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: LISTING_STUDIO_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      inputDrafts: [],
      drafts: [],
    };
  }

  function migrate(value) {
    if (value?.schemaVersion === 1 && Number.isInteger(value.storeRevision) &&
        Array.isArray(value.drafts)) {
      return {
        ...value,
        schemaVersion: LISTING_STUDIO_SCHEMA_VERSION,
        inputDrafts: [],
      };
    }
    if (value?.schemaVersion !== LISTING_STUDIO_SCHEMA_VERSION ||
        !Number.isInteger(value.storeRevision) ||
        !Array.isArray(value.inputDrafts) ||
        !Array.isArray(value.drafts)) throw new Error('invalid');
    return value;
  }

  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      return migrate(JSON.parse(fs.readFileSync(storePath, 'utf8')));
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      const safe = new Error('Listing Studio store is unavailable.');
      safe.code = 'LISTING_STORE_UNAVAILABLE';
      throw safe;
    }
  }

  function assertAppendOnly(current, next, field) {
    if (next[field].length < current[field].length ||
        current[field].some((record, index) =>
          JSON.stringify(record) !== JSON.stringify(next[field][index]))) {
      const error = new Error(`Listing Studio ${field} are append-only.`);
      error.code = 'IMMUTABLE_RECORD';
      throw error;
    }
  }

  function mutate(task, expectedRevision) {
    const run = queue.then(() => {
      const current = read();
      if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
        const conflict = new Error('Listing workspace changed. Refresh and try again.');
        conflict.code = 'REVISION_CONFLICT';
        throw conflict;
      }
      const result = task(structuredClone(current));
      assertAppendOnly(current, result.store, 'inputDrafts');
      assertAppendOnly(current, result.store, 'drafts');
      const next = {
        ...result.store,
        schemaVersion: LISTING_STUDIO_SCHEMA_VERSION,
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

module.exports = { LISTING_STUDIO_SCHEMA_VERSION, createListingStudioStore };
