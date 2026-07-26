const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function createListingStudioStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'listing-studio.json');
  let queue = Promise.resolve();
  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return { schemaVersion: 1, storeRevision: 0, createdAt: timestamp, updatedAt: timestamp, drafts: [] };
  }
  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const value = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (value.schemaVersion !== 1 || !Number.isInteger(value.storeRevision) ||
          !Array.isArray(value.drafts)) throw new Error('invalid');
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      const safe = new Error('Listing Studio store is unavailable.');
      safe.code = 'LISTING_STORE_UNAVAILABLE';
      throw safe;
    }
  }
  function mutate(task, expectedRevision) {
    const run = queue.then(() => {
      const current = read();
      if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
        const conflict = new Error('Listing drafts changed. Refresh and try again.');
        conflict.code = 'REVISION_CONFLICT';
        throw conflict;
      }
      const result = task(structuredClone(current));
      if (result.store.drafts.length < current.drafts.length ||
          current.drafts.some((draft, index) =>
            JSON.stringify(draft) !== JSON.stringify(result.store.drafts[index]))) {
        throw new Error('Listing drafts are append-only.');
      }
      const next = {
        ...result.store,
        schemaVersion: 1,
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

module.exports = { LISTING_STUDIO_SCHEMA_VERSION: 1, createListingStudioStore };
