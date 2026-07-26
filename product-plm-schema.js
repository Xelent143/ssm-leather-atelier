const crypto = require('crypto');

const PRODUCT_PLM_SCHEMA_VERSION = 1;
const PRODUCT_BRAIN_REFERENCE_TYPES = Object.freeze([
  'aiAnalysis',
  'leatherExpertNotes',
  'manufacturingNotes',
  'photographyNotes',
  'seoNotes',
  'marketplaceNotes',
  'qcHistory',
  'customerIssueHistory',
  'marketingAssets',
  'videoAssets',
  'promptLibrary',
  'brandKnowledge',
]);

const DATA_CLASSIFICATIONS = Object.freeze([
  'public',
  'internal',
  'confidential',
  'factory_confidential',
  'commercially_sensitive',
  'personal_data',
  'authentication_secret',
  'regulated_evidence',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function cleanText(value, maxLength = 240) {
  return String(value || '').trim().slice(0, maxLength);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  );
}

function contentHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function emptyProductBrainReferences() {
  return Object.fromEntries(PRODUCT_BRAIN_REFERENCE_TYPES.map((type) => [type, []]));
}

function normalizeLegacyProduct(sourceSystem, product) {
  const legacyId = cleanText(product?.id, 160);
  if (!legacyId) throw new Error('Legacy product ID is required.');
  return {
    sourceSystem,
    sourceEntityType: 'product',
    legacyId,
    legacySlug: cleanText(product.slug, 240),
    legacySku: cleanText(product.sku, 160),
    legacyMpn: cleanText(product.mpn, 160),
    legacyItemGroupId: cleanText(product.itemGroupId, 240),
    title: cleanText(product.title || 'Untitled product', 300),
    brandName: cleanText(product.brand || 'MOTOGRIP GEAR', 160),
  };
}

function legacySourceKey(record) {
  return `${record.sourceSystem}:${record.sourceEntityType}:${record.legacyId}`;
}

function validateStore(store) {
  if (!store || typeof store !== 'object') throw new Error('Product PLM store is invalid.');
  if (store.schemaVersion !== PRODUCT_PLM_SCHEMA_VERSION) throw new Error('Product PLM schema version is unsupported.');
  if (!Number.isInteger(store.storeRevision) || store.storeRevision < 0) throw new Error('Product PLM store revision is invalid.');
  for (const key of ['brands', 'legalEntities', 'productIdentities', 'legacyMappings', 'migrationPreviews', 'migrationBatches']) {
    if (!Array.isArray(store[key])) throw new Error(`Product PLM ${key} collection is invalid.`);
  }
  const ids = new Set();
  for (const collection of ['brands', 'legalEntities', 'productIdentities', 'legacyMappings', 'migrationPreviews', 'migrationBatches']) {
    for (const entity of store[collection]) {
      if (!isUuid(entity.id)) throw new Error(`Product PLM ${collection} contains an invalid UUID.`);
      if (ids.has(entity.id)) throw new Error('Product PLM contains a duplicate entity UUID.');
      ids.add(entity.id);
    }
  }
  const sourceKeys = new Set();
  for (const mapping of store.legacyMappings) {
    const key = legacySourceKey(mapping);
    if (sourceKeys.has(key)) throw new Error('Product PLM contains a duplicate legacy mapping.');
    sourceKeys.add(key);
    if (!isUuid(mapping.productUuid)) throw new Error('Product PLM legacy mapping target is invalid.');
  }
  return store;
}

module.exports = {
  DATA_CLASSIFICATIONS,
  PRODUCT_BRAIN_REFERENCE_TYPES,
  PRODUCT_PLM_SCHEMA_VERSION,
  canonicalize,
  cleanText,
  contentHash,
  emptyProductBrainReferences,
  isUuid,
  legacySourceKey,
  normalizeLegacyProduct,
  validateStore,
};
