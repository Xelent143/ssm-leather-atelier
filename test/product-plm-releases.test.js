const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { computeApprovalPolicyHash } = require('../product-plm-approval-policies');
const {
  computeApprovalDecisionHash,
  computeApprovalRequestHash,
} = require('../product-plm-approvals');
const { computeEvidenceRecordHash } = require('../product-plm-evidence');
const { computeKnowledgeLockHash } = require('../product-plm-knowledge-locks');
const { resolveApprovedRelease } = require('../product-plm-release-resolver');
const {
  RELEASE_CHANNELS,
  RELEASE_PURPOSES,
  computeApprovalSnapshotHash,
  computeReleaseLifecycleEventHash,
  computeReleaseManifestHash,
} = require('../product-plm-releases');
const { PRODUCT_PLM_SCHEMA_VERSION, upgradeStore } = require('../product-plm-schema');
const { createProductPlmStore } = require('../product-plm-store');
const {
  computeEntityHashes,
  computeEvidenceSetHash,
  computeProductVersionHash,
  hashValue,
} = require('../product-plm-versions');

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-release-'));
  return {
    dataDir,
    store: createProductPlmStore({
      dataDir,
      now: () => Date.parse('2026-07-26T12:00:00.000Z'),
    }),
  };
}

function emptyIntegrityReferences() {
  return {
    integrityCheckReferenceId: null,
    verificationReferenceId: null,
    trustLevelReferenceId: null,
  };
}

function emptyTrustReferences() {
  return {
    trustProvenanceReferenceId: null,
    releaseCertificationReferenceId: null,
  };
}

function emptyLifecycleReferences() {
  return {
    lifecyclePolicyReferenceId: null,
    archivalPolicyReferenceId: null,
  };
}

