const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createAiVisionStore } = require('../ai-vision-store');
const { createAiVisionService } = require('../ai-vision-service');
const {
  createOpenAiVisionAdapter,
  createVisionProviderRegistry,
} = require('../ai-vision-providers');
const { confidence, validateDraftInput } = require('../ai-vision-schema');

function fixture({ owner = true, permissions = {}, title = 'Brown Leather Western Vest' } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-vision-'));
  const store = createAiVisionStore({ dataDir });
  const user = { id: owner ? 'vision-owner' : 'vision-editor', accountType: owner ? 'owner' : 'user', status: 'active' };
  const product = {
    id: '11111111-1111-4111-8111-111111111111',
    productUuid: '22222222-2222-4222-8222-222222222222',
    title,
    organization: { productType: 'Western Vest', category: 'Leather Vests', color: 'Brown' },
    classification: {
      gender: { value: 'male', status: 'confirmed' },
      ageGroup: { value: 'adult', status: 'confirmed' },
    },
    merchantAttributes: { color: 'Brown', material: 'Cowhide' },
    media: [
      { id: '33333333-3333-4333-8333-333333333333', path: '/assets/vest-front.png', role: 'Front', title: 'Vest front' },
      { id: '44444444-4444-4444-8444-444444444444', path: '/assets/vest-back.png', role: 'Back', title: 'Vest back' },
      { id: '55555555-5555-4555-8555-555555555555', path: '/assets/vest-blur.png', role: 'Detail', title: 'blur hardware detail' },
    ],
  };
  const service = createAiVisionService({
    store,
    identity: { findById: (id) => id === user.id ? user : null },
    productStore: { read: () => ({ products: [structuredClone(product)] }) },
    plmStore: { read: () => ({ storeRevision: 12 }) },
    authorizeUser: (candidate, module, action) => Boolean(permissions[`${module}:${action}`]),
    env: { NODE_ENV: 'test', OPENAI_API_KEY: 'must-never-be-returned' },
  });
  return { dataDir, product, service, session: { actorType: 'named_user', userId: user.id }, store };
}

async function analyzed(current, providerId = 'fake_test_provider') {
  let result = await current.service.createDraft(current.session, {
    productId: current.product.id,
    providerId,
    selectedMediaIds: current.product.media.map((item) => item.id),
    imageRoles: Object.fromEntries(current.product.media.map((item) => [item.id, item.role])),
    expectedRevision: 0,
  });
  result = await current.service.run(current.session, {
    productId: current.product.id,
    analysisId: result.analysis.id,
    expectedRevision: result.workspace.storeRevision,
  });
  return result;
}

test('Vision store is atomic, restart-safe, and rejects stale revisions', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-vision-store-'));
  const store = createAiVisionStore({ dataDir });
  await store.mutate(async (state) => {
    state.auditEvents.push({ id: 'event-1' });
    return { store: state, value: true };
  }, 0);
  await assert.rejects(() => store.mutate(async (state) => ({ store: state }), 0), /changed/);
  const reopened = createAiVisionStore({ dataDir });
  assert.equal(reopened.read().storeRevision, 1);
  assert.equal(reopened.read().auditEvents[0].id, 'event-1');
  assert.equal(fs.statSync(reopened.paths.storePath).mode & 0o777, 0o600);
});

test('schema normalizes confidence and excludes unknown media IDs', () => {
  assert.deepEqual(confidence(84), { score: 84, label: 'High' });
  assert.deepEqual(confidence(-10), { score: 0, label: 'Unknown' });
  const valid = validateDraftInput({
    providerId: 'fake_test_provider',
    selectedMediaIds: ['valid', 'invalid', 'valid'],
    imageRoles: { valid: 'Front' },
  }, ['valid']);
  assert.deepEqual(valid.selectedMediaIds, ['valid']);
  assert.equal(valid.imageRoles.valid, 'Front');
});

