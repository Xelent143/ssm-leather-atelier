const crypto = require('crypto');

const VERSION_KEYS = new Set([
  'id', 'schemaVersion', 'productUuid', 'versionNumber', 'snapshotSchemaVersion',
  'sourceStoreRevision', 'snapshot', 'entityHashes', 'evidenceReferenceIds',
  'evidenceSetHash', 'contentHash', 'captureReason', 'status', 'productDnaReferences',
  'competitorReferenceIds', 'searchIntelligenceReferences', 'aiProvenance',
  'dataClassification', 'createdAt', 'createdBy',
]);
const SNAPSHOT_KEYS = new Set([
  'productIdentity', 'brand', 'legalEntity', 'productFamily', 'productStyle',
  'productComponents', 'productRelationships', 'optionDefinitions', 'optionValues',
  'styleOptionAssignments', 'sellableItems', 'marketplaceIdentities',
]);
const DNA_KEYS = new Set([
  'dnaFingerprint', 'dnaGeneration', 'dnaParentVersionId', 'dnaScoreReferenceId',
]);
const SEARCH_KEYS = new Set([
  'keywordClusterIds', 'searchIntentIds', 'faqClusterIds', 'trendIds', 'blogTopicIds',
]);
const AI_PROVENANCE_KEYS = new Set([
  'aiSessionReferenceId', 'promptTemplateReferenceId', 'aiEngineVersionReferenceId',
  'humanApprovalReferenceId',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function containsProhibitedSnapshotKey(value) {
  const prohibited = new Set([
    'password',
    'token',
    'secret',
    'cookie',
    'customerdata',
    'customermeasurements',
    'paymentdata',
    'orderdata',
    'generatedcontent',
    'aioutput',
  ]);
  if (Array.isArray(value)) return value.some(containsProhibitedSnapshotKey);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) =>
    prohibited.has(key.toLowerCase()) || containsProhibitedSnapshotKey(child));
}

function validateUuidArray(values, label, limit = 250) {
  if (!Array.isArray(values) || values.length > limit ||
      values.some((value) => !isUuid(value)) || new Set(values).size !== values.length) {
    throw new Error(`${label} are invalid.`);
  }
}

function validateReferenceObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !keys.has(key))) {
    throw new Error(`${label} contains unsupported data.`);
  }
}

function snapshotEntries(snapshot) {
  const entries = [
    ['product_identity', snapshot.productIdentity],
    ['brand', snapshot.brand],
    ['legal_entity', snapshot.legalEntity],
    ['product_family', snapshot.productFamily],
    ['product_style', snapshot.productStyle],
  ];
  const collections = [
    ['product_component', snapshot.productComponents],
    ['product_relationship', snapshot.productRelationships],
    ['option_definition', snapshot.optionDefinitions],
    ['option_value', snapshot.optionValues],
    ['style_option_assignment', snapshot.styleOptionAssignments],
    ['sellable_item', snapshot.sellableItems],
    ['marketplace_identity', snapshot.marketplaceIdentities],
  ];
  for (const [type, values] of collections) {
    for (const value of values) entries.push([type, value]);
  }
  return entries;
}

