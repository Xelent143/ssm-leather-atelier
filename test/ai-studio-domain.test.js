const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  STUDIO_PERMISSIONS,
  authorizeStudioPermission,
} = require('../ai-studio-authorization');
const { computeStudioAuditEventHash } = require('../ai-studio-audit');
const {
  computeArtifactHash,
  computeGenerationPlanHash,
  computeStudioApprovalReferenceHash,
  computeStudioProjectHash,
  computeStudioTaskHash,
  computeValidationResultHash,
  hashValue,
} = require('../ai-studio-domain');
const {
  AI_STUDIO_REPOSITORY_CONTRACT,
  validateAiStudioRepository,
} = require('../ai-studio-repository');
const {
  AI_STUDIO_SCHEMA_VERSION,
  upgradeAiStudioStore,
} = require('../ai-studio-schema');
const { createAiStudioStore } = require('../ai-studio-store');
const {
  TRUSTED_RELEASE_REJECTION_CODES,
  TRUSTED_RELEASE_RESOLVER_CONTRACT,
} = require('../ai-studio-trusted-release-contracts');
const { PRODUCT_PLM_SCHEMA_VERSION } = require('../product-plm-schema');

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-ai-studio-'));
  let clock = Date.parse('2026-07-26T12:00:00.000Z');
  return {
    dataDir,
    store: createAiStudioStore({ dataDir, now: () => clock++ }),
  };
}

function emptyReferences() {
  return {
    assetIntelligenceReferences: {
      visualSimilarityReferenceId: null,
      brandComplianceReferenceId: null,
      marketplaceComplianceReferenceId: null,
      copyrightVerificationReferenceId: null,
    },
    humanFeedbackReferences: {
      humanRatingReferenceId: null,
      customerRatingReferenceId: null,
      marketplacePerformanceReferenceId: null,
      conversionPerformanceReferenceId: null,
    },
    promptGovernanceReferences: {
      promptApprovalReferenceId: null,
      promptTestReferenceId: null,
      promptBenchmarkReferenceId: null,
    },
    mediaVersioningReferences: {
      parentArtifactReferenceId: null,
      derivedArtifactReferenceId: null,
      supersededArtifactReferenceId: null,
    },
    aiCostIntelligenceReferences: {
      estimatedROIReferenceId: null,
      costOptimizationReferenceId: null,
      providerBenchmarkReferenceId: null,
    },
  };
}