test('fake provider performs deterministic multi-image analysis without external access', async () => {
  const current = fixture();
  const result = await analyzed(current);
  assert.equal(result.analysis.providerId, 'fake_test_provider');
  assert.equal(result.analysis.suggestedRoles[current.product.media[0].id], 'Front');
  assert.equal(result.analysis.suggestedRoles[current.product.media[1].id], 'Back');
  assert.equal(result.analysis.facts.find((item) => item.key === 'primaryColor').value, 'Brown');
  assert.equal(result.analysis.facts.find((item) => item.key === 'material').needsConfirmation, true);
  assert.equal(result.analysis.facts.find((item) => item.key === 'gender').status, 'unknown');
  assert.ok(result.analysis.coverage.missing.includes('Interior'));
  assert.equal(result.analysis.quality.find((item) => item.mediaId === current.product.media[2].id).status,
    'Needs Improvement');
});

test('metadata-only provider keeps provenance distinct and creates no visual claims', async () => {
  const current = fixture();
  const result = await analyzed(current, 'metadata_only');
  assert.ok(result.analysis.facts.every((item) => item.source === 'metadata_only'));
  assert.equal(result.analysis.facts.find((item) => item.key === 'productType').value, 'Western Vest');
  assert.equal(result.analysis.quality[0].status, 'Unknown');
});

test('OpenAI adapter is privacy-safe and execution remains disabled', () => {
  const adapter = createOpenAiVisionAdapter({ env: { OPENAI_API_KEY: 'never-return-this-value' } });
  assert.equal(adapter.status, 'Configured but Execution Disabled');
  assert.equal(adapter.executionEnabled, false);
  assert.equal(JSON.stringify(adapter).includes('never-return-this-value'), false);
  assert.throws(() => adapter.analyze(), (error) => error.code === 'VISION_PROVIDER_EXECUTION_DISABLED');
  const listed = createVisionProviderRegistry({ env: { NODE_ENV: 'production', OPENAI_API_KEY: 'hidden' } }).list();
  assert.equal(JSON.stringify(listed).includes('hidden'), false);
  assert.equal(listed.find((item) => item.id === 'fake_test_provider').available, false);
});

test('facts require approval and rejected facts cannot enter the Product DNA overlay', async () => {
  const current = fixture();
  let result = await analyzed(current, 'metadata_only');
  await assert.rejects(() => current.service.applyToProductDna(current.session, {
    productId: current.product.id, analysisId: result.analysis.id,
    expectedRevision: result.workspace.storeRevision,
  }), /Approve at least one fact/);
  const productType = result.analysis.facts.find((item) => item.key === 'productType');
  result = await current.service.approveFact(current.session, {
    productId: current.product.id, analysisId: result.analysis.id, factId: productType.factId,
    expectedRevision: result.workspace.storeRevision,
  });
  const color = result.analysis.facts.find((item) => item.key === 'primaryColor');
  result = await current.service.rejectFact(current.session, {
    productId: current.product.id, analysisId: result.analysis.id, factId: color.factId,
    expectedRevision: result.workspace.storeRevision,
  });
  const applied = await current.service.applyToProductDna(current.session, {
    productId: current.product.id, analysisId: result.analysis.id,
    expectedRevision: result.workspace.storeRevision,
  });
  assert.equal(applied.application.appliedFacts.productType.value, 'Western Vest');
  assert.equal(applied.application.appliedFacts.primaryColor, undefined);
  assert.equal(applied.application.productDnaRevision, 12);
  assert.equal(current.store.read().productDnaApplications.length, 1);
});

test('corrected facts and conflict resolution retain evidence and history', async () => {
  const current = fixture({ title: 'Conflict Brown Leather Vest' });
  current.product.media[1].title = 'conflict black back';
  let result = await analyzed(current);
  const material = result.analysis.facts.find((item) => item.key === 'material');
  result = await current.service.correctFact(current.session, {
    productId: current.product.id, analysisId: result.analysis.id, factId: material.factId,
    value: 'Cowhide', expectedRevision: result.workspace.storeRevision,
  });
  assert.equal(result.analysis.facts.find((item) => item.factId === material.factId).userConfirmedValue, 'Cowhide');
  const conflict = result.analysis.conflicts[0];
  result = await current.service.resolveConflict(current.session, {
    productId: current.product.id, analysisId: result.analysis.id, conflictId: conflict.conflictId,
    choice: 'keep_trusted', note: 'Trusted Product DNA remains authoritative.',
    expectedRevision: result.workspace.storeRevision,
  });
  assert.equal(result.analysis.conflicts[0].status, 'resolved');
  assert.equal(result.analysis.resolutions.length, 1);
  assert.ok(current.service.auditHistory(current.session, current.product.id)
    .some((event) => event.action === 'vision_conflict_resolved'));
});