function computeEntityHashes(snapshot) {
  return Object.fromEntries(
    snapshotEntries(snapshot)
      .map(([type, entity]) => [`${type}:${entity.id}`, hashValue(entity)])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function computeEvidenceSetHash(evidenceReferenceIds, evidenceRecords) {
  const records = new Map(evidenceRecords.map((record) => [record.id, record]));
  return hashValue([...evidenceReferenceIds].sort().map((id) => ({
    id,
    recordHash: records.get(id)?.recordHash || null,
  })));
}

function versionHashInput(version) {
  return {
    id: version.id,
    schemaVersion: version.schemaVersion,
    productUuid: version.productUuid,
    versionNumber: version.versionNumber,
    snapshotSchemaVersion: version.snapshotSchemaVersion,
    sourceStoreRevision: version.sourceStoreRevision,
    snapshot: version.snapshot,
    entityHashes: version.entityHashes,
    evidenceReferenceIds: version.evidenceReferenceIds,
    evidenceSetHash: version.evidenceSetHash,
    captureReason: version.captureReason,
    status: version.status,
    productDnaReferences: version.productDnaReferences,
    competitorReferenceIds: version.competitorReferenceIds,
    searchIntelligenceReferences: version.searchIntelligenceReferences,
    aiProvenance: version.aiProvenance,
    dataClassification: version.dataClassification,
    createdAt: version.createdAt,
    createdBy: version.createdBy,
  };
}

function computeProductVersionHash(version) {
  return hashValue(versionHashInput(version));
}

function validateSnapshot(snapshot, productUuid) {
  validateReferenceObject(snapshot, SNAPSHOT_KEYS, 'Product PLM version snapshot');
  if (Buffer.byteLength(JSON.stringify(snapshot), 'utf8') > 2 * 1024 * 1024) {
    throw new Error('Product PLM version snapshot exceeds the size limit.');
  }
  if (containsProhibitedSnapshotKey(snapshot)) {
    throw new Error('Product PLM version snapshot contains prohibited data.');
  }
  for (const key of [
    'productComponents', 'productRelationships', 'optionDefinitions', 'optionValues',
    'styleOptionAssignments', 'sellableItems', 'marketplaceIdentities',
  ]) {
    if (!Array.isArray(snapshot[key])) throw new Error('Product PLM version snapshot collection is invalid.');
  }
  for (const key of ['productIdentity', 'brand', 'legalEntity', 'productFamily', 'productStyle']) {
    if (!snapshot[key] || typeof snapshot[key] !== 'object' || !isUuid(snapshot[key].id)) {
      throw new Error('Product PLM version snapshot root entity is invalid.');
    }
  }
  if (snapshot.productIdentity.id !== productUuid ||
      snapshot.productStyle.productUuid !== productUuid ||
      snapshot.productStyle.brandId !== snapshot.brand.id ||
      snapshot.productStyle.legalEntityId !== snapshot.legalEntity.id ||
      snapshot.productStyle.familyId !== snapshot.productFamily.id) {
    throw new Error('Product PLM version snapshot ownership is inconsistent.');
  }
  const entryKeys = snapshotEntries(snapshot).map(([type, entity]) => `${type}:${entity.id}`);
  if (new Set(entryKeys).size !== entryKeys.length) {
    throw new Error('Product PLM version snapshot contains duplicate entity identities.');
  }
}

function validateProductVersions(store) {
  const productIds = new Set(store.productIdentities.map((identity) => identity.id));
  const evidenceIds = new Set(store.evidenceRecords.map((record) => record.id));
  const versionsByProduct = new Map();
  const versionById = new Map(store.productVersions.map((version) => [version.id, version]));
  for (const version of store.productVersions) {
    if (!version || typeof version !== 'object' || Array.isArray(version) ||
        Object.keys(version).some((key) => !VERSION_KEYS.has(key))) {
      throw new Error('Product PLM version contains unsupported data.');
    }
    if (!productIds.has(version.productUuid) || !Number.isInteger(version.versionNumber) ||
        version.versionNumber < 1 || !Number.isInteger(version.snapshotSchemaVersion) ||
        version.snapshotSchemaVersion < 1 || !Number.isInteger(version.sourceStoreRevision) ||
        version.sourceStoreRevision < 0 || version.status !== 'candidate' ||
        !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive']
          .includes(version.dataClassification) ||
        !String(version.captureReason || '').trim() || String(version.captureReason).length > 500) {
      throw new Error('Product PLM version metadata is invalid.');
    }
    validateSnapshot(version.snapshot, version.productUuid);
    const entityHashes = computeEntityHashes(version.snapshot);
    if (hashValue(entityHashes) !== hashValue(version.entityHashes) ||
        Object.values(version.entityHashes).some((hash) => !isHash(hash))) {
      throw new Error('Product PLM version entity hashes are invalid.');
    }
    validateUuidArray(version.evidenceReferenceIds, 'Product PLM version evidence references');
    if (version.evidenceReferenceIds.some((id) => !evidenceIds.has(id)) ||
        version.evidenceSetHash !== computeEvidenceSetHash(version.evidenceReferenceIds, store.evidenceRecords)) {
      throw new Error('Product PLM version evidence set is invalid.');
    }
    validateReferenceObject(version.productDnaReferences, DNA_KEYS, 'Product DNA references');
    const dna = version.productDnaReferences;
    if ((dna.dnaFingerprint !== null && !isHash(dna.dnaFingerprint)) ||
        !Number.isInteger(dna.dnaGeneration) || dna.dnaGeneration < 0 ||
        (dna.dnaParentVersionId !== null && !isUuid(dna.dnaParentVersionId)) ||
        (dna.dnaScoreReferenceId !== null && !isUuid(dna.dnaScoreReferenceId))) {
      throw new Error('Product DNA references are invalid.');
    }
    if (dna.dnaParentVersionId !== null) {
      const parent = versionById.get(dna.dnaParentVersionId);
      if (!parent || parent.productUuid !== version.productUuid ||
          parent.versionNumber >= version.versionNumber) {
        throw new Error('Product DNA parent version reference is invalid.');
      }
    }
    validateUuidArray(version.competitorReferenceIds, 'Competitor Intelligence references');
    validateReferenceObject(
      version.searchIntelligenceReferences,
      SEARCH_KEYS,
      'Search Intelligence references',
    );
    for (const [key, values] of Object.entries(version.searchIntelligenceReferences)) {
      validateUuidArray(values, `Search Intelligence ${key}`);
    }
    validateReferenceObject(version.aiProvenance, AI_PROVENANCE_KEYS, 'AI provenance');
    if (Object.values(version.aiProvenance).some((value) => value !== null && !isUuid(value))) {
      throw new Error('AI provenance references are invalid.');
    }
    if (version.contentHash !== computeProductVersionHash(version)) {
      throw new Error('Product PLM version content hash is invalid.');
    }
    const versions = versionsByProduct.get(version.productUuid) || [];
    versions.push(version.versionNumber);
    versionsByProduct.set(version.productUuid, versions);
  }
  for (const numbers of versionsByProduct.values()) {
    const sorted = [...numbers].sort((a, b) => a - b);
    if (new Set(sorted).size !== sorted.length ||
        sorted.some((number, index) => number !== index + 1)) {
      throw new Error('Product PLM version numbering is invalid.');
    }
  }
}

module.exports = {
  computeEntityHashes,
  computeEvidenceSetHash,
  computeProductVersionHash,
  hashValue,
  validateProductVersions,
};
