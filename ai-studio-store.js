const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { validateStudioAppendOnlyTransition } = require('./ai-studio-audit');
const {
  AI_STUDIO_SCHEMA_VERSION,
  upgradeAiStudioStore,
  validateAiStudioStore,
} = require('./ai-studio-schema');

function atomicWriteJson(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

function createAiStudioStore(options = {}) {
  const dataDir = options.dataDir;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'ai-product-studio.json');
  let mutationQueue = Promise.resolve();

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }

  function emptyStore() {
    const timestamp = new Date(now()).toISOString();
    return {
      schemaVersion: AI_STUDIO_SCHEMA_VERSION,
      storeRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      studioProjects: [],
      generationPlans: [],
      studioTasks: [],
      artifacts: [],
      validationResults: [],
      studioApprovalReferences: [],
      studioAuditEvents: [],
    };
  }

  function read() {
    ensureDataDir();
    try {
      return validateAiStudioStore(
        upgradeAiStudioStore(JSON.parse(fs.readFileSync(storePath, 'utf8'))),
      );
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      const unavailable = new Error('AI Studio store is unavailable.');
      unavailable.code = 'AI_STUDIO_STORE_UNAVAILABLE';
      throw unavailable;
    }
  }

  function write(nextStore, expectedRevision) {
    ensureDataDir();
    const current = read();
    if (expectedRevision !== undefined && Number(expectedRevision) !== current.storeRevision) {
      const conflict = new Error('AI Studio data changed. Refresh and try again.');
      conflict.code = 'AI_STUDIO_REVISION_CONFLICT';
      throw conflict;
    }
    const next = validateAiStudioStore({
      ...nextStore,
      schemaVersion: AI_STUDIO_SCHEMA_VERSION,
      storeRevision: current.storeRevision + 1,
      createdAt: current.createdAt,
      updatedAt: new Date(now()).toISOString(),
    });
    validateStudioAppendOnlyTransition(current, next);
    try {
      const onDisk = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      const backupPath = `${storePath}.v${onDisk.schemaVersion}.backup`;
      if (onDisk.schemaVersion < AI_STUDIO_SCHEMA_VERSION && !fs.existsSync(backupPath)) {
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
        const conflict = new Error('AI Studio data changed. Refresh and try again.');
        conflict.code = 'AI_STUDIO_REVISION_CONFLICT';
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
      v0BackupPath: `${storePath}.v0.backup`,
    },
    read,
    write,
  };
}

module.exports = {
  atomicWriteJson,
  createAiStudioStore,
};
