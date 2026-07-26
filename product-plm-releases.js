const { computeEvidenceSetHash, hashValue } = require('./product-plm-versions');

const RELEASE_CHANNELS = Object.freeze([
  'website',
  'ebay',
  'etsy',
  'amazon',
  'walmart',
  'wholesale',
  'dealer',
  'internal',
  'ai_generation',
]);
const RELEASE_PURPOSES = Object.freeze([
  'product_listing',
  'seo',
  'blog',
  'buying_guide',
  'faq',
  'marketing',
  'factory',
  'wholesale',
  'customer_support',
  'ai_training',
]);
const RELEASE_EVENT_CODES = Object.freeze([
  'release_drafted',
  'release_approved',
  'release_activated',
  'release_withdrawn',
  'release_superseded',
  'release_revoked',
  'release_expired',
  'integrity_verification_passed',
  'integrity_verification_failed',
]);

const RELEASE_KEYS = new Set([
  'id', 'schemaVersion', 'productUuid', 'releaseNumber', 'productVersionId',
  'productVersionHash', 'evidenceReferenceIds', 'evidenceSetHash',
  'approvalRequestId', 'approvalDecisionIds', 'approvalSnapshotHash',
  'channels', 'purposes', 'releaseNonceHash', 'releaseManifestHash',
  'integrityReferences', 'consumptionEngineReferences',
  'trustProvenanceReferences', 'aiCompatibilityReferences',
  'customerExperienceReferences', 'analyticsReferences',
  'lifecyclePolicyReferences', 'dataClassification', 'createdAt', 'createdBy',
]);
const EVENT_KEYS = new Set([
  'id', 'schemaVersion', 'productUuid', 'releaseId', 'sequence', 'eventCode',
  'reasonCode', 'eventNonceHash', 'previousEventHash', 'eventHash', 'actorId',
  'actorType', 'timestamp', 'dataClassification',
]);
const INTEGRITY_KEYS = new Set([
  'integrityCheckReferenceId', 'verificationReferenceId', 'trustLevelReferenceId',
]);
const CONSUMPTION_ENGINE_KEYS = new Set([
  'productStudioReferenceIds', 'searchIntelligenceReferenceIds',
  'competitorIntelligenceReferenceIds', 'ceoDashboardReferenceIds',
  'factoryOsReferenceIds', 'wholesaleOsReferenceIds',
]);
const TRUST_PROVENANCE_KEYS = new Set([
  'trustProvenanceReferenceId', 'releaseCertificationReferenceId',
]);
const AI_COMPATIBILITY_KEYS = new Set([
  'supportedAIModelReferenceIds', 'promptProfileReferenceIds',
]);
const CUSTOMER_EXPERIENCE_KEYS = new Set([
  'customerJourneyReferenceIds', 'supportKnowledgeReferenceIds',
]);
const ANALYTICS_KEYS = new Set([
  'analyticsReferenceIds', 'performanceReferenceIds',
]);
const LIFECYCLE_POLICY_KEYS = new Set([
  'lifecyclePolicyReferenceId', 'archivalPolicyReferenceId',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function isTimestamp(value) {
  return Number.isFinite(Date.parse(value));
}

function validateReferenceObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !keys.has(key))) {
    throw new Error(`${label} contains unsupported data.`);
  }
}

function validateNullableUuid(value, label) {
  if (value !== null && !isUuid(value)) throw new Error(`${label} is invalid.`);
}

function validateUuidArray(values, label, limit = 250) {
  if (!Array.isArray(values) || values.length > limit ||
      values.some((value) => !isUuid(value)) ||
      new Set(values).size !== values.length) {
    throw new Error(`${label} are invalid.`);
  }
}

function validateControlledArray(values, allowed, label) {
  if (!Array.isArray(values) || !values.length || values.length > allowed.length ||
      values.some((value) => !allowed.includes(value)) ||
      new Set(values).size !== values.length) {
    throw new Error(`${label} are invalid.`);
  }
}