function buildFoundation(draft) {
  const brand = {
    id: crypto.randomUUID(),
    name: 'MOTOGRIP GEAR',
    code: 'MOTOGRIP_GEAR',
    defaultLegalEntityId: null,
  };
  const legalEntity = { id: crypto.randomUUID(), legalName: 'MOTOGRIP GEAR LLC' };
  brand.defaultLegalEntityId = legalEntity.id;
  const identity = { id: crypto.randomUUID(), brandId: brand.id, legalEntityId: legalEntity.id };
  const family = {
    id: crypto.randomUUID(),
    code: 'MOTORCYCLE_JACKET',
    brandId: brand.id,
    legalEntityId: legalEntity.id,
    parentFamilyId: null,
  };
  const style = {
    id: crypto.randomUUID(),
    productUuid: identity.id,
    familyId: family.id,
    brandId: brand.id,
    legalEntityId: legalEntity.id,
    styleCode: 'STYLE-RELEASE',
    productType: 'motorcycle_jacket',
  };
  draft.brands.push(brand);
  draft.legalEntities.push(legalEntity);
  draft.productIdentities.push(identity);
  draft.productFamilies.push(family);
  draft.productStyles.push(style);

  const evidence = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    evidenceType: 'qc_report',
    title: 'Release QC evidence',
    description: 'Reference metadata only.',
    sourceType: 'qc_registry',
    sourceReference: 'QC-RELEASE-001',
    artifactReferenceId: crypto.randomUUID(),
    artifactContentHash: 'a'.repeat(64),
    recordHash: null,
    mimeType: 'application/pdf',
    issuedAt: '2026-07-26T00:00:00.000Z',
    expiresAt: null,
    status: 'active',
    supersedesEvidenceId: null,
    aiProvenance: {
      aiSessionReferenceId: null,
      promptTemplateReferenceId: null,
      aiEngineVersionReferenceId: null,
      humanApprovalReferenceId: null,
    },
    dataClassification: 'regulated_evidence',
    createdAt: '2026-07-26T00:00:00.000Z',
    createdBy: 'user:owner',
  };
  evidence.recordHash = computeEvidenceRecordHash(evidence);
  draft.evidenceRecords.push(evidence);

  const snapshot = {
    productIdentity: structuredClone(identity),
    brand: structuredClone(brand),
    legalEntity: structuredClone(legalEntity),
    productFamily: structuredClone(family),
    productStyle: structuredClone(style),
    productComponents: [],
    productRelationships: [],
    optionDefinitions: [],
    optionValues: [],
    styleOptionAssignments: [],
    sellableItems: [],
    marketplaceIdentities: [],
  };
  const version = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: identity.id,
    versionNumber: 1,
    snapshotSchemaVersion: 1,
    sourceStoreRevision: 0,
    snapshot,
    entityHashes: computeEntityHashes(snapshot),
    evidenceReferenceIds: [evidence.id],
    evidenceSetHash: computeEvidenceSetHash([evidence.id], draft.evidenceRecords),
    contentHash: null,
    captureReason: 'Trusted release candidate.',
    status: 'candidate',
    productDnaReferences: {
      dnaFingerprint: null,
      dnaGeneration: 0,
      dnaParentVersionId: null,
      dnaScoreReferenceId: null,
    },
    competitorReferenceIds: [],
    searchIntelligenceReferences: {
      keywordClusterIds: [],
      searchIntentIds: [],
      faqClusterIds: [],
      trendIds: [],
      blogTopicIds: [],
    },
    aiProvenance: {
      aiSessionReferenceId: null,
      promptTemplateReferenceId: null,
      aiEngineVersionReferenceId: null,
      humanApprovalReferenceId: null,
    },
    dataClassification: 'confidential',
    createdAt: '2026-07-26T00:00:00.000Z',
    createdBy: 'user:owner',
  };
  version.contentHash = computeProductVersionHash(version);
  draft.productVersions.push(version);

  const policy = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    policyCode: 'OWNER_RELEASE_REVIEW',
    policyVersion: 1,
    name: 'Owner release review',
    riskLevel: 'low',
    approvalReasonCodes: ['product_change'],
    requiredApprovals: [{
      role: 'owner',
      minimumApprovals: 1,
      allowSelfApproval: true,
      permittedDecisionCodes: [
        'approved', 'rejected', 'needs_changes', 'blocked',
        'expired', 'superseded', 'revoked',
      ],
    }],
    evidenceRequirements: [{ evidenceType: 'qc_report', minimumCount: 1, required: true }],
    expiresAfterSeconds: 86400,
    status: 'active',
    policyHash: null,
    dataClassification: 'internal',
    createdAt: '2026-07-26T00:01:00.000Z',
    createdBy: 'user:owner',
  };
  policy.policyHash = computeApprovalPolicyHash(policy);
  draft.approvalPolicies.push(policy);

  const approvalReferences = {
    delegationReferences: {
      delegatedFromActorId: null,
      delegatedToActorId: null,
      delegationPolicyReferenceId: null,
    },
    escalationReferences: {
      escalationReferenceId: null,
      escalationReasonCode: null,
      escalationLevel: null,
    },
    complianceReferences: { regulatoryReferenceIds: [], auditReferenceIds: [] },
    aiReviewReferences: {
      aiReviewReferenceId: null,
      aiRiskAssessmentReferenceId: null,
    },
    wholesaleClientReferences: {
      wholesaleApprovalReferenceId: null,
      clientApprovalReferenceId: null,
    },
  };
  const request = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: identity.id,
    productVersionId: version.id,
    versionContentHash: version.contentHash,
    evidenceReferenceIds: [evidence.id],
    evidenceSetHash: version.evidenceSetHash,
    approvalPolicyId: policy.id,
    approvalPolicyHash: policy.policyHash,
    approvalReasonCode: 'product_change',
    riskLevel: 'low',
    requestNonceHash: hashValue('release-request-nonce'),
    requestHash: null,
    expiresAt: '2026-07-27T00:01:00.000Z',
    status: 'requested',
    ...approvalReferences,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T00:01:00.000Z',
    createdBy: 'user:owner',
  };
  request.requestHash = computeApprovalRequestHash(request);
  draft.approvalRequests.push(request);

  const decision = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    approvalRequestId: request.id,
    sequence: 1,
    decisionCode: 'approved',
    actorId: crypto.randomUUID(),
    actorType: 'named_user',
    actorRole: 'owner',
    authorizationSnapshotHash: hashValue({ accountType: 'owner', status: 'active' }),
    evidenceReferenceIds: [evidence.id],
    versionContentHash: version.contentHash,
    evidenceSetHash: version.evidenceSetHash,
    approvalPolicyHash: policy.policyHash,
    decisionNonceHash: hashValue('release-decision-nonce'),
    previousDecisionHash: null,
    decisionHash: null,
    signatureReferences: {
      signatureReferenceId: null,
      signatureMethodReferenceId: null,
    },
    ...approvalReferences,
    dataClassification: 'confidential',
    decidedAt: '2026-07-26T00:02:00.000Z',
  };
  decision.decisionHash = computeApprovalDecisionHash(decision);
  draft.approvalDecisions.push(decision);
  return { decision, evidence, identity, policy, request, version };
}

