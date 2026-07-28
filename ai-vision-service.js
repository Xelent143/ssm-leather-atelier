const crypto = require('crypto');
const { createVisionProviderRegistry } = require('./ai-vision-providers');
const { IMAGE_ROLES, cleanText, confidence, validateDraftInput } = require('./ai-vision-schema');

function createAiVisionService(options = {}) {
  const {
    store, identity, productStore, plmStore,
    authorizeUser = () => false,
    env = process.env,
    now = () => Date.now(),
  } = options;
  const registry = createVisionProviderRegistry({ env });

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
      view: ['ai', 'view'], prepare: ['ai', 'edit'], run: ['ai', 'create'],
      approve: ['ai', 'approve'], apply: ['product_dna', 'edit'],
    };
    const permission = mapping[action];
    return Boolean(permission && authorizeUser(user, permission[0], permission[1]));
  }
  function requirePermission(user, action) {
    if (!allowed(user, action)) {
      throw Object.assign(new Error('You do not have permission for this Vision action.'), { code: 'FORBIDDEN' });
    }
  }
  function productFor(productId) {
    const product = productStore.read().products.find((item) => item.id === productId || item.productUuid === productId);
    if (!product) throw Object.assign(new Error('Product Editor draft was not found.'), { code: 'NOT_FOUND' });
    return product;
  }
  function analysesFor(state, productId) {
    return state.analyses.filter((item) => item.productId === productId)
      .sort((a, b) => b.version - a.version);
  }
  function safeProviders(user) {
    return registry.list().map((provider) => ({
      ...provider,
      credentialValue: undefined,
      canConfigure: user.accountType === 'owner',
    }));
  }
  function approvedFacts(analysis) {
    if (!analysis) return {};
    return Object.fromEntries(analysis.facts.filter((item) =>
      ['confirmed', 'corrected'].includes(item.status) && item.approval?.status === 'approved')
      .map((item) => [item.key, {
        value: item.userConfirmedValue ?? item.value,
        confidenceScore: item.confidenceScore,
        confidenceLabel: item.confidenceLabel,
        evidenceMediaIds: item.evidenceMediaIds,
        source: item.source,
        status: item.status,
      }]));
  }
  function merchantReadiness(product, analysis) {
    const approved = approvedFacts(analysis);
    const trusted = {
      productTitle: product.title,
      productType: product.organization?.productType || approved.productType?.value,
      gender: product.classification?.gender?.status === 'confirmed' ? product.classification.gender.value : approved.gender?.value,
      ageGroup: product.classification?.ageGroup?.status === 'confirmed' ? product.classification.ageGroup.value : approved.ageGroup?.value,
      color: product.merchantAttributes?.color || approved.primaryColor?.value,
      material: product.merchantAttributes?.material || approved.material?.value,
    };
    const required = ['productTitle', 'productType', 'gender', 'ageGroup', 'color', 'material'];
    const missing = required.filter((key) => !trusted[key] || trusted[key] === 'Unknown');
    const primarySuitable = analysis?.quality?.some((item) =>
      analysis.imageRoles[item.mediaId] === 'Front' && ['Good', 'Acceptable'].includes(item.status));
    const imageCoverage = analysis?.coverage?.percentage || 0;
    const blockers = [...missing.map((key) => `Confirm ${key}.`)];
    if (!primarySuitable) blockers.push('Confirm a suitable primary image.');
    if (analysis?.conflicts?.some((item) => item.status === 'unresolved')) blockers.push('Resolve vision conflicts.');
    const completed = required.length - missing.length;
    const score = Math.max(0, Math.min(100,
      Math.round(completed / required.length * 70 + Math.min(imageCoverage, 100) * 0.2 + (primarySuitable ? 10 : 0))));
    return {
      score,
      status: blockers.length ? (score < 50 ? 'Blocked' : 'Needs Review') : 'Ready',
      blockers,
      values: trusted,
      imageCoverage,
      primaryImageSuitable: Boolean(primarySuitable),
    };
  }
  function workspace(session, productId) {
    const user = userFor(session);
    requirePermission(user, 'view');
    const product = productFor(productId);
    const state = store.read();
    const history = analysesFor(state, product.id);
    const latest = history[0] || null;
    return {
      schemaVersion: 1,
      storeRevision: state.storeRevision,
      productId: product.id,
      latest,
      history: history.map(({ id, version, status, providerId, createdAt, updatedAt }) =>
        ({ id, version, status, providerId, createdAt, updatedAt })),
      media: (product.media || []).map((item) => ({
        id: item.id, path: item.path, title: item.title || item.originalName || item.role || 'Product image',
        currentRole: IMAGE_ROLES.includes(item.role) ? item.role : item.role === 'Left' ? 'Left Side'
          : item.role === 'Right' ? 'Right Side' : 'Unknown',
      })),
      roles: IMAGE_ROLES,
      providers: safeProviders(user),
      permissions: {
        view: allowed(user, 'view'), prepare: allowed(user, 'prepare'), run: allowed(user, 'run'),
        approve: allowed(user, 'approve'), apply: allowed(user, 'apply'),
        configureProvider: user.accountType === 'owner',
      },
      approvedFacts: approvedFacts(latest),
      merchantReadiness: merchantReadiness(product, latest),
      productDnaApplications: state.productDnaApplications.filter((item) => item.productId === product.id),
    };
  }
  async function createDraft(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'prepare');
    const product = productFor(input.productId);
    const validMedia = (product.media || []).map((item) => item.id);
    const validated = validateDraftInput(input, validMedia);
    if (!validated.selectedMediaIds.length) {
      throw Object.assign(new Error('Select at least one image for Vision analysis.'), { code: 'AI_IMAGES_REQUIRED' });
    }
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const previous = analysesFor(state, product.id)[0];
      const analysis = {
        id: crypto.randomUUID(),
        productId: product.id,
        productUuid: product.productUuid,
        version: Number(previous?.version || 0) + 1,
        selectedMediaIds: validated.selectedMediaIds,
        excludedMediaIds: validated.excludedMediaIds,
        imageRoles: validated.imageRoles,
        suggestedRoles: {},
        providerId: validated.providerId,
        providerStatus: 'selected',
        status: 'ready',
        facts: [],
        conflicts: [],
        quality: [],
        coverage: null,
        recommendations: [],
        note: validated.note,
        resolutions: [],
        approvalRecords: [],
        mediaStudioCoverageUpdate: null,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        revision: 1,
      };
      state.analyses.push(analysis);
      state.auditEvents.push(safeAudit('vision_analysis_draft_created', user.id, product.id, analysis.id, timestamp));
      return { store: state, value: analysis };
    }, input.expectedRevision);
    return { analysis: result.value, workspace: workspace(session, product.id) };
  }
  function safeAudit(action, actorId, productId, analysisId, timestamp, extra = {}) {
    return { id: crypto.randomUUID(), timestamp, action, actorId, productId, analysisId, ...extra };
  }
  async function run(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'run');
    const product = productFor(input.productId);
    const current = store.read();
    const analysis = current.analyses.find((item) => item.id === input.analysisId && item.productId === product.id);
    if (!analysis) throw Object.assign(new Error('Vision analysis was not found.'), { code: 'NOT_FOUND' });
    const provider = registry.get(analysis.providerId);
    if (!provider || !provider.available || !provider.executionEnabled) {
      throw Object.assign(new Error('Selected Vision provider is unavailable or execution is disabled.'), {
        code: 'VISION_PROVIDER_EXECUTION_DISABLED',
      });
    }
    const media = (product.media || []).filter((item) => analysis.selectedMediaIds.includes(item.id));
    try {
      const normalized = provider.analyze({ product, media, roles: analysis.imageRoles });
      const timestamp = new Date(now()).toISOString();
      const result = await store.mutate(async (state) => {
        const index = state.analyses.findIndex((item) => item.id === analysis.id);
        const next = {
          ...state.analyses[index],
          suggestedRoles: normalized.suggestedRoles,
          providerStatus: 'completed',
          status: normalized.conflicts.length ? 'conflicted'
            : normalized.facts.some((item) => item.needsConfirmation) ? 'needs_review' : 'completed',
          facts: normalized.facts,
          conflicts: normalized.conflicts,
          quality: normalized.quality,
          coverage: normalized.coverage,
          recommendations: normalized.recommendations,
          revision: state.analyses[index].revision + 1,
          updatedBy: user.id,
          updatedAt: timestamp,
        };
        state.analyses[index] = next;
        state.auditEvents.push(safeAudit('vision_analysis_completed', user.id, product.id, next.id, timestamp, {
          providerId: provider.id, factCount: next.facts.length, conflictCount: next.conflicts.length,
        }));
        return { store: state, value: next };
      }, input.expectedRevision);
      return { analysis: result.value, workspace: workspace(session, product.id) };
    } catch (error) {
      if (error.code) throw error;
      throw Object.assign(new Error('Vision analysis failed safely; prior completed analyses remain available.'), {
        code: 'VISION_PROVIDER_FAILED',
      });
    }
  }
  async function reviewFact(session, input = {}, action) {
    const user = userFor(session);
    requirePermission(user, action === 'reject' ? 'approve' : 'approve');
    const product = productFor(input.productId);
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const index = state.analyses.findIndex((item) => item.id === input.analysisId && item.productId === product.id);
      if (index < 0) throw Object.assign(new Error('Vision analysis was not found.'), { code: 'NOT_FOUND' });
      const analysis = { ...state.analyses[index], facts: structuredClone(state.analyses[index].facts) };
      const factIndex = analysis.facts.findIndex((item) => item.factId === input.factId);
      if (factIndex < 0) throw Object.assign(new Error('Vision fact was not found.'), { code: 'NOT_FOUND' });
      const currentFact = analysis.facts[factIndex];
      const corrected = action === 'correct' ? cleanText(input.value, 500) : null;
      analysis.facts[factIndex] = {
        ...currentFact,
        status: action === 'reject' ? 'rejected' : action === 'correct' ? 'corrected' : 'confirmed',
        userConfirmedValue: corrected || (action === 'approve' ? currentFact.value : null),
        needsConfirmation: false,
        approval: {
          status: action === 'reject' ? 'rejected' : 'approved',
          approverId: user.id, timestamp, note: cleanText(input.note, 500),
        },
      };
      analysis.approvalRecords = [...analysis.approvalRecords, {
        id: crypto.randomUUID(), factId: input.factId, action, actorId: user.id, timestamp,
      }];
      analysis.revision += 1;
      analysis.updatedAt = timestamp;
      analysis.updatedBy = user.id;
      state.analyses[index] = analysis;
      state.auditEvents.push(safeAudit(`vision_fact_${action}`, user.id, product.id, analysis.id, timestamp, {
        factId: input.factId, factKey: currentFact.key,
      }));
      return { store: state, value: analysis };
    }, input.expectedRevision);
    return { analysis: result.value, workspace: workspace(session, product.id) };
  }
  async function resolveConflict(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'approve');
    const product = productFor(input.productId);
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const index = state.analyses.findIndex((item) => item.id === input.analysisId && item.productId === product.id);
      if (index < 0) throw Object.assign(new Error('Vision analysis was not found.'), { code: 'NOT_FOUND' });
      const analysis = { ...state.analyses[index], conflicts: structuredClone(state.analyses[index].conflicts) };
      const conflict = analysis.conflicts.find((item) => item.conflictId === input.conflictId);
      if (!conflict) throw Object.assign(new Error('Vision conflict was not found.'), { code: 'NOT_FOUND' });
      conflict.status = 'resolved';
      conflict.resolution = {
        choice: ['keep_trusted', 'accept_observed', 'corrected', 'variation', 'exclude_image']
          .includes(input.choice) ? input.choice : 'keep_trusted',
        correctedValue: cleanText(input.correctedValue, 500),
        excludedMediaIds: Array.isArray(input.excludedMediaIds) ? input.excludedMediaIds.filter((id) =>
          analysis.selectedMediaIds.includes(id)) : [],
        note: cleanText(input.note, 500),
        actorId: user.id,
        timestamp,
      };
      analysis.resolutions = [...analysis.resolutions, { conflictId: conflict.conflictId, ...conflict.resolution }];
      analysis.status = analysis.conflicts.some((item) => item.status === 'unresolved') ? 'conflicted' : 'needs_review';
      analysis.revision += 1;
      analysis.updatedAt = timestamp;
      state.analyses[index] = analysis;
      state.auditEvents.push(safeAudit('vision_conflict_resolved', user.id, product.id, analysis.id, timestamp, {
        conflictId: conflict.conflictId, choice: conflict.resolution.choice,
      }));
      return { store: state, value: analysis };
    }, input.expectedRevision);
    return { analysis: result.value, workspace: workspace(session, product.id) };
  }
  async function applyToProductDna(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'apply');
    const product = productFor(input.productId);
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const analysis = state.analyses.find((item) => item.id === input.analysisId && item.productId === product.id);
      if (!analysis) throw Object.assign(new Error('Vision analysis was not found.'), { code: 'NOT_FOUND' });
      if (analysis.conflicts.some((item) => item.status === 'unresolved')) {
        throw Object.assign(new Error('Resolve Vision conflicts before applying facts.'), { code: 'CONFLICT' });
      }
      const approved = Object.entries(approvedFacts(analysis));
      if (!approved.length) throw Object.assign(new Error('Approve at least one fact before applying.'), { code: 'APPROVAL_REQUIRED' });
      const plm = plmStore?.read?.();
      const dnaRevision = plm?.storeRevision ?? null;
      const application = {
        id: crypto.randomUUID(), productId: product.id, productUuid: product.productUuid,
        analysisId: analysis.id, previousValues: {},
        appliedFacts: Object.fromEntries(approved),
        factSource: 'approved_vision_analysis',
        evidenceMediaIds: [...new Set(approved.flatMap(([, item]) => item.evidenceMediaIds || []))],
        approverId: user.id, approvalTimestamp: timestamp, appliedAt: timestamp,
        productDnaRevision: dnaRevision, reversible: true, revertedAt: null,
      };
      state.productDnaApplications.push(application);
      analysis.status = approved.length === analysis.facts.length ? 'applied' : 'partially_applied';
      analysis.revision += 1;
      analysis.updatedAt = timestamp;
      state.auditEvents.push(safeAudit('vision_facts_applied_to_product_dna_overlay', user.id, product.id, analysis.id, timestamp, {
        applicationId: application.id, factKeys: approved.map(([key]) => key),
      }));
      return { store: state, value: application };
    }, input.expectedRevision);
    return { application: result.value, workspace: workspace(session, product.id) };
  }
  async function updateMediaCoverage(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'prepare');
    const product = productFor(input.productId);
    const timestamp = new Date(now()).toISOString();
    const result = await store.mutate(async (state) => {
      const index = state.analyses.findIndex((item) => item.id === input.analysisId && item.productId === product.id);
      if (index < 0) throw Object.assign(new Error('Vision analysis was not found.'), { code: 'NOT_FOUND' });
      const analysis = state.analyses[index];
      analysis.mediaStudioCoverageUpdate = {
        sharedAt: timestamp, sharedBy: user.id,
        confirmed: analysis.coverage?.confirmed || [],
        missing: analysis.coverage?.missing || [],
        lowQualityMediaIds: analysis.coverage?.lowQuality || [],
        recommendations: analysis.recommendations || [],
        sourceAnalysisId: analysis.id,
      };
      analysis.revision += 1;
      analysis.updatedAt = timestamp;
      state.auditEvents.push(safeAudit('vision_coverage_shared_with_media_studio', user.id, product.id, analysis.id, timestamp));
      return { store: state, value: analysis.mediaStudioCoverageUpdate };
    }, input.expectedRevision);
    return { coverage: result.value, workspace: workspace(session, product.id) };
  }
  async function cancel(session, input = {}) {
    const user = userFor(session);
    requirePermission(user, 'prepare');
    const product = productFor(input.productId);
    const result = await store.mutate(async (state) => {
      const analysis = state.analyses.find((item) => item.id === input.analysisId && item.productId === product.id);
      if (!analysis) throw Object.assign(new Error('Vision analysis was not found.'), { code: 'NOT_FOUND' });
      analysis.status = 'cancelled';
      analysis.revision += 1;
      analysis.updatedAt = new Date(now()).toISOString();
      return { store: state, value: analysis };
    }, input.expectedRevision);
    return { analysis: result.value, workspace: workspace(session, product.id) };
  }
  function integrationProjection(productId) {
    const state = store.read();
    const latest = analysesFor(state, productId)[0] || null;
    return {
      approvedFacts: approvedFacts(latest),
      coverage: latest?.mediaStudioCoverageUpdate || null,
      missingInformation: latest?.facts?.filter((item) => item.needsConfirmation || item.status === 'unknown')
        .map((item) => item.key) || [],
      analysisId: latest?.id || null,
      status: latest?.status || null,
    };
  }
  function auditHistory(session, productId) {
    const user = userFor(session);
    requirePermission(user, 'view');
    productFor(productId);
    return store.read().auditEvents.filter((item) => item.productId === productId);
  }
  return {
    applyToProductDna,
    approveFact: (session, input) => reviewFact(session, input, 'approve'),
    auditHistory,
    cancel,
    correctFact: (session, input) => reviewFact(session, input, 'correct'),
    createDraft,
    integrationProjection,
    rejectFact: (session, input) => reviewFact(session, input, 'reject'),
    resolveConflict,
    run,
    updateMediaCoverage,
    workspace,
  };
}

module.exports = { createAiVisionService };
