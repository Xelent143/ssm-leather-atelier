const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { analyzeCopy } = require('./copy-intelligence-service');
const { IMAGE_ROLES, validateResponse } = require('./ai-product-copilot-schema');

const DEFAULT_LIMITS = Object.freeze({
  maxImages: 8, maxRequestsPerUserDay: 20, maxImageBytes: 5 * 1024 * 1024,
});
const UNSAFE_FACT_FIELDS = new Set([
  'leatherThickness', 'hardwareBrand', 'waterproofing', 'ceCertification',
  'armorCertification', 'countryOfManufacture', 'shippingTime', 'returnPolicy',
  'customSizing', 'measurements',
]);

function clean(value, max = 5000) {
  return String(value ?? '').replace(/\0/g, '').slice(0, max);
}
function slugify(value) {
  return clean(value, 160).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function actor(identity, session) {
  if (!session || session.actorType !== 'named_user') throw Object.assign(new Error('Named account access is required.'), { code: 'FORBIDDEN' });
  const user = identity.findById(session.userId);
  if (!user || user.status !== 'active') throw Object.assign(new Error('Active named account access is required.'), { code: 'FORBIDDEN' });
  return user;
}
function permission(authorizeUser, user, capability) {
  const map = {
    view: ['ai', 'view'], run: ['ai', 'create'], reanalyze: ['ai', 'create'],
    apply_suggestions: ['ai', 'edit'], view_history: ['ai', 'view'],
    configure_provider: ['ai', 'configure'],
  };
  return user.accountType === 'owner' || authorizeUser(user, ...(map[capability] || ['ai', 'view']));
}
function denyUnless(value) {
  if (!value) throw Object.assign(new Error('You do not have permission for this AI Product Analysis action.'), { code: 'FORBIDDEN' });
}
function safeInstruction(value) {
  const text = clean(value, 4000);
  return text.replace(/(?:api[_ -]?key|password|secret|token)\s*[:=]\s*\S+/gi, '[redacted]');
}
function flattenCopyContent(result) {
  return {
    shopify: {
      title: result.websiteContent.title, description: result.websiteContent.fullDescription,
      seoTitle: result.seo.title, metaDescription: result.seo.metaDescription,
    },
    ebay: result.ebayDraft, etsy: result.etsyDraft,
    seo: { title: result.seo.title, metaDescription: result.seo.metaDescription },
    faq: result.websiteContent.faq, buyingGuide: result.websiteContent.buyingGuide,
  };
}
function supportedFacts(product, trustedProduct = null) {
  return {
    brand: product.organization?.brand || '',
    productType: product.organization?.productType || '',
    category: product.organization?.category || '',
    gender: product.organization?.gender || '',
    ...Object.fromEntries(Object.entries(product.metafields || {}).filter(([, value]) => clean(value))),
    trustedProductId: trustedProduct?.id || product.productUuid,
  };
}
function evidenceImage(item) {
  return {
    id: item.id, role: IMAGE_ROLES.has(item.role) ? item.role : 'Unknown',
    title: clean(item.title || item.originalName, 200),
  };
}
function outputFields(result) {
  return {
    title: result.websiteContent.title,
    'organization.productType': result.productFacts.find((fact) => fact.field === 'productType')?.value || '',
    'organization.category': result.categorySuggestions[0] || '',
    'organization.tags': result.websiteContent.tags,
    'section.shortDescription': result.websiteContent.shortDescription,
    'section.fullDescription': result.websiteContent.fullDescription,
    'section.features': result.websiteContent.features.map((item) => `✔ ${item}`).join('\n'),
    'section.specifications': result.websiteContent.specifications.join('\n'),
    'section.perfectFor': result.websiteContent.perfectFor,
    'section.whyYouWillLoveIt': result.websiteContent.whyYouWillLoveIt,
    'section.faq': result.websiteContent.faq.map((item) => `${item.question}\n${item.answer}`).join('\n\n'),
    'section.buyingGuide': result.websiteContent.buyingGuide,
    'seo.title': result.seo.title,
    'seo.metaDescription': result.seo.metaDescription,
    'seo.handle': result.seo.handle,
  };
}

function createAiProductCopilotService(options = {}) {
  const {
    store, identity, productStore, plmStore, provider, authorizeUser = () => false,
    dataDir, rootDir, now = () => Date.now(),
  } = options;
  const limits = {
    maxImages: Number(process.env.AI_PRODUCT_COPILOT_MAX_IMAGES || DEFAULT_LIMITS.maxImages),
    maxRequestsPerUserDay: Number(process.env.AI_PRODUCT_COPILOT_DAILY_LIMIT || DEFAULT_LIMITS.maxRequestsPerUserDay),
    maxImageBytes: Number(process.env.AI_PRODUCT_COPILOT_MAX_IMAGE_BYTES || DEFAULT_LIMITS.maxImageBytes),
  };

  function productFor(productId) {
    const product = productStore.read().products.find((item) => item.id === productId || item.productUuid === productId);
    if (!product) throw Object.assign(new Error('Product Editor draft was not found.'), { code: 'NOT_FOUND' });
    return product;
  }
  function imageInput(media) {
    const publicPath = String(media.path || '');
    if (/^https:\/\//i.test(publicPath)) return { ...evidenceImage(media), dataUrl: publicPath };
    let filePath = null;
    if (publicPath.startsWith('/product-editor-media/')) {
      const relative = publicPath.slice('/product-editor-media/'.length);
      filePath = path.resolve(dataDir, 'product-editor-media', relative);
      const approvedRoot = `${path.resolve(dataDir, 'product-editor-media')}${path.sep}`;
      if (!filePath.startsWith(approvedRoot)) filePath = null;
    } else if (/^\/?assets\//.test(publicPath)) {
      filePath = path.resolve(rootDir, publicPath.replace(/^\/+/, ''));
      const approvedRoot = `${path.resolve(rootDir, 'assets')}${path.sep}`;
      if (!filePath.startsWith(approvedRoot)) filePath = null;
    }
    if (!filePath || !fs.existsSync(filePath)) throw Object.assign(new Error('One or more selected images are unavailable.'), { code: 'AI_IMAGE_UNAVAILABLE' });
    const stat = fs.statSync(filePath);
    if (stat.size > limits.maxImageBytes) throw Object.assign(new Error('An image exceeds the configured AI analysis size limit.'), { code: 'AI_IMAGE_TOO_LARGE' });
    const mimeType = media.mimeType || ({ '.png': 'image/png', '.webp': 'image/webp' }[path.extname(filePath).toLowerCase()] || 'image/jpeg');
    return { ...evidenceImage(media), dataUrl: `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}` };
  }
  function usageKey(user) {
    return `${new Date(now()).toISOString().slice(0, 10)}:${user.id}`;
  }
  function safeAnalysis(record) {
    const copy = structuredClone(record);
    delete copy.providerRequestId;
    return copy;
  }
  function workspace(session, productId) {
    const user = actor(identity, session);
    denyUnless(permission(authorizeUser, user, 'view'));
    const product = productFor(productId);
    const state = store.read();
    const analyses = state.analyses.filter((item) => item.productId === product.id).map(safeAnalysis).reverse();
    const key = usageKey(user);
    return {
      schemaVersion: 1, storeRevision: state.storeRevision,
      productId: product.id, productUuid: product.productUuid,
      analyses, latest: analyses[0] || null,
      provider: {
        name: provider.name, model: provider.model, configured: provider.configured,
        status: provider.configured ? 'ready' : 'not_configured',
      },
      limits, usage: {
        analysesToday: state.dailyUsage[key]?.analyses || 0,
        imagesAnalyzedToday: state.dailyUsage[key]?.images || 0,
        failedToday: state.dailyUsage[key]?.failed || 0,
      },
      permissions: {
        view: permission(authorizeUser, user, 'view'),
        run: permission(authorizeUser, user, 'run'),
        reanalyze: permission(authorizeUser, user, 'reanalyze'),
        applySuggestions: permission(authorizeUser, user, 'apply_suggestions'),
        viewHistory: permission(authorizeUser, user, 'view_history'),
        configureProvider: permission(authorizeUser, user, 'configure_provider'),
      },
    };
  }
  async function analyze(session, input = {}) {
    const user = actor(identity, session);
    const prior = store.read().analyses.filter((item) => item.productId === input.productId);
    denyUnless(permission(authorizeUser, user, prior.length ? 'reanalyze' : 'run'));
    const product = productFor(input.productId);
    const selectedIds = new Set((input.imageIds || product.media.map((item) => item.id)).map(String));
    const media = product.media.filter((item) => selectedIds.has(item.id)).slice(0, limits.maxImages);
    if (!media.length) throw Object.assign(new Error('Upload at least one product image before analysis.'), { code: 'AI_IMAGES_REQUIRED' });
    const current = store.read();
    const key = usageKey(user);
    if (Number(current.dailyUsage[key]?.analyses || 0) >= limits.maxRequestsPerUserDay) {
      throw Object.assign(new Error('Daily AI analysis limit reached.'), { code: 'AI_DAILY_LIMIT' });
    }
    const images = media.map(imageInput);
    const plm = plmStore.read();
    const trustedProduct = (plm.productIdentities || []).find((item) => item.id === product.productUuid) || null;
    const knownFacts = {
      ...supportedFacts(product, trustedProduct),
      ...Object.fromEntries(Object.entries(input.knownFacts || {}).map(([keyName, value]) => [clean(keyName, 100), clean(value, 500)])),
    };
    let providerResult;
    try {
      providerResult = await provider.analyze({
        images,
        context: {
          productId: product.id, productName: clean(input.productName || product.title, 300),
          instruction: safeInstruction(input.instruction), knownFacts,
          targetAudience: clean(input.targetAudience, 300), targetMarket: clean(input.targetMarket || 'USA', 100),
          brand: clean(input.brand || product.organization.brand, 120),
          tone: clean(input.tone || 'Premium, factual, human and trustworthy', 300),
          evidenceImages: images.map(({ id, role, title }) => ({ id, role, title })),
        },
      });
    } catch (error) {
      await store.mutate(async (state) => {
        state.dailyUsage[key] = {
          analyses: Number(state.dailyUsage[key]?.analyses || 0),
          images: Number(state.dailyUsage[key]?.images || 0),
          failed: Number(state.dailyUsage[key]?.failed || 0) + 1,
        };
        state.auditEvents.push({
          id: crypto.randomUUID(), action: 'ai_product_analysis_failed', productId: product.id,
          actorId: user.id, result: 'failed', errorCode: error.code || 'AI_PROVIDER_FAILED',
          timestamp: new Date(now()).toISOString(),
        });
        return { store: state, value: null };
      });
      throw error;
    }
    const validated = validateResponse(providerResult.output, images);
    const trustedConflicts = [];
    validated.productFacts = validated.productFacts.map((fact) => {
      const trustedValue = clean(knownFacts[fact.field], 500);
      if (trustedValue && fact.value && trustedValue.toLowerCase() !== fact.value.toLowerCase()) {
        trustedConflicts.push({ field: fact.field, trustedValue, aiValue: fact.value, resolution: 'trusted_data_wins' });
        return { ...fact, value: trustedValue, status: 'needs_confirmation' };
      }
      if (UNSAFE_FACT_FIELDS.has(fact.field) && !trustedValue) return { ...fact, status: 'needs_confirmation', confidence: 'low' };
      return fact;
    });
    const copyAnalysis = analyzeCopy({
      content: flattenCopyContent(validated), facts: knownFacts,
      supportedClaims: Object.values(knownFacts).filter(Boolean),
      analyzedAt: new Date(now()).toISOString(),
    });
    const record = {
      id: crypto.randomUUID(), version: prior.length + 1, productId: product.id,
      productUuid: product.productUuid, status: validated.missingInformation.some((item) => item.critical)
        ? 'needs_confirmation' : 'analysis_complete',
      imageIds: images.map((image) => image.id),
      imageRoles: Object.fromEntries(images.map((image) => [image.id, image.role])),
      instruction: safeInstruction(input.instruction),
      provider: provider.name, model: provider.model, providerVersion: provider.version,
      generatedAt: new Date(now()).toISOString(), requestedBy: user.id,
      result: validated, trustedConflicts, copyAnalysis,
      suggestions: Object.entries(outputFields(validated)).map(([field, value]) => ({
        id: crypto.randomUUID(), field, value, status: 'pending',
        confidence: ['title', 'seo.title', 'seo.metaDescription'].includes(field) ? 'medium' : 'high',
        evidence: validated.productFacts.filter((fact) => fact.status !== 'rejected').flatMap((fact) => fact.evidence).slice(0, 10),
      })),
      acceptedFields: [], rejectedFields: [], finalAppliedDraftVersion: null,
      providerRequestId: providerResult.providerRequestId || null,
      usage: providerResult.usage || null,
    };
    const saved = await store.mutate(async (state) => {
      state.analyses.push(record);
      state.dailyUsage[key] = {
        analyses: Number(state.dailyUsage[key]?.analyses || 0) + 1,
        images: Number(state.dailyUsage[key]?.images || 0) + images.length,
        failed: Number(state.dailyUsage[key]?.failed || 0),
      };
      state.auditEvents.push({
        id: crypto.randomUUID(), action: 'ai_product_analysis_created',
        analysisId: record.id, productId: product.id, actorId: user.id,
        provider: provider.name, model: provider.model, result: 'success',
        timestamp: new Date(now()).toISOString(),
      });
      return { store: state, value: safeAnalysis(record) };
    }, input.expectedRevision);
    return { analysis: saved.value, workspace: workspace(session, product.id) };
  }
  async function recordReview(session, input = {}) {
    const user = actor(identity, session);
    denyUnless(permission(authorizeUser, user, 'apply_suggestions'));
    const current = store.read();
    const source = current.analyses.find((item) => item.id === input.analysisId);
    if (!source) throw Object.assign(new Error('AI analysis was not found.'), { code: 'NOT_FOUND' });
    const allowed = new Set(source.suggestions.map((item) => item.field));
    const acceptedFields = [...new Set((input.acceptedFields || []).map(String).filter((item) => allowed.has(item)))];
    const rejectedFields = [...new Set((input.rejectedFields || []).map(String).filter((item) => allowed.has(item) && !acceptedFields.includes(item)))];
    const review = {
      ...source, id: crypto.randomUUID(), version: source.version + 0.1,
      status: 'analysis_complete', generatedAt: new Date(now()).toISOString(),
      requestedBy: user.id, parentAnalysisId: source.id, acceptedFields, rejectedFields,
      finalAppliedDraftVersion: Number(input.draftRevision || 0),
      suggestions: source.suggestions.map((item) => ({
        ...item, status: acceptedFields.includes(item.field) ? 'accepted' :
          rejectedFields.includes(item.field) ? 'rejected' : 'pending',
      })),
      providerRequestId: null,
    };
    const saved = await store.mutate(async (state) => {
      state.analyses.push(review);
      state.auditEvents.push({
        id: crypto.randomUUID(), action: 'ai_product_suggestions_reviewed',
        analysisId: review.id, parentAnalysisId: source.id, productId: source.productId,
        actorId: user.id, acceptedFields, rejectedFields, result: 'success',
        timestamp: new Date(now()).toISOString(),
      });
      return { store: state, value: safeAnalysis(review) };
    }, input.expectedRevision);
    return { analysis: saved.value, workspace: workspace(session, source.productId) };
  }
  async function cancel(session, input = {}) {
    const user = actor(identity, session);
    denyUnless(permission(authorizeUser, user, 'run'));
    const record = {
      id: crypto.randomUUID(), version: 1, productId: input.productId,
      productUuid: productFor(input.productId).productUuid, status: 'cancelled',
      imageIds: [], imageRoles: {}, instruction: safeInstruction(input.instruction),
      provider: provider.name, model: provider.model, providerVersion: provider.version,
      generatedAt: new Date(now()).toISOString(), requestedBy: user.id,
      result: null, trustedConflicts: [], copyAnalysis: null, suggestions: [],
      acceptedFields: [], rejectedFields: [], finalAppliedDraftVersion: null,
    };
    const saved = await store.mutate(async (state) => {
      state.analyses.push(record);
      state.auditEvents.push({
        id: crypto.randomUUID(), action: 'ai_product_analysis_cancelled',
        analysisId: record.id, productId: record.productId, actorId: user.id,
        result: 'success', timestamp: record.generatedAt,
      });
      return { store: state, value: safeAnalysis(record) };
    }, input.expectedRevision);
    return { analysis: saved.value, workspace: workspace(session, record.productId) };
  }
  return { analyze, cancel, recordReview, workspace, paths: store.paths, limits };
}

function createDeterministicCopilotProvider(outputFactory) {
  return {
    name: 'deterministic-test', model: 'fixture-v1', version: 'test-only', configured: true,
    async analyze(input) {
      return { output: outputFactory(input), usage: { input_tokens: 0, output_tokens: 0 }, providerRequestId: 'test-request' };
    },
  };
}

module.exports = {
  DEFAULT_LIMITS, createAiProductCopilotService, createDeterministicCopilotProvider,
};
