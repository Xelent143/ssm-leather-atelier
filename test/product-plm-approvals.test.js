const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  APPROVAL_DECISION_CODES,
  APPROVAL_REASON_CODES,
  APPROVAL_RISK_LEVELS,
  APPROVAL_ROLES,
  computeApprovalPolicyHash,
} = require('../product-plm-approval-policies');
const {
  authorizeApprovalActor,
  computeApprovalDecisionHash,
  computeApprovalRequestHash,
} = require('../product-plm-approvals');
const { computeHistoryEventHash } = require('../product-plm-history');
const { PRODUCT_PLM_SCHEMA_VERSION, upgradeStore } = require('../product-plm-schema');
const { createProductPlmStore } = require('../product-plm-store');
const {
  computeEntityHashes,
  computeEvidenceSetHash,
  computeProductVersionHash,
  hashValue,
} = require('../product-plm-versions');

function fixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-approval-'));
  const store = createProductPlmStore({
    dataDir,
    now: () => Date.parse('2026-07-26T12:00:00.000Z'),
  });
  return { dataDir, store };
}

function references() {
  return {
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
    complianceReferences: {
      regulatoryReferenceIds: [],
      auditReferenceIds: [],
    },
    aiReviewReferences: {
      aiReviewReferenceId: null,
      aiRiskAssessmentReferenceId: null,
    },
    wholesaleClientReferences: {
      wholesaleApprovalReferenceId: null,
      clientApprovalReferenceId: null,
    },
  };
}

function addFoundation(draft) {
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
    styleCode: 'STYLE-APPROVAL',
    productType: 'motorcycle_jacket',
  };
  draft.brands.push(brand);
  draft.legalEntities.push(legalEntity);
  draft.productIdentities.push(identity);
  draft.productFamilies.push(family);
  draft.productStyles.push(style);
  const evidence = {
    id: crypto.randomUUID(),
    recordHash: 'a'.repeat(64),
  };
  draft.evidenceRecords.push({
    ...evidence,
    schemaVersion: 1,
    evidenceType: 'qc_report',
    title: 'QC evidence',
    description: 'Reference metadata only.',
    sourceType: 'qc_registry',
    sourceReference: 'QC-001',
    artifactReferenceId: crypto.randomUUID(),
    artifactContentHash: 'b'.repeat(64),
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
  });
  const evidenceRecord = draft.evidenceRecords.at(-1);
  const { computeEvidenceRecordHash } = require('../product-plm-evidence');
  evidenceRecord.recordHash = computeEvidenceRecordHash(evidenceRecord);
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
    evidenceReferenceIds: [evidenceRecord.id],
    evidenceSetHash: computeEvidenceSetHash([evidenceRecord.id], draft.evidenceRecords),
    contentHash: null,
    captureReason: 'Approval test candidate.',
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
  return { evidence: evidenceRecord, identity, version };
}

