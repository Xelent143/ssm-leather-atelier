const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  AI_MEDIA_STUDIO_SCHEMA_VERSION,
  createAiMediaStudioStore,
  deterministicAssetId,
  migrateStore,
} = require('../ai-media-studio-store');
const { createAiMediaStudioService } = require('../ai-media-studio-service');
const { createProviderRegistry } = require('../ai-media-provider-adapters');

function fixture({ owner = true, permissions = {}, env = {} } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-media-v2-'));
  const store = createAiMediaStudioStore({ dataDir });
  const user = { id: owner ? 'owner-v2' : 'editor-v2', accountType: owner ? 'owner' : 'user', status: 'active' };
  const product = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    productUuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Brown Leather Western Vest',
    organization: { productType: 'Western Vest', category: 'Western Vests', color: 'Brown' },
    merchantAttributes: { color: 'Brown', material: 'Leather' },
    metafields: { leatherType: 'Cowhide' },
    media: [
      { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', path: '/assets/front.png', role: 'Front', title: 'Front' },
      { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', path: '/assets/back.png', role: 'Back', title: 'Back' },
      { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', path: '/assets/lifestyle.png', role: 'Lifestyle', title: 'Lifestyle' },
    ],
  };
  const service = createAiMediaStudioService({
    store,
    env,
    identity: { findById: (id) => id === user.id ? user : null },
    productStore: { read: () => ({ products: [structuredClone(product)] }) },
    authorizeUser: (candidate, module, action) => Boolean(permissions[`${module}:${action}`]),
  });
  return {
    dataDir, product, service, store,
    session: { actorType: 'named_user', userId: user.id },
  };
}

async function savedPlan(current) {
  return current.service.save(current.session, {
    productId: current.product.id,
    referenceMediaIds: current.product.media.map((item) => item.id),
    roleAssignments: Object.fromEntries(current.product.media.map((item) => [item.id, item.role])),
    designLocks: ['Stitching', 'Panels', 'Zippers', 'Pockets', 'Hardware', 'Logo', 'Leather Texture', 'Shape', 'Color'],
  });
}

test('V1 stores migrate in memory to schema v2 with deterministic asset identity', () => {
  const timestamp = new Date().toISOString();
  const migrated = migrateStore({
    schemaVersion: 1, storeRevision: 3, createdAt: timestamp, updatedAt: timestamp,
    auditEvents: [],
    plans: [{
      productId: 'product-1', productUuid: 'uuid-1', selectedAssets: ['Ghost Mannequin', 'Left'],
      referenceMediaIds: ['media-1'], designLocks: ['Color'], instructions: 'Keep brown.',
      createdAt: timestamp, updatedAt: timestamp,
    }],
  }, () => Date.now());
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.plans[0].assets[0].assetType, 'Ghost Mannequin Front');
  assert.equal(migrated.plans[0].assets[1].assetType, 'Left Side');
  assert.equal(migrated.plans[0].assets[0].assetId,
    deterministicAssetId('product-1', 'Ghost Mannequin Front'));
});

test('mixed-source plan preserves stable asset ids while providers change', async () => {
  const current = fixture();
  await savedPlan(current);
  let workspace = current.service.workspace(current.session, current.product.id);
  const front = workspace.plan.assets.find((item) => item.assetType === 'Front');
  const lifestyle = workspace.plan.assets.find((item) => item.assetType === 'Lifestyle');
  let changed = await current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: front.assetId,
    expectedRevision: workspace.storeRevision, source: 'uploaded',
    productReferenceMediaIds: [current.product.media[0].id],
  });
  changed = await current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: lifestyle.assetId,
    expectedRevision: changed.workspace.storeRevision, source: 'google_flow',
    productReferenceMediaIds: [current.product.media[0].id, current.product.media[1].id],
    styleReferenceMediaIds: [current.product.media[2].id],
  });
  assert.equal(changed.asset.assetId, lifestyle.assetId);
  assert.equal(changed.asset.status, 'source_selected');
  assert.deepEqual(changed.asset.productReferenceMediaIds.length, 2);
});

test('OpenAI status is privacy-safe and execution remains disabled', () => {
  const registry = createProviderRegistry({
    env: { OPENAI_API_KEY: 'test-secret-never-returned' },
    settings: { openai: { enabled: true } },
  });
  const provider = registry.get('openai');
  assert.equal(provider.status, 'Configured — Execution Disabled');
  assert.equal(provider.executionSupported, false);
  assert.equal(JSON.stringify(provider).includes('test-secret-never-returned'), false);
  assert.throws(() => registry.execute(), (error) => error.code === 'PROVIDER_EXECUTION_DISABLED');
});

