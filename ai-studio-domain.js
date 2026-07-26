const crypto = require('crypto');
const { STUDIO_PERMISSIONS } = require('./ai-studio-authorization');
const { validateTrustedInputSnapshot } = require('./ai-studio-trusted-release-contracts');

const STUDIO_DATA_CLASSIFICATIONS = Object.freeze([
  'public',
  'internal',
  'confidential',
  'factory_confidential',
  'commercially_sensitive',
  'regulated_evidence',
]);
const STUDIO_PROJECT_STATES = Object.freeze([
  'defined',
  'blocked',
  'superseded',
  'cancelled',
]);
const GENERATION_PLAN_STATES = Object.freeze([
  'draft',
  'review_required',
  'approved',
  'rejected',
  'superseded',
]);
const STUDIO_TASK_STATES = Object.freeze([
  'defined',
  'blocked',
  'cancelled',
  'superseded',
]);
const ARTIFACT_STATES = Object.freeze([
  'declared',
  'review_required',
  'approved',
  'rejected',
  'revoked',
  'superseded',
]);
const VALIDATION_OUTCOMES = Object.freeze([
  'not_executed',
  'passed',
  'failed',
  'warning',
  'blocked',
]);
const STUDIO_APPROVAL_DECISIONS = Object.freeze([
  'approved',
  'rejected',
  'needs_changes',
  'blocked',
  'superseded',
  'revoked',
]);

const PROJECT_KEYS = new Set([
  'id', 'schemaVersion', 'projectCode', 'trustedInputSnapshot',
  'requestedOutputTypes', 'targetMarkets', 'targetLocales', 'state',
  'projectNonceHash', 'projectHash', 'dataClassification', 'createdAt', 'createdBy',
]);
const PLAN_KEYS = new Set([
  'id', 'schemaVersion', 'studioProjectId', 'planNumber', 'state',
  'taskDefinitionIds', 'promptGovernanceReferences',
  'aiCostIntelligenceReferences', 'planNonceHash', 'planHash',
  'dataClassification', 'createdAt', 'createdBy',
]);
const TASK_KEYS = new Set([
  'id', 'schemaVersion', 'studioProjectId', 'generationPlanId', 'taskCode',
  'taskType', 'dependsOnTaskIds', 'expectedArtifactTypes', 'state',
  'idempotencyKeyHash', 'taskHash', 'dataClassification', 'createdAt', 'createdBy',
]);
const ARTIFACT_KEYS = new Set([
  'id', 'schemaVersion', 'studioProjectId', 'generationPlanId', 'studioTaskId',
  'productUuid', 'artifactType', 'channel', 'purpose', 'locale',
  'contentReferenceId', 'mimeType', 'contentHash', 'state',
  'assetIntelligenceReferences', 'humanFeedbackReferences',
  'promptGovernanceReferences', 'mediaVersioningReferences',
  'aiCostIntelligenceReferences', 'artifactNonceHash', 'artifactHash',
  'dataClassification', 'createdAt', 'createdBy',
]);
const VALIDATION_KEYS = new Set([
  'id', 'schemaVersion', 'studioProjectId', 'artifactId', 'validationType',
  'outcome', 'ruleSetReferenceId', 'findingReferenceIds', 'validationNonceHash',
  'validationHash', 'dataClassification', 'createdAt', 'createdBy',
]);
const APPROVAL_KEYS = new Set([
  'id', 'schemaVersion', 'studioProjectId', 'subjectType', 'subjectId',
  'permission', 'decisionCode', 'actorId', 'actorType', 'actorRole',
  'evidenceReferenceIds', 'approvalNonceHash', 'approvalReferenceHash',
  'dataClassification', 'createdAt', 'createdBy',
]);

const ASSET_INTELLIGENCE_KEYS = new Set([
  'visualSimilarityReferenceId', 'brandComplianceReferenceId',
  'marketplaceComplianceReferenceId', 'copyrightVerificationReferenceId',
]);
const HUMAN_FEEDBACK_KEYS = new Set([
  'humanRatingReferenceId', 'customerRatingReferenceId',
  'marketplacePerformanceReferenceId', 'conversionPerformanceReferenceId',
]);
const PROMPT_GOVERNANCE_KEYS = new Set([
  'promptApprovalReferenceId', 'promptTestReferenceId', 'promptBenchmarkReferenceId',
]);
const MEDIA_VERSIONING_KEYS = new Set([
  'parentArtifactReferenceId', 'derivedArtifactReferenceId',
  'supersededArtifactReferenceId',
]);
const AI_COST_KEYS = new Set([
  'estimatedROIReferenceId', 'costOptimizationReferenceId',
  'providerBenchmarkReferenceId',
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
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  );
}