function validateReleaseReferences(record) {
  validateReferenceObject(
    record.integrityReferences,
    INTEGRITY_KEYS,
    'Product PLM release integrity references',
  );
  for (const [key, value] of Object.entries(record.integrityReferences)) {
    validateNullableUuid(value, `Release integrity ${key}`);
  }
  validateReferenceObject(
    record.consumptionEngineReferences,
    CONSUMPTION_ENGINE_KEYS,
    'Product PLM release consumption engine references',
  );
  for (const [key, values] of Object.entries(record.consumptionEngineReferences)) {
    validateUuidArray(values, `Release consumption engine ${key}`);
  }
  validateReferenceObject(
    record.trustProvenanceReferences,
    TRUST_PROVENANCE_KEYS,
    'Product PLM release trust provenance references',
  );
  for (const [key, value] of Object.entries(record.trustProvenanceReferences)) {
    validateNullableUuid(value, `Release trust provenance ${key}`);
  }
  validateReferenceObject(
    record.aiCompatibilityReferences,
    AI_COMPATIBILITY_KEYS,
    'Product PLM release AI compatibility references',
  );
  for (const [key, values] of Object.entries(record.aiCompatibilityReferences)) {
    validateUuidArray(values, `Release AI compatibility ${key}`);
  }
  validateReferenceObject(
    record.customerExperienceReferences,
    CUSTOMER_EXPERIENCE_KEYS,
    'Product PLM release customer experience references',
  );
  for (const [key, values] of Object.entries(record.customerExperienceReferences)) {
    validateUuidArray(values, `Release customer experience ${key}`);
  }
  validateReferenceObject(
    record.analyticsReferences,
    ANALYTICS_KEYS,
    'Product PLM release analytics references',
  );
  for (const [key, values] of Object.entries(record.analyticsReferences)) {
    validateUuidArray(values, `Release analytics ${key}`);
  }
  validateReferenceObject(
    record.lifecyclePolicyReferences,
    LIFECYCLE_POLICY_KEYS,
    'Product PLM release lifecycle policy references',
  );
  for (const [key, value] of Object.entries(record.lifecyclePolicyReferences)) {
    validateNullableUuid(value, `Release lifecycle policy ${key}`);
  }
}

function releaseHashInput(release) {
  const { releaseManifestHash, ...input } = release;
  return input;
}

function computeReleaseManifestHash(release) {
  return hashValue(releaseHashInput(release));
}

function computeApprovalSnapshotHash(policy, request, decisions) {
  return hashValue({
    policyId: policy.id,
    policyHash: policy.policyHash,
    requestId: request.id,
    requestHash: request.requestHash,
    decisions: [...decisions]
      .sort((left, right) => left.sequence - right.sequence)
      .map((decision) => ({
        id: decision.id,
        decisionHash: decision.decisionHash,
        sequence: decision.sequence,
      })),
  });
}

function eventHashInput(event) {
  const { eventHash, ...input } = event;
  return input;
}

function computeReleaseLifecycleEventHash(event) {
  return hashValue(eventHashInput(event));
}

function validateProductReleases(store) {
  const products = new Set(store.productIdentities.map((item) => item.id));
  const versions = new Map(store.productVersions.map((item) => [item.id, item]));
  const evidenceIds = new Set(store.evidenceRecords.map((item) => item.id));
  const requests = new Map(store.approvalRequests.map((item) => [item.id, item]));
  const decisions = new Map(store.approvalDecisions.map((item) => [item.id, item]));
  const policies = new Map(store.approvalPolicies.map((item) => [item.id, item]));
  const nonces = new Set();
  const releaseNumbers = new Set();
  for (const release of store.productReleases) {
    if (!release || typeof release !== 'object' || Array.isArray(release) ||
        Object.keys(release).some((key) => !RELEASE_KEYS.has(key))) {
      throw new Error('Product PLM release contains unsupported data.');
    }
    const version = versions.get(release.productVersionId);
    const request = requests.get(release.approvalRequestId);
    const policy = request ? policies.get(request.approvalPolicyId) : null;
    const approvalDecisions = release.approvalDecisionIds.map((id) => decisions.get(id));
    if (!isUuid(release.id) || !products.has(release.productUuid) ||
        !Number.isInteger(release.releaseNumber) || release.releaseNumber < 1 ||
        !version || version.productUuid !== release.productUuid ||
        release.productVersionHash !== version.contentHash ||
        !request || request.productUuid !== release.productUuid ||
        request.productVersionId !== version.id ||
        request.versionContentHash !== release.productVersionHash ||
        request.evidenceSetHash !== release.evidenceSetHash ||
        !policy || approvalDecisions.some((decision) =>
          !decision || decision.approvalRequestId !== request.id) ||
        !isHash(release.releaseNonceHash) || nonces.has(release.releaseNonceHash) ||
        !isTimestamp(release.createdAt) ||
        !String(release.createdBy || '').trim() || String(release.createdBy).length > 180 ||
        !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive']
          .includes(release.dataClassification)) {
      throw new Error('Product PLM release metadata is invalid.');
    }
    validateUuidArray(release.evidenceReferenceIds, 'Product PLM release evidence references');
    validateUuidArray(release.approvalDecisionIds, 'Product PLM release approval decisions');
    if (release.evidenceReferenceIds.some((id) => !evidenceIds.has(id)) ||
        release.evidenceSetHash !==
          computeEvidenceSetHash(release.evidenceReferenceIds, store.evidenceRecords)) {
      throw new Error('Product PLM release evidence set is invalid.');
    }
    if (release.approvalSnapshotHash !==
        computeApprovalSnapshotHash(policy, request, approvalDecisions)) {
      throw new Error('Product PLM release approval snapshot is invalid.');
    }
    validateControlledArray(release.channels, RELEASE_CHANNELS, 'Product PLM release channels');
    validateControlledArray(release.purposes, RELEASE_PURPOSES, 'Product PLM release purposes');
    validateReleaseReferences(release);
    if (release.releaseManifestHash !== computeReleaseManifestHash(release)) {
      throw new Error('Product PLM release manifest hash is invalid.');
    }
    const releaseNumberKey = `${release.productUuid}:${release.releaseNumber}`;
    if (releaseNumbers.has(releaseNumberKey)) {
      throw new Error('Product PLM release number is duplicated.');
    }
    releaseNumbers.add(releaseNumberKey);
    nonces.add(release.releaseNonceHash);
  }
}