test('Google Flow builds a manual prompt package with locks and separated references', async () => {
  const current = fixture();
  await savedPlan(current);
  let workspace = current.service.workspace(current.session, current.product.id);
  const asset = workspace.plan.assets.find((item) => item.assetType === 'Lifestyle');
  let changed = await current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: workspace.storeRevision, source: 'google_flow',
    productReferenceMediaIds: [current.product.media[0].id],
    styleReferenceMediaIds: [current.product.media[2].id],
    designLocks: ['Stitching', 'Color', 'Logo'],
    instructions: 'Premium USA lifestyle composition.',
  });
  changed = await current.service.generatePrompt(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: changed.workspace.storeRevision,
  });
  assert.equal(changed.asset.status, 'prompt_ready');
  assert.equal(changed.asset.promptPackage.providerMode, 'manual_prompt_workflow');
  assert.match(changed.asset.promptPackage.negativeConstraints.join(' '), /Preserve exactly/);
  assert.match(changed.asset.promptPackage.providerNotes, /Manual Prompt Workflow/);
  assert.deepEqual(changed.asset.promptPackage.productReferenceMediaIds, [current.product.media[0].id]);
  assert.deepEqual(changed.asset.promptPackage.styleReferenceMediaIds, [current.product.media[2].id]);
});

test('manual result requires explicit approval and rejection is audited', async () => {
  const current = fixture();
  await savedPlan(current);
  let workspace = current.service.workspace(current.session, current.product.id);
  const asset = workspace.plan.assets.find((item) => item.assetType === 'Infographic');
  let changed = await current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: workspace.storeRevision, source: 'google_flow',
  });
  changed = await current.service.attachResult(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: changed.workspace.storeRevision, mediaId: current.product.media[2].id,
  });
  assert.equal(changed.asset.status, 'awaiting_approval');
  assert.equal(changed.asset.approvedMediaId, null);
  changed = await current.service.rejectAsset(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: changed.workspace.storeRevision, reason: 'Design mismatch',
  });
  assert.equal(changed.asset.status, 'rejected');
  assert.ok(current.service.assetHistory(current.session, current.product.id, asset.assetId)
    .some((event) => event.action === 'media_asset_reject'));
});

test('approved uploaded media is explicit and restart-safe', async () => {
  const current = fixture();
  await savedPlan(current);
  let workspace = current.service.workspace(current.session, current.product.id);
  const asset = workspace.plan.assets.find((item) => item.assetType === 'Front');
  let changed = await current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: workspace.storeRevision, source: 'uploaded',
    productReferenceMediaIds: [current.product.media[0].id],
  });
  changed = await current.service.approveAsset(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: changed.workspace.storeRevision,
  });
  assert.equal(changed.asset.approvedMediaId, current.product.media[0].id);
  assert.equal(changed.asset.status, 'approved');
  const reopened = createAiMediaStudioStore({ dataDir: current.dataDir });
  assert.equal(reopened.read().plans[0].assets.find((item) => item.assetId === asset.assetId).status, 'approved');
});

test('provider settings are Owner-only and never accept secret values', async () => {
  const editor = fixture({
    owner: false,
    permissions: { 'ai:view': true, 'ai:edit': true, 'ai:create': true },
  });
  await assert.rejects(() => editor.service.updateProviderSettings(editor.session, {
    openai: { enabled: true, apiKey: 'must-not-persist' },
  }), /Owner/);
  const owner = fixture();
  const updated = await owner.service.updateProviderSettings(owner.session, {
    expectedRevision: 0,
    openai: { enabled: true, apiKey: 'must-not-persist' },
    googleFlow: { enabled: true },
  });
  assert.equal(JSON.stringify(owner.store.read()).includes('must-not-persist'), false);
  assert.equal(updated.providers.find((item) => item.id === 'openai').status, 'Not Configured');
});

test('asset approval obeys permission policy and revision conflicts remain enforced', async () => {
  const current = fixture({
    owner: false,
    permissions: { 'ai:view': true, 'ai:edit': true, 'ai:create': true },
  });
  await savedPlan(current);
  const workspace = current.service.workspace(current.session, current.product.id);
  const asset = workspace.plan.assets.find((item) => item.assetType === 'Front');
  await assert.rejects(() => current.service.approveAsset(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: workspace.storeRevision,
  }), /permission/);
  await current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: workspace.storeRevision, source: 'uploaded',
    productReferenceMediaIds: [current.product.media[0].id],
  });
  await assert.rejects(() => current.service.updateAssetSource(current.session, {
    productId: current.product.id, assetId: asset.assetId,
    expectedRevision: workspace.storeRevision, source: 'none',
  }), /changed/);
});

test('cost estimates are provider-neutral placeholders and never block uploaded media', async () => {
  const current = fixture();
  await savedPlan(current);
  const workspace = current.service.workspace(current.session, current.product.id);
  assert.ok(workspace.costEstimate.items.some((item) => item.label === '$0.00'));
  const registry = createProviderRegistry();
  assert.match(registry.estimate('google_flow').label, /External\/manual/);
  assert.match(registry.estimate('openai').label, /Unavailable/);
});

test('schema version and UI expose the provider foundation without live generation', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'product-editor-v2-ui.js'), 'utf8');
  assert.equal(AI_MEDIA_STUDIO_SCHEMA_VERSION, 2);
  assert.match(ui, /Use Uploaded Image/);
  assert.match(ui, /Generate with OpenAI/);
  assert.match(ui, /Prepare for Google Flow/);
  assert.match(ui, /Manual Prompt Workflow/);
  assert.doesNotMatch(ui, /Execute OpenAI Generation/);
});
