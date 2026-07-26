const { hashValue } = require('./product-plm-versions');

const APPROVAL_ROLES = Object.freeze([
  'owner',
  'product_manager',
  'factory',
  'qc',
  'seo',
  'marketplace',
  'legal',
  'wholesale',
  'custom_client',
]);
const APPROVAL_DECISION_CODES = Object.freeze([
  'approved',
  'rejected',
  'needs_changes',
  'blocked',
  'expired',
  'superseded',
  'revoked',
]);
const APPROVAL_RISK_LEVELS = Object.freeze(['low', 'medium', 'high', 'critical']);
const APPROVAL_REASON_CODES = Object.freeze([
  'product_change',
  'safety',
  'compliance',
  'seo',
  'marketplace',
  'customer_request',
  'factory_update',
]);

const POLICY_KEYS = new Set([
  'id', 'schemaVersion', 'policyCode', 'policyVersion', 'name', 'riskLevel',
  'approvalReasonCodes', 'requiredApprovals', 'evidenceRequirements',
  'expiresAfterSeconds', 'status', 'policyHash', 'dataClassification',
  'createdAt', 'createdBy',
]);
const ROLE_RULE_KEYS = new Set([
  'role', 'minimumApprovals', 'allowSelfApproval', 'permittedDecisionCodes',
]);
const EVIDENCE_REQUIREMENT_KEYS = new Set([
  'evidenceType', 'minimumCount', 'required',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isTimestamp(value) {
  return Number.isFinite(Date.parse(value));
}

function policyHashInput(policy) {
  const { policyHash, ...input } = policy;
  return input;
}

function computeApprovalPolicyHash(policy) {
  return hashValue(policyHashInput(policy));
}

function validateCodeArray(values, allowed, label) {
  if (!Array.isArray(values) || !values.length || values.length > allowed.length ||
      values.some((value) => !allowed.includes(value)) ||
      new Set(values).size !== values.length) {
    throw new Error(`${label} are invalid.`);
  }
}

function validateApprovalPolicies(store) {
  const versions = new Set();
  for (const policy of store.approvalPolicies) {
    if (!policy || typeof policy !== 'object' || Array.isArray(policy) ||
        Object.keys(policy).some((key) => !POLICY_KEYS.has(key))) {
      throw new Error('Product PLM approval policy contains unsupported data.');
    }
    if (!isUuid(policy.id) ||
        !/^[A-Z][A-Z0-9_]{0,99}$/.test(String(policy.policyCode || '')) ||
        !Number.isInteger(policy.policyVersion) || policy.policyVersion < 1 ||
        !String(policy.name || '').trim() || String(policy.name).length > 240 ||
        !APPROVAL_RISK_LEVELS.includes(policy.riskLevel) ||
        !Number.isInteger(policy.expiresAfterSeconds) ||
        policy.expiresAfterSeconds < 60 || policy.expiresAfterSeconds > 31536000 ||
        !['active', 'retired'].includes(policy.status) ||
        !['internal', 'confidential', 'commercially_sensitive']
          .includes(policy.dataClassification) ||
        !isTimestamp(policy.createdAt) ||
        !String(policy.createdBy || '').trim() || String(policy.createdBy).length > 180) {
      throw new Error('Product PLM approval policy metadata is invalid.');
    }
    validateCodeArray(
      policy.approvalReasonCodes,
      APPROVAL_REASON_CODES,
      'Product PLM approval policy reason codes',
    );
    if (!Array.isArray(policy.requiredApprovals) || !policy.requiredApprovals.length ||
        policy.requiredApprovals.length > APPROVAL_ROLES.length) {
      throw new Error('Product PLM approval policy role rules are invalid.');
    }
    const roles = new Set();
    for (const rule of policy.requiredApprovals) {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule) ||
          Object.keys(rule).some((key) => !ROLE_RULE_KEYS.has(key)) ||
          !APPROVAL_ROLES.includes(rule.role) || roles.has(rule.role) ||
          !Number.isInteger(rule.minimumApprovals) || rule.minimumApprovals < 1 ||
          rule.minimumApprovals > 100 || typeof rule.allowSelfApproval !== 'boolean') {
        throw new Error('Product PLM approval policy role rule is invalid.');
      }
      validateCodeArray(
        rule.permittedDecisionCodes,
        APPROVAL_DECISION_CODES,
        'Product PLM approval policy decision codes',
      );
      roles.add(rule.role);
    }
    if (!Array.isArray(policy.evidenceRequirements) ||
        policy.evidenceRequirements.length > 100) {
      throw new Error('Product PLM approval policy evidence requirements are invalid.');
    }
    const evidenceTypes = new Set();
    for (const requirement of policy.evidenceRequirements) {
      if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement) ||
          Object.keys(requirement).some((key) => !EVIDENCE_REQUIREMENT_KEYS.has(key)) ||
          !/^[a-z][a-z0-9_]{0,99}$/.test(String(requirement.evidenceType || '')) ||
          evidenceTypes.has(requirement.evidenceType) ||
          !Number.isInteger(requirement.minimumCount) ||
          requirement.minimumCount < 0 || requirement.minimumCount > 100 ||
          typeof requirement.required !== 'boolean') {
        throw new Error('Product PLM approval policy evidence requirement is invalid.');
      }
      evidenceTypes.add(requirement.evidenceType);
    }
    const versionKey = `${policy.policyCode}:${policy.policyVersion}`;
    if (versions.has(versionKey)) {
      throw new Error('Product PLM approval policy version is duplicated.');
    }
    versions.add(versionKey);
    if (policy.policyHash !== computeApprovalPolicyHash(policy)) {
      throw new Error('Product PLM approval policy hash is invalid.');
    }
  }
}

module.exports = {
  APPROVAL_DECISION_CODES,
  APPROVAL_REASON_CODES,
  APPROVAL_RISK_LEVELS,
  APPROVAL_ROLES,
  computeApprovalPolicyHash,
  validateApprovalPolicies,
};