function deriveReleaseLifecycle(events) {
  const sorted = [...events].sort((left, right) => left.sequence - right.sequence);
  let state = 'absent';
  for (const event of sorted) {
    if (event.eventCode === 'release_drafted') state = 'draft';
    else if (event.eventCode === 'release_approved') state = 'approved';
    else if (event.eventCode === 'release_activated') state = 'active';
    else if (event.eventCode === 'release_withdrawn') state = 'withdrawn';
    else if (event.eventCode === 'release_superseded') state = 'superseded';
    else if (event.eventCode === 'release_revoked') state = 'revoked';
    else if (event.eventCode === 'release_expired') state = 'expired';
  }
  return state;
}

function nextLifecycleState(state, eventCode) {
  if (eventCode === 'integrity_verification_passed' ||
      eventCode === 'integrity_verification_failed') {
    return state === 'absent' ? null : state;
  }
  const transitions = {
    absent: { release_drafted: 'draft' },
    draft: { release_approved: 'approved', release_revoked: 'revoked' },
    approved: { release_activated: 'active', release_revoked: 'revoked' },
    active: {
      release_withdrawn: 'withdrawn',
      release_superseded: 'superseded',
      release_revoked: 'revoked',
      release_expired: 'expired',
    },
  };
  return transitions[state]?.[eventCode] || null;
}

function validateReleaseLifecycleEvents(store) {
  const releases = new Map(store.productReleases.map((item) => [item.id, item]));
  const nonces = new Set();
  const byRelease = new Map();
  for (const event of store.releaseLifecycleEvents) {
    if (!event || typeof event !== 'object' || Array.isArray(event) ||
        Object.keys(event).some((key) => !EVENT_KEYS.has(key))) {
      throw new Error('Product PLM release lifecycle event contains unsupported data.');
    }
    const release = releases.get(event.releaseId);
    if (!isUuid(event.id) || !release || release.productUuid !== event.productUuid ||
        !Number.isInteger(event.sequence) || event.sequence < 1 ||
        !RELEASE_EVENT_CODES.includes(event.eventCode) ||
        (event.reasonCode !== null &&
          !/^[A-Z][A-Z0-9_]{0,99}$/.test(String(event.reasonCode))) ||
        !isHash(event.eventNonceHash) || nonces.has(event.eventNonceHash) ||
        !String(event.actorId || '').trim() || String(event.actorId).length > 180 ||
        !/^[a-z][a-z0-9_]{0,79}$/.test(String(event.actorType || '')) ||
        !isTimestamp(event.timestamp) ||
        !['internal', 'confidential', 'commercially_sensitive']
          .includes(event.dataClassification) ||
        event.eventHash !== computeReleaseLifecycleEventHash(event)) {
      throw new Error('Product PLM release lifecycle event metadata is invalid.');
    }
    nonces.add(event.eventNonceHash);
    const events = byRelease.get(event.releaseId) || [];
    events.push(event);
    byRelease.set(event.releaseId, events);
  }
  for (const events of byRelease.values()) {
    const sorted = [...events].sort((left, right) => left.sequence - right.sequence);
    let state = 'absent';
    for (let index = 0; index < sorted.length; index += 1) {
      if (sorted[index].sequence !== index + 1 ||
          sorted[index].previousEventHash !==
            (index === 0 ? null : sorted[index - 1].eventHash)) {
        throw new Error('Product PLM release lifecycle event chain is invalid.');
      }
      const nextState = nextLifecycleState(state, sorted[index].eventCode);
      if (!nextState) {
        throw new Error('Product PLM release lifecycle transition is invalid.');
      }
      state = nextState;
    }
  }
}

module.exports = {
  RELEASE_CHANNELS,
  RELEASE_EVENT_CODES,
  RELEASE_PURPOSES,
  computeApprovalSnapshotHash,
  computeReleaseLifecycleEventHash,
  computeReleaseManifestHash,
  deriveReleaseLifecycle,
  nextLifecycleState,
  validateProductReleases,
  validateReleaseLifecycleEvents,
  validateReleaseReferences,
};
