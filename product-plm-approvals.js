const {
  APPROVAL_DECISION_CODES,
  APPROVAL_REASON_CODES,
  APPROVAL_RISK_LEVELS,
  APPROVAL_ROLES,
} = require('./product-plm-approval-policies');
const { computeEvidenceSetHash, hashValue } = require('./product-plm-versions');

const REQUEST_KEYS = new Set([
  'id', 'schemaVersion', 'productUuid', 'productVersionId', 'versionContentHash',
  'evidenceReferenceIds', 'evidenceSetHash', 'approvalPolicyId',
  'approvalPolicyHash', 'approvalReasonCode', 'riskLevel', 'requestNonceHash',
  'requestHash', 'expiresAt', 'status', 'delegationReferences',
  'escalationReferences', 'complianceReferences', 'aiReviewReferences',
  'wholesaleClientReferences', 'dataClassification', 'createdAt', 'createdBy',
]);
const DECISION_KEYS = new Set([
  'id', 'schemaVersion', 'approvalRequestId', 'sequence', 'decisionCode',
  'actorId', 'actorType', 'actorRole', 'authorizationSnapshotHash',
  'evidenceReferenceIds', 'versionContentHash', 'evidenceSetHash',
  'approvalPolicyHash', 'decisionNonceHash', 'previousDecisionHash',
  'decisionHash', 'signatureReferences', 'delegationReferences',
  'escalationReferences', 'complianceReferences', 'aiReviewReferences',
  'wholesaleClientReferences', 'dataClassification', 'decidedAt',
]);
const DELEGATION_KEYS = new Set([
  'delegatedFromActorId', 'delegatedToActorId', 'delegationPolicyReferenceId',
]);
const ESCALATION_KEYS = new Set([
  'escalationReferenceId', 'escalationReasonCode', 'escalationLevel',
]);
const SIGNATURE_KEYS = new Set([
  'signatureReferenceId', 'signatureMethodReferenceId',
]);
const COMPLIANCE_KEYS = new Set([
  'regulatoryReferenceIds', 'auditReferenceIds',
]);
const AI_REVIEW_KEYS = new Set([
  'aiReviewReferenceId', 'aiRiskAssessmentReferenceId',
]);
const WHOLESALE_CLIENT_KEYS = new Set([
  'wholesaleApprovalReferenceId', 'clientApprovalReferenceId',
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

function validateReservedReferences(record) {
  validateReferenceObject(
    record.delegationReferences,
    DELEGATION_KEYS,
    'Product PLM approval delegation references',
  );
  validateNullableUuid(record.delegationReferences.delegatedFromActorId, 'Delegating actor reference');
  validateNullableUuid(record.delegationReferences.delegatedToActorId, 'Delegated actor reference');
  validateNullableUuid(
    record.delegationReferences.delegationPolicyReferenceId,
    'Delegation policy reference',
  );

  validateReferenceObject(
    record.escalationReferences,
    ESCALATION_KEYS,
    'Product PLM approval escalation references',
  );
  validateNullableUuid(record.escalationReferences.escalationReferenceId, 'Escalation reference');
  if (record.escalationReferences.escalationReasonCode !== null &&
      !/^[A-Z][A-Z0-9_]{0,99}$/.test(record.escalationReferences.escalationReasonCode)) {
    throw new Error('Approval escalation reason reference is invalid.');
  }
  if (record.escalationReferences.escalationLevel !== null &&
      (!Number.isInteger(record.escalationReferences.escalationLevel) ||
       record.escalationReferences.escalationLevel < 1 ||
       record.escalationReferences.escalationLevel > 100)) {
    throw new Error('Approval escalation level reference is invalid.');
  }

  validateReferenceObject(
    record.complianceReferences,
    COMPLIANCE_KEYS,
    'Product PLM approval compliance references',
  );
  validateUuidArray(record.complianceReferences.regulatoryReferenceIds, 'Regulatory references');
  validateUuidArray(record.complianceReferences.auditReferenceIds, 'Audit references');

  validateReferenceObject(
    record.aiReviewReferences,
    AI_REVIEW_KEYS,
    'Product PLM approval AI review references',
  );
  validateNullableUuid(record.aiReviewReferences.aiReviewReferenceId, 'AI review reference');
  validateNullableUuid(
    record.aiReviewReferences.aiRiskAssessmentReferenceId,
    'AI risk assessment reference',
  );

  validateReferenceObject(
    record.wholesaleClientReferences,
    WHOLESALE_CLIENT_KEYS,
    'Product PLM approval wholesale and client references',
  );
  validateNullableUuid(
    record.wholesaleClientReferences.wholesaleApprovalReferenceId,
    'Wholesale approval reference',
  );
  validateNullableUuid(
    record.wholesaleClientReferences.clientApprovalReferenceId,
    'Client approval reference',
  );
}

function requestHashInput(request) {
  const { requestHash, ...input } = request;
  return input;
}

function decisionHashInput(decision) {
  const { decisionHash, ...input } = decision;
  return input;
}

function computeApprovalRequestHash(request) {
  return hashValue(requestHashInput(request));
}

function computeApprovalDecisionHash(decision) {
  return hashValue(decisionHashInput(decision));
}

function authorizeApprovalActor(session, user, requestedRole) {
  const allowed = session?.actorType === 'named_user' &&
    isUuid(session.userId) &&
    user?.id === session.userId &&
    user?.accountType === 'owner' &&
    user?.status === 'active' &&
    requestedRole === 'owner';
  return {
    allowed,
    actorId: allowed ? session.userId : null,
    actorType: allowed ? 'named_user' : null,
    actorRole: allowed ? 'owner' : null,
  };
}

function validateApprovalRequests(store) {
  const products = new Set(store.productIdentities.map((item) => item.id));
  const versions = new Map(store.productVersions.map((item) => [item.id, item]));
  const policies = new Map(store.approvalPolicies.map((item) => [item.id, item]));
  const evidenceIds = new Set(store.evidenceRecords.map((item) => item.id));
  const nonces = new Set();
  for (const request of store.approvalRequests) {
    if (!request || typeof request !== 'object' || Array.isArray(request) ||
        Object.keys(request).some((key) => !REQUEST_KEYS.has(key))) {
      throw new Error('Product PLM approval request contains unsupported data.');
    }
    const version = versions.get(request.productVersionId);
    const policy = policies.get(request.approvalPolicyId);
    if (!isUuid(request.id) || !products.has(request.productUuid) ||
        !version || version.productUuid !== request.productUuid ||
        request.versionContentHash !== version.contentHash ||
        !policy || request.approvalPolicyHash !== policy.policyHash ||
        !policy.approvalReasonCodes.includes(request.approvalReasonCode) ||
        !APPROVAL_REASON_CODES.includes(request.approvalReasonCode) ||
        request.riskLevel !== policy.riskLevel ||
        !APPROVAL_RISK_LEVELS.includes(request.riskLevel) ||
        !isHash(request.requestNonceHash) || nonces.has(request.requestNonceHash) ||
        request.status !== 'requested' ||
        !isTimestamp(request.createdAt) || !isTimestamp(request.expiresAt) ||
        Date.parse(request.expiresAt) <= Date.parse(request.createdAt) ||
        !String(request.createdBy || '').trim() || String(request.createdBy).length > 180 ||
        !['internal', 'confidential', 'commercially_sensitive']
          .includes(request.dataClassification)) {
      throw new Error('Product PLM approval request metadata is invalid.');
    }
    validateUuidArray(request.evidenceReferenceIds, 'Approval request evidence references');
    if (request.evidenceReferenceIds.some((id) => !evidenceIds.has(id)) ||
        request.evidenceSetHash !==
          computeEvidenceSetHash(request.evidenceReferenceIds, store.evidenceRecords)) {
      throw new Error('Product PLM approval request evidence set is invalid.');
    }
    validateReservedReferences(request);
    if (request.requestHash !== computeApprovalRequestHash(request)) {
      throw new Error('Product PLM approval request hash is invalid.');
    }
    nonces.add(request.requestNonceHash);
  }
}

function validateApprovalDecisions(store) {
  const requests = new Map(store.approvalRequests.map((item) => [item.id, item]));
  const policies = new Map(store.approvalPolicies.map((item) => [item.id, item]));
  const evidenceIds = new Set(store.evidenceRecords.map((item) => item.id));
  const nonces = new Set();
  const byRequest = new Map();
  for (const decision of store.approvalDecisions) {
    if (!decision || typeof decision !== 'object' || Array.isArray(decision) ||
        Object.keys(decision).some((key) => !DECISION_KEYS.has(key))) {
      throw new Error('Product PLM approval decision contains unsupported data.');
    }
    const request = requests.get(decision.approvalRequestId);
    const policy = request ? policies.get(request.approvalPolicyId) : null;
    const roleRule = policy?.requiredApprovals.find((rule) => rule.role === decision.actorRole);
    if (!isUuid(decision.id) || !request ||
        !Number.isInteger(decision.sequence) || decision.sequence < 1 ||
        !APPROVAL_DECISION_CODES.includes(decision.decisionCode) ||
        !String(decision.actorId || '').trim() || String(decision.actorId).length > 180 ||
        decision.actorType !== 'named_user' || decision.actorRole !== 'owner' ||
        !APPROVAL_ROLES.includes(decision.actorRole) ||
        !roleRule || !roleRule.permittedDecisionCodes.includes(decision.decisionCode) ||
        !isHash(decision.authorizationSnapshotHash) ||
        decision.versionContentHash !== request.versionContentHash ||
        decision.evidenceSetHash !== request.evidenceSetHash ||
        decision.approvalPolicyHash !== request.approvalPolicyHash ||
        !isHash(decision.decisionNonceHash) || nonces.has(decision.decisionNonceHash) ||
        !isTimestamp(decision.decidedAt) ||
        !['internal', 'confidential', 'commercially_sensitive']
          .includes(decision.dataClassification)) {
      throw new Error('Product PLM approval decision metadata is invalid.');
    }
    validateUuidArray(decision.evidenceReferenceIds, 'Approval decision evidence references');
    if (decision.evidenceReferenceIds.some((id) => !evidenceIds.has(id)) ||
        decision.evidenceSetHash !==
          computeEvidenceSetHash(decision.evidenceReferenceIds, store.evidenceRecords)) {
      throw new Error('Product PLM approval decision evidence set is invalid.');
    }
    validateReservedReferences(decision);
    validateReferenceObject(
      decision.signatureReferences,
      SIGNATURE_KEYS,
      'Product PLM approval signature references',
    );
    validateNullableUuid(decision.signatureReferences.signatureReferenceId, 'Signature reference');
    validateNullableUuid(
      decision.signatureReferences.signatureMethodReferenceId,
      'Signature method reference',
    );
    if (decision.decisionHash !== computeApprovalDecisionHash(decision)) {
      throw new Error('Product PLM approval decision hash is invalid.');
    }
    nonces.add(decision.decisionNonceHash);
    const decisions = byRequest.get(decision.approvalRequestId) || [];
    decisions.push(decision);
    byRequest.set(decision.approvalRequestId, decisions);
  }
  for (const decisions of byRequest.values()) {
    const sorted = [...decisions].sort((left, right) => left.sequence - right.sequence);
    for (let index = 0; index < sorted.length; index += 1) {
      if (sorted[index].sequence !== index + 1 ||
          sorted[index].previousDecisionHash !==
            (index === 0 ? null : sorted[index - 1].decisionHash)) {
        throw new Error('Product PLM approval decision chain is invalid.');
      }
    }
  }
}

function validateApprovalRegistry(store) {
  validateApprovalRequests(store);
  validateApprovalDecisions(store);
}

module.exports = {
  authorizeApprovalActor,
  computeApprovalDecisionHash,
  computeApprovalRequestHash,
  validateApprovalRegistry,
};
