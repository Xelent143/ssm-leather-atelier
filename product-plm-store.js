const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  PRODUCT_PLM_SCHEMA_VERSION,
  upgradeStore,
  validateStore,
} = require('./product-plm-schema');
const { validateAppendOnlyTransition } = require('./product-plm-history');

function atomicWriteJson(filePath, value) {
  const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, filePath);
}

function createProductPlmStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'product-plm.json');
  let mutationQueue = Promise.resolve();

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: PRODUCT_PLM_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      brands: [],
      legalEntities: [],
      productIdentities: [],
      productFamilies: [],
      productStyles: [],
      productComponents: [],
      productRelationships: [],
      optionDefinitions: [],
      optionValues: [],
      styleOptionAssignments: [],
      sellableItems: [],
      marketplaceIdentities: [],
      productVersions: [],
      evidenceRecords: [],
      evidenceLinks: [],
      productHistoryEvents: [],
      legacyMappings: [],
      migrationPreviews: [],
      migrationBatches: [],
    };
  }

  function read() {
    ensureDataDir();
    try {
      return validateStore(upgradeStore(JSON.parse(fs.readFileSync(storePath, 'utf8'))));
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      const unavailable = new Error('Product PLM store is unavailable.');
      unavailable.code = 'PLM_STORE_UNAVAILABLE';
      throw unavailable;
    }
  }

  function write(nextStore, expectedRevision) {
    ensureDataDir();
    const current = read();
    if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
      const conflict = new Error('Product PLM data changed. Refresh and try again.');
      conflict.code = 'PLM_REVISION_CONFLICT';
      throw conflict;
    }
    const next = validateStore({
      ...nextStore,
      schemaVersion: PRODUCT_PLM_SCHEMA_VERSION,
      storeRevision: current.storeRevision + 1,
      createdAt: current.createdAt,
      updatedAt: new Date(now()).toISOString(),
    });
    validateAppendOnlyTransition(current, next);
    try {
      const onDisk = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      const backupPath = `${storePath}.v${onDisk.schemaVersion}.backup`;
      if (onDisk.schemaVersion < PRODUCT_PLM_SCHEMA_VERSION && !fs.existsSync(backupPath)) {
        fs.copyFileSync(storePath, backupPath, fs.constants.COPYFILE_EXCL);
        fs.chmodSync(backupPath, 0o600);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    atomicWriteJson(storePath, next);
    return next;
  }

  function mutate(task, expectedRevision) {
    const run = mutationQueue.then(() => {
      const current = read();
      if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
        const conflict = new Error('Product PLM data changed. Refresh and try again.');
        conflict.code = 'PLM_REVISION_CONFLICT';
        throw conflict;
      }
      const result = task(structuredClone(current));
      const written = write(result.store, current.storeRevision);
      return { store: written, value: result.value };
    });
    mutationQueue = run.catch(() => {});
    return run;
  }

  return {
    emptyStore,
    mutate,
    paths: {
      storePath,
      v1BackupPath: `${storePath}.v1.backup`,
      v2BackupPath: `${storePath}.v2.backup`,
      v3BackupPath: `${storePath}.v3.backup`,
      v4BackupPath: `${storePath}.v4.backup`,
    },
    read,
    write,
  };
}

module.exports = { atomicWriteJson, createProductPlmStore };
