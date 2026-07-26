const { validateStudioAuditEvents } = require('./ai-studio-audit');
const { validateStudioDomain } = require('./ai-studio-domain');

const AI_STUDIO_SCHEMA_VERSION = 1;
const AI_STUDIO_COLLECTIONS = Object.freeze([
  'studioProjects',
  'generationPlans',
  'studioTasks',
  'artifacts',
  'validationResults',
  'studioApprovalReferences',
  'studioAuditEvents',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function upgradeAiStudioStore(store) {
  if (!store || typeof store !== 'object') throw new Error('AI Studio store is invalid.');
  if (store.schemaVersion === AI_STUDIO_SCHEMA_VERSION) return store;
  if (store.schemaVersion !== 0) throw new Error('AI Studio schema version is unsupported.');
  return {
    ...store,
    schemaVersion: AI_STUDIO_SCHEMA_VERSION,
    studioProjects: [],
    generationPlans: [],
    studioTasks: [],
    artifacts: [],
    validationResults: [],
    studioApprovalReferences: [],
    studioAuditEvents: [],
  };
}

function validateAiStudioStore(store) {
  if (!store || typeof store !== 'object') throw new Error('AI Studio store is invalid.');
  if (store.schemaVersion !== AI_STUDIO_SCHEMA_VERSION) {
    throw new Error('AI Studio schema version is unsupported.');
  }
  if (!Number.isInteger(store.storeRevision) || store.storeRevision < 0) {
    throw new Error('AI Studio store revision is invalid.');
  }
  for (const collection of AI_STUDIO_COLLECTIONS) {
    if (!Array.isArray(store[collection])) {
      throw new Error(`AI Studio ${collection} collection is invalid.`);
    }
  }
  const ids = new Set();
  for (const collection of AI_STUDIO_COLLECTIONS) {
    for (const record of store[collection]) {
      if (!isUuid(record.id) || ids.has(record.id)) {
        throw new Error('AI Studio contains an invalid or duplicate record UUID.');
      }
      ids.add(record.id);
    }
  }
  validateStudioDomain(store);
  validateStudioAuditEvents(store);
  return store;
}

module.exports = {
  AI_STUDIO_COLLECTIONS,
  AI_STUDIO_SCHEMA_VERSION,
  upgradeAiStudioStore,
  validateAiStudioStore,
};
