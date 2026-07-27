const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CATEGORY_TAXONOMY_SCHEMA_VERSION = 1;

function createCategoryTaxonomyStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'category-taxonomy.json');
  const mediaDir = path.join(dataDir, 'category-media');
  let queue = Promise.resolve();

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: CATEGORY_TAXONOMY_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastImportAt: null,
      categories: [],
      assignments: [],
      rulePreviews: [],
      auditEvents: [],
      syncEvents: [],
    };
  }
  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(mediaDir, { recursive: true, mode: 0o700 });
    try {
      const value = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (value?.schemaVersion !== CATEGORY_TAXONOMY_SCHEMA_VERSION ||
          !Number.isInteger(value.storeRevision) || !Array.isArray(value.categories) ||
          !Array.isArray(value.assignments) || !Array.isArray(value.auditEvents) ||
          !Array.isArray(value.syncEvents)) throw new Error('invalid');
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('Category taxonomy store is unavailable.'), { code: 'CATEGORY_STORE_UNAVAILABLE' });
    }
  }
  function mutate(task, expectedRevision) {
    const run = queue.then(async () => {
      const current = read();
      if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
        throw Object.assign(new Error('Category data changed. Refresh before saving.'), {
          code: 'REVISION_CONFLICT', currentRevision: current.storeRevision,
        });
      }
      const result = await task(structuredClone(current));
      if (result.store.auditEvents.length < current.auditEvents.length ||
          result.store.syncEvents.length < current.syncEvents.length ||
          current.auditEvents.some((event, index) => JSON.stringify(event) !== JSON.stringify(result.store.auditEvents[index])) ||
          current.syncEvents.some((event, index) => JSON.stringify(event) !== JSON.stringify(result.store.syncEvents[index]))) {
        throw Object.assign(new Error('Category history is append-only.'), { code: 'IMMUTABLE_RECORD' });
      }
      const next = {
        ...result.store,
        schemaVersion: CATEGORY_TAXONOMY_SCHEMA_VERSION,
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

module.exports = { CATEGORY_TAXONOMY_SCHEMA_VERSION, createCategoryTaxonomyStore };