function addApprovalLedger(draft, foundation, reserved = references()) {
  const policy = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    policyCode: 'OWNER_PRODUCT_REVIEW',
    policyVersion: 1,
    name: 'Owner product review',
    riskLevel: 'low',
    approvalReasonCodes: ['product_change'],
    requiredApprovals: [{
      role: 'owner',
      minimumApprovals: 1,
      allowSelfApproval: true,
      permittedDecisionCodes: [...APPROVAL_DECISION_CODES],
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
  const request = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: foundation.identity.id,
    productVersionId: foundation.version.id,
    versionContentHash: foundation.version.contentHash,
    evidenceReferenceIds: [foundation.evidence.id],
    evidenceSetHash: computeEvidenceSetHash([foundation.evidence.id], draft.evidenceRecords),
    approvalPolicyId: policy.id,
    approvalPolicyHash: policy.policyHash,
    approvalReasonCode: 'product_change',
    riskLevel: 'low',
    requestNonceHash: hashValue('request-nonce'),
    requestHash: null,
    expiresAt: '2026-07-27T00:01:00.000Z',
    status: 'requested',
    ...reserved,
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
    authorizationSnapshotHash: hashValue({ actorType: 'named_user', actorRole: 'owner' }),
    evidenceReferenceIds: [foundation.evidence.id],
    versionContentHash: request.versionContentHash,
    evidenceSetHash: request.evidenceSetHash,
    approvalPolicyHash: request.approvalPolicyHash,
    decisionNonceHash: hashValue('decision-nonce'),
    previousDecisionHash: null,
    decisionHash: null,
    signatureReferences: {
      signatureReferenceId: reserved.signatureReferenceId || null,
      signatureMethodReferenceId: reserved.signatureMethodReferenceId || null,
    },
    ...references(),
    dataClassification: 'confidential',
    decidedAt: '2026-07-26T00:02:00.000Z',
  };
  decision.decisionHash = computeApprovalDecisionHash(decision);
  draft.approvalDecisions.push(decision);
  return { decision, policy, request };
}

test('schema v5 upgrades in memory with empty approval collections', () => {
  const current = fixture();
  const v5 = current.store.emptyStore();
  v5.schemaVersion = 5;
  delete v5.approvalPolicies;
  delete v5.approvalRequests;
  delete v5.approvalDecisions;
  const upgraded = upgradeStore(v5);
  assert.equal(upgraded.schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.deepEqual(upgraded.approvalPolicies, []);
  assert.deepEqual(upgraded.approvalRequests, []);
  assert.deepEqual(upgraded.approvalDecisions, []);
  assert.equal(fs.existsSync(current.store.paths.storePath), false);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('first schema v6 mutation creates a restricted v5 rollback backup', async () => {
  const current = fixture();
  const v5 = current.store.emptyStore();
  v5.schemaVersion = 5;
  delete v5.approvalPolicies;
  delete v5.approvalRequests;
  delete v5.approvalDecisions;
  fs.writeFileSync(current.store.paths.storePath, `${JSON.stringify(v5, null, 2)}\n`, { mode: 0o600 });
  await current.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(current.store.read().schemaVersion, 6);
  assert.equal(fs.existsSync(current.store.paths.v5BackupPath), true);
  assert.equal(fs.statSync(current.store.paths.v5BackupPath).mode & 0o777, 0o600);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('approval registry binds policy, version, evidence and reserved references by hash', async () => {
  const current = fixture();
  const reserved = references();
  reserved.delegationReferences = {
    delegatedFromActorId: crypto.randomUUID(),
    delegatedToActorId: crypto.randomUUID(),
    delegationPolicyReferenceId: crypto.randomUUID(),
  };
  reserved.escalationReferences = {
    escalationReferenceId: crypto.randomUUID(),
    escalationReasonCode: 'SAFETY_REVIEW',
    escalationLevel: 2,
  };
  reserved.complianceReferences = {
    regulatoryReferenceIds: [crypto.randomUUID()],
    auditReferenceIds: [crypto.randomUUID()],
  };
  reserved.aiReviewReferences = {
    aiReviewReferenceId: crypto.randomUUID(),
    aiRiskAssessmentReferenceId: crypto.randomUUID(),
  };
  reserved.wholesaleClientReferences = {
    wholesaleApprovalReferenceId: crypto.randomUUID(),
    clientApprovalReferenceId: crypto.randomUUID(),
  };
  const result = await current.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const approval = addApprovalLedger(draft, foundation, reserved);
    return { store: draft, value: approval };
  }, 0);
  assert.equal(result.store.approvalPolicies.length, 1);
  assert.equal(result.store.approvalRequests.length, 1);
  assert.equal(result.store.approvalDecisions.length, 1);
  assert.equal('password' in result.value.decision, false);
  assert.equal('signature' in result.value.decision, false);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('only a Named Owner receives executable approval authorization', () => {
  const ownerId = crypto.randomUUID();
  assert.equal(authorizeApprovalActor(
    { actorType: 'named_user', userId: ownerId },
    { id: ownerId, accountType: 'owner', status: 'active' },
    'owner',
  ).allowed, true);
  assert.equal(authorizeApprovalActor(
    { actorType: 'legacy_owner', userId: ownerId },
    { id: ownerId, accountType: 'owner', status: 'active' },
    'owner',
  ).allowed, false);
  assert.equal(authorizeApprovalActor(
    { actorType: 'named_user', userId: ownerId },
    { id: ownerId, accountType: 'owner', status: 'active' },
    'qc',
  ).allowed, false);
  assert.equal(authorizeApprovalActor(
    { actorType: 'named_user', userId: ownerId },
    { id: ownerId, accountType: 'owner', status: 'suspended' },
    'owner',
  ).allowed, false);
});

test('all reserved role, decision, risk and reason vocabularies are stable', () => {
  assert.deepEqual(APPROVAL_ROLES, [
    'owner', 'product_manager', 'factory', 'qc', 'seo', 'marketplace',
    'legal', 'wholesale', 'custom_client',
  ]);
  assert.deepEqual(APPROVAL_RISK_LEVELS, ['low', 'medium', 'high', 'critical']);
  assert.ok(APPROVAL_DECISION_CODES.includes('revoked'));
  assert.ok(APPROVAL_REASON_CODES.includes('customer_request'));
});

test('request replay and immutable approval rewrites are rejected', async () => {
  const current = fixture();
  await current.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    addApprovalLedger(draft, foundation);
    return { store: draft, value: null };
  }, 0);
  const revision = current.store.read().storeRevision;
  await assert.rejects(
    current.store.mutate((draft) => {
      const replay = structuredClone(draft.approvalRequests[0]);
      replay.id = crypto.randomUUID();
      replay.requestHash = computeApprovalRequestHash(replay);
      draft.approvalRequests.push(replay);
      return { store: draft, value: null };
    }, revision),
    /metadata is invalid/,
  );
  await assert.rejects(
    current.store.mutate((draft) => {
      draft.approvalDecisions[0].decisionCode = 'revoked';
      draft.approvalDecisions[0].decisionHash =
        computeApprovalDecisionHash(draft.approvalDecisions[0]);
      return { store: draft, value: null };
    }, revision),
    /immutable record was changed/,
  );
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('approval history records can reference approval aggregates without payloads', async () => {
  const current = fixture();
  const result = await current.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const approval = addApprovalLedger(draft, foundation);
    const event = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      productUuid: foundation.identity.id,
      sequence: 1,
      aggregateType: 'approval_decision',
      aggregateId: approval.decision.id,
      action: 'approval_decision_recorded',
      result: 'success',
      actorId: approval.decision.actorId,
      sessionId: null,
      timestamp: approval.decision.decidedAt,
      previousEventHash: null,
      eventHash: null,
      relatedVersionId: foundation.version.id,
      relatedEvidenceId: foundation.evidence.id,
      relatedApprovalPolicyId: approval.policy.id,
      relatedApprovalRequestId: approval.request.id,
      relatedApprovalDecisionId: approval.decision.id,
      changedFields: ['approvalDecisions'],
      beforeHash: null,
      afterHash: approval.decision.decisionHash,
      dataClassification: 'confidential',
    };
    event.eventHash = computeHistoryEventHash(event);
    draft.productHistoryEvents.push(event);
    return { store: draft, value: event };
  }, 0);
  assert.equal(result.store.productHistoryEvents[0].aggregateType, 'approval_decision');
  assert.equal('evidencePayload' in result.value, false);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});
