const { hashValue } = require('./product-plm-versions');

const HISTORY_KEYS = new Set([
  'id', 'schemaVersion', 'productUuid', 'sequence', 'aggregateType', 'aggregateId',
  'action', 'result', 'actorId', 'sessionId', 'timestamp', 'previousEventHash',
  'eventHash', 'relatedVersionId', 'relatedEvidenceId', 'changedFields',
  'beforeHash', 'afterHash', 'dataClassification',
  'relatedApprovalPolicyId', 'relatedApprovalRequestId', 'relatedApprovalDecisionId',
  'relatedReleaseId', 'relatedKnowledgeLockId',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function historyHashInput(event) {
  const { eventHash, ...input } = event;
  return input;
}

function computeHistoryEventHash(event) {
  return hashValue(historyHashInput(event));
}

function validateProductHistory(store) {
  const productIds = new Set(store.productIdentities.map((identity) => identity.id));
  const aggregates = {
    product_version: new Set(store.productVersions.map((item) => item.id)),
    evidence_record: new Set(store.evidenceRecords.map((item) => item.id)),
    evidence_link: new Set(store.evidenceLinks.map((item) => item.id)),
    approval_policy: new Set(store.approvalPolicies.map((item) => item.id)),
    approval_request: new Set(store.approvalRequests.map((item) => item.id)),
    approval_decision: new Set(store.approvalDecisions.map((item) => item.id)),
    product_release: new Set(store.productReleases.map((item) => item.id)),
    release_lifecycle_event: new Set(store.releaseLifecycleEvents.map((item) => item.id)),
    knowledge_lock: new Set(store.knowledgeLocks.map((item) => item.id)),
  };
  const versionIds = aggregates.product_version;
  const evidenceIds = aggregates.evidence_record;
  const eventsByProduct = new Map();
  for (const event of store.productHistoryEvents) {
    if (!event || typeof event !== 'object' || Array.isArray(event) ||
        Object.keys(event).some((key) => !HISTORY_KEYS.has(key))) {
      throw new Error('Product PLM history event contains unsupported data.');
    }
    if (!productIds.has(event.productUuid) || !Number.isInteger(event.sequence) || event.sequence < 1 ||
        !aggregates[event.aggregateType]?.has(event.aggregateId) ||
        !/^[a-z][a-z0-9_]{0,99}$/.test(String(event.action || '')) ||
        !['success', 'rejected', 'failed'].includes(event.result) ||
        !String(event.actorId || '').trim() || String(event.actorId).length > 180 ||
        (event.sessionId !== null && String(event.sessionId).length > 180) ||
        !Number.isFinite(Date.parse(event.timestamp)) ||
        (event.relatedVersionId !== null && !versionIds.has(event.relatedVersionId)) ||
        (event.relatedEvidenceId !== null && !evidenceIds.has(event.relatedEvidenceId)) ||
        (event.relatedApprovalPolicyId != null &&
          !aggregates.approval_policy.has(event.relatedApprovalPolicyId)) ||
        (event.relatedApprovalRequestId != null &&
          !aggregates.approval_request.has(event.relatedApprovalRequestId)) ||
        (event.relatedApprovalDecisionId != null &&
          !aggregates.approval_decision.has(event.relatedApprovalDecisionId)) ||
        (event.relatedReleaseId != null &&
          !aggregates.product_release.has(event.relatedReleaseId)) ||
        (event.relatedKnowledgeLockId != null &&
          !aggregates.knowledge_lock.has(event.relatedKnowledgeLockId)) ||
        !Array.isArray(event.changedFields) || event.changedFields.length > 100 ||
        event.changedFields.some((field) => typeof field !== 'string' || field.length > 160) ||
        (event.beforeHash !== null && !isHash(event.beforeHash)) ||
        (event.afterHash !== null && !isHash(event.afterHash)) ||
        !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive']
          .includes(event.dataClassification)) {
      throw new Error('Product PLM history event metadata is invalid.');
    }
    if (event.eventHash !== computeHistoryEventHash(event)) {
      throw new Error('Product PLM history event hash is invalid.');
    }
    const events = eventsByProduct.get(event.productUuid) || [];
    events.push(event);
    eventsByProduct.set(event.productUuid, events);
  }
  for (const events of eventsByProduct.values()) {
    const sorted = [...events].sort((left, right) => left.sequence - right.sequence);
    for (let index = 0; index < sorted.length; index += 1) {
      const event = sorted[index];
      if (event.sequence !== index + 1 ||
          event.previousEventHash !== (index === 0 ? null : sorted[index - 1].eventHash)) {
        throw new Error('Product PLM history event chain is invalid.');
      }
    }
  }
}

function validateAppendOnlyTransition(current, next) {
  for (const collection of [
    'productVersions',
    'evidenceRecords',
    'evidenceLinks',
    'productHistoryEvents',
    'approvalPolicies',
    'approvalRequests',
    'approvalDecisions',
    'productReleases',
    'releaseLifecycleEvents',
    'knowledgeLocks',
  ]) {
    if (next[collection].length < current[collection].length) {
      throw new Error(`Product PLM ${collection} is append-only.`);
    }
    for (let index = 0; index < current[collection].length; index += 1) {
      if (hashValue(current[collection][index]) !== hashValue(next[collection][index])) {
        throw new Error(`Product PLM ${collection} immutable record was changed.`);
      }
    }
  }
}

module.exports = {
  computeHistoryEventHash,
  validateAppendOnlyTransition,
  validateProductHistory,
};