function buildRelease(draft, foundation, reserved = {}) {
  const release = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: foundation.identity.id,
    releaseNumber: 1,
    productVersionId: foundation.version.id,
    productVersionHash: foundation.version.contentHash,
    evidenceReferenceIds: [foundation.evidence.id],
    evidenceSetHash: foundation.version.evidenceSetHash,
    approvalRequestId: foundation.request.id,
    approvalDecisionIds: [foundation.decision.id],
    approvalSnapshotHash: computeApprovalSnapshotHash(
      foundation.policy,
      foundation.request,
      [foundation.decision],
    ),
    channels: ['website', 'internal', 'ai_generation'],
    purposes: ['product_listing', 'customer_support', 'ai_training'],
    releaseNonceHash: hashValue('release-manifest-nonce'),
    releaseManifestHash: null,
    integrityReferences: reserved.integrityReferences || emptyIntegrityReferences(),
    consumptionEngineReferences: {
      productStudioReferenceIds: [],
      searchIntelligenceReferenceIds: [],
      competitorIntelligenceReferenceIds: [],
      ceoDashboardReferenceIds: [],
      factoryOsReferenceIds: [],
      wholesaleOsReferenceIds: [],
    },
    trustProvenanceReferences: reserved.trustProvenanceReferences || emptyTrustReferences(),
    aiCompatibilityReferences: reserved.aiCompatibilityReferences || {
      supportedAIModelReferenceIds: [],
      promptProfileReferenceIds: [],
    },
    customerExperienceReferences: reserved.customerExperienceReferences || {
      customerJourneyReferenceIds: [],
      supportKnowledgeReferenceIds: [],
    },
    analyticsReferences: reserved.analyticsReferences || {
      analyticsReferenceIds: [],
      performanceReferenceIds: [],
    },
    lifecyclePolicyReferences: reserved.lifecyclePolicyReferences || emptyLifecycleReferences(),
    dataClassification: 'confidential',
    createdAt: '2026-07-26T00:03:00.000Z',
    createdBy: 'user:owner',
  };
  release.releaseManifestHash = computeReleaseManifestHash(release);
  draft.productReleases.push(release);

  const lock = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: release.productUuid,
    releaseId: release.id,
    productVersionId: release.productVersionId,
    productVersionHash: release.productVersionHash,
    evidenceSetHash: release.evidenceSetHash,
    releaseManifestHash: release.releaseManifestHash,
    approvalSnapshotHash: release.approvalSnapshotHash,
    canonicalizationVersion: 1,
    hashAlgorithm: 'sha256',
    knowledgeLockNonceHash: hashValue('knowledge-lock-nonce'),
    knowledgeLockHash: null,
    integrityReferences: release.integrityReferences,
    trustProvenanceReferences: release.trustProvenanceReferences,
    lifecyclePolicyReferences: release.lifecyclePolicyReferences,
    dataClassification: 'confidential',
    createdAt: '2026-07-26T00:04:00.000Z',
    createdBy: 'user:owner',
  };
  lock.knowledgeLockHash = computeKnowledgeLockHash(lock);
  draft.knowledgeLocks.push(lock);
  return { lock, release };
}

