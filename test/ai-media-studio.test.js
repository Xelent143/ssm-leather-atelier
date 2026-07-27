const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createAiMediaStudioStore } = require('../ai-media-studio-store');
const { createAiMediaStudioService } = require('../ai-media-studio-service');
const {
  ASSET_TYPES,
  DESIGN_LOCKS,
  IMAGE_SOURCE_MODES,
  REFERENCE_IMAGE_ROLES,
  validatePlanInput,
} = require('../ai-media-studio-schema');

function harness({ owner = true, permissions = {} } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-media-studio-'));
  const store = createAiMediaStudioStore({ dataDir });
  const user = {
    id: owner ? 'owner-1' : 'editor-1',
    accountType: owner ? 'owner' : 'user',
    status: 'active',
  };
  const product = {
    id: '11111111-1111-4111-8111-111111111111',
    productUuid: '22222222-2222-4222-8222-222222222222',
    organization: { productType: 'Western Vest', color: 'Brown' },
    merchantAttributes: { color: 'Brown' },
    metafields: {},
    media: [
      { id: '33333333-3333-4333-8333-333333333333', path: '/assets/front.png', role: 'Front', title: 'Front' },
      { id: '44444444-4444-4444-8444-444444444444', path: '/assets/back.png', role: 'Back', title: 'Back' },
    ],
  };
  const identity = { findById: (id) => id === user.id ? user : null };
  const productStore = { read: () => ({ products: [structuredClone(product)] }) };
  const service = createAiMediaStudioService({
    store, identity, productStore,
    authorizeUser: (candidate, module, action) => Boolean(permissions[`${module}:${action}`]),
  });
  return {
    dataDir, product, service, store,
    session: { actorType: 'named_user', userId: user.id },
  };
}

test('schema defines the three source modes, approved roles, assets, and design locks', () => {
  assert.deepEqual(IMAGE_SOURCE_MODES, ['uploaded_only', 'hybrid', 'ai_generated']);
  assert.ok(REFERENCE_IMAGE_ROLES.includes('Size Chart'));
  assert.ok(ASSET_TYPES.includes('Ghost Mannequin'));
  assert.ok(ASSET_TYPES.includes('Video Prompt'));
  assert.ok(DESIGN_LOCKS.includes('Leather Texture'));
});

test('plan validation rejects unsupported values and unknown media references', () => {
  const result = validatePlanInput({
    mode: 'hybrid',
    referenceMediaIds: ['known', 'unknown', 'known'],
    roleAssignments: { known: 'Front', unknown: 'Back' },
    selectedAssets: ['Front', 'Executable Provider Call'],
    designLocks: ['Color', 'Secret'],
    instructions: 'Keep exact leather color.',
    unsupported: 'rejected',
  }, ['known']);
  assert.deepEqual(result.referenceMediaIds, ['known']);
  assert.deepEqual(result.roleAssignments, { known: 'Front' });
  assert.deepEqual(result.selectedAssets, ['Front']);
  assert.deepEqual(result.designLocks, ['Color']);
  assert.equal(result.unsupported, undefined);
});

test('Owner can persist a versioned hybrid plan with no provider integration', async () => {
  const { service, session, product, store } = harness();
  const saved = await service.save(session, {
    productId: product.id,
    mode: 'hybrid',
    referenceMediaIds: product.media.map((item) => item.id),
    roleAssignments: Object.fromEntries(product.media.map((item) => [item.id, item.role])),
    selectedAssets: ['Ghost Mannequin', 'Lifestyle', 'Social Banner'],
    designLocks: ['Stitching', 'Pockets', 'Color'],
    instructions: 'Keep exact stitching and brown leather color.',
  });
  assert.equal(saved.plan.revision, 1);
  assert.equal(saved.workspace.provider.integrated, false);
  assert.equal(saved.workspace.provider.status, 'not_integrated');
  assert.equal(store.read().auditEvents[0].action, 'media_plan_saved');
  assert.equal(fs.statSync(store.paths.storePath).mode & 0o777, 0o600);
});