function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function hashRecord(record, hashField) {
  const input = { ...record };
  delete input[hashField];
  return hashValue(input);
}

function containsEmbeddedPayload(value) {
  const prohibited = new Set([
    'password', 'token', 'secret', 'cookie', 'authorizationheader',
    'providerresponse', 'providerrequest', 'rawpayload', 'filecontent',
    'imagebytes', 'videobytes', 'prompttext', 'promptcontent', 'aioutput',
    'generatedcontent', 'mutableproductdata', 'productmanagerdata',
    'customerdata', 'analyticsdata',
  ]);
  if (Array.isArray(value)) return value.some(containsEmbeddedPayload);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) =>
    prohibited.has(key.toLowerCase()) || containsEmbeddedPayload(child));
}

function validateBase(record, keys, states, stateField, hashField, label) {
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      Object.keys(record).some((key) => !keys.has(key)) ||
      !isUuid(record.id) || record.schemaVersion !== 1 ||
      (states && !states.includes(record[stateField])) ||
      !STUDIO_DATA_CLASSIFICATIONS.includes(record.dataClassification) ||
      !Number.isFinite(Date.parse(record.createdAt)) ||
      !String(record.createdBy || '').trim() || String(record.createdBy).length > 180 ||
      containsEmbeddedPayload(record) ||
      record[hashField] !== hashRecord(record, hashField)) {
    throw new Error(`AI Studio ${label} is invalid.`);
  }
}

function validateUuidArray(values, label, limit = 250) {
  if (!Array.isArray(values) || values.length > limit ||
      values.some((value) => !isUuid(value)) ||
      new Set(values).size !== values.length) {
    throw new Error(`AI Studio ${label} are invalid.`);
  }
}

function validateStringArray(values, label, limit = 100) {
  if (!Array.isArray(values) || values.length > limit ||
      values.some((value) =>
        !/^[a-z][a-z0-9_-]{0,99}$/i.test(String(value || ''))) ||
      new Set(values).size !== values.length) {
    throw new Error(`AI Studio ${label} are invalid.`);
  }
}

function validateReferenceEnvelope(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !keys.has(key)) ||
      Object.values(value).some((reference) => reference !== null && !isUuid(reference))) {
    throw new Error(`AI Studio ${label} references are invalid.`);
  }
}

function computeStudioProjectHash(record) {
  return hashRecord(record, 'projectHash');
}

function computeGenerationPlanHash(record) {
  return hashRecord(record, 'planHash');
}

function computeStudioTaskHash(record) {
  return hashRecord(record, 'taskHash');
}

function computeArtifactHash(record) {
  return hashRecord(record, 'artifactHash');
}

function computeValidationResultHash(record) {
  return hashRecord(record, 'validationHash');
}

function computeStudioApprovalReferenceHash(record) {
  return hashRecord(record, 'approvalReferenceHash');
}

function validateStudioProjects(store) {
  const codes = new Set();
  for (const project of store.studioProjects) {
    validateBase(
      project,
      PROJECT_KEYS,
      STUDIO_PROJECT_STATES,
      'state',
      'projectHash',
      'Project',
    );
    if (!/^[A-Z][A-Z0-9_-]{0,99}$/.test(String(project.projectCode || '')) ||
        codes.has(project.projectCode) || !isHash(project.projectNonceHash)) {
      throw new Error('AI Studio Project metadata is invalid.');
    }
    validateTrustedInputSnapshot(project.trustedInputSnapshot);
    validateStringArray(project.requestedOutputTypes, 'Project output types');
    validateStringArray(project.targetMarkets, 'Project target markets');
    validateStringArray(project.targetLocales, 'Project target locales');
    codes.add(project.projectCode);
  }
}