function addCompleteDomain(draft, options = {}) {
  const productUuid = crypto.randomUUID();
  const project = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    projectCode: 'STUDIO-MG-0001',
    trustedInputSnapshot: {
      resolverContractVersion: 1,
      trustState: 'pending_resolution',
      productUuid,
      productReleaseId: crypto.randomUUID(),
      knowledgeLockId: crypto.randomUUID(),
      knowledgeLockHash: 'a'.repeat(64),
      productVersionHash: 'b'.repeat(64),
      evidenceSetHash: 'c'.repeat(64),
      releaseManifestHash: 'd'.repeat(64),
      requiredChannel: 'ai_generation',
      requiredPurpose: 'product_listing',
      sourceDataClassification: 'confidential',
      capturedAt: '2026-07-26T12:00:00.000Z',
    },
    requestedOutputTypes: ['artifact_metadata'],
    targetMarkets: ['us'],
    targetLocales: ['en-us'],
    state: 'defined',
    projectNonceHash: hashValue(options.projectNonce || 'project-nonce'),
    projectHash: null,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T12:00:00.000Z',
    createdBy: 'user:owner',
  };
  project.projectHash = computeStudioProjectHash(project);
  draft.studioProjects.push(project);

  const taskId = crypto.randomUUID();
  const plan = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    studioProjectId: project.id,
    planNumber: 1,
    state: 'draft',
    taskDefinitionIds: [taskId],
    promptGovernanceReferences: emptyReferences().promptGovernanceReferences,
    aiCostIntelligenceReferences: emptyReferences().aiCostIntelligenceReferences,
    planNonceHash: hashValue(options.planNonce || 'plan-nonce'),
    planHash: null,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T12:01:00.000Z',
    createdBy: 'user:owner',
  };
  plan.planHash = computeGenerationPlanHash(plan);
  draft.generationPlans.push(plan);

  const task = {
    id: taskId,
    schemaVersion: 1,
    studioProjectId: project.id,
    generationPlanId: plan.id,
    taskCode: 'DECLARE-ARTIFACT',
    taskType: 'metadata_declaration',
    dependsOnTaskIds: [],
    expectedArtifactTypes: ['product_image'],
    state: 'defined',
    idempotencyKeyHash: hashValue(options.taskNonce || 'task-nonce'),
    taskHash: null,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T12:02:00.000Z',
    createdBy: 'user:owner',
  };
  task.taskHash = computeStudioTaskHash(task);
  draft.studioTasks.push(task);

  const artifact = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    studioProjectId: project.id,
    generationPlanId: plan.id,
    studioTaskId: task.id,
    productUuid,
    artifactType: 'product_image',
    channel: 'internal',
    purpose: 'product_listing',
    locale: 'en-US',
    contentReferenceId: crypto.randomUUID(),
    mimeType: 'image/jpeg',
    contentHash: 'e'.repeat(64),
    state: 'declared',
    ...emptyReferences(),
    artifactNonceHash: hashValue(options.artifactNonce || 'artifact-nonce'),
    artifactHash: null,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T12:03:00.000Z',
    createdBy: 'user:owner',
  };
  artifact.artifactHash = computeArtifactHash(artifact);
  draft.artifacts.push(artifact);

  const validation = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    studioProjectId: project.id,
    artifactId: artifact.id,
    validationType: 'contract_only',
    outcome: 'not_executed',
    ruleSetReferenceId: crypto.randomUUID(),
    findingReferenceIds: [],
    validationNonceHash: hashValue(options.validationNonce || 'validation-nonce'),
    validationHash: null,
    dataClassification: 'internal',
    createdAt: '2026-07-26T12:04:00.000Z',
    createdBy: 'user:owner',
  };
  validation.validationHash = computeValidationResultHash(validation);
  draft.validationResults.push(validation);

  const approval = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    studioProjectId: project.id,
    subjectType: 'artifact',
    subjectId: artifact.id,
    permission: 'approve_artifact',
    decisionCode: 'approved',
    actorId: crypto.randomUUID(),
    actorType: 'named_user',
    actorRole: 'owner',
    evidenceReferenceIds: [],
    approvalNonceHash: hashValue(options.approvalNonce || 'approval-nonce'),
    approvalReferenceHash: null,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T12:05:00.000Z',
    createdBy: 'user:owner',
  };
  approval.approvalReferenceHash = computeStudioApprovalReferenceHash(approval);
  draft.studioApprovalReferences.push(approval);

  const audit = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    sequence: 1,
    aggregateType: 'studio_project',
    aggregateId: project.id,
    action: 'studio_domain_declared',
    result: 'success',
    actorId: 'user:owner',
    sessionId: null,
    eventNonceHash: hashValue(options.auditNonce || 'audit-nonce'),
    previousEventHash: null,
    eventHash: null,
    relatedStudioProjectId: project.id,
    relatedGenerationPlanId: plan.id,
    relatedStudioTaskId: task.id,
    relatedArtifactId: artifact.id,
    relatedValidationResultId: validation.id,
    relatedApprovalReferenceId: approval.id,
    changedFields: [
      'studioProjects',
      'generationPlans',
      'studioTasks',
      'artifacts',
      'validationResults',
      'studioApprovalReferences',
    ],
    timestamp: '2026-07-26T12:06:00.000Z',
    dataClassification: 'internal',
  };
  audit.eventHash = computeStudioAuditEventHash(audit);
  draft.studioAuditEvents.push(audit);
  return { approval, artifact, audit, plan, project, task, validation };
}