function lifecycleEvent(release, sequence, eventCode, previousEventHash = null) {
  const event = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: release.productUuid,
    releaseId: release.id,
    sequence,
    eventCode,
    reasonCode: null,
    eventNonceHash: hashValue(`lifecycle-${sequence}-${eventCode}`),
    previousEventHash,
    eventHash: null,
    actorId: 'user:owner',
    actorType: 'named_user',
    timestamp: new Date(Date.parse('2026-07-26T00:05:00.000Z') + sequence).toISOString(),
    dataClassification: 'confidential',
  };
  event.eventHash = computeReleaseLifecycleEventHash(event);
  return event;
}

async function completeStore(current, state = 'approved', reserved = {}) {
  return current.store.mutate((draft) => {
    const foundation = buildFoundation(draft);
    const built = buildRelease(draft, foundation, reserved);
    const drafted = lifecycleEvent(built.release, 1, 'release_drafted');
    draft.releaseLifecycleEvents.push(drafted);
    if (state !== 'draft') {
      const approved = lifecycleEvent(built.release, 2, 'release_approved', drafted.eventHash);
      draft.releaseLifecycleEvents.push(approved);
      if (state === 'withdrawn') {
        const active = lifecycleEvent(built.release, 3, 'release_activated', approved.eventHash);
        const withdrawn = lifecycleEvent(built.release, 4, 'release_withdrawn', active.eventHash);
        draft.releaseLifecycleEvents.push(active, withdrawn);
      }
    }
    return { store: draft, value: { ...foundation, ...built } };
  }, 0);
}