function validateGenerationPlans(store) {
  const projectIds = new Set(store.studioProjects.map((item) => item.id));
  const planNumbers = new Set();
  for (const plan of store.generationPlans) {
    validateBase(
      plan,
      PLAN_KEYS,
      GENERATION_PLAN_STATES,
      'state',
      'planHash',
      'Generation Plan',
    );
    if (!projectIds.has(plan.studioProjectId) ||
        !Number.isInteger(plan.planNumber) || plan.planNumber < 1 ||
        !isHash(plan.planNonceHash)) {
      throw new Error('AI Studio Generation Plan metadata is invalid.');
    }
    validateUuidArray(plan.taskDefinitionIds, 'Generation Plan task definitions');
    validateReferenceEnvelope(
      plan.promptGovernanceReferences,
      PROMPT_GOVERNANCE_KEYS,
      'Prompt Governance',
    );
    validateReferenceEnvelope(
      plan.aiCostIntelligenceReferences,
      AI_COST_KEYS,
      'AI Cost Intelligence',
    );
    const numberKey = `${plan.studioProjectId}:${plan.planNumber}`;
    if (planNumbers.has(numberKey)) throw new Error('AI Studio Generation Plan number is duplicated.');
    planNumbers.add(numberKey);
  }
}

function validateStudioTasks(store) {
  const projects = new Set(store.studioProjects.map((item) => item.id));
  const plans = new Map(store.generationPlans.map((item) => [item.id, item]));
  const taskIds = new Set(store.studioTasks.map((item) => item.id));
  const idempotencyKeys = new Set();
  for (const task of store.studioTasks) {
    validateBase(task, TASK_KEYS, STUDIO_TASK_STATES, 'state', 'taskHash', 'Task');
    const plan = plans.get(task.generationPlanId);
    if (!projects.has(task.studioProjectId) || !plan ||
        plan.studioProjectId !== task.studioProjectId ||
        !/^[A-Z][A-Z0-9_-]{0,99}$/.test(String(task.taskCode || '')) ||
        !/^[a-z][a-z0-9_]{0,99}$/.test(String(task.taskType || '')) ||
        !isHash(task.idempotencyKeyHash) ||
        idempotencyKeys.has(task.idempotencyKeyHash)) {
      throw new Error('AI Studio Task metadata is invalid.');
    }
    validateUuidArray(task.dependsOnTaskIds, 'Task dependencies');
    if (task.dependsOnTaskIds.includes(task.id) ||
        task.dependsOnTaskIds.some((id) => !taskIds.has(id))) {
      throw new Error('AI Studio Task dependency is invalid.');
    }
    validateStringArray(task.expectedArtifactTypes, 'Task artifact types');
    idempotencyKeys.add(task.idempotencyKeyHash);
  }
  for (const task of store.studioTasks) {
    function visit(dependencyId, path) {
      if (path.has(dependencyId)) throw new Error('AI Studio Task dependency contains a cycle.');
      const dependency = store.studioTasks.find((item) => item.id === dependencyId);
      if (dependency.studioProjectId !== task.studioProjectId) {
        throw new Error('AI Studio Task dependency crosses a Project boundary.');
      }
      const nextPath = new Set(path);
      nextPath.add(dependencyId);
      for (const nestedId of dependency.dependsOnTaskIds) visit(nestedId, nextPath);
    }
    for (const dependencyId of task.dependsOnTaskIds) {
      visit(dependencyId, new Set([task.id]));
    }
  }
  for (const plan of store.generationPlans) {
    const actualTaskIds = store.studioTasks
      .filter((task) => task.generationPlanId === plan.id)
      .map((task) => task.id)
      .sort();
    if (JSON.stringify([...plan.taskDefinitionIds].sort()) !== JSON.stringify(actualTaskIds)) {
      throw new Error('AI Studio Generation Plan task definitions are inconsistent.');
    }
  }
}

