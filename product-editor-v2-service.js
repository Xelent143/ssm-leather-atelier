const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  brandDefinitionForName,
  createStyle,
  findOrCreateFamily,
  hierarchyProposal,
  seedInitialBrands,
} = require('./product-plm-hierarchy');
const { emptyProductBrainReferences } = require('./product-plm-schema');
const { canonicalMediaUrl } = require('./media-url');
const {
  genderLabel, merchantReadiness, normalizeClassification, normalizeMerchantAttributes,
  normalizeWebsiteContent,
} = require('./product-listing-contract');

const PRODUCT_TYPES = Object.freeze([
  'Leather Jacket', 'Motorcycle Jacket', 'Leather Vest', 'Biker Vest', 'Western Vest',
  'Waistcoat', 'Leather Pants', 'Leather Shorts', 'Chaps', 'Leather Bag', 'Gloves',
  'Accessories', 'Other',
]);
const MEDIA_TYPES = new Map([
  ['image/jpeg', { extension: '.jpg', signatures: [[0xff, 0xd8, 0xff]] }],
  ['image/png', { extension: '.png', signatures: [[0x89, 0x50, 0x4e, 0x47]] }],
  ['image/webp', { extension: '.webp', signatures: [[0x52, 0x49, 0x46, 0x46]] }],
]);
const MEDIA_ROLES = new Set([
  'Front', 'Back', 'Left Side', 'Right Side', 'Side', 'Interior', 'Detail',
  'Hardware', 'Lifestyle', 'Size Chart', 'Unknown', 'Other',
]);
const STATUS_VALUES = new Set(['draft', 'active', 'archived']);
const DEFAULT_LEGAL_ENTITY = 'MOTOGRIP GEAR LLC';

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}
function slugify(value) {
  return clean(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function safeHtml(value) {
  let html = String(value || '').slice(0, 100000);
  html = html.replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '');
  html = html.replace(/javascript\s*:/gi, '');
  return html;
}
function optionCode(name) {
  return clean(name, 40).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}
function optionCombinations(options) {
  const active = options.filter((option) => option.name && option.values.length);
  if (!active.length) return [{}];
  return active.reduce((rows, option) => rows.flatMap((row) =>
    option.values.map((value) => ({ ...row, [optionCode(option.name)]: value }))), [{}]);
}
function normalizedOptions(input) {
  const names = new Set();
  return (Array.isArray(input) ? input : []).slice(0, 3).map((option) => {
    const name = clean(option.name, 40);
    const key = name.toLowerCase();
    if (!name || names.has(key)) {
      throw Object.assign(new Error('Option names must be unique.'), { code: 'VALIDATION' });
    }
    names.add(key);
    const values = [...new Set((Array.isArray(option.values) ? option.values : [])
      .map((value) => clean(value, 40)).filter(Boolean))];
    if (!values.length) throw Object.assign(new Error(`${name} requires at least one value.`), { code: 'VALIDATION' });
    return { id: clean(option.id, 80) || crypto.randomUUID(), name, values };
  });
}
function validatePrice(price, compareAtPrice, allowLowerCompareAt = false) {
  if (number(price, -1) < 0) throw Object.assign(new Error('Price cannot be negative.'), { code: 'VALIDATION' });
  if (compareAtPrice !== '' && compareAtPrice !== null && compareAtPrice !== undefined &&
      number(compareAtPrice, -1) < number(price) && !allowLowerCompareAt) {
    throw Object.assign(new Error('Compare-at price cannot be lower than price.'), { code: 'VALIDATION' });
  }
}
function importedWebsiteIdentity(source) {
  const productSku = clean(source?.sku, 80).toUpperCase();
  if (!productSku) return null;
  return {
    productSku,
    internalProductCode: clean(source.internalProductCode, 80) || null,
    factoryCode: clean(source.factoryCode, 80) || null,
    state: 'imported',
    source: 'website_import',
    variantSkus: (Array.isArray(source.variants) ? source.variants : [])
      .filter((variant) => clean(variant.sku, 80))
      .map((variant) => ({
        sku: clean(variant.sku, 80).toUpperCase(),
        attributes: variant.attributes || {},
      })),
  };
}

function createProductEditorV2Service(options = {}) {
  const {
    store, identity, productIdentityService, productPlmStore, websiteAdapter,
    operationalLaunchService,
    authorizeUser = (user, module, action) => user.accountType === 'owner' ||
      !['approve', 'publish', 'delete', 'export', 'configure'].includes(action),
  } = options;
  const now = options.now || (() => Date.now());

  function actor(session, roles = ['owner', 'listing_editor']) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.status !== 'active' || !roles.includes(user.accountType)) {
      throw Object.assign(new Error('Authorized named-user access is required.'), { code: 'FORBIDDEN' });
    }
    return user;
  }
  function appendAudit(state, user, product, action, details = {}) {
    state.auditEvents.push({
      id: crypto.randomUUID(),
      productId: product.id,
      productUuid: product.productUuid,
      actorId: `user:${user.id}`,
      actorRole: user.accountType,
      action,
      changedFields: [...new Set(details.changedFields || [])].slice(0, 80),
      previousRevision: details.previousRevision ?? null,
      newRevision: details.newRevision ?? product.revision,
      result: details.result || 'success',
      timestamp: new Date(now()).toISOString(),
    });
  }
  function productView(product) {
    const view = structuredClone(product);
    view.websiteContent = normalizeWebsiteContent(view.websiteContent, {
      description: view.descriptionHtml || view.sections?.fullDescription,
      features: view.sections?.features,
      specifications: view.sections?.specifications,
      perfectFor: view.sections?.perfectFor,
      whyYouWillLoveIt: view.sections?.whyYouWillLoveIt,
    });
    view.classification = normalizeClassification(view.classification, {
      gender: view.organization?.gender,
      ageGroup: view.organization?.ageGroup,
    });
    view.merchantAttributes = normalizeMerchantAttributes(view.merchantAttributes, view);
    view.merchantReadiness = merchantReadiness(view.merchantAttributes, view.classification);
    view.identity = productIdentityService.view(product.productUuid).identity || view.identity;
    if (view.identity) {
      const skuByAttributes = new Map((view.identity.variantSkus || []).map((item) => [
        JSON.stringify(item.attributes || {}), item.sku,
      ]));
      view.variants = view.variants.map((variant) => ({
        ...variant,
        sku: skuByAttributes.get(JSON.stringify(variant.attributes || {})) || variant.sku,
      }));
    }
    return view;
  }
  function workspace(session, productId = null) {
    const user = actor(session);
    const state = store.read();
    const products = state.products.map(productView);
    const product = productId ? products.find((item) => item.id === productId || item.productUuid === productId) : null;
    return {
      storeRevision: state.storeRevision,
      products,
      product,
      permissions: {
        edit: true,
        submit: true,
        approve: authorizeUser(user, 'publishing', 'approve'),
        publish: authorizeUser(user, 'publishing', 'publish'),
      },
      productTypes: PRODUCT_TYPES,
      mediaLibrary: products.flatMap((item) => item.media || []).map((item) => ({
        ...item, sourceProductId: item.productId || product?.id || null,
      })),
      auditEvents: product
        ? state.auditEvents.filter((event) => event.productId === product.id).slice(-100).reverse()
        : [],
    };
  }
  function normalizeDraft(input, prior = null) {
    const pricing = input.pricing || {};
    validatePrice(pricing.price, pricing.compareAtPrice, pricing.allowLowerCompareAt === true);
    const options = normalizedOptions(input.options || []);
    const priorBySignature = new Map((prior?.variants || []).map((variant) => [variant.signature, variant]));
    const suppliedBySignature = new Map((input.variants || []).map((variant) => [variant.signature, variant]));
    const variants = optionCombinations(options).map((attributes) => {
      const signature = Object.entries(attributes).map(([key, value]) => `${key}:${value}`).join('|') || 'default';
      const supplied = suppliedBySignature.get(signature) || priorBySignature.get(signature) || {};
      validatePrice(supplied.price ?? pricing.price, supplied.compareAtPrice ?? pricing.compareAtPrice,
        pricing.allowLowerCompareAt === true);
      return {
        id: supplied.id || crypto.randomUUID(),
        signature,
        attributes,
        sku: clean(supplied.sku, 100),
        imageId: clean(supplied.imageId, 80) || null,
        price: number(supplied.price) > 0 ? number(supplied.price) : number(pricing.price),
        compareAtPrice: supplied.compareAtPrice === '' || supplied.compareAtPrice == null
          ? null : number(supplied.compareAtPrice),
        cost: supplied.cost === '' || supplied.cost == null ? null : number(supplied.cost),
        quantity: Math.max(0, Math.floor(number(supplied.quantity))),
        weight: Math.max(0, number(supplied.weight, number(input.shipping?.weight))),
        barcodeId: null,
        status: supplied.status === 'disabled' ? 'disabled' : 'active',
        availableForSale: supplied.availableForSale !== false,
      };
    });
    const handle = slugify(input.seo?.handle || input.title);
    if (!handle) throw Object.assign(new Error('A product title and URL handle are required.'), { code: 'VALIDATION' });
    const websiteContent = normalizeWebsiteContent(input.websiteContent, {
      description: input.descriptionHtml || input.sections?.fullDescription,
      features: input.sections?.features,
      specifications: input.sections?.specifications,
      perfectFor: input.sections?.perfectFor,
      whyYouWillLoveIt: input.sections?.whyYouWillLoveIt,
    });
    const classification = normalizeClassification(input.classification, {
      gender: input.organization?.gender,
      ageGroup: input.organization?.ageGroup,
    });
    const organizationGender = genderLabel(classification.gender.value, classification.ageGroup.value) ||
      clean(input.organization?.gender, 40) || 'Unisex';
    const base = {
      title: clean(input.title, 300),
      descriptionHtml: safeHtml(input.descriptionHtml),
      websiteContent,
      sections: Object.fromEntries(['shortDescription', 'fullDescription', 'features', 'specifications',
        'perfectFor', 'whyYouWillLoveIt', 'faq', 'buyingGuide'].map((key) => [key, safeHtml(input.sections?.[key])])),
      classification,
      organization: {
        brand: clean(input.organization?.brand, 160) || 'MOTOGRIP GEAR',
        vendor: clean(input.organization?.vendor, 160) || clean(input.organization?.brand, 160) || 'MOTOGRIP GEAR',
        productType: clean(input.organization?.productType, 100) || 'Other',
        category: clean(input.organization?.category, 100),
        gender: organizationGender,
        ageGroup: classification.ageGroup.value,
        collections: [...new Set((input.organization?.collections || []).map((item) => clean(item, 80)).filter(Boolean))],
        tags: [...new Set((input.organization?.tags || []).map((item) => clean(item, 80)).filter(Boolean))],
        themeTemplate: clean(input.organization?.themeTemplate, 80) || 'default',
        status: STATUS_VALUES.has(input.organization?.status) ? input.organization.status : 'draft',
      },
      pricing: {
        price: number(pricing.price),
        compareAtPrice: pricing.compareAtPrice === '' || pricing.compareAtPrice == null ? null : number(pricing.compareAtPrice),
        cost: pricing.cost === '' || pricing.cost == null ? null : number(pricing.cost),
        taxable: pricing.taxable !== false,
      },
      inventory: {
        trackInventory: input.inventory?.trackInventory === true,
        continueSellingWhenOutOfStock: input.inventory?.continueSellingWhenOutOfStock === true,
      },
      shipping: {
        physicalProduct: input.shipping?.physicalProduct !== false,
        weight: Math.max(0, number(input.shipping?.weight)),
        weightUnit: ['lb', 'oz', 'kg', 'g'].includes(input.shipping?.weightUnit) ? input.shipping.weightUnit : 'lb',
        packagePreset: clean(input.shipping?.packagePreset, 80),
        countryOfOrigin: clean(input.shipping?.countryOfOrigin, 2).toUpperCase(),
        hsCode: clean(input.shipping?.hsCode, 20),
        processingTime: clean(input.shipping?.processingTime, 80),
        shippingProfileReferenceId: null,
      },
      metafields: Object.fromEntries(Object.entries(input.metafields || {}).slice(0, 80)
        .map(([key, value]) => [clean(key, 80), typeof value === 'boolean' ? value : clean(value, 1000)])),
      seo: {
        title: clean(input.seo?.title, 160),
        metaDescription: clean(input.seo?.metaDescription, 320),
        handle,
      },
      options,
      variants,
    };
    base.sections.fullDescription = websiteContent.description.join('\n\n');
    base.sections.features = websiteContent.features.join('\n');
    base.sections.specifications = websiteContent.specifications
      .map((item) => `${item.label}: ${item.value}`).join('\n');
    base.sections.perfectFor = websiteContent.perfectFor;
    base.sections.whyYouWillLoveIt = websiteContent.whyYouWillLoveIt;
    base.merchantAttributes = normalizeMerchantAttributes(input.merchantAttributes, base);
    base.merchantReadiness = merchantReadiness(base.merchantAttributes, classification);
    return base;
  }

  async function create(session, input) {
    const user = actor(session);
    if (!authorizeUser(user, 'products', 'create')) {
      throw Object.assign(new Error('Product create permission is required.'), { code: 'FORBIDDEN' });
    }
    const productUuid = crypto.randomUUID();
    const normalized = normalizeDraft(input);
    const timestamp = new Date(now()).toISOString();
    const record = {
      id: crypto.randomUUID(),
      productUuid,
      websiteProductId: clean(input.websiteProductId, 120) || null,
      sourceHandle: clean(input.sourceHandle, 120) || null,
      revision: 1,
      workflowState: 'draft',
      ownerReviewStatus: 'not_submitted',
      websiteSyncStatus: 'not_published',
      media: [],
      identity: null,
      ...normalized,
      createdAt: timestamp,
      createdBy: `user:${user.id}`,
      updatedAt: timestamp,
      updatedBy: `user:${user.id}`,
    };
    await store.mutate((state) => {
      if (state.products.some((item) => item.seo.handle === record.seo.handle)) {
        throw Object.assign(new Error('URL handle is already used by another Product Editor draft.'), { code: 'DUPLICATE_PRODUCT' });
      }
      state.products.push(record);
      appendAudit(state, user, record, 'product_draft_created', { changedFields: ['product'] });
      return { store: state, value: record };
    }, input.expectedRevision);
    return workspace(session, record.id);
  }

  async function importWebsite(session, input) {
    const user = actor(session);
    const inspected = websiteAdapter.inspect(input.websiteProductId, input.handle);
    const source = inspected.product;
    if (!source) throw Object.assign(new Error('Website product was not found.'), { code: 'NOT_FOUND' });
    const current = store.read();
    const existing = current.products.find((item) =>
      String(item.websiteProductId) === String(source.id) || item.seo.handle === source.slug);
    const importedIdentity = importedWebsiteIdentity(source);
    if (existing) {
      if (!existing.identity?.productSku && importedIdentity) {
        await store.mutate((state) => {
          const record = state.products.find((item) => item.id === existing.id);
          if (!record || record.identity?.productSku) return { store: state, value: record };
          const previousRevision = record.revision;
          record.identity = importedIdentity;
          record.revision += 1;
          record.updatedAt = new Date(now()).toISOString();
          record.updatedBy = `user:${user.id}`;
          appendAudit(state, user, record, 'website_identity_projected', {
            changedFields: ['identity'],
            previousRevision,
            newRevision: record.revision,
          });
          return { store: state, value: record };
        });
      }
      return workspace(session, existing.id);
    }
    const sourceOptions = Array.isArray(source.options) ? source.options :
      Object.keys(source.stock || {}).length ? [{ name: 'Size', values: Object.keys(source.stock) }] : [];
    const normalized = normalizeDraft({
      title: source.title,
      descriptionHtml: source.descriptionHtml || source.description,
      sections: {
        shortDescription: source.shortDescription || '',
        fullDescription: source.description || '',
        features: source.features || '',
        specifications: source.specifications || '',
        perfectFor: source.perfectFor || '',
        whyYouWillLoveIt: source.whyYouWillLoveIt || '',
        faq: source.faq || '',
        buyingGuide: source.buyingGuide || '',
      },
      organization: {
        brand: source.brand || 'MOTOGRIP GEAR', vendor: source.maker || source.brand,
        productType: source.productType || 'Other', category: source.category || '',
        gender: source.gender || 'Unisex', ageGroup: source.ageGroup || '',
        collections: source.collections || [],
        tags: source.tags || (source.tag ? [source.tag] : []),
        themeTemplate: source.themeTemplate || 'default', status: source.status || 'draft',
      },
      pricing: { price: source.price, compareAtPrice: source.compareAtPrice, cost: source.costPerItem, taxable: source.taxable },
      inventory: { trackInventory: true, continueSellingWhenOutOfStock: false },
      shipping: source.shipping || {
        physicalProduct: true,
        weight: number(String(source.shippingWeight || '').split(' ')[0]),
        weightUnit: String(source.shippingWeight || '').split(' ')[1] || 'lb',
      },
      metafields: source.metafields || {
        outerMaterial: source.material, leatherType: source.leatherType,
        leatherThickness: source.leatherThickness, liningMaterial: source.lining,
        closure: source.closureType, hardware: source.hardware,
        armorCompatibility: source.armorCompatibility, careInstructions: source.careInstructions,
        manufacturer: source.maker,
      },
      seo: { title: source.seoTitle, metaDescription: source.metaDescription || source.seoDescription, handle: source.slug },
      classification: source.classification || {
        gender: { value: source.gender, confidence: 'low', status: 'needs_confirmation', source: 'website_import' },
        ageGroup: { value: source.ageGroup, confidence: 'low', status: 'needs_confirmation', source: 'website_import' },
      },
      merchantAttributes: source.merchantAttributes || {
        gender: source.gender, age_group: source.ageGroup, color: source.color,
        material: source.material || source.leatherType, pattern: source.pattern,
        condition: source.condition, availability: source.availability,
        brand: source.brand, size_system: source.sizeSystem, size_type: source.sizeType,
        product_type: source.productType, google_product_category: source.googleProductCategory,
        mpn: source.mpn, gtin: source.gtin, identifier_exists: source.identifierExists,
      },
      options: sourceOptions,
      variants: Array.isArray(source.variants) ? source.variants :
        Object.entries(source.stock || {}).map(([size, quantity]) => ({
          signature: `size:${size}`, attributes: { size }, sku: '', price: source.price,
          compareAtPrice: source.compareAtPrice, quantity,
        })),
    });
    const timestamp = new Date(now()).toISOString();
    const mediaPaths = [source.primaryImage || source.image, ...(source.galleryImages || [])]
      .map((mediaPath) => canonicalMediaUrl(mediaPath, { fallback: null }))
      .filter(Boolean);
    const record = {
      id: crypto.randomUUID(),
      productUuid: clean(input.productUuid, 80) || crypto.randomUUID(),
      websiteProductId: String(source.id),
      sourceHandle: source.slug,
      websiteRevision: inspected.revision,
      revision: 1,
      workflowState: 'live',
      ownerReviewStatus: 'approved',
      websiteSyncStatus: 'synced',
      media: mediaPaths.map((mediaPath, order) => ({
        id: crypto.randomUUID(), productId: null, path: mediaPath,
        originalName: path.basename(mediaPath), mimeType: '', size: null,
        altText: source.imageAltText || source.title, title: source.title,
        role: order === 0 ? 'Front' : 'Other', featured: order === 0, order,
        createdAt: timestamp, createdBy: 'website-import',
      })),
      identity: productIdentityService.view(clean(input.productUuid, 80)).identity || importedIdentity,
      ...normalized,
      createdAt: timestamp, createdBy: `user:${user.id}`, updatedAt: timestamp, updatedBy: `user:${user.id}`,
    };
    record.media.forEach((item) => { item.productId = record.id; });
    await store.mutate((state) => {
      state.products.push(record);
      appendAudit(state, user, record, 'website_product_imported', { changedFields: ['product'] });
      return { store: state, value: record };
    }, input.expectedRevision);
    return workspace(session, record.id);
  }

  async function save(session, input) {
    const user = actor(session);
    await store.mutate((state) => {
      const record = state.products.find((item) => item.id === input.productId);
      if (!record) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
      if (['submitted', 'approved', 'publishing'].includes(record.workflowState)) {
        throw Object.assign(new Error('Create or reopen an editable revision before changing this product.'), { code: 'WORKFLOW_CONFLICT' });
      }
      const normalized = normalizeDraft(input, record);
      const duplicate = state.products.find((item) => item.id !== record.id && item.seo.handle === normalized.seo.handle);
      if (duplicate) throw Object.assign(new Error('URL handle is already used by another Product Editor draft.'), { code: 'DUPLICATE_PRODUCT' });
      const previousRevision = record.revision;
      Object.assign(record, normalized, {
        revision: record.revision + 1,
        workflowState: record.workflowState === 'changes_requested' ? 'draft' : record.workflowState,
        updatedAt: new Date(now()).toISOString(),
        updatedBy: `user:${user.id}`,
      });
      appendAudit(state, user, record, 'product_draft_saved', {
        changedFields: Object.keys(normalized),
        previousRevision,
      });
      return { store: state, value: record };
    }, input.expectedRevision);
    return workspace(session, input.productId);
  }

  async function uploadMedia(session, input) {
    const user = actor(session);
    if (!authorizeUser(user, 'media', 'create')) {
      throw Object.assign(new Error('Media upload permission is required.'), { code: 'FORBIDDEN' });
    }
    const type = MEDIA_TYPES.get(clean(input.mimeType, 80).toLowerCase());
    if (!type) throw Object.assign(new Error('Only JPG, PNG and WEBP images are supported.'), { code: 'VALIDATION' });
    let bytes;
    try { bytes = Buffer.from(String(input.dataBase64 || ''), 'base64'); } catch { bytes = Buffer.alloc(0); }
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
      throw Object.assign(new Error('Image must be between 1 byte and 5 MB.'), { code: 'VALIDATION' });
    }
    if (!type.signatures.some((signature) => signature.every((byte, index) => bytes[index] === byte)) ||
        (input.mimeType === 'image/webp' && bytes.slice(8, 12).toString() !== 'WEBP')) {
      throw Object.assign(new Error('Image content does not match its declared format.'), { code: 'VALIDATION' });
    }
    const id = crypto.randomUUID();
    const directory = path.join(store.paths.mediaDir, input.productId);
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const fileName = `${id}${type.extension}`;
    const finalPath = path.join(directory, fileName);
    const temporaryPath = `${finalPath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, bytes, { mode: 0o600 });
    fs.renameSync(temporaryPath, finalPath);
    try {
      await store.mutate((state) => {
        const product = state.products.find((item) => item.id === input.productId);
        if (!product) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
        const media = {
          id,
          productId: product.id,
          path: `/product-editor-media/${product.id}/${fileName}`,
          originalName: path.basename(clean(input.fileName, 160)).replace(/[^a-zA-Z0-9._ -]/g, '_'),
          mimeType: input.mimeType,
          size: bytes.length,
          altText: clean(input.altText, 300),
          title: clean(input.title, 200),
          role: MEDIA_ROLES.has(input.role) ? input.role : 'Other',
          featured: product.media.length === 0,
          order: product.media.length,
          createdAt: new Date(now()).toISOString(),
          createdBy: `user:${user.id}`,
        };
        product.media.push(media);
        product.revision += 1;
        appendAudit(state, user, product, 'product_media_uploaded', { changedFields: ['media'] });
        return { store: state, value: media };
      }, input.expectedRevision);
    } catch (error) {
      try { fs.unlinkSync(finalPath); } catch {}
      throw error;
    }
    return workspace(session, input.productId);
  }

  async function updateMedia(session, input) {
    const user = actor(session);
    if (!authorizeUser(user, 'media', 'edit')) {
      throw Object.assign(new Error('Media edit permission is required.'), { code: 'FORBIDDEN' });
    }
    await store.mutate((state) => {
      const product = state.products.find((item) => item.id === input.productId);
      if (!product) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
      const ids = new Set(product.media.map((item) => item.id));
      const ordered = (input.media || []).filter((item) => ids.has(item.id));
      if (ordered.length !== product.media.length) throw Object.assign(new Error('Media update is incomplete.'), { code: 'VALIDATION' });
      const featuredId = ordered.find((item) => item.featured)?.id || ordered[0]?.id;
      product.media = ordered.map((item, order) => {
        const prior = product.media.find((current) => current.id === item.id);
        return {
          ...prior,
          order,
          featured: item.id === featuredId,
          altText: clean(item.altText, 300),
          title: clean(item.title, 200),
          role: MEDIA_ROLES.has(item.role) ? item.role : prior.role,
        };
      });
      product.revision += 1;
      appendAudit(state, user, product, 'product_media_updated', { changedFields: ['media'] });
      return { store: state, value: product };
    }, input.expectedRevision);
    return workspace(session, input.productId);
  }

  async function attachMedia(session, input) {
    const user = actor(session);
    await store.mutate((state) => {
      const product = state.products.find((item) => item.id === input.productId);
      const source = state.products.flatMap((item) => item.media)
        .find((item) => item.id === input.sourceMediaId);
      if (!product || !source) throw Object.assign(new Error('Media Library asset was not found.'), { code: 'NOT_FOUND' });
      if (product.media.some((item) => item.path === source.path)) {
        throw Object.assign(new Error('This media asset is already attached.'), { code: 'CONFLICT' });
      }
      product.media.push({
        ...structuredClone(source),
        id: crypto.randomUUID(),
        productId: product.id,
        featured: product.media.length === 0,
        order: product.media.length,
        createdAt: new Date(now()).toISOString(),
        createdBy: `user:${user.id}`,
      });
      product.revision += 1;
      appendAudit(state, user, product, 'product_media_library_attached', { changedFields: ['media'] });
      return { store: state, value: product };
    }, input.expectedRevision);
    return workspace(session, input.productId);
  }

  async function removeMedia(session, input) {
    const user = actor(session);
    let removedPath = null;
    await store.mutate((state) => {
      const product = state.products.find((item) => item.id === input.productId);
      if (!product) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
      const media = product.media.find((item) => item.id === input.mediaId);
      if (!media) throw Object.assign(new Error('Media was not found.'), { code: 'NOT_FOUND' });
      removedPath = path.join(store.paths.mediaDir, product.id, path.basename(media.path));
      product.media = product.media.filter((item) => item.id !== media.id)
        .map((item, order) => ({ ...item, order }));
      if (product.media.length && !product.media.some((item) => item.featured)) product.media[0].featured = true;
      product.revision += 1;
      appendAudit(state, user, product, 'product_media_removed', { changedFields: ['media'] });
      return { store: state, value: product };
    }, input.expectedRevision);
    try { fs.unlinkSync(removedPath); } catch {}
    return workspace(session, input.productId);
  }

  async function ensurePlmFoundation(user, product) {
    if (productPlmStore.read().productIdentities.some((item) => item.id === product.productUuid)) return;
    await productPlmStore.mutate((draft) => {
      const timestamp = new Date(now()).toISOString();
      let legalEntity = draft.legalEntities.find((item) => item.legalName === DEFAULT_LEGAL_ENTITY);
      if (!legalEntity) {
        legalEntity = {
          id: crypto.randomUUID(), schemaVersion: 1, legalName: DEFAULT_LEGAL_ENTITY,
          tradingName: 'MOTOGRIP GEAR', entityType: 'limited_liability_company',
          countryCode: 'US', registrationReference: null, status: 'active',
          dataClassification: 'confidential', createdAt: timestamp, createdBy: `user:${user.id}`,
          updatedAt: timestamp, updatedBy: `user:${user.id}`,
        };
        draft.legalEntities.push(legalEntity);
      }
      seedInitialBrands(draft.brands, timestamp, `user:${user.id}`, legalEntity.id);
      const brandDefinition = brandDefinitionForName(product.organization.brand) || brandDefinitionForName('MOTOGRIP GEAR');
      const brand = draft.brands.find((item) => item.code === brandDefinition.code);
      const identityRecord = {
        id: product.productUuid, schemaVersion: 1, brandId: brand.id,
        legalEntityId: legalEntity.id, displayName: product.title, identityStatus: 'active',
        dataClassification: 'internal',
        originalMediaReferences: product.media.map((media) => ({
          sourceSystem: 'product-editor-v2', reference: media.path, role: media.featured ? 'primary' : 'gallery',
        })),
        extensionReferences: { leatherMaterials: [], patterns: [], boms: [], marketplaceExternalIds: [] },
        productBrainReferences: emptyProductBrainReferences(),
        createdAt: timestamp, createdBy: `user:${user.id}`, updatedAt: timestamp, updatedBy: `user:${user.id}`,
      };
      draft.productIdentities.push(identityRecord);
      const proposal = hierarchyProposal({
        title: product.title, brandName: brand.name,
        category: product.organization.category, productType: product.organization.productType,
        legacySlug: product.seo.handle,
      });
      proposal.styleName = product.title;
      const family = findOrCreateFamily(draft, proposal, brand, legalEntity, timestamp, `user:${user.id}`);
      createStyle(draft, identityRecord, family, proposal, timestamp, `user:${user.id}`);
      return { store: draft, value: identityRecord };
    });
  }

  async function submit(session, input) {
    const user = actor(session);
    await store.mutate((state) => {
      const product = state.products.find((item) => item.id === input.productId);
      if (!product) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
      if (!['draft', 'changes_requested'].includes(product.workflowState)) {
        throw Object.assign(new Error('Only an editable draft can be submitted.'), { code: 'WORKFLOW_CONFLICT' });
      }
      product.workflowState = 'submitted';
      product.ownerReviewStatus = 'pending';
      product.revision += 1;
      appendAudit(state, user, product, 'product_submitted_for_review', { changedFields: ['workflowState'] });
      return { store: state, value: product };
    }, input.expectedRevision);
    return workspace(session, input.productId);
  }

  async function review(session, input, action) {
    const user = actor(session);
    if (!authorizeUser(user, 'publishing', 'approve')) {
      throw Object.assign(new Error('Approval permission is required.'), { code: 'FORBIDDEN' });
    }
    const current = store.read();
    const product = current.products.find((item) => item.id === input.productId);
    if (!product) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
    if (action === 'approve') await ensurePlmFoundation(user, product);
    await store.mutate(async (state) => {
      const target = state.products.find((item) => item.id === input.productId);
      if (target.workflowState !== 'submitted') {
        throw Object.assign(new Error('The submitted product revision changed.'), { code: 'REVISION_CONFLICT' });
      }
      target.workflowState = action === 'approve' ? 'approved' : 'changes_requested';
      target.ownerReviewStatus = action === 'approve' ? 'approved' : 'changes_requested';
      target.reviewNote = clean(input.note, 1000);
      target.revision += 1;
      appendAudit(state, user, target, action === 'approve' ? 'product_owner_approved' : 'product_changes_requested', {
        changedFields: ['workflowState', 'ownerReviewStatus'],
      });
      return { store: state, value: target };
    }, input.expectedRevision);
    if (action === 'approve') {
      const latest = store.read().products.find((item) => item.id === input.productId);
      const identityInput = {
        productUuid: latest.productUuid,
        brand: latest.organization.brand,
        productType: latest.organization.productType,
        title: latest.title,
        variants: latest.variants.map((variant) => variant.attributes),
        sellableAttributeKeys: latest.options.map((option) => optionCode(option.name)),
        existingSku: latest.identity?.productSku || undefined,
      };
      let identityView = productIdentityService.view(latest.productUuid);
      if (!identityView.identity) identityView = await productIdentityService.generate(session, identityInput);
      await store.mutate((state) => {
        const target = state.products.find((item) => item.id === input.productId);
        target.identity = identityView.identity;
        const skuBySignature = new Map(identityView.identity.variantSkus.map((item) => [
          Object.entries(item.attributes).map(([key, value]) => `${key}:${value}`).join('|') || 'default',
          item.sku,
        ]));
        target.variants = target.variants.map((variant) => ({
          ...variant, sku: skuBySignature.get(variant.signature) || variant.sku,
        }));
        appendAudit(state, user, target, 'product_identity_attached', { changedFields: ['identity', 'variants'] });
        return { store: state, value: target };
      });
    }
    return workspace(session, input.productId);
  }

  function criticalFields(product) {
    return [
      ['title', product.title],
      ['primary image', product.media.some((item) => item.featured) || product.media.length === 1],
      ['category', product.organization.category],
      ['price', Number.isFinite(product.pricing.price) && product.pricing.price > 0],
      ['product status', STATUS_VALUES.has(product.organization.status) && product.organization.status !== 'archived'],
    ].filter(([, present]) => !present).map(([label]) => label);
  }

  function publicationFields(product, identityRecord = null) {
    const featured = product.media.find((item) => item.featured) || product.media[0];
    const stock = Object.fromEntries(product.variants.map((variant) => [variant.sku, variant.quantity]));
    return {
      title: product.title,
      description: product.websiteContent.description.join('\n\n'),
      descriptionHtml: product.descriptionHtml,
      websiteContent: product.websiteContent,
      shortDescription: product.sections.shortDescription,
      features: product.sections.features,
      specifications: product.sections.specifications,
      perfectFor: product.sections.perfectFor,
      whyYouWillLoveIt: product.sections.whyYouWillLoveIt,
      faq: product.sections.faq,
      buyingGuide: product.sections.buyingGuide,
      seoTitle: product.seo.title,
      metaDescription: product.seo.metaDescription,
      slug: product.seo.handle,
      brand: product.organization.brand,
      maker: product.organization.vendor,
      productType: product.organization.productType,
      category: product.organization.category,
      gender: product.organization.gender,
      ageGroup: product.classification.ageGroup.value,
      classification: product.classification,
      merchantAttributes: product.merchantAttributes,
      merchantReadiness: product.merchantReadiness,
      collections: product.organization.collections,
      tags: product.organization.tags,
      status: product.organization.status === 'draft' ? 'active' : product.organization.status,
      price: product.pricing.price,
      compareAtPrice: product.pricing.compareAtPrice,
      costPerItem: product.pricing.cost,
      taxable: product.pricing.taxable,
      image: featured?.path || '',
      primaryImage: featured?.path || '',
      galleryImages: product.media.filter((item) => item.id !== featured?.id).map((item) => item.path),
      imageMetadata: product.media,
      options: product.options,
      variants: product.variants,
      variantOptions: product.options.map((option) => option.name),
      availableColors: product.options.find((option) => option.name.toLowerCase() === 'color')?.values || [],
      stock,
      inventory: product.variants.reduce((total, variant) => total + variant.quantity, 0),
      trackInventory: product.inventory.trackInventory,
      continueSellingWhenOutOfStock: product.inventory.continueSellingWhenOutOfStock,
      sku: identityRecord?.productSku || product.identity?.productSku || '',
      internalProductCode: identityRecord?.internalProductCode || product.identity?.internalProductCode || '',
      factoryCode: identityRecord?.factoryCode || product.identity?.factoryCode || '',
      shipping: product.shipping,
      shippingWeight: `${product.shipping.weight} ${product.shipping.weightUnit}`,
      metafields: product.metafields,
      factualProjection: true,
    };
  }

  function preview(session, productId) {
    actor(session);
    const product = store.read().products.find((item) => item.id === productId);
    if (!product) throw Object.assign(new Error('Product draft was not found.'), { code: 'NOT_FOUND' });
    const identityRecord = productIdentityService.view(product.productUuid).identity;
    return {
      product: {
        id: product.websiteProductId || product.productUuid,
        ...publicationFields(productView(product), identityRecord),
      },
      missingQuickListingFields: criticalFields(product),
      previewOnly: true,
    };
  }

  async function publish(session, input) {
    const user = actor(session);
    if (!authorizeUser(user, 'publishing', 'publish')) {
      throw Object.assign(new Error('Publishing permission is required.'), { code: 'FORBIDDEN' });
    }
    const state = store.read();
    const product = state.products.find((item) => item.id === input.productId);
    const idempotencyKey = clean(input.idempotencyKey, 200);
    if (!idempotencyKey) throw Object.assign(new Error('An idempotency key is required.'), { code: 'VALIDATION' });
    if (state.idempotencyKeys.some((item) => item.key === idempotencyKey)) return workspace(session, input.productId);
    if (!product || product.workflowState !== 'approved') {
      throw Object.assign(new Error('Owner approval is required.'), { code: 'APPROVAL_REQUIRED' });
    }
    if (criticalFields(product).length) {
      throw Object.assign(new Error(`Missing critical fields: ${criticalFields(product).join(', ')}.`), { code: 'MISSING_CRITICAL' });
    }
    const identityRecord = productIdentityService.view(product.productUuid).identity;
    if (!identityRecord || identityRecord.state !== 'locked') {
      throw Object.assign(new Error('A locked Product Identity is required.'), { code: 'IDENTITY_NOT_LOCKED' });
    }
    const plm = productPlmStore.read();
    const release = [...plm.productReleases].reverse().find((item) => {
      if (item.productUuid !== product.productUuid) return false;
      const lifecycle = plm.releaseLifecycleEvents.filter((event) => event.releaseId === item.id);
      return lifecycle.some((event) => event.eventCode === 'release_activated');
    });
    const knowledgeLock = [...plm.knowledgeLocks].reverse().find((item) =>
      item.productUuid === product.productUuid && item.releaseId === release?.id);
    if (!release || !knowledgeLock) {
      throw Object.assign(new Error('A trusted Product Release and valid Knowledge Lock are required.'), { code: 'UNTRUSTED_RELEASE' });
    }
    const website = websiteAdapter.inspect(product.websiteProductId, product.sourceHandle || product.seo.handle);
    const publication = await websiteAdapter.publish({
      websiteProductId: product.websiteProductId || product.productUuid,
      currentHandle: product.sourceHandle || product.seo.handle,
      expectedWebsiteRevision: input.expectedWebsiteRevision || website.revision,
      fields: publicationFields(product, identityRecord),
    });
    await store.mutate((next) => {
      const target = next.products.find((item) => item.id === product.id);
      target.websiteProductId = publication.product.id;
      target.sourceHandle = publication.product.slug;
      target.websiteSyncStatus = 'synced';
      target.workflowState = 'live';
      target.organization.status = publication.product.status;
      target.websiteRevision = publication.newRevision;
      target.publishedAt = new Date(now()).toISOString();
      target.publishedBy = `user:${user.id}`;
      target.revision += 1;
      next.idempotencyKeys.push({ key: idempotencyKey, productId: target.id, createdAt: target.publishedAt });
      appendAudit(next, user, target, 'product_published', {
        changedFields: Object.keys(publication.product),
        previousRevision: publication.previousRevision,
        newRevision: publication.newRevision,
      });
      return { store: next, value: target };
    }, input.expectedRevision);
    operationalLaunchService.announce({ type: 'website.published', productUuid: product.productUuid, revision: publication.newRevision });
    return workspace(session, product.id);
  }

  async function revise(session, input) {
    const user = actor(session);
    await store.mutate((state) => {
      const product = state.products.find((item) => item.id === input.productId);
      if (!product || product.workflowState !== 'live') {
        throw Object.assign(new Error('Only a live product can start a new revision.'), { code: 'WORKFLOW_CONFLICT' });
      }
      product.workflowState = 'draft';
      product.ownerReviewStatus = 'not_submitted';
      product.revision += 1;
      appendAudit(state, user, product, 'product_revision_created', { changedFields: ['workflowState'] });
      return { store: state, value: product };
    }, input.expectedRevision);
    return workspace(session, input.productId);
  }

  async function backfillMediaPaths() {
    const current = store.read();
    const changes = current.products.flatMap((product) => (product.media || []).flatMap((media) => {
      const normalized = canonicalMediaUrl(media.path, { fallback: null });
      return normalized && normalized !== media.path
        ? [{ productId: product.id, mediaId: media.id, normalized }]
        : [];
    }));
    if (!changes.length) return { changed: 0 };
    const result = await store.mutate((state) => {
      const timestamp = new Date(now()).toISOString();
      let changed = 0;
      for (const change of changes) {
        const product = state.products.find((item) => item.id === change.productId);
        const media = product?.media?.find((item) => item.id === change.mediaId);
        if (!media || media.path === change.normalized) continue;
        media.path = change.normalized;
        product.updatedAt = timestamp;
        state.auditEvents.push({
          id: crypto.randomUUID(),
          productId: product.id,
          actorId: 'system:media-path-backfill',
          action: 'product_media_path_normalized',
          changedFields: ['media.path'],
          mediaId: media.id,
          result: 'success',
          timestamp,
        });
        changed += 1;
      }
      return { store: state, value: changed };
    });
    return { changed: result.value };
  }

  return {
    workspace, create, importWebsite, save, uploadMedia, updateMedia, attachMedia, removeMedia, backfillMediaPaths, submit,
    approve: (session, input) => review(session, input, 'approve'),
    requestChanges: (session, input) => review(session, input, 'request_changes'),
    publish, revise, preview, criticalFields,
  };
}

module.exports = {
  PRODUCT_TYPES,
  createProductEditorV2Service,
  normalizedOptions,
  optionCombinations,
  safeHtml,
};