test('Studio schema v1 is empty and does not write on read', () => {
  const fixture = createFixture();
  const current = fixture.store.read();
  assert.equal(AI_STUDIO_SCHEMA_VERSION, 1);
  assert.equal(current.schemaVersion, 1);
  assert.equal(current.storeRevision, 0);
  assert.deepEqual(current.studioProjects, []);
  assert.equal(fs.existsSync(fixture.store.paths.storePath), false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('schema v0 upgrades in memory and first v1 write preserves restricted rollback backup', async () => {
  const fixture = createFixture();
  const v0 = {
    schemaVersion: 0,
    storeRevision: 0,
    createdAt: '2026-07-26T00:00:00.000Z',
    updatedAt: '2026-07-26T00:00:00.000Z',
  };
  const upgraded = upgradeAiStudioStore(v0);
  assert.equal(upgraded.schemaVersion, 1);
  assert.deepEqual(upgraded.artifacts, []);
  assert.equal(fs.existsSync(fixture.store.paths.storePath), false);
  fs.writeFileSync(fixture.store.paths.storePath, `${JSON.stringify(v0, null, 2)}\n`, { mode: 0o600 });
  await fixture.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(fs.existsSync(fixture.store.paths.v0BackupPath), true);
  assert.equal(fs.statSync(fixture.store.paths.v0BackupPath).mode & 0o777, 0o600);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('complete Studio domain validates contract-only bindings and all reserved envelopes', async () => {
  const fixture = createFixture();
  const result = await fixture.store.mutate((draft) => {
    const value = addCompleteDomain(draft);
    const referenceId = () => crypto.randomUUID();
    value.artifact.assetIntelligenceReferences = {
      visualSimilarityReferenceId: referenceId(),
      brandComplianceReferenceId: referenceId(),
      marketplaceComplianceReferenceId: referenceId(),
      copyrightVerificationReferenceId: referenceId(),
    };
    value.artifact.humanFeedbackReferences = {
      humanRatingReferenceId: referenceId(),
      customerRatingReferenceId: referenceId(),
      marketplacePerformanceReferenceId: referenceId(),
      conversionPerformanceReferenceId: referenceId(),
    };
    value.artifact.promptGovernanceReferences = {
      promptApprovalReferenceId: referenceId(),
      promptTestReferenceId: referenceId(),
      promptBenchmarkReferenceId: referenceId(),
    };
    value.artifact.aiCostIntelligenceReferences = {
      estimatedROIReferenceId: referenceId(),
      costOptimizationReferenceId: referenceId(),
      providerBenchmarkReferenceId: referenceId(),
    };
    value.artifact.artifactHash = computeArtifactHash(value.artifact);
    return { store: draft, value };
  }, 0);
  assert.equal(result.value.project.trustedInputSnapshot.trustState, 'pending_resolution');
  assert.equal(result.value.validation.outcome, 'not_executed');
  assert.equal('providerResponse' in result.value.artifact, false);
  assert.equal('fileContent' in result.value.artifact, false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('unsupported fields and embedded payloads are rejected', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const value = addCompleteDomain(draft);
      value.artifact.providerResponse = { generatedContent: 'not allowed' };
      value.artifact.artifactHash = computeArtifactHash(value.artifact);
      return { store: draft, value: null };
    }, 0),
    /Artifact is invalid/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('reserved references require UUIDs and replay keys are unique across record types', async () => {
  const invalidReference = createFixture();
  await assert.rejects(
    invalidReference.store.mutate((draft) => {
      const value = addCompleteDomain(draft);
      value.artifact.assetIntelligenceReferences.visualSimilarityReferenceId = 'score:0.98';
      value.artifact.artifactHash = computeArtifactHash(value.artifact);
      return { store: draft, value: null };
    }, 0),
    /Asset Intelligence references are invalid/,
  );
  const replay = createFixture();
  await assert.rejects(
    replay.store.mutate((draft) => {
      const duplicate = hashValue('shared-replay-key');
      addCompleteDomain(draft, { projectNonce: 'shared-replay-key', planNonce: 'shared-replay-key' });
      assert.equal(draft.studioProjects[0].projectNonceHash, duplicate);
      return { store: draft, value: null };
    }, 0),
    /replay-protection key is duplicated/,
  );
  for (const fixture of [invalidReference, replay]) {
    fs.rmSync(fixture.dataDir, { recursive: true, force: true });
  }
});

test('media lineage rejects self references, cycles and incompatible supersession', async () => {
  const self = createFixture();
  await assert.rejects(
    self.store.mutate((draft) => {
      const value = addCompleteDomain(draft);
      value.artifact.mediaVersioningReferences.parentArtifactReferenceId = value.artifact.id;
      value.artifact.artifactHash = computeArtifactHash(value.artifact);
      return { store: draft, value: null };
    }, 0),
    /self-reference/,
  );

  const cycle = createFixture();
  await assert.rejects(
    cycle.store.mutate((draft) => {
      const value = addCompleteDomain(draft);
      const second = structuredClone(value.artifact);
      second.id = crypto.randomUUID();
      second.contentReferenceId = crypto.randomUUID();
      second.contentHash = 'f'.repeat(64);
      second.artifactNonceHash = hashValue('second-artifact-nonce');
      value.artifact.mediaVersioningReferences.parentArtifactReferenceId = second.id;
      second.mediaVersioningReferences.parentArtifactReferenceId = value.artifact.id;
      value.artifact.artifactHash = computeArtifactHash(value.artifact);
      second.artifactHash = computeArtifactHash(second);
      draft.artifacts.push(second);
      return { store: draft, value: null };
    }, 0),
    /cycle/,
  );

  const supersession = createFixture();
  await assert.rejects(
    supersession.store.mutate((draft) => {
      const value = addCompleteDomain(draft);
      const second = structuredClone(value.artifact);
      second.id = crypto.randomUUID();
      second.contentReferenceId = crypto.randomUUID();
      second.artifactType = 'video';
      second.mimeType = 'video/mp4';
      second.artifactNonceHash = hashValue('superseding-artifact-nonce');
      second.mediaVersioningReferences.supersededArtifactReferenceId = value.artifact.id;
      second.artifactHash = computeArtifactHash(second);
      draft.artifacts.push(second);
      return { store: draft, value: null };
    }, 0),
    /supersession is invalid/,
  );
  for (const fixture of [self, cycle, supersession]) {
    fs.rmSync(fixture.dataDir, { recursive: true, force: true });
  }
});

test('Studio records and audit history remain immutable and revision checked', async () => {
  const fixture = createFixture();
  const result = await fixture.store.mutate((draft) => {
    addCompleteDomain(draft);
    return { store: draft, value: true };
  }, 0);
  await assert.rejects(
    fixture.store.mutate((draft) => {
      draft.artifacts[0].state = 'approved';
      draft.artifacts[0].artifactHash = computeArtifactHash(draft.artifacts[0]);
      return { store: draft, value: null };
    }, result.store.storeRevision),
    /immutable record was changed/,
  );
  await assert.rejects(
    fixture.store.mutate((draft) => ({ store: draft, value: null }), 0),
    (error) => error.code === 'AI_STUDIO_REVISION_CONFLICT',
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('only an active Named Owner receives structural Studio permissions', () => {
  const ownerId = crypto.randomUUID();
  const session = { actorType: 'named_user', userId: ownerId };
  const owner = { id: ownerId, accountType: 'owner', status: 'active' };
  for (const permission of STUDIO_PERMISSIONS) {
    assert.equal(authorizeStudioPermission(session, owner, permission).allowed, true);
  }
  assert.equal(authorizeStudioPermission(
    { actorType: 'legacy_owner', userId: ownerId },
    owner,
    'create_studio_project',
  ).allowed, false);
  assert.equal(authorizeStudioPermission(
    session,
    { ...owner, status: 'suspended' },
    'approve_artifact',
  ).allowed, false);
});

test('trusted-release and repository contracts are declarative and reject safely', () => {
  assert.equal(TRUSTED_RELEASE_RESOLVER_CONTRACT.contractVersion, 1);
  assert.ok(TRUSTED_RELEASE_REJECTION_CODES.includes('invalid_knowledge_lock'));
  assert.ok(TRUSTED_RELEASE_REJECTION_CODES.includes('resolver_unavailable'));
  assert.equal(AI_STUDIO_REPOSITORY_CONTRACT.concurrencyModel, 'single_replica_revision_checked');
  assert.doesNotThrow(() => validateAiStudioRepository({
    read() {},
    write() {},
    mutate() {},
  }));
});

test('Phase 4A has no resolver import, provider execution, network execution or Product Manager read', () => {
  const sourceFiles = [
    'ai-studio-trusted-release-contracts.js',
    'ai-studio-authorization.js',
    'ai-studio-domain.js',
    'ai-studio-audit.js',
    'ai-studio-schema.js',
    'ai-studio-store.js',
    'ai-studio-repository.js',
  ];
  const source = sourceFiles
    .map((file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8'))
    .join('\n');
  assert.doesNotMatch(source, /product-plm-release-resolver/);
  assert.doesNotMatch(source, /\bfetch\s*\(|https?:\/\/|node:https|node:http/);
  assert.doesNotMatch(source, /admin-store\.json|merchant-catalog\.json|ProductManager/);
  assert.doesNotMatch(source, /\bopenai\b|\banthropic\b|\bgemini\b/i);
  assert.equal(PRODUCT_PLM_SCHEMA_VERSION, 7);
});
