const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 1;

function emptyStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    storeRevision: 0,
    lastSyncAt: null,
    sourceRevision: null,
    products: [],
  };
}

function createCatalogSyncStore(options = {}) {
  const dataDir = options.dataDir;
  if (!dataDir) throw new Error('Catalog data directory is required.');
  const storePath = options.storePath || path.join(dataDir, 'catalog-sync.json');

  function read() {
    if (!fs.existsSync(storePath)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      throw new Error('Catalog store schema is unsupported.');
    }
    return {
      ...emptyStore(),
      ...parsed,
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
  }

  function write(next, expectedRevision) {
    const current = read();
    if (expectedRevision !== current.storeRevision) {
      const conflict = new Error('Catalog changed during synchronization.');
      conflict.code = 'REVISION_CONFLICT';
      throw conflict;
    }
    const saved = {
      ...next,
      schemaVersion: SCHEMA_VERSION,
      storeRevision: current.storeRevision + 1,
    };
    fs.mkdirSync(dataDir, { recursive: true });
    const temporaryPath = `${storePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(saved, null, 2)}\n`, {
      mode: 0o600,
    });
    fs.renameSync(temporaryPath, storePath);
    return saved;
  }

  return {
    path: storePath,
    read,
    write,
  };
}

module.exports = {
  CATALOG_SYNC_SCHEMA_VERSION: SCHEMA_VERSION,
  createCatalogSyncStore,
  emptyCatalogSyncStore: emptyStore,
};
