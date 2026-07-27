const crypto = require('crypto');
const {
  ASSET_TYPES,
  DESIGN_LOCKS,
  IMAGE_SOURCE_MODES,
  REFERENCE_IMAGE_ROLES,
  validatePlanInput,
} = require('./ai-media-studio-schema');

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

  function planFor(state, product) {
    return state.plans.find((item) => item.productId === product.id) || defaultPlan(product);
  }

  function safeWorkspace(user, product, state) {
    const plan = planFor(state, product);
    return {
      schemaVersion: 1,
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
        configureProvider: user.accountType === 'owner',
      },
      provider: {
        integrated: false,
        status: 'not_integrated',
        message: 'No image-generation provider is connected in this sprint.',
      },
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

  return { analyze, save, workspace };
}

module.exports = { createAiMediaStudioService };