test('trusted merchant values take precedence over unapproved observations', async () => {
  const current = fixture();
  const result = await analyzed(current);
  assert.equal(result.workspace.merchantReadiness.values.gender, 'male');
  assert.equal(result.workspace.merchantReadiness.values.ageGroup, 'adult');
  assert.equal(result.workspace.merchantReadiness.values.material, 'Cowhide');
  assert.equal(result.workspace.merchantReadiness.values.color, 'Brown');
});

test('approved coverage is explicitly shared with Media Studio and Copilot projection', async () => {
  const current = fixture();
  let result = await analyzed(current);
  const analysisId = result.analysis.id;
  result = await current.service.updateMediaCoverage(current.session, {
    productId: current.product.id, analysisId,
    expectedRevision: result.workspace.storeRevision,
  });
  const projection = current.service.integrationProjection(current.product.id);
  assert.equal(projection.coverage.sourceAnalysisId, analysisId);
  assert.ok(projection.coverage.confirmed.includes('Front'));
  assert.ok(projection.missingInformation.includes('material'));
});

test('Listing Editor permissions allow preparation but block approval and Product DNA application', async () => {
  const current = fixture({
    owner: false,
    permissions: { 'ai:view': true, 'ai:edit': true, 'ai:create': true },
  });
  let result = await current.service.createDraft(current.session, {
    productId: current.product.id, providerId: 'metadata_only',
    selectedMediaIds: [current.product.media[0].id],
    imageRoles: { [current.product.media[0].id]: 'Front' }, expectedRevision: 0,
  });
  result = await current.service.run(current.session, {
    productId: current.product.id, analysisId: result.analysis.id,
    expectedRevision: result.workspace.storeRevision,
  });
  await assert.rejects(() => current.service.approveFact(current.session, {
    productId: current.product.id, analysisId: result.analysis.id,
    factId: result.analysis.facts[0].factId, expectedRevision: result.workspace.storeRevision,
  }), /permission/);
  await assert.rejects(() => current.service.applyToProductDna(current.session, {
    productId: current.product.id, analysisId: result.analysis.id,
    expectedRevision: result.workspace.storeRevision,
  }), /permission/);
});

test('failed or disabled analysis preserves completed analysis history', async () => {
  const current = fixture();
  const completed = await analyzed(current, 'metadata_only');
  const next = await current.service.createDraft(current.session, {
    productId: current.product.id, providerId: 'openai_vision',
    selectedMediaIds: [current.product.media[0].id],
    imageRoles: { [current.product.media[0].id]: 'Front' },
    expectedRevision: completed.workspace.storeRevision,
  });
  await assert.rejects(() => current.service.run(current.session, {
    productId: current.product.id, analysisId: next.analysis.id,
    expectedRevision: next.workspace.storeRevision,
  }), (error) => error.code === 'VISION_PROVIDER_EXECUTION_DISABLED');
  const history = current.service.workspace(current.session, current.product.id).history;
  assert.equal(history.length, 2);
  assert.ok(history.some((item) => item.status === completed.analysis.status));
});

test('UI and server expose review workflow without generation or paid provider execution', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'product-editor-v2-ui.js'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(ui, /AI Vision/);
  assert.match(ui, /Apply Approved Facts to Product DNA/);
  assert.match(ui, /Update Media Coverage Plan/);
  assert.match(ui, /Needs Confirmation/);
  assert.match(server, /api\\\/admin\\\/ai-vision/);
  assert.doesNotMatch(ui, /Generate Vision Image/);
});
