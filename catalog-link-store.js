const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 1;

function emptyStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    storeRevision: 0,
    links: [],
    ignoredProducts: [],
    rejectedSuggestions: [],
    auditEvents: [],
  };
}

function createCatalogLinkStore(options = {}) {
  const dataDir = options.dataDir;
  if (!dataDir) throw new Error('Catalog link data directory is required.');
  const storePath = options.storePath || path.join(dataDir, 'catalog-product-dna-links.json');

  function read() {
    if (!fs.existsSync(storePath)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const error = new Error('Catalog link store schema is unsupported.');
      error.code = 'CATALOG_LINK_STORE_UNAVAILABLE';
      throw error;
    }
    return {
      ...emptyStore(),
      ...parsed,
      links: Array.isArray(parsed.links) ? parsed.links : [],
      ignoredProducts: Array.isArray(parsed.ignoredProducts) ? parsed.ignoredProducts : [],
      rejectedSuggestions: Array.isArray(parsed.rejectedSuggestions) ? parsed.rejectedSuggestions : [],
      auditEvents: Array.isArray(parsed.auditEvents) ? parsed.auditEvents : [],
    };
  }

  function write(next, expectedRevision) {
    const current = read();
    if (expectedRevision !== current.storeRevision) {
      const error = new Error('Catalog links changed while this review was open.');
      error.code = 'REVISION_CONFLICT';
      throw error;
    }
    const saved = {
      ...next,
      schemaVersion: SCHEMA_VERSION,
      storeRevision: current.storeRevision + 1,
    };
    fs.mkdirSync(dataDir, { recursive: true });
    const temporaryPath = `${storePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(saved, null, 2)}\n`, { mode: 0o600 });
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
  CATALOG_LINK_SCHEMA_VERSION: SCHEMA_VERSION,
  createCatalogLinkStore,
  emptyCatalogLinkStore: emptyStore,
};
