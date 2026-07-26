const { hashValue } = require('./product-plm-versions');

const KNOWLEDGE_LOCK_KEYS = new Set([
  'id', 'schemaVersion', 'productUuid', 'releaseId', 'productVersionId',
  'productVersionHash', 'evidenceSetHash', 'releaseManifestHash',
  'approvalSnapshotHash', 'canonicalizationVersion', 'hashAlgorithm',
  'knowledgeLockNonceHash', 'knowledgeLockHash', 'integrityReferences',
  'trustProvenanceReferences', 'lifecyclePolicyReferences',
  'dataClassification', 'createdAt', 'createdBy',
]);
const INTEGRITY_KEYS = new Set([
  'integrityCheckReferenceId', 'verificationReferenceId', 'trustLevelReferenceId',
]);
const TRUST_KEYS = new Set([
  'trustProvenanceReferenceId', 'releaseCertificationReferenceId',
]);
const POLICY_KEYS = new Set([
  'lifecyclePolicyReferenceId', 'archivalPolicyReferenceId',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function validateNullableReferenceObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !keys.has(key)) ||
      Object.values(value).some((reference) => reference !== null && !isUuid(reference))) {
    throw new Error(`${label} are invalid.`);
  }
}

function knowledgeLockHashInput(lock) {
  const { knowledgeLockHash, ...input } = lock;
  return input;
}

function computeKnowledgeLockHash(lock) {
  return hashValue(knowledgeLockHashInput(lock));
}

function validateKnowledgeLocks(store) {
  const releases = new Map(store.productReleases.map((item) => [item.id, item]));
  const nonces = new Set();
  const releaseLocks = new Set();
  for (const lock of store.knowledgeLocks) {
    if (!lock || typeof lock !== 'object' || Array.isArray(lock) ||
        Object.keys(lock).some((key) => !KNOWLEDGE_LOCK_KEYS.has(key))) {
      throw new Error('Product PLM Knowledge Lock contains unsupported data.');
    }
    const release = releases.get(lock.releaseId);
    if (!isUuid(lock.id) || !release ||
        release.productUuid !== lock.productUuid ||
        release.productVersionId !== lock.productVersionId ||
        release.productVersionHash !== lock.productVersionHash ||
        release.evidenceSetHash !== lock.evidenceSetHash ||
        release.releaseManifestHash !== lock.releaseManifestHash ||
        release.approvalSnapshotHash !== lock.approvalSnapshotHash ||
        !Number.isInteger(lock.canonicalizationVersion) ||
        lock.canonicalizationVersion < 1 ||
        lock.hashAlgorithm !== 'sha256' ||
        !isHash(lock.knowledgeLockNonceHash) ||
        nonces.has(lock.knowledgeLockNonceHash) ||
        releaseLocks.has(lock.releaseId) ||
        !Number.isFinite(Date.parse(lock.createdAt)) ||
        !String(lock.createdBy || '').trim() || String(lock.createdBy).length > 180 ||
        !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive']
          .includes(lock.dataClassification)) {
      throw new Error('Product PLM Knowledge Lock metadata is invalid.');
    }
    validateNullableReferenceObject(
      lock.integrityReferences,
      INTEGRITY_KEYS,
      'Product PLM Knowledge Lock integrity references',
    );
    validateNullableReferenceObject(
      lock.trustProvenanceReferences,
      TRUST_KEYS,
      'Product PLM Knowledge Lock trust provenance references',
    );
    validateNullableReferenceObject(
      lock.lifecyclePolicyReferences,
      POLICY_KEYS,
      'Product PLM Knowledge Lock lifecycle policy references',
    );
    if (lock.knowledgeLockHash !== computeKnowledgeLockHash(lock)) {
      throw new Error('Product PLM Knowledge Lock hash is invalid.');
    }
    nonces.add(lock.knowledgeLockNonceHash);
    releaseLocks.add(lock.releaseId);
  }
}

module.exports = {
  computeKnowledgeLockHash,
  validateKnowledgeLocks,
};
