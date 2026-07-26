const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  EVIDENCE_TYPES,
  computeEvidenceLinkHash,
  computeEvidenceRecordHash,
} = require('../product-plm-evidence');
const { computeHistoryEventHash } = require('../product-plm-history');
const {
  PRODUCT_PLM_SCHEMA_VERSION,
  upgradeStore,
} = require('../product-plm-schema');
const { createProductPlmStore } = require('../product-plm-store');
const {
  computeEntityHashes,
  computeEvidenceSetHash,
  computeProductVersionHash,
} = require('../product-plm-versions');

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-version-'));
  let clock = Date.parse('2026-07-26T00:00:00.000Z');
  const store = createProductPlmStore({ dataDir, now: () => clock++ });
  return { dataDir, store };
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
  const productIdentity = {
    id: crypto.randomUUID(),
    brandId: brand.id,
    legalEntityId: legalEntity.id,
  };
  const productFamily = {
    id: crypto.randomUUID(),
    code: 'MOTORCYCLE_JACKET',
    brandId: brand.id,
    legalEntityId: legalEntity.id,
    parentFamilyId: null,
  };
  const productStyle = {
    id: crypto.randomUUID(),
    productUuid: productIdentity.id,
    familyId: productFamily.id,
    brandId: brand.id,
    legalEntityId: legalEntity.id,
    styleCode: 'STYLE-VERSIONED',
    productType: 'motorcycle_jacket',
  };
  draft.brands.push(brand);
  draft.legalEntities.push(legalEntity);
  draft.productIdentities.push(productIdentity);
  draft.productFamilies.push(productFamily);
  draft.productStyles.push(productStyle);
  return { brand, legalEntity, productFamily, productIdentity, productStyle };
}

function snapshotFromFoundation(foundation) {
  return {
    productIdentity: structuredClone(foundation.productIdentity),
    brand: structuredClone(foundation.brand),
    legalEntity: structuredClone(foundation.legalEntity),
    productFamily: structuredClone(foundation.productFamily),
    productStyle: structuredClone(foundation.productStyle),
    productComponents: [],
    productRelationships: [],
    optionDefinitions: [],
    optionValues: [],
    styleOptionAssignments: [],
    sellableItems: [],
    marketplaceIdentities: [],
  };
}

function aiProvenance(fields = {}) {
  return {
    aiSessionReferenceId: fields.aiSessionReferenceId ?? null,
    promptTemplateReferenceId: fields.promptTemplateReferenceId ?? null,
    aiEngineVersionReferenceId: fields.aiEngineVersionReferenceId ?? null,
    humanApprovalReferenceId: fields.humanApprovalReferenceId ?? null,
  };
}

function evidenceRecord(fields = {}) {
  const record = {
    id: fields.id || crypto.randomUUID(),
    schemaVersion: 1,
    evidenceType: fields.evidenceType || 'stitching_sop',
    title: fields.title || 'Approved stitching SOP',
    description: 'Reference metadata only.',
    sourceType: 'factory_document_registry',
    sourceReference: 'FACTORY-SOP-001',
    artifactReferenceId: crypto.randomUUID(),
    artifactContentHash: 'a'.repeat(64),
    recordHash: null,
    mimeType: 'application/pdf',
    issuedAt: '2026-07-26T00:00:00.000Z',
    expiresAt: null,
    status: 'active',
    supersedesEvidenceId: fields.supersedesEvidenceId ?? null,
    aiProvenance: fields.aiProvenance || aiProvenance(),
    dataClassification: 'factory_confidential',
    createdAt: '2026-07-26T00:00:00.000Z',
    createdBy: 'user:owner',
  };
  record.recordHash = computeEvidenceRecordHash(record);
  return record;
}

function productVersion(foundation, evidenceRecords, fields = {}) {
  const snapshot = snapshotFromFoundation(foundation);
  const version = {
    id: fields.id || crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: foundation.productIdentity.id,
    versionNumber: fields.versionNumber || 1,
    snapshotSchemaVersion: 1,
    sourceStoreRevision: fields.sourceStoreRevision || 0,
    snapshot,
    entityHashes: computeEntityHashes(snapshot),
    evidenceReferenceIds: evidenceRecords.map((record) => record.id),
    evidenceSetHash: null,
    contentHash: null,
    captureReason: fields.captureReason || 'Initial immutable PLM capture.',
    status: 'candidate',
    productDnaReferences: {
      dnaFingerprint: fields.dnaFingerprint ?? null,
      dnaGeneration: fields.dnaGeneration ?? 0,
      dnaParentVersionId: fields.dnaParentVersionId ?? null,
      dnaScoreReferenceId: fields.dnaScoreReferenceId ?? null,
    },
    competitorReferenceIds: fields.competitorReferenceIds || [],
    searchIntelligenceReferences: {
      keywordClusterIds: fields.keywordClusterIds || [],
      searchIntentIds: fields.searchIntentIds || [],
      faqClusterIds: fields.faqClusterIds || [],
      trendIds: fields.trendIds || [],
      blogTopicIds: fields.blogTopicIds || [],
    },
    aiProvenance: fields.aiProvenance || aiProvenance(),
    dataClassification: 'factory_confidential',
    createdAt: '2026-07-26T00:00:00.000Z',
    createdBy: 'user:owner',
  };
  version.evidenceSetHash = computeEvidenceSetHash(version.evidenceReferenceIds, evidenceRecords);
  version.contentHash = computeProductVersionHash(version);
  return version;
}

