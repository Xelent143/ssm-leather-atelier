const TRUSTED_RELEASE_REJECTION_CODES = Object.freeze([
  'not_found',
  'not_approved',
  'withdrawn',
  'superseded',
  'revoked',
  'expired',
  'invalid_version',
  'invalid_evidence',
  'invalid_approval',
  'invalid_manifest',
  'invalid_knowledge_lock',
  'channel_not_authorized',
  'purpose_not_authorized',
  'resolver_unavailable',
]);

const TRUSTED_RELEASE_RESOLVER_CONTRACT = Object.freeze({
  contractVersion: 1,
  requestFields: Object.freeze([
    'productReleaseId',
    'requiredChannel',
    'requiredPurpose',
  ]),
  trustedResultFields: Object.freeze([
    'productUuid',
    'productReleaseId',
    'knowledgeLockId',
    'knowledgeLockHash',
    'productVersionHash',
    'evidenceSetHash',
    'releaseManifestHash',
    'dataClassification',
  ]),
  rejectionCodes: TRUSTED_RELEASE_REJECTION_CODES,
});

const TRUSTED_INPUT_KEYS = new Set([
  'resolverContractVersion', 'trustState', 'productUuid', 'productReleaseId',
  'knowledgeLockId', 'knowledgeLockHash', 'productVersionHash',
  'evidenceSetHash', 'releaseManifestHash', 'requiredChannel',
  'requiredPurpose', 'sourceDataClassification', 'capturedAt',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function validateTrustedInputSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) ||
      Object.keys(snapshot).some((key) => !TRUSTED_INPUT_KEYS.has(key)) ||
      snapshot.resolverContractVersion !== TRUSTED_RELEASE_RESOLVER_CONTRACT.contractVersion ||
      snapshot.trustState !== 'pending_resolution' ||
      !isUuid(snapshot.productUuid) || !isUuid(snapshot.productReleaseId) ||
      !isUuid(snapshot.knowledgeLockId) ||
      !isHash(snapshot.knowledgeLockHash) ||
      !isHash(snapshot.productVersionHash) ||
      !isHash(snapshot.evidenceSetHash) ||
      !isHash(snapshot.releaseManifestHash) ||
      !/^[a-z][a-z0-9_]{0,79}$/.test(String(snapshot.requiredChannel || '')) ||
      !/^[a-z][a-z0-9_]{0,79}$/.test(String(snapshot.requiredPurpose || '')) ||
      !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive']
        .includes(snapshot.sourceDataClassification) ||
      !Number.isFinite(Date.parse(snapshot.capturedAt))) {
    throw new Error('AI Studio trusted input snapshot contract is invalid.');
  }
}

module.exports = {
  TRUSTED_RELEASE_REJECTION_CODES,
  TRUSTED_RELEASE_RESOLVER_CONTRACT,
  validateTrustedInputSnapshot,
};