test('schema v6 upgrades in memory and first v7 write creates a restricted backup', async () => {
  const current = createFixture();
  const v6 = current.store.emptyStore();
  v6.schemaVersion = 6;
  delete v6.productReleases;
  delete v6.releaseLifecycleEvents;
  delete v6.knowledgeLocks;
  const upgraded = upgradeStore(v6);
  assert.equal(upgraded.schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.deepEqual(upgraded.productReleases, []);
  assert.equal(fs.existsSync(current.store.paths.storePath), false);
  fs.writeFileSync(current.store.paths.storePath, `${JSON.stringify(v6, null, 2)}\n`, { mode: 0o600 });
  await current.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(fs.existsSync(current.store.paths.v6BackupPath), true);
  assert.equal(fs.statSync(current.store.paths.v6BackupPath).mode & 0o777, 0o600);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('release and Knowledge Lock preserve independently verifiable hashes and references', async () => {
  const current = createFixture();
  const referenceId = () => crypto.randomUUID();
  const result = await completeStore(current, 'approved', {
    integrityReferences: {
      integrityCheckReferenceId: referenceId(),
      verificationReferenceId: referenceId(),
      trustLevelReferenceId: referenceId(),
    },
    trustProvenanceReferences: {
      trustProvenanceReferenceId: referenceId(),
      releaseCertificationReferenceId: referenceId(),
    },
    aiCompatibilityReferences: {
      supportedAIModelReferenceIds: [referenceId()],
      promptProfileReferenceIds: [referenceId()],
    },
    customerExperienceReferences: {
      customerJourneyReferenceIds: [referenceId()],
      supportKnowledgeReferenceIds: [referenceId()],
    },
    analyticsReferences: {
      analyticsReferenceIds: [referenceId()],
      performanceReferenceIds: [referenceId()],
    },
    lifecyclePolicyReferences: {
      lifecyclePolicyReferenceId: referenceId(),
      archivalPolicyReferenceId: referenceId(),
    },
  });
  assert.equal(result.value.release.productVersionHash, result.value.version.contentHash);
  assert.equal(result.value.lock.releaseManifestHash, result.value.release.releaseManifestHash);
  assert.equal('productPayload' in result.value.release, false);
  assert.equal('aiPrompt' in result.value.release, false);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('trusted resolver accepts only approved locked releases for authorized consumption', async () => {
  const current = createFixture();
  const result = await completeStore(current);
  const trusted = resolveApprovedRelease(result.store, {
    productUuid: result.value.identity.id,
    channel: 'ai_generation',
    purpose: 'ai_training',
  });
  assert.equal(trusted.trusted, true);
  assert.equal(trusted.reason, 'trusted');
  assert.equal(resolveApprovedRelease(result.store, {
    productUuid: result.value.identity.id,
    channel: 'ebay',
  }).reason, 'channel_not_authorized');
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('trusted resolver rejects drafts, withdrawals, invalid locks and later revocations', async () => {
  const draftFixture = createFixture();
  const draft = await completeStore(draftFixture, 'draft');
  assert.equal(resolveApprovedRelease(draft.store, {
    productUuid: draft.value.identity.id,
  }).reason, 'not_approved');

  const withdrawnFixture = createFixture();
  const withdrawn = await completeStore(withdrawnFixture, 'withdrawn');
  assert.equal(resolveApprovedRelease(withdrawn.store, {
    productUuid: withdrawn.value.identity.id,
  }).reason, 'withdrawn');

  const corrupt = structuredClone(withdrawn.store);
  corrupt.knowledgeLocks[0].knowledgeLockHash = '0'.repeat(64);
  assert.equal(resolveApprovedRelease(corrupt, {
    productUuid: withdrawn.value.identity.id,
  }).reason, 'invalid_knowledge_lock');

  const revoked = structuredClone(draft.store);
  const first = revoked.approvalDecisions[0];
  const later = {
    ...structuredClone(first),
    id: crypto.randomUUID(),
    sequence: 2,
    decisionCode: 'revoked',
    decisionNonceHash: hashValue('later-revocation'),
    previousDecisionHash: first.decisionHash,
    decisionHash: null,
    decidedAt: '2026-07-26T00:10:00.000Z',
  };
  later.decisionHash = computeApprovalDecisionHash(later);
  revoked.approvalDecisions.push(later);
  assert.equal(resolveApprovedRelease(revoked, {
    productUuid: draft.value.identity.id,
  }).reason, 'invalid_approval');

  for (const item of [draftFixture, withdrawnFixture]) {
    fs.rmSync(item.dataDir, { recursive: true, force: true });
  }
});

test('release lifecycle rejects invalid transitions and records stay append-only', async () => {
  const current = createFixture();
  const result = await completeStore(current);
  const revision = result.store.storeRevision;
  await assert.rejects(
    current.store.mutate((draft) => {
      const approved = draft.releaseLifecycleEvents[1];
      const invalid = lifecycleEvent(
        result.value.release,
        3,
        'release_withdrawn',
        approved.eventHash,
      );
      draft.releaseLifecycleEvents.push(invalid);
      return { store: draft, value: null };
    }, revision),
    /transition is invalid/,
  );
  await assert.rejects(
    current.store.mutate((draft) => {
      draft.productReleases[0].purposes.push('blog');
      draft.productReleases[0].releaseManifestHash =
        computeReleaseManifestHash(draft.productReleases[0]);
      return { store: draft, value: null };
    }, revision),
    /Knowledge Lock metadata is invalid|immutable record was changed/,
  );
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('all approved release channels and purposes are reserved without publishing logic', () => {
  for (const channel of [
    'website', 'ebay', 'etsy', 'amazon', 'walmart',
    'wholesale', 'dealer', 'internal', 'ai_generation',
  ]) assert.ok(RELEASE_CHANNELS.includes(channel));
  for (const purpose of [
    'product_listing', 'seo', 'blog', 'buying_guide', 'faq',
    'marketing', 'factory', 'wholesale', 'customer_support', 'ai_training',
  ]) assert.ok(RELEASE_PURPOSES.includes(purpose));
});
