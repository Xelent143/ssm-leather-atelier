const { hashValue } = require('./ai-studio-domain');

const AUDIT_KEYS = new Set([
  'id', 'schemaVersion', 'sequence', 'aggregateType', 'aggregateId', 'action',
  'result', 'actorId', 'sessionId', 'eventNonceHash', 'previousEventHash',
  'eventHash', 'relatedStudioProjectId', 'relatedGenerationPlanId',
  'relatedStudioTaskId', 'relatedArtifactId', 'relatedValidationResultId',
  'relatedApprovalReferenceId', 'changedFields', 'timestamp',
  'dataClassification',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function computeStudioAuditEventHash(event) {
  const input = { ...event };
  delete input.eventHash;
  return hashValue(input);
}

function validateStudioAuditEvents(store) {
  const aggregates = {
    studio_project: new Set(store.studioProjects.map((item) => item.id)),
    generation_plan: new Set(store.generationPlans.map((item) => item.id)),
    studio_task: new Set(store.studioTasks.map((item) => item.id)),
    artifact: new Set(store.artifacts.map((item) => item.id)),
    validation_result: new Set(store.validationResults.map((item) => item.id)),
    approval_reference: new Set(store.studioApprovalReferences.map((item) => item.id)),
  };
  const references = {
    relatedStudioProjectId: aggregates.studio_project,
    relatedGenerationPlanId: aggregates.generation_plan,
    relatedStudioTaskId: aggregates.studio_task,
    relatedArtifactId: aggregates.artifact,
    relatedValidationResultId: aggregates.validation_result,
    relatedApprovalReferenceId: aggregates.approval_reference,
  };
  const nonces = new Set();
  const sorted = [...store.studioAuditEvents].sort((left, right) => left.sequence - right.sequence);
  for (let index = 0; index < sorted.length; index += 1) {
    const event = sorted[index];
    if (!event || typeof event !== 'object' || Array.isArray(event) ||
        Object.keys(event).some((key) => !AUDIT_KEYS.has(key)) ||
        !isUuid(event.id) || event.schemaVersion !== 1 ||
        event.sequence !== index + 1 ||
        !aggregates[event.aggregateType]?.has(event.aggregateId) ||
        !/^[a-z][a-z0-9_]{0,99}$/.test(String(event.action || '')) ||
        !['success', 'rejected', 'failed', 'blocked'].includes(event.result) ||
        !String(event.actorId || '').trim() || String(event.actorId).length > 180 ||
        (event.sessionId !== null && String(event.sessionId).length > 180) ||
        !isHash(event.eventNonceHash) || nonces.has(event.eventNonceHash) ||
        event.previousEventHash !== (index === 0 ? null : sorted[index - 1].eventHash) ||
        !Array.isArray(event.changedFields) || event.changedFields.length > 100 ||
        event.changedFields.some((field) =>
          typeof field !== 'string' || field.length > 160) ||
        !Number.isFinite(Date.parse(event.timestamp)) ||
        !['internal', 'confidential', 'commercially_sensitive']
          .includes(event.dataClassification) ||
        event.eventHash !== computeStudioAuditEventHash(event)) {
      throw new Error('AI Studio audit event is invalid.');
    }
    for (const [key, ids] of Object.entries(references)) {
      if (event[key] !== null && !ids.has(event[key])) {
        throw new Error('AI Studio audit event reference is invalid.');
      }
    }
    nonces.add(event.eventNonceHash);
  }
}

function validateStudioAppendOnlyTransition(current, next) {
  for (const collection of [
    'studioProjects',
    'generationPlans',
    'studioTasks',
    'artifacts',
    'validationResults',
    'studioApprovalReferences',
    'studioAuditEvents',
  ]) {
    if (next[collection].length < current[collection].length) {
      throw new Error(`AI Studio ${collection} is append-only.`);
    }
    for (let index = 0; index < current[collection].length; index += 1) {
      if (hashValue(current[collection][index]) !== hashValue(next[collection][index])) {
        throw new Error(`AI Studio ${collection} immutable record was changed.`);
      }
    }
  }
}

module.exports = {
  computeStudioAuditEventHash,
  validateStudioAppendOnlyTransition,
  validateStudioAuditEvents,
};