test('coverage analysis is metadata-only, restart-safe, and makes no image/provider call', async () => {
  const { service, session, product, store, dataDir } = harness();
  const saved = await service.save(session, {
    productId: product.id,
    mode: 'uploaded_only',
    referenceMediaIds: product.media.map((item) => item.id),
    roleAssignments: Object.fromEntries(product.media.map((item) => [item.id, item.role])),
    selectedAssets: [],
    designLocks: DESIGN_LOCKS,
  });
  const analyzed = await service.analyze(session, {
    productId: product.id,
    expectedRevision: saved.workspace.storeRevision,
  });
  assert.equal(analyzed.plan.analysis.analysisType, 'metadata_only');
  assert.equal(analyzed.plan.analysis.detectedColor, 'Brown');
  assert.deepEqual(analyzed.plan.analysis.detectedAngles, ['Front', 'Back']);
  assert.ok(analyzed.plan.analysis.missingAngles.includes('Interior'));
  assert.match(analyzed.plan.analysis.notice, /No pixels were analyzed/);

  const reopened = createAiMediaStudioStore({ dataDir });
  assert.equal(reopened.read().plans[0].id, store.read().plans[0].id);
  assert.equal(reopened.read().plans[0].analysis.coveragePercentage, 25);
});

test('legacy side-role labels normalize into the permanent reference-role contract', () => {
  const { service, session, product } = harness();
  product.media[0].role = 'Left Side';
  product.media[1].role = 'Right Side';
  const workspace = service.workspace(session, product.id);
  assert.equal(workspace.plan.roleAssignments[product.media[0].id], 'Left');
  assert.equal(workspace.plan.roleAssignments[product.media[1].id], 'Right');
});

test('revision conflicts prevent silent Media Studio overwrites', async () => {
  const { service, session, product } = harness();
  await service.save(session, {
    productId: product.id,
    expectedRevision: 0,
    referenceMediaIds: [product.media[0].id],
    roleAssignments: { [product.media[0].id]: 'Front' },
  });
  await assert.rejects(() => service.save(session, {
    productId: product.id,
    expectedRevision: 0,
    referenceMediaIds: [product.media[1].id],
    roleAssignments: { [product.media[1].id]: 'Back' },
  }), /changed/);
});

test('Listing Editor can prepare workflow but cannot configure a provider', async () => {
  const { service, session, product } = harness({
    owner: false,
    permissions: { 'ai:view': true, 'ai:edit': true, 'ai:create': true },
  });
  const workspace = service.workspace(session, product.id);
  assert.equal(workspace.permissions.prepare, true);
  assert.equal(workspace.permissions.analyze, true);
  assert.equal(workspace.permissions.configureProvider, false);
  await service.save(session, {
    productId: product.id,
    referenceMediaIds: [product.media[0].id],
    roleAssignments: { [product.media[0].id]: 'Front' },
  });
});

test('roles without AI preparation permission are denied server-side', async () => {
  const { service, session, product } = harness({
    owner: false,
    permissions: { 'ai:view': true },
  });
  assert.equal(service.workspace(session, product.id).permissions.prepare, false);
  await assert.rejects(() => service.save(session, {
    productId: product.id,
    referenceMediaIds: [],
  }), /permission/);
});

test('Product Editor renders complete workflow controls without generation actions', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'product-editor-v2-ui.js'), 'utf8');
  assert.match(source, /AI Media Studio v1/);
  assert.match(source, /Uploaded Images Only/);
  assert.match(source, /Hybrid/);
  assert.match(source, /AI Generated/);
  assert.match(source, /Analyze Images/);
  assert.match(source, /Ghost Mannequin/);
  assert.match(source, /Design lock/);
  assert.match(source, /No image provider connected/);
  assert.match(source, /no image API was called/i);
  assert.doesNotMatch(source, /Generate Images Now/);
});
