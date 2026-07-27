const crypto = require('crypto');
const { canonicalMediaUrl } = require('./media-url');

const GRID_ACTIONS = new Set(['archive', 'hide', 'restore', 'delete']);
const BULK_FIELDS = new Set([
  'price', 'compareAtPrice', 'inventory', 'status', 'brand', 'category',
  'collections', 'tags', 'weight', 'physicalProduct', 'processingTime',
  'variantInventory', 'variantPrice', 'productType',
]);

function text(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}
function finite(value, label, nullable = false) {
  if (nullable && (value === '' || value === null || value === undefined)) return null;
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) {
    throw Object.assign(new Error(`${label} must be a non-negative number.`), { code: 'VALIDATION' });
  }
  return result;
}
function stringList(value) {
  return [...new Set((Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => text(item, 80)).filter(Boolean))].slice(0, 100);
}
const imageUrl = (value = '') => canonicalMediaUrl(value);
function createProductManagementGridService(options = {}) {
  const {
    store, identity, editorService, listingStore, readWebsiteCatalog, websiteAdapter, announce = () => {},
    authorizeUser = (user, module, action) => user.accountType === 'owner' ||
      !['approve', 'publish', 'delete', 'export', 'configure'].includes(action),
  } = options;
  const now = options.now || (() => Date.now());

  function actor(session) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.status !== 'active' || !['owner', 'listing_editor'].includes(user.accountType)) {
      throw Object.assign(new Error('Authorized named-user access is required.'), { code: 'FORBIDDEN' });
    }
    return user;
  }
  function viewer(session) {
    if (session?.actorType === 'named_user') return actor(session);
    if (session?.actorType === 'legacy_owner') {
      return { id: 'legacy-compatibility', status: 'active', accountType: 'legacy_owner' };
    }
    throw Object.assign(new Error('Authenticated admin access is required.'), { code: 'FORBIDDEN' });
  }
  function permissions(user) {
    const canEdit = authorizeUser(user, 'products', 'edit');
    return {
      edit: canEdit,
      duplicate: canEdit,
      archive: canEdit,
      hide: canEdit,
      restore: canEdit,
      bulkEdit: authorizeUser(user, 'products', 'bulkEdit'),
      export: authorizeUser(user, 'products', 'export'),
      delete: user.accountType === 'owner',
      publish: authorizeUser(user, 'publishing', 'publish'),
      overrideSku: false,
      modifyIdentity: false,
      modifyGovernance: false,
    };
  }
  function managementStatus(product) {
    if (product.managementState === 'deleted') return 'Deleted';
    if (product.managementState === 'hidden') return 'Hidden';
    if (product.managementState === 'archived' || product.organization?.status === 'archived') return 'Archived';
    if (product.workflowState === 'live' || product.organization?.status === 'active') return 'Live';
    return 'Draft';
  }
  function syncStatus(product) {
    if (product.websiteSyncStatus === 'failed') return 'Sync Error';
    if (product.websiteSyncStatus === 'synced') return 'Synced';
    if (product.ownerReviewStatus === 'submitted') return 'Needs Review';
    return 'Not Synced';
  }
  function projectEditor(product, drafts = []) {
    const variants = (product.variants || []).filter((variant) => variant.status !== 'disabled');
    const identityRecord = product.identity || {};
    const priceValues = variants.map((variant) => Number(variant.price)).filter(Number.isFinite);
    const inventory = variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.quantity || 0)), 0);
    const media = [...(product.media || [])].sort((a, b) => Number(a.order) - Number(b.order));
    return {
      id: product.id,
      editorProductId: product.id,
      productUuid: product.productUuid,
      websiteProductId: product.websiteProductId || null,
      source: 'product_editor_v2',
      title: product.title,
      handle: product.seo?.handle || product.sourceHandle || '',
      image: imageUrl(media.find((item) => item.featured)?.path || media[0]?.path),
      sku: identityRecord.productSku || '',
      variantSkus: variants.map((variant) => variant.sku).filter(Boolean),
      status: managementStatus(product),
      inventory,
      outOfStock: variants.length > 0 && inventory === 0,
      variantCount: variants.length,
      price: Number(product.pricing?.price ?? (priceValues.length ? Math.min(...priceValues) : 0)),
      compareAtPrice: product.pricing?.compareAtPrice ?? null,
      brand: product.organization?.brand || '',
      category: product.organization?.category || '',
      productType: product.organization?.productType || '',
      collections: product.organization?.collections || [],
      tags: product.organization?.tags || [],
      syncStatus: syncStatus(product),
      lastUpdated: product.updatedAt || product.createdAt || null,
      missingImages: media.length === 0,
      revision: product.revision,
      storeRevision: null,
      workflowState: product.workflowState,
      reviewStatus: product.ownerReviewStatus,
      websiteSyncStatus: product.websiteSyncStatus,
      options: product.options || [],
      variants,
      seo: product.seo || {},
      activityCount: 0,
      recentDrafts: drafts.filter((draft) => draft.productUuid === product.productUuid)
        .slice(-5).reverse().map((draft) => ({
          id: draft.id,
          version: draft.version,
          createdAt: draft.createdAt,
          approvalState: draft.approvalState || draft.reviewState || 'draft',
        })),
    };
  }
  function projectLegacy(product) {
    const variants = Array.isArray(product.variants) ? product.variants : Object.entries(product.stock || {}).map(([size, quantity]) => ({
      attributes: { size }, quantity, price: product.price, sku: '',
    }));
    return {
      id: `website:${product.id}`,
      editorProductId: null,
      productUuid: null,
      websiteProductId: String(product.id),
      source: 'website_legacy',
      title: product.title,
      handle: product.slug,
      image: imageUrl(product.primaryImage || product.image),
      sku: product.sku || '',
      variantSkus: variants.map((variant) => variant.sku).filter(Boolean),
      status: product.status === 'archived' ? 'Archived' : product.status === 'active' ? 'Live' : 'Draft',
      inventory: variants.length
        ? variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.quantity || 0)), 0)
        : Number(product.inventory || 0),
      outOfStock: Number(product.inventory || 0) <= 0,
      variantCount: variants.length,
      price: Number(product.price || 0),
      compareAtPrice: product.compareAtPrice ?? null,
      brand: product.brand || product.maker || '',
      category: product.category || '',
      productType: product.productType || '',
      collections: product.collections || [],
      tags: product.tags || (product.tag ? [product.tag] : []),
      syncStatus: 'Website Source',
      lastUpdated: product.updatedAt || null,
      missingImages: !(product.primaryImage || product.image),
      revision: null,
      workflowState: 'legacy',
      reviewStatus: 'not_migrated',
      websiteSyncStatus: 'website_source',
      options: product.options || [],
      variants,
      seo: { title: product.seoTitle || '', metaDescription: product.seoDescription || '', handle: product.slug },
      activityCount: 0,
      recentDrafts: [],
    };
  }
  function grid(session) {
    const user = viewer(session);
    const state = store.read();
    const drafts = listingStore?.read?.().drafts || [];
    const editorRows = state.products.map((product) => projectEditor(product, drafts));
    const website = readWebsiteCatalog();
    const claimed = new Set(editorRows.flatMap((row) => [String(row.websiteProductId || ''), row.handle]).filter(Boolean));
    const legacyRows = (website.products || [])
      .filter((product) => !claimed.has(String(product.id)) && !claimed.has(product.slug))
      .map(projectLegacy);
    const auditCount = new Map();
    for (const event of state.auditEvents) auditCount.set(event.productId, (auditCount.get(event.productId) || 0) + 1);
    const rows = [...editorRows, ...legacyRows]
      .filter((row) => row.status !== 'Deleted')
      .map((row) => ({ ...row, storeRevision: state.storeRevision, activityCount: auditCount.get(row.editorProductId) || 0 }));
    const counts = {
      total: rows.length,
      live: rows.filter((row) => row.status === 'Live').length,
      draft: rows.filter((row) => row.status === 'Draft').length,
      archived: rows.filter((row) => row.status === 'Archived').length,
      hidden: rows.filter((row) => row.status === 'Hidden').length,
      needsReview: rows.filter((row) => row.syncStatus === 'Needs Review').length,
      syncErrors: rows.filter((row) => row.syncStatus === 'Sync Error').length,
      outOfStock: rows.filter((row) => row.outOfStock).length,
    };
    return { schemaVersion: 1, storeRevision: state.storeRevision, products: rows, counts, permissions: permissions(user) };
  }
  async function resolveEditorProduct(session, id) {
    const state = store.read();
    const existing = state.products.find((product) => product.id === id);
    if (existing) return existing.id;
    if (!String(id).startsWith('website:')) {
      throw Object.assign(new Error('Product was not found.'), { code: 'NOT_FOUND' });
    }
    const result = await editorService.importWebsite(session, { websiteProductId: String(id).slice(8) });
    return result.product.id;
  }
  function appendAudit(state, user, product, action, changedFields) {
    state.auditEvents.push({
      id: crypto.randomUUID(),
      productId: product.id,
      productUuid: product.productUuid,
      actorId: `user:${user.id}`,
      actorRole: user.accountType,
      action,
      changedFields: [...new Set(changedFields)].slice(0, 80),
      previousRevision: product.revision - 1,
      newRevision: product.revision,
      result: 'success',
      timestamp: new Date(now()).toISOString(),
    });
  }
  function applyBulkValues(product, values) {
    const changed = [];
    const unknown = Object.keys(values).filter((key) => !BULK_FIELDS.has(key));
    if (unknown.length) throw Object.assign(new Error('Unsupported bulk field.'), { code: 'VALIDATION' });
    if ('sku' in values || 'productSku' in values || 'identity' in values) {
      throw Object.assign(new Error('Locked Product Identity fields cannot be edited here.'), { code: 'IDENTITY_LOCKED' });
    }
    if ('price' in values) {
      product.pricing.price = finite(values.price, 'Price');
      changed.push('pricing.price');
    }
    if ('compareAtPrice' in values) {
      product.pricing.compareAtPrice = finite(values.compareAtPrice, 'Compare price', true);
      changed.push('pricing.compareAtPrice');
    }
    if ('brand' in values) { product.organization.brand = text(values.brand, 160); changed.push('organization.brand'); }
    if ('category' in values) { product.organization.category = text(values.category, 100); changed.push('organization.category'); }
    if ('productType' in values) { product.organization.productType = text(values.productType, 100); changed.push('organization.productType'); }
    if ('collections' in values) { product.organization.collections = stringList(values.collections); changed.push('organization.collections'); }
    if ('tags' in values) { product.organization.tags = stringList(values.tags); changed.push('organization.tags'); }
    if ('status' in values) {
      const status = text(values.status, 30).toLowerCase();
      if (!['draft', 'active', 'archived', 'hidden'].includes(status)) {
        throw Object.assign(new Error('Unsupported product status.'), { code: 'VALIDATION' });
      }
      product.managementState = status === 'hidden' ? 'hidden' : status === 'archived' ? 'archived' : 'active';
      product.organization.status = status === 'hidden' ? 'draft' : status;
      changed.push('status');
    }
    if ('weight' in values) { product.shipping.weight = finite(values.weight, 'Weight'); changed.push('shipping.weight'); }
    if ('physicalProduct' in values) { product.shipping.physicalProduct = values.physicalProduct === true; changed.push('shipping.physicalProduct'); }
    if ('processingTime' in values) { product.shipping.processingTime = text(values.processingTime, 80); changed.push('shipping.processingTime'); }
    const quantity = 'variantInventory' in values ? values.variantInventory : values.inventory;
    if (quantity !== undefined) {
      const next = Math.floor(finite(quantity, 'Inventory'));
      product.variants.forEach((variant) => { variant.quantity = next; });
      changed.push('variants.quantity');
    }
    if ('variantPrice' in values) {
      const price = finite(values.variantPrice, 'Variant price');
      product.variants.forEach((variant) => { variant.price = price; });
      changed.push('variants.price');
    }
    return changed;
  }
  async function mutate(session, input) {
    const user = actor(session);
    const requiredAction = input.action === 'bulk_edit' ? 'bulkEdit' : input.action === 'delete' ? 'delete' : 'edit';
    if (!authorizeUser(user, 'products', requiredAction) ||
        (input.action === 'delete' && user.accountType !== 'owner')) {
      throw Object.assign(new Error(input.action === 'delete'
        ? 'Owner access is required.'
        : 'Product management permission is required.'), { code: 'FORBIDDEN' });
    }
    const ids = [...new Set((input.productIds || []).map(String))].slice(0, 1000);
    if (!ids.length) throw Object.assign(new Error('Select at least one product.'), { code: 'VALIDATION' });
    const importsWebsiteSource = ids.some((id) => id.startsWith('website:'));
    const resolved = [];
    for (const id of ids) resolved.push(await resolveEditorProduct(session, id));
    const result = await store.mutate(async (state) => {
      const changedProducts = [];
      const statusInputs = GRID_ACTIONS.has(input.action) && input.action !== 'delete'
        ? resolved.map((id) => state.products.find((item) => item.id === id))
          .filter((product) => product?.websiteProductId)
          .map((product) => ({
            websiteProductId: product.websiteProductId,
            currentHandle: product.sourceHandle || product.seo?.handle,
            expectedWebsiteRevision: product.websiteRevision,
            status: input.action === 'restore' ? 'active' : input.action === 'hide' ? 'hidden' : input.action,
          }))
        : [];
      const statusChanges = statusInputs.length && websiteAdapter?.setStatuses
        ? await websiteAdapter.setStatuses(statusInputs)
        : [];
      const statusById = new Map(statusChanges.map((change) => [String(change.product.id), change]));
      for (const id of resolved) {
        const product = state.products.find((item) => item.id === id);
        if (!product) throw Object.assign(new Error('Product was not found.'), { code: 'NOT_FOUND' });
        let changed = [];
        if (input.action === 'bulk_edit') {
          changed = applyBulkValues(product, input.values || {});
        } else if (GRID_ACTIONS.has(input.action)) {
          if (input.action === 'delete' && user.accountType !== 'owner') {
            throw Object.assign(new Error('Named Owner access is required to delete products.'), { code: 'FORBIDDEN' });
          }
          product.previousManagementState = product.managementState || product.organization.status || 'draft';
          product.managementState = input.action === 'restore'
            ? 'active'
            : input.action === 'delete'
              ? 'deleted'
              : input.action === 'hide'
                ? 'hidden'
                : input.action;
          if (input.action === 'archive') product.organization.status = 'archived';
          if (input.action === 'hide') product.organization.status = 'hidden';
          if (input.action === 'restore') product.organization.status = product.workflowState === 'live' ? 'active' : 'draft';
          const websiteChange = statusById.get(String(product.websiteProductId));
          if (websiteChange) {
            product.websiteRevision = websiteChange.newRevision;
            product.websiteSyncStatus = 'synced';
          }
          changed = ['managementState', 'organization.status'];
          if (websiteChange) changed.push('websiteRevision', 'websiteSyncStatus');
        } else {
          throw Object.assign(new Error('Unsupported product-grid action.'), { code: 'VALIDATION' });
        }
        if (!changed.length) continue;
        product.revision += 1;
        product.updatedAt = new Date(now()).toISOString();
        product.updatedBy = `user:${user.id}`;
        appendAudit(state, user, product, `product_grid_${input.action}`, changed);
        changedProducts.push(product);
      }
      return { store: state, value: changedProducts };
    }, importsWebsiteSource ? undefined : input.expectedRevision);
    for (const product of result.value) {
      announce({ type: 'product.grid.updated', productUuid: product.productUuid, revision: product.revision });
    }
    return grid(session);
  }
  async function duplicate(session, input) {
    const user = actor(session);
    const sourceId = await resolveEditorProduct(session, String(input.productId));
    const result = await store.mutate((state) => {
      const source = state.products.find((item) => item.id === sourceId);
      if (!source) throw Object.assign(new Error('Product was not found.'), { code: 'NOT_FOUND' });
      const id = crypto.randomUUID();
      const timestamp = new Date(now()).toISOString();
      const copy = structuredClone(source);
      Object.assign(copy, {
        id,
        productUuid: crypto.randomUUID(),
        websiteProductId: null,
        sourceHandle: null,
        websiteRevision: null,
        title: `${source.title} — Copy`,
        revision: 1,
        workflowState: 'draft',
        ownerReviewStatus: 'not_submitted',
        websiteSyncStatus: 'not_published',
        managementState: 'active',
        identity: null,
        createdAt: timestamp,
        createdBy: `user:${user.id}`,
        updatedAt: timestamp,
        updatedBy: `user:${user.id}`,
      });
      const baseHandle = `${source.seo.handle}-copy`;
      let handle = baseHandle;
      let suffix = 2;
      while (state.products.some((item) => item.seo.handle === handle)) handle = `${baseHandle}-${suffix++}`;
      copy.seo.handle = handle;
      copy.media = (copy.media || []).map((item) => ({ ...item, id: crypto.randomUUID(), productId: id, featured: item.featured === true }));
      copy.variants = (copy.variants || []).map((variant) => ({ ...variant, id: crypto.randomUUID(), sku: '' }));
      state.products.push(copy);
      appendAudit(state, user, copy, 'product_grid_duplicate', ['product']);
      return { store: state, value: copy };
    }, input.expectedRevision);
    announce({ type: 'product.grid.updated', productUuid: result.value.productUuid, revision: 1 });
    return { ...grid(session), duplicatedProductId: result.value.id };
  }
  function history(session, productId) {
    actor(session);
    const state = store.read();
    const product = state.products.find((item) => item.id === productId);
    if (!product) throw Object.assign(new Error('Product was not found.'), { code: 'NOT_FOUND' });
    return {
      product: projectEditor(product),
      events: state.auditEvents.filter((event) => event.productId === product.id).slice(-200).reverse(),
    };
  }

  return { grid, mutate, duplicate, history };
}

module.exports = { BULK_FIELDS, GRID_ACTIONS, createProductManagementGridService };