function validateArtifacts(store) {
  const projects = new Map(store.studioProjects.map((item) => [item.id, item]));
  const plans = new Map(store.generationPlans.map((item) => [item.id, item]));
  const tasks = new Map(store.studioTasks.map((item) => [item.id, item]));
  const artifacts = new Map(store.artifacts.map((item) => [item.id, item]));
  const nonces = new Set();
  const supersededTargets = new Set();
  for (const artifact of store.artifacts) {
    validateBase(
      artifact,
      ARTIFACT_KEYS,
      ARTIFACT_STATES,
      'state',
      'artifactHash',
      'Artifact',
    );
    const project = projects.get(artifact.studioProjectId);
    const plan = plans.get(artifact.generationPlanId);
    const task = tasks.get(artifact.studioTaskId);
    if (!project || !plan || !task ||
        plan.studioProjectId !== project.id ||
        task.studioProjectId !== project.id || task.generationPlanId !== plan.id ||
        artifact.productUuid !== project.trustedInputSnapshot.productUuid ||
        !/^[a-z][a-z0-9_]{0,99}$/.test(String(artifact.artifactType || '')) ||
        !/^[a-z][a-z0-9_]{0,79}$/.test(String(artifact.channel || '')) ||
        !/^[a-z][a-z0-9_]{0,79}$/.test(String(artifact.purpose || '')) ||
        !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(String(artifact.locale || '')) ||
        !isUuid(artifact.contentReferenceId) ||
        !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(String(artifact.mimeType || '')) ||
        !isHash(artifact.contentHash) || !isHash(artifact.artifactNonceHash) ||
        nonces.has(artifact.artifactNonceHash)) {
      throw new Error('AI Studio Artifact metadata is invalid.');
    }
    validateReferenceEnvelope(
      artifact.assetIntelligenceReferences,
      ASSET_INTELLIGENCE_KEYS,
      'Asset Intelligence',
    );
    validateReferenceEnvelope(
      artifact.humanFeedbackReferences,
      HUMAN_FEEDBACK_KEYS,
      'Human Feedback',
    );
    validateReferenceEnvelope(
      artifact.promptGovernanceReferences,
      PROMPT_GOVERNANCE_KEYS,
      'Prompt Governance',
    );
    validateReferenceEnvelope(
      artifact.mediaVersioningReferences,
      MEDIA_VERSIONING_KEYS,
      'Media Versioning',
    );
    validateReferenceEnvelope(
      artifact.aiCostIntelligenceReferences,
      AI_COST_KEYS,
      'AI Cost Intelligence',
    );
    for (const reference of Object.values(artifact.mediaVersioningReferences)) {
      if (reference === artifact.id) throw new Error('AI Studio media lineage contains a self-reference.');
      if (reference !== null) {
        const related = artifacts.get(reference);
        if (!related || related.studioProjectId !== artifact.studioProjectId ||
            related.productUuid !== artifact.productUuid) {
          throw new Error('AI Studio media lineage reference is invalid.');
        }
      }
    }
    const supersededId = artifact.mediaVersioningReferences.supersededArtifactReferenceId;
    if (supersededId !== null) {
      const superseded = artifacts.get(supersededId);
      if (supersededTargets.has(supersededId) ||
          superseded.artifactType !== artifact.artifactType ||
          superseded.channel !== artifact.channel ||
          superseded.purpose !== artifact.purpose ||
          superseded.locale !== artifact.locale) {
        throw new Error('AI Studio artifact supersession is invalid.');
      }
      supersededTargets.add(supersededId);
    }
    nonces.add(artifact.artifactNonceHash);
  }
  for (const artifact of store.artifacts) {
    function visit(referenceId, path) {
      if (path.has(referenceId)) throw new Error('AI Studio media lineage contains a cycle.');
      const related = artifacts.get(referenceId);
      const nextPath = new Set(path);
      nextPath.add(referenceId);
      const relatedMedia = related.mediaVersioningReferences;
      if (relatedMedia.parentArtifactReferenceId) {
        visit(relatedMedia.parentArtifactReferenceId, nextPath);
      }
      if (relatedMedia.supersededArtifactReferenceId) {
        visit(relatedMedia.supersededArtifactReferenceId, nextPath);
      }
    }
    const media = artifact.mediaVersioningReferences;
    if (media.parentArtifactReferenceId) {
      visit(media.parentArtifactReferenceId, new Set([artifact.id]));
    }
    if (media.supersededArtifactReferenceId) {
      visit(media.supersededArtifactReferenceId, new Set([artifact.id]));
    }
    if (media.derivedArtifactReferenceId !== null) {
      const derived = artifacts.get(media.derivedArtifactReferenceId);
      if (derived.mediaVersioningReferences.parentArtifactReferenceId !== artifact.id) {
        throw new Error('AI Studio derived artifact relationship is inconsistent.');
      }
    }
  }
}

