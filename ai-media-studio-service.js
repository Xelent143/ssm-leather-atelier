const crypto = require('crypto');
const {
  ASSET_SOURCES,
  ASSET_TYPES,
  DESIGN_LOCKS,
  IMAGE_SOURCE_MODES,
  REFERENCE_IMAGE_ROLES,
  validatePlanInput,
} = require('./ai-media-studio-schema');
const { createProviderRegistry } = require('./ai-media-provider-adapters');
const { deterministicAssetId } = require('./ai-media-studio-store');

const COVERAGE_ROLES = ['Front', 'Back', 'Left', 'Right', 'Interior', 'Detail', 'Hardware', 'Lifestyle'];

function normalizedReferenceRole(value) {
  const aliases = {
    'Left Side': 'Left',
    'Right Side': 'Right',
  };
  const role = aliases[value] || value;
  return REFERENCE_IMAGE_ROLES.includes(role) ? role : 'Unknown';
}

function createAiMediaStudioService(options = {}) {
  const {
    store,
    identity,
    productStore,
    authorizeUser = () => false,
    env = process.env,
    now = () => Date.now(),
  } = options;

  function userFor(session) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.status !== 'active') {
      throw Object.assign(new Error('Named user authentication is required.'), { code: 'FORBIDDEN' });
    }
    return user;
  }

  function allowed(user, action) {
    if (user.accountType === 'owner') return true;
    const mapping = {
      view: ['ai', 'view'],
      prepare: ['ai', 'edit'],
      analyze: ['ai', 'create'],
      approve: ['ai', 'approve'],
    };
    const permission = mapping[action];
    return Boolean(permission && authorizeUser(user, permission[0], permission[1]));
  }

  function requirePermission(user, action) {
    if (!allowed(user, action)) {
      throw Object.assign(new Error('You do not have permission for this Media Studio action.'), {
        code: 'FORBIDDEN',
      });
    }
  }

  function productFor(productId) {
    const product = productStore.read().products.find((item) =>
      item.id === productId || item.productUuid === productId);
    if (!product) throw Object.assign(new Error('Product Editor draft was not found.'), { code: 'NOT_FOUND' });
    return product;
  }

  function defaultPlan(product) {
    const timestamp = new Date(now()).toISOString();
    return {
      id: null,
      productId: product.id,
      productUuid: product.productUuid,
      revision: 0,
      state: product.media?.length ? 'ready' : 'draft',
      mode: 'uploaded_only',
      referenceMediaIds: (product.media || []).map((item) => item.id),
      roleAssignments: Object.fromEntries((product.media || []).map((item) => [
        item.id,
        normalizedReferenceRole(item.role),
      ])),
      selectedAssets: [],
      assets: ASSET_TYPES.map((assetType) => ({
        assetId: deterministicAssetId(product.id, assetType),
        productId: product.id,
        assetType,
        source: 'uploaded',
        provider: 'uploaded',
        status: 'planned',
        productReferenceMediaIds: [],
        styleReferenceMediaIds: [],
        designLocks: [...DESIGN_LOCKS],
        instructions: '',
        promptPackage: null,
        generatedMediaId: null,
        approvedMediaId: null,
        approval: null,
        replacedAssetReference: null,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      designLocks: [...DESIGN_LOCKS],
      instructions: '',
      analysis: null,
      estimatedCost: {
        status: 'placeholder',
        currency: 'USD',
        amount: null,
        message: 'Available after an image-generation provider is approved.',
      },
      createdAt: null,
      updatedAt: null,
      updatedBy: null,
    };
  }

  function completeAssets(product, plan) {
    const existing = Array.isArray(plan.assets) ? plan.assets : [];
    const byType = new Map(existing.map((asset) => [asset.assetType, asset]));
    const defaults = defaultPlan(product).assets;
    return ASSET_TYPES.map((assetType) => byType.get(assetType) ||
      defaults.find((asset) => asset.assetType === assetType));
  }

  function planFor(state, product) {
    const plan = state.plans.find((item) => item.productId === product.id) || defaultPlan(product);
    return { ...plan, assets: completeAssets(product, plan) };
  }

  function safeWorkspace(user, product, state) {
    const plan = planFor(state, product);
    const registry = createProviderRegistry({ settings: state.providerSettings, env });
    return {
      schemaVersion: 2,
      storeRevision: state.storeRevision,
      productId: product.id,
      plan,
      referenceMedia: (product.media || []).map((item) => ({
        id: item.id,
        path: item.path,
        title: item.title || item.originalName || item.role || 'Product image',
        currentRole: item.role || 'Unknown',
        featured: Boolean(item.featured),
      })),
      constants: {
        sourceModes: IMAGE_SOURCE_MODES,
        referenceRoles: REFERENCE_IMAGE_ROLES,
        assetTypes: ASSET_TYPES,
        designLocks: DESIGN_LOCKS,
      },
      permissions: {
        view: allowed(user, 'view'),
        prepare: allowed(user, 'prepare'),
        analyze: allowed(user, 'analyze'),
        approve: allowed(user, 'approve'),
        configureProvider: user.accountType === 'owner',
      },
      providers: registry.list(),
      provider: {
        integrated: false, status: 'not_integrated',
        message: 'Provider planning is available. Automated image execution remains disabled.',
      },
      costEstimate: estimatePlan(plan, registry),
    };
  }

  function estimatePlan(plan, registry) {
    const assets = completeAssets({ id: plan.productId }, plan);
    const items = assets.map((asset) => ({
      assetId: asset.assetId,
      assetType: asset.assetType,
      provider: asset.provider,
      ...registry.estimate(asset.provider),
    }));
    const byProvider = Object.values(items.reduce((groups, item) => {
      groups[item.provider] ||= { provider: item.provider, count: 0, amount: 0, tracked: true };
      groups[item.provider].count += 1;
      if (item.amount == null) groups[item.provider].tracked = false;
      else groups[item.provider].amount += item.amount;
      return groups;
    }, {}));
    return {
      items,
      byProvider,
      total: items.every((item) => item.amount != null)
        ? { amount: items.reduce((sum, item) => sum + item.amount, 0), currency: 'USD' }
        : { amount: null, currency: null, label: 'Contains untracked or unavailable provider costs' },
    };
  }

  function workspace(session, productId) {
    const user = userFor(session);
    requirePermission(user, 'view');
    const product = productFor(productId);
    return safeWorkspace(user, product, store.read());
  }

  async function save(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'prepare');
    const product = productFor(input.productId);
    const mediaIds = (product.media || []).map((item) => item.id);
    const validated = validatePlanInput(input, mediaIds);
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const existing = state.plans.find((item) => item.productId === product.id);
      const plan = {
        ...(existing || defaultPlan(product)),
        ...validated,
        id: existing?.id || crypto.randomUUID(),
        productId: product.id,
        productUuid: product.productUuid,
        revision: Number(existing?.revision || 0) + 1,
        state: validated.referenceMediaIds.length ? 'ready' : 'draft',
        analysis: existing?.analysis || null,
        createdAt: existing?.createdAt || timestamp,
        updatedAt: timestamp,
        updatedBy: user.id,
      };
      plan.assets = completeAssets(product, plan);
      const index = state.plans.findIndex((item) => item.productId === product.id);
      if (index >= 0) state.plans[index] = plan;
      else state.plans.push(plan);
      state.auditEvents.push({
        id: crypto.randomUUID(),
        timestamp,
        action: 'media_plan_saved',
        actorId: user.id,
        productId: product.id,
        planId: plan.id,
        planRevision: plan.revision,
        changedFields: Object.keys(validated),
      });
      return { store: state, value: plan };
    }, input.expectedRevision);
    return {
      plan: result.value,
      workspace: safeWorkspace(user, product, result.store),
    };
  }

  function assetFor(plan, assetId) {
    const asset = plan.assets.find((item) => item.assetId === assetId);
    if (!asset) throw Object.assign(new Error('Media asset plan item was not found.'), { code: 'NOT_FOUND' });
    return asset;
  }

  function providerFor(state, providerId) {
    const registry = createProviderRegistry({ settings: state.providerSettings, env });
    const provider = registry.get(providerId);
    if (!provider) throw Object.assign(new Error('Media provider is not supported.'), { code: 'VALIDATION' });
    return { provider, registry };
  }

  function safeRefs(values, product) {
    const valid = new Set((product.media || []).map((item) => item.id));
    return [...new Set(Array.isArray(values) ? values.map(String).filter((id) => valid.has(id)) : [])];
  }

  function promptPackage(product, plan, asset, provider) {
    const lockText = asset.designLocks.length
      ? `Preserve exactly: ${asset.designLocks.join(', ')}. Do not invent, remove, relocate, or materially alter locked product features.`
      : 'Do not invent product features.';
    return {
      schemaVersion: 1,
      packageId: crypto.randomUUID(),
      provider: provider.id,
      providerMode: provider.mode,
      productIdentity: { productId: product.id, productUuid: product.productUuid },
      productCategory: product.organization?.category || '',
      productTitle: product.title || '',
      confirmedColor: product.merchantAttributes?.color || product.organization?.color || '',
      confirmedMaterial: product.merchantAttributes?.material || product.metafields?.leatherType || '',
      assetType: asset.assetType,
      targetAngle: asset.assetType,
      productReferenceMediaIds: [...asset.productReferenceMediaIds],
      styleReferenceMediaIds: [...asset.styleReferenceMediaIds],
      designLocks: [...asset.designLocks],
      userInstructions: asset.instructions || plan.instructions || '',
      negativeConstraints: [
        lockText,
        'Style and composition references must not override factual garment details.',
        'Do not add unsupported logos, hardware, pockets, stitching, materials, colors, or certification marks.',
      ],
      backgroundRequirement: asset.assetType.includes('White Background') ? 'Clean white background' : '',
      compositionRequirement: asset.assetType,
      outputOrientation: asset.assetType.includes('Banner') ? 'landscape' : 'portrait_or_square',
      outputQuality: 'future_provider_setting',
      approvalRequirement: 'Explicit approval is required before activation.',
      providerNotes: provider.id === 'google_flow'
        ? 'Manual Prompt Workflow. Copy/export this package, run it manually in Google Flow, then upload the returned result.'
        : 'Execution is disabled. This package is ready for a future approved provider executor.',
      editablePrompt: [
        `Create ${asset.assetType} media for ${product.title || 'this product'}.`,
        lockText,
        asset.instructions || plan.instructions || '',
      ].filter(Boolean).join('\n\n'),
      generatedAt: new Date(now()).toISOString(),
    };
  }

  async function mutateAsset(session, input = {}, operation) {
    const user = userFor(session);
    requirePermission(user, operation === 'approve' || operation === 'reject' ? 'approve' : 'prepare');
    const product = productFor(input.productId);
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const index = state.plans.findIndex((item) => item.productId === product.id);
      if (index < 0) throw Object.assign(new Error('Save the Media Studio plan first.'), { code: 'AI_MEDIA_PLAN_REQUIRED' });
      const plan = { ...state.plans[index], assets: completeAssets(product, state.plans[index]) };
      const assetIndex = plan.assets.findIndex((item) => item.assetId === input.assetId);
      const current = assetFor(plan, input.assetId);
      let asset = { ...current };
      let action = `media_asset_${operation}`;
      if (operation === 'source') {
        const source = ASSET_SOURCES.includes(input.source) ? input.source : null;
        if (!source) throw Object.assign(new Error('Select a supported asset source.'), { code: 'VALIDATION' });
        const { provider } = providerFor(state, source);
        if (!provider.available && source !== 'openai') {
          throw Object.assign(new Error('Selected provider is unavailable.'), { code: 'PROVIDER_UNAVAILABLE' });
        }
        asset = {
          ...asset,
          source,
          provider: source,
          status: source === 'none' ? 'not_required'
            : source === 'google_flow' ? 'source_selected'
              : source === 'openai' && !provider.available ? 'awaiting_configuration' : 'ready',
          productReferenceMediaIds: safeRefs(input.productReferenceMediaIds, product),
          styleReferenceMediaIds: safeRefs(input.styleReferenceMediaIds, product),
          designLocks: Array.isArray(input.designLocks)
            ? input.designLocks.filter((lock) => DESIGN_LOCKS.includes(lock)) : asset.designLocks,
          instructions: typeof input.instructions === 'string' ? input.instructions.slice(0, 4000) : asset.instructions,
          promptPackage: null,
        };
      } else if (operation === 'prompt') {
        const { provider } = providerFor(state, asset.provider);
        if (!['openai', 'google_flow'].includes(asset.provider)) {
          throw Object.assign(new Error('Prompt packages apply only to provider-planned assets.'), { code: 'VALIDATION' });
        }
        asset.promptPackage = promptPackage(product, plan, asset, provider);
        asset.status = 'prompt_ready';
      } else if (operation === 'result') {
        const mediaId = safeRefs([input.mediaId], product)[0];
        if (!mediaId) throw Object.assign(new Error('Select a valid uploaded result.'), { code: 'VALIDATION' });
        if (asset.approvedMediaId && asset.approvedMediaId !== mediaId) {
          asset.replacedAssetReference = asset.approvedMediaId;
        }
        asset.generatedMediaId = mediaId;
        asset.status = 'awaiting_approval';
      } else if (operation === 'approve') {
        const mediaId = asset.generatedMediaId ||
          (asset.provider === 'uploaded' ? asset.productReferenceMediaIds[0] : null);
        if (!mediaId) throw Object.assign(new Error('Attach or select a media result before approval.'), { code: 'VALIDATION' });
        asset.approvedMediaId = mediaId;
        asset.status = 'approved';
        asset.approval = { status: 'approved', approverId: user.id, timestamp, rejectionReason: '' };
      } else if (operation === 'reject') {
        asset.status = 'rejected';
        asset.approval = {
          status: 'rejected', approverId: user.id, timestamp,
          rejectionReason: String(input.reason || '').slice(0, 500),
        };
      } else if (operation === 'restore') {
        if (!asset.replacedAssetReference) throw Object.assign(new Error('No previous approved asset is available.'), { code: 'VALIDATION' });
        asset.approvedMediaId = asset.replacedAssetReference;
        asset.status = 'approved';
      }
      asset.revision = Number(asset.revision || 0) + 1;
      asset.updatedAt = timestamp;
      plan.assets[assetIndex] = asset;
      plan.revision = Number(plan.revision || 0) + 1;
      plan.updatedAt = timestamp;
      plan.updatedBy = user.id;
      state.plans[index] = plan;
      state.auditEvents.push({
        id: crypto.randomUUID(), timestamp, action, actorId: user.id,
        productId: product.id, assetId: asset.assetId, assetType: asset.assetType,
        provider: asset.provider, status: asset.status, assetRevision: asset.revision,
      });
      return { store: state, value: asset };
    }, input.expectedRevision);
    return { asset: result.value, workspace: safeWorkspace(user, product, result.store) };
  }

  async function updateProviderSettings(session, input = {}) {
    const user = userFor(session);
    if (user.accountType !== 'owner') throw Object.assign(new Error('Named Owner permission is required.'), { code: 'FORBIDDEN' });
    const result = await store.mutate(async (state) => {
      const openai = input.openai || {};
      const flow = input.googleFlow || {};
      state.providerSettings = {
        ...state.providerSettings,
        openai: {
          ...state.providerSettings.openai,
          enabled: openai.enabled === true,
          defaultQuality: String(openai.defaultQuality || '').slice(0, 80),
          defaultSize: String(openai.defaultSize || '').slice(0, 80),
        },
        google_flow: {
          ...state.providerSettings.google_flow,
          enabled: flow.enabled !== false,
          promptExportEnabled: true,
          manualResultUploadEnabled: true,
        },
      };
      state.auditEvents.push({
        id: crypto.randomUUID(), timestamp: new Date(now()).toISOString(),
        action: 'media_provider_settings_updated', actorId: user.id,
        changedProviders: ['openai', 'google_flow'],
      });
      return { store: state, value: null };
    }, input.expectedRevision);
    return {
      storeRevision: result.store.storeRevision,
      providers: createProviderRegistry({ settings: result.store.providerSettings, env }).list(),
    };
  }

  function providerStatus(session) {
    const user = userFor(session);
    requirePermission(user, 'view');
    const state = store.read();
    return {
      storeRevision: state.storeRevision,
      providers: createProviderRegistry({ settings: state.providerSettings, env }).list(),
      canConfigure: user.accountType === 'owner',
    };
  }

  function assetHistory(session, productId, assetId) {
    const user = userFor(session);
    requirePermission(user, 'view');
    productFor(productId);
    return store.read().auditEvents.filter((event) => event.assetId === assetId)
      .map(({ id, timestamp, action, actorId, productId: pid, assetId: aid, assetType, provider, status, assetRevision }) =>
        ({ id, timestamp, action, actorId, productId: pid, assetId: aid, assetType, provider, status, assetRevision }));
  }

  function metadataAnalysis(product, plan) {
    const selected = new Set(plan.referenceMediaIds);
    const roles = plan.referenceMediaIds.map((id) => plan.roleAssignments[id] || 'Unknown');
    const coverage = COVERAGE_ROLES.map((role) => ({
      role,
      available: roles.includes(role),
      mediaIds: plan.referenceMediaIds.filter((id) => plan.roleAssignments[id] === role),
    }));
    const covered = coverage.filter((item) => item.available).length;
    const color = product.organization?.color || product.merchantAttributes?.color ||
      product.metafields?.color || 'Needs confirmation';
    const style = product.metafields?.style || product.organization?.productType || 'Needs confirmation';
    return {
      analysisType: 'metadata_only',
      analyzedAt: new Date(now()).toISOString(),
      selectedImageCount: selected.size,
      detectedAngles: roles.filter((role) => role !== 'Unknown'),
      missingAngles: coverage.filter((item) => !item.available).map((item) => item.role),
      detectedColor: color,
      detectedStyle: style,
      detectedProductType: product.organization?.productType || 'Needs confirmation',
      detectedQuality: 'Requires visual provider',
      coveragePercentage: Math.round((covered / coverage.length) * 100),
      coverage,
      notice: 'Coverage is calculated from user-confirmed image roles and existing factual product metadata. No pixels were analyzed.',
    };
  }

  async function analyze(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'analyze');
    const product = productFor(input.productId);
    const current = store.read();
    const existing = planFor(current, product);
    if (!existing.id) {
      throw Object.assign(new Error('Save the Media Studio plan before analyzing coverage.'), {
        code: 'AI_MEDIA_PLAN_REQUIRED',
      });
    }
    if (!existing.referenceMediaIds.length) {
      throw Object.assign(new Error('Choose at least one reference image before analysis.'), {
        code: 'AI_IMAGES_REQUIRED',
      });
    }
    const analysis = metadataAnalysis(product, existing);
    const timestamp = analysis.analyzedAt;
    const result = await store.mutate(async (state) => {
      const index = state.plans.findIndex((item) => item.id === existing.id);
      const plan = {
        ...state.plans[index],
        revision: state.plans[index].revision + 1,
        state: analysis.missingAngles.length ? 'needs_review' : 'analyzed',
        analysis,
        updatedAt: timestamp,
        updatedBy: user.id,
      };
      state.plans[index] = plan;
      state.auditEvents.push({
        id: crypto.randomUUID(),
        timestamp,
        action: 'media_coverage_analyzed',
        actorId: user.id,
        productId: product.id,
        planId: plan.id,
        planRevision: plan.revision,
        analysisType: 'metadata_only',
      });
      return { store: state, value: plan };
    }, input.expectedRevision);
    return {
      plan: result.value,
      workspace: safeWorkspace(user, product, result.store),
    };
  }

  return {
    analyze,
    approveAsset: (session, input) => mutateAsset(session, input, 'approve'),
    assetHistory,
    attachResult: (session, input) => mutateAsset(session, input, 'result'),
    generatePrompt: (session, input) => mutateAsset(session, input, 'prompt'),
    providerStatus,
    rejectAsset: (session, input) => mutateAsset(session, input, 'reject'),
    restoreAsset: (session, input) => mutateAsset(session, input, 'restore'),
    save,
    updateAssetSource: (session, input) => mutateAsset(session, input, 'source'),
    updateProviderSettings,
    workspace,
  };
}

module.exports = { createAiMediaStudioService };