function evidenceLink(version, evidence) {
  const link = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    evidenceId: evidence.id,
    subjectType: 'product_version',
    subjectId: version.id,
    fieldPath: 'productStyle.productType',
    claimCode: 'PRODUCT_TYPE',
    relationship: 'supports',
    requiredForRelease: true,
    linkHash: null,
    dataClassification: 'factory_confidential',
    createdAt: '2026-07-26T00:00:00.000Z',
    createdBy: 'user:owner',
  };
  link.linkHash = computeEvidenceLinkHash(link);
  return link;
}

function historyEvent(version, evidence, fields = {}) {
  const event = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: version.productUuid,
    sequence: fields.sequence || 1,
    aggregateType: fields.aggregateType || 'product_version',
    aggregateId: fields.aggregateId || version.id,
    action: fields.action || 'version_captured',
    result: 'success',
    actorId: 'user:owner',
    sessionId: 'session-reference',
    timestamp: fields.timestamp || '2026-07-26T00:00:00.000Z',
    previousEventHash: fields.previousEventHash ?? null,
    eventHash: null,
    relatedVersionId: version.id,
    relatedEvidenceId: evidence?.id || null,
    changedFields: fields.changedFields || ['productVersions'],
    beforeHash: null,
    afterHash: fields.afterHash || version.contentHash,
    dataClassification: 'internal',
  };
  event.eventHash = computeHistoryEventHash(event);
  return event;
}

async function writeCompleteFixture(fixture, referenceFields = {}) {
  return fixture.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const evidence = evidenceRecord({
      aiProvenance: aiProvenance(referenceFields.aiProvenance),
    });
    draft.evidenceRecords.push(evidence);
    const version = productVersion(foundation, [evidence], referenceFields);
    draft.productVersions.push(version);
    const link = evidenceLink(version, evidence);
    draft.evidenceLinks.push(link);
    const event = historyEvent(version, evidence);
    draft.productHistoryEvents.push(event);
    return { store: draft, value: { evidence, event, foundation, link, version } };
  }, 0);
}