function validateValidationResults(store) {
  const projects = new Set(store.studioProjects.map((item) => item.id));
  const artifacts = new Map(store.artifacts.map((item) => [item.id, item]));
  const nonces = new Set();
  for (const result of store.validationResults) {
    validateBase(
      result,
      VALIDATION_KEYS,
      VALIDATION_OUTCOMES,
      'outcome',
      'validationHash',
      'Validation Result',
    );
    const artifact = artifacts.get(result.artifactId);
    if (!projects.has(result.studioProjectId) || !artifact ||
        artifact.studioProjectId !== result.studioProjectId ||
        !/^[a-z][a-z0-9_]{0,99}$/.test(String(result.validationType || '')) ||
        !isUuid(result.ruleSetReferenceId) ||
        !isHash(result.validationNonceHash) ||
        nonces.has(result.validationNonceHash)) {
      throw new Error('AI Studio Validation Result metadata is invalid.');
    }
    validateUuidArray(result.findingReferenceIds, 'Validation finding references');
    nonces.add(result.validationNonceHash);
  }
}

function validateStudioApprovalReferences(store) {
  const projects = new Set(store.studioProjects.map((item) => item.id));
  const subjects = {
    generation_plan: new Set(store.generationPlans.map((item) => item.id)),
    artifact: new Set(store.artifacts.map((item) => item.id)),
  };
  const subjectPermissions = {
    generation_plan: new Set(['approve_generation_plan']),
    artifact: new Set([
      'approve_artifact',
      'revoke_artifact',
      'view_confidential_artifact',
    ]),
  };
  const nonces = new Set();
  for (const approval of store.studioApprovalReferences) {
    validateBase(
      approval,
      APPROVAL_KEYS,
      null,
      null,
      'approvalReferenceHash',
      'Approval Reference',
    );
    if (!projects.has(approval.studioProjectId) ||
        !subjects[approval.subjectType]?.has(approval.subjectId) ||
        !STUDIO_PERMISSIONS.includes(approval.permission) ||
        !subjectPermissions[approval.subjectType]?.has(approval.permission) ||
        !STUDIO_APPROVAL_DECISIONS.includes(approval.decisionCode) ||
        !isUuid(approval.actorId) || approval.actorType !== 'named_user' ||
        approval.actorRole !== 'owner' ||
        !isHash(approval.approvalNonceHash) ||
        nonces.has(approval.approvalNonceHash)) {
      throw new Error('AI Studio Approval Reference metadata is invalid.');
    }
    validateUuidArray(approval.evidenceReferenceIds, 'Approval evidence references');
    nonces.add(approval.approvalNonceHash);
  }
}

function validateReplayKeys(store) {
  const keys = [
    ...store.studioProjects.map((record) => record.projectNonceHash),
    ...store.generationPlans.map((record) => record.planNonceHash),
    ...store.studioTasks.map((record) => record.idempotencyKeyHash),
    ...store.artifacts.map((record) => record.artifactNonceHash),
    ...store.validationResults.map((record) => record.validationNonceHash),
    ...store.studioApprovalReferences.map((record) => record.approvalNonceHash),
  ];
  if (keys.some((key) => !isHash(key)) || new Set(keys).size !== keys.length) {
    throw new Error('AI Studio replay-protection key is duplicated or invalid.');
  }
}

function validateStudioDomain(store) {
  validateStudioProjects(store);
  validateGenerationPlans(store);
  validateStudioTasks(store);
  validateArtifacts(store);
  validateValidationResults(store);
  validateStudioApprovalReferences(store);
  validateReplayKeys(store);
}

module.exports = {
  ARTIFACT_STATES,
  GENERATION_PLAN_STATES,
  STUDIO_APPROVAL_DECISIONS,
  STUDIO_DATA_CLASSIFICATIONS,
  STUDIO_PROJECT_STATES,
  STUDIO_TASK_STATES,
  VALIDATION_OUTCOMES,
  computeArtifactHash,
  computeGenerationPlanHash,
  computeStudioApprovalReferenceHash,
  computeStudioProjectHash,
  computeStudioTaskHash,
  computeValidationResultHash,
  hashValue,
  validateStudioDomain,
};