test('schema v4 upgrades in memory and preserves all Phase 3B.2C collections', () => {
  const fixture = createFixture();
  const v4 = fixture.store.emptyStore();
  v4.schemaVersion = 4;
  delete v4.productVersions;
  delete v4.evidenceRecords;
  delete v4.evidenceLinks;
  delete v4.productHistoryEvents;
  addFoundation(v4);
  const upgraded = upgradeStore(v4);
  assert.equal(v4.schemaVersion, 4);
  assert.equal(upgraded.schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.equal(upgraded.productStyles.length, 1);
  assert.deepEqual(upgraded.productVersions, []);
  assert.deepEqual(upgraded.evidenceRecords, []);
  assert.deepEqual(upgraded.productHistoryEvents, []);
  assert.equal(fs.existsSync(fixture.store.paths.storePath), false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('first schema v5 mutation preserves a restricted v4 rollback backup', async () => {
  const fixture = createFixture();
  const v4 = fixture.store.emptyStore();
  v4.schemaVersion = 4;
  delete v4.productVersions;
  delete v4.evidenceRecords;
  delete v4.evidenceLinks;
  delete v4.productHistoryEvents;
  fs.writeFileSync(fixture.store.paths.storePath, `${JSON.stringify(v4, null, 2)}\n`, { mode: 0o600 });
  await fixture.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(fixture.store.read().schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.equal(fs.existsSync(fixture.store.paths.v4BackupPath), true);
  assert.equal(JSON.parse(fs.readFileSync(fixture.store.paths.v4BackupPath)).schemaVersion, 4);
  assert.equal(fs.statSync(fixture.store.paths.v4BackupPath).mode & 0o777, 0o600);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('immutable Product Version captures evidence and all reserved reference envelopes', async () => {
  const fixture = createFixture();
  const references = {
    dnaFingerprint: 'b'.repeat(64),
    dnaGeneration: 1,
    dnaScoreReferenceId: crypto.randomUUID(),
    competitorReferenceIds: [crypto.randomUUID()],
    keywordClusterIds: [crypto.randomUUID()],
    searchIntentIds: [crypto.randomUUID()],
    faqClusterIds: [crypto.randomUUID()],
    trendIds: [crypto.randomUUID()],
    blogTopicIds: [crypto.randomUUID()],
    aiProvenance: {
      aiSessionReferenceId: crypto.randomUUID(),
      promptTemplateReferenceId: crypto.randomUUID(),
      aiEngineVersionReferenceId: crypto.randomUUID(),
      humanApprovalReferenceId: crypto.randomUUID(),
    },
  };
  const result = await writeCompleteFixture(fixture, references);
  assert.equal(result.store.productVersions.length, 1);
  assert.equal(result.store.evidenceRecords.length, 1);
  assert.equal(result.store.evidenceLinks.length, 1);
  assert.equal(result.store.productHistoryEvents.length, 1);
  assert.equal(result.value.version.productDnaReferences.dnaFingerprint, 'b'.repeat(64));
  assert.deepEqual(result.value.version.competitorReferenceIds, references.competitorReferenceIds);
  assert.equal('prompt' in result.value.version.aiProvenance, false);
  assert.equal('aiOutput' in result.value.version, false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('factory evidence registry includes every approved reserved evidence type', () => {
  for (const type of [
    'stitching_sop',
    'leather_cutting_pattern',
    'hardware_specification',
    'thread_specification',
    'packaging_sop',
    'qc_checklist',
  ]) {
    assert.ok(EVIDENCE_TYPES.includes(type));
  }
});

test('version records remain immutable even when their content hash is recomputed', async () => {
  const fixture = createFixture();
  await writeCompleteFixture(fixture);
  const revision = fixture.store.read().storeRevision;
  await assert.rejects(
    fixture.store.mutate((draft) => {
      draft.productVersions[0].captureReason = 'Attempted rewrite';
      draft.productVersions[0].contentHash = computeProductVersionHash(draft.productVersions[0]);
      return { store: draft, value: null };
    }, revision),
    /immutable record was changed/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('evidence and history records cannot be rewritten or removed', async () => {
  const fixture = createFixture();
  await writeCompleteFixture(fixture);
  const revision = fixture.store.read().storeRevision;
  await assert.rejects(
    fixture.store.mutate((draft) => {
      draft.evidenceRecords[0].title = 'Rewritten title';
      draft.evidenceRecords[0].recordHash = computeEvidenceRecordHash(draft.evidenceRecords[0]);
      return { store: draft, value: null };
    }, revision),
    /evidence set is invalid|immutable record was changed/,
  );
  await assert.rejects(
    fixture.store.mutate((draft) => {
      draft.productHistoryEvents = [];
      return { store: draft, value: null };
    }, revision),
    /append-only/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('history events form a per-product append-only hash chain', async () => {
  const fixture = createFixture();
  const first = await writeCompleteFixture(fixture);
  const revision = first.store.storeRevision;
  const result = await fixture.store.mutate((draft) => {
    const prior = draft.productHistoryEvents[0];
    const event = historyEvent(first.value.version, first.value.evidence, {
      sequence: 2,
      aggregateType: 'evidence_link',
      aggregateId: first.value.link.id,
      action: 'evidence_linked',
      previousEventHash: prior.eventHash,
      afterHash: first.value.link.linkHash,
      changedFields: ['evidenceLinks'],
      timestamp: '2026-07-26T00:01:00.000Z',
    });
    draft.productHistoryEvents.push(event);
    return { store: draft, value: event };
  }, revision);
  assert.equal(result.store.productHistoryEvents.length, 2);
  assert.equal(result.value.previousEventHash, first.value.event.eventHash);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('versions reject embedded AI payloads and unrecognized reference fields', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const version = productVersion(foundation, []);
      version.generatedListing = 'Not allowed';
      draft.productVersions.push(version);
      return { store: draft, value: null };
    }, 0),
    /unsupported data/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('Phase 3B.3C introduces empty release primitives without mutating earlier records', () => {
  const fixture = createFixture();
  const current = fixture.store.read();
  assert.deepEqual(current.approvalPolicies, []);
  assert.deepEqual(current.approvalRequests, []);
  assert.deepEqual(current.approvalDecisions, []);
  assert.deepEqual(current.productReleases, []);
  assert.deepEqual(current.releaseLifecycleEvents, []);
  assert.deepEqual(current.knowledgeLocks, []);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});
