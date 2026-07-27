const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STATUS = new Set(['draft', 'active', 'hidden', 'archived']);
const BULK_FIELDS = new Set(['name', 'parentId', 'status', 'websiteVisibility', 'sortOrder', 'seoTitle', 'metaDescription', 'themeTemplate', 'internalNote']);
const RULE_FIELDS = new Set(['productType', 'brand', 'tag', 'color', 'price']);

function clean(value, max = 300) { return String(value ?? '').trim().slice(0, max); }
function slug(value) {
  return clean(value, 160).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 120);
}
function list(value) {
  return [...new Set((Array.isArray(value) ? value : String(value || '').split(',')).map((item) => clean(item, 100)).filter(Boolean))];
}
function fail(message, code = 'VALIDATION') { throw Object.assign(new Error(message), { code }); }
function createCategoryTaxonomyService(options = {}) {
  const { store, identity, readWebsiteCatalog, readEditorProducts, announce = () => {} } = options;
  const now = options.now || (() => Date.now());
  function actor(session, allowLegacy = false) {
    if (allowLegacy && session?.actorType === 'legacy_owner') return { id: 'legacy-compatibility', accountType: 'legacy_owner', status: 'active' };
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.status !== 'active' || !['owner', 'listing_editor'].includes(user.accountType)) fail('Authorized named-user access is required.', 'FORBIDDEN');
    return user;
  }
  function permissions(user) {
    const edit = ['owner', 'listing_editor'].includes(user.accountType);
    return { edit, create: edit, assignments: edit, rules: edit, submit: edit, approve: user.accountType === 'owner',
      publish: user.accountType === 'owner', delete: user.accountType === 'owner', liveNavigation: user.accountType === 'owner' };
  }
  function products() {
    const website = readWebsiteCatalog().products || [];
    const editor = readEditorProducts?.().products || [];
    const rows = new Map();
    for (const product of website) rows.set(String(product.id), {
      id: String(product.id), editorProductId: null, title: product.title, sku: product.sku || '',
      image: product.primaryImage || product.image || '', status: product.status || 'active',
      inventory: Number(product.inventory ?? Object.values(product.stock || {}).reduce((sum, quantity) => sum + Number(quantity || 0), 0)),
      productType: product.productType || '', brand: product.brand || product.maker || '', tags: list(product.tags || product.tag),
      category: product.category || '', collections: list(product.collections), handle: product.slug || '',
    });
    for (const product of editor) {
      const key = String(product.websiteProductId || product.id);
      const variants = product.variants || [];
      rows.set(key, {
        id: key, editorProductId: product.id, title: product.title, sku: product.identity?.productSku || '',
        image: product.media?.find((item) => item.featured)?.path || product.media?.[0]?.path || '',
        status: product.organization?.status || 'draft',
        inventory: variants.reduce((sum, variant) => sum + Number(variant.quantity || 0), 0),
        productType: product.organization?.productType || '', brand: product.organization?.brand || '',
        tags: product.organization?.tags || [], category: product.organization?.category || '',
        collections: product.organization?.collections || [], handle: product.seo?.handle || '',
      });
    }
    return [...rows.values()];
  }
  function pathFor(category, categories, seen = new Set()) {
    if (!category || seen.has(category.id)) return '';
    seen.add(category.id);
    const parent = categories.find((item) => item.id === category.parentId);
    return [pathFor(parent, categories, seen), category.name].filter(Boolean).join(' > ');
  }
  function descendants(id, categories) {
    const found = [];
    const walk = (parent) => categories.filter((item) => item.parentId === parent).forEach((item) => { found.push(item.id); walk(item.id); });
    walk(id); return found;
  }
  function validateHierarchy(category, categories) {
    if (!category.parentId) return;
    if (category.parentId === category.id || descendants(category.id, categories).includes(category.parentId)) fail('Circular category relationships are not allowed.', 'CIRCULAR_HIERARCHY');
    const parent = categories.find((item) => item.id === category.parentId);
    if (!parent) fail('Parent category was not found.', 'MISSING_PARENT');
    let depth = 1; let cursor = parent;
    while (cursor?.parentId) { depth += 1; cursor = categories.find((item) => item.id === cursor.parentId); }
    if (depth >= 3) fail('Category hierarchy supports a maximum of three levels.', 'MAX_DEPTH');
  }
  function ensureUnique(category, categories) {
    if (!category.slug) fail('A unique category handle is required.');
    if (categories.some((item) => item.id !== category.id && item.slug.toLowerCase() === category.slug.toLowerCase())) fail('Category handle already exists.', 'DUPLICATE_SLUG');
    if (categories.some((item) => item.id !== category.id && item.parentId === category.parentId && item.name.toLowerCase() === category.name.toLowerCase())) fail('A category with this name already exists under the selected parent.', 'DUPLICATE_CATEGORY');
  }
  function audit(state, user, category, action, previous = {}, details = {}) {
    state.auditEvents.push({
      id: crypto.randomUUID(), actorId: `user:${user.id}`, actorRole: user.accountType,
      categoryId: category.id, action, previousParentId: previous.parentId || null, newParentId: category.parentId || null,
      changedFields: details.changedFields || [], previousRevision: previous.revision || 0, newRevision: category.revision,
      assignmentIdsAdded: details.added || [], assignmentIdsRemoved: details.removed || [],
      result: 'success', errorCode: null, timestamp: new Date(now()).toISOString(),
    });
  }
  function websiteSources() {
    const output = [];
    for (const product of products()) {
      const names = [product.category, ...(product.collections || [])].filter(Boolean);
      for (const name of names) output.push({ name, productId: product.id, kind: name === product.category ? 'category' : 'collection' });
    }
    return output;
  }
  async function sync(session, automatic = false) {
    const user = actor(session, automatic);
    const result = await store.mutate((state) => {
      const timestamp = new Date(now()).toISOString();
      const touched = [];
      for (const source of websiteSources()) {
        const sourceKey = `website:${slug(source.name)}`;
        let category = state.categories.find((item) => item.websiteCategoryId === sourceKey || item.sourceKeys?.includes(sourceKey));
        if (!category) category = state.categories.find((item) => item.slug === slug(source.name) && !item.parentId);
        if (!category) {
          category = {
            id: crypto.randomUUID(), websiteCategoryId: sourceKey, sourceKeys: [sourceKey], kind: source.kind,
            name: clean(source.name, 100), slug: slug(source.name), parentId: null, description: '',
            featuredImage: '', bannerImage: '', seoTitle: '', metaDescription: '', status: 'active',
            websiteVisibility: true, sortOrder: state.categories.filter((item) => !item.parentId).length + 1,
            themeTemplate: 'default', internalNote: '', workflowState: 'live', syncState: 'Synced',
            createdAt: timestamp, updatedAt: timestamp, revision: 1, websiteRevision: 1,
          };
          state.categories.push(category); touched.push(category.id);
        } else if (!category.sourceKeys?.includes(sourceKey)) category.sourceKeys = [...(category.sourceKeys || []), sourceKey];
        if (!state.assignments.some((item) => item.categoryId === category.id && item.productId === source.productId)) {
          state.assignments.push({ id: crypto.randomUUID(), categoryId: category.id, productId: source.productId, source: 'website_import', manual: false, createdAt: timestamp });
        }
      }
      state.lastImportAt = timestamp;
      state.syncEvents.push({ id: crypto.randomUUID(), action: 'website_taxonomy_import', result: 'success', categoryIds: touched, timestamp });
      return { store: state, value: touched };
    });
    announce({ type: 'category.sync.completed', storeRevision: result.store.storeRevision });
    return workspace(session);
  }
  function project(state) {
    const productRows = products();
    return state.categories.map((category) => {
      const assignedIds = state.assignments.filter((item) => item.categoryId === category.id).map((item) => item.productId);
      const assigned = productRows.filter((product) => assignedIds.includes(product.id));
      return {
        ...category, hierarchyPath: pathFor(category, state.categories),
        productCount: assigned.length, childCount: state.categories.filter((item) => item.parentId === category.id).length,
        products: assigned, seoStatus: category.seoTitle && category.metaDescription ? 'Complete' : 'Missing SEO',
      };
    });
  }
  function workspace(session) {
    const user = actor(session, true); const state = store.read(); const categories = project(state);
    const counts = {
      total: categories.length, roots: categories.filter((item) => !item.parentId).length,
      subcategories: categories.filter((item) => item.parentId).length,
      active: categories.filter((item) => item.status === 'active').length,
      hidden: categories.filter((item) => item.status === 'hidden').length,
      archived: categories.filter((item) => item.status === 'archived').length,
      needsReview: categories.filter((item) => item.syncState === 'Needs Review').length,
      empty: categories.filter((item) => item.productCount === 0).length,
      syncErrors: categories.filter((item) => item.syncState === 'Import Error').length,
    };
    return { schemaVersion: 1, storeRevision: state.storeRevision, lastImportAt: state.lastImportAt, categories, products: products(), counts, permissions: permissions(user) };
  }
  function normalizeInput(input, existing = {}) {
    const status = clean(input.status ?? existing.status ?? 'draft', 20).toLowerCase();
    if (!STATUS.has(status)) fail('Unsupported category status.');
    return {
      ...existing, name: clean(input.name ?? existing.name, 100),
      slug: slug(input.slug ?? existing.slug ?? input.name), parentId: input.parentId || null,
      description: clean(input.description ?? existing.description, 10000),
      featuredImage: clean(input.featuredImage ?? existing.featuredImage, 500),
      bannerImage: clean(input.bannerImage ?? existing.bannerImage, 500),
      seoTitle: clean(input.seoTitle ?? existing.seoTitle, 80),
      metaDescription: clean(input.metaDescription ?? existing.metaDescription, 180),
      status, websiteVisibility: input.websiteVisibility ?? existing.websiteVisibility ?? true,
      sortOrder: Math.max(0, Number(input.sortOrder ?? existing.sortOrder ?? 0)),
      themeTemplate: clean(input.themeTemplate ?? existing.themeTemplate ?? 'default', 80),
      internalNote: clean(input.internalNote ?? existing.internalNote, 2000),
    };
  }
  async function create(session, input) {
    const user = actor(session); const timestamp = new Date(now()).toISOString();
    const result = await store.mutate((state) => {
      const category = normalizeInput(input, {
        id: crypto.randomUUID(), websiteCategoryId: null, sourceKeys: [], kind: input.kind === 'collection' ? 'collection' : 'category',
        workflowState: 'draft', syncState: 'Needs Review', createdAt: timestamp, revision: 1,
      });
      if (!category.name) fail('Category name is required.');
      validateHierarchy(category, state.categories); ensureUnique(category, state.categories);
      category.updatedAt = timestamp; state.categories.push(category); audit(state, user, category, 'category_created');
      return { store: state, value: category };
    }, input.expectedRevision);
    announce({ type: 'category.updated', categoryId: result.value.id }); return { category: project(result.store).find((item) => item.id === result.value.id), storeRevision: result.store.storeRevision };
  }
  async function update(session, id, input) {
    const user = actor(session);
    const result = await store.mutate((state) => {
      const index = state.categories.findIndex((item) => item.id === id); if (index < 0) fail('Category was not found.', 'NOT_FOUND');
      const previous = structuredClone(state.categories[index]);
      const category = normalizeInput(input, state.categories[index]);
      validateHierarchy(category, state.categories); ensureUnique(category, state.categories);
      category.revision += 1; category.updatedAt = new Date(now()).toISOString();
      category.workflowState = input.submit ? 'submitted' : category.workflowState;
      category.syncState = category.workflowState === 'live' ? 'Synced' : 'Needs Review';
      state.categories[index] = category;
      const changedFields = Object.keys(input).filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(category[key]));
      audit(state, user, category, input.submit ? 'category_submitted' : 'category_updated', previous, { changedFields });
      return { store: state, value: category };
    }, input.expectedRevision);
    announce({ type: 'category.updated', categoryId: id }); return { category: project(result.store).find((item) => item.id === id), storeRevision: result.store.storeRevision };
  }
  async function workflow(session, id, action, input = {}) {
    const user = actor(session); if (['approve', 'publish', 'delete'].includes(action) && user.accountType !== 'owner') fail('Named Owner access is required.', 'FORBIDDEN');
    const result = await store.mutate((state) => {
      const category = state.categories.find((item) => item.id === id); if (!category) fail('Category was not found.', 'NOT_FOUND');
      const previous = structuredClone(category);
      if (action === 'approve') { if (category.workflowState !== 'submitted') fail('Submit the category before approval.'); category.workflowState = 'approved'; }
      else if (action === 'publish') { if (category.workflowState !== 'approved') fail('Owner approval is required before publishing.'); category.workflowState = 'live'; category.status = category.status === 'draft' ? 'active' : category.status; category.syncState = 'Synced'; category.websiteRevision = (category.websiteRevision || 0) + 1; }
      else if (action === 'hide') { category.status = 'hidden'; category.websiteVisibility = false; }
      else if (action === 'archive') { category.status = 'archived'; category.websiteVisibility = false; }
      else if (action === 'restore') { category.status = 'active'; }
      else if (action === 'delete') {
        const children = state.categories.filter((item) => item.parentId === id).length;
        const assignments = state.assignments.filter((item) => item.categoryId === id).length;
        if (children || assignments || category.websiteCategoryId || category.websiteRevision) fail('Category has dependencies. Archive it or remove dependencies first.', 'DELETE_BLOCKED');
        if (input.confirmation !== 'DELETE') fail('Type DELETE to permanently remove this category.', 'CONFIRMATION_REQUIRED');
        state.categories = state.categories.filter((item) => item.id !== id);
        audit(state, user, category, 'category_deleted', previous); return { store: state, value: { deleted: true, id } };
      } else fail('Unsupported category action.');
      category.revision += 1; category.updatedAt = new Date(now()).toISOString();
      audit(state, user, category, `category_${action}`, previous, { changedFields: ['workflowState', 'status', 'websiteVisibility'] });
      if (action === 'publish') state.syncEvents.push({ id: crypto.randomUUID(), categoryId: id, action: 'category_published', result: 'success', timestamp: category.updatedAt });
      return { store: state, value: category };
    }, input.expectedRevision);
    announce({ type: action === 'publish' ? 'category.sync.completed' : 'category.updated', categoryId: id });
    return { ...workspace(session), result: result.value };
  }
  async function assign(session, id, input) {
    const user = actor(session); const add = list(input.add); const remove = list(input.remove);
    const result = await store.mutate((state) => {
      const category = state.categories.find((item) => item.id === id); if (!category) fail('Category was not found.', 'NOT_FOUND');
      const valid = new Set(products().map((item) => item.id)); if ([...add, ...remove].some((item) => !valid.has(item))) fail('One or more products were not found.', 'NOT_FOUND');
      const previous = structuredClone(category);
      state.assignments = state.assignments.filter((item) => !(item.categoryId === id && remove.includes(item.productId)));
      for (const productId of add) if (!state.assignments.some((item) => item.categoryId === id && item.productId === productId)) {
        state.assignments.push({ id: crypto.randomUUID(), categoryId: id, productId, source: 'manual', manual: true, createdAt: new Date(now()).toISOString(), actorId: `user:${user.id}` });
      }
      category.revision += 1; category.updatedAt = new Date(now()).toISOString(); category.syncState = 'Needs Review';
      audit(state, user, category, 'category_assignments_updated', previous, { added: add, removed: remove });
      return { store: state, value: category };
    }, input.expectedRevision);
    announce({ type: 'category.assignment.updated', categoryId: id }); return { ...workspace(session), categoryId: id };
  }
  async function bulk(session, input) {
    const ids = list(input.categoryIds); if (!ids.length) fail('Select at least one category.');
    let latest; for (const id of ids) {
      if (input.action === 'edit') {
        const unsupported = Object.keys(input.values || {}).filter((key) => !BULK_FIELDS.has(key)); if (unsupported.length) fail('Unsupported bulk category field.');
        latest = await update(session, id, { ...(input.values || {}), expectedRevision: undefined });
      } else latest = await workflow(session, id, input.action, { confirmation: input.confirmation });
    }
    return latest || workspace(session);
  }
  function previewRules(session, input) {
    actor(session); const rules = Array.isArray(input.rules) ? input.rules : [];
    for (const rule of rules) if (!RULE_FIELDS.has(rule.field)) fail('Unsupported category rule.');
    const matches = products().filter((product) => {
      const results = rules.map((rule) => {
        const expected = clean(rule.value).toLowerCase(); const actual = rule.field === 'tag' ? product.tags.join(' ').toLowerCase() : clean(product[rule.field]).toLowerCase();
        if (rule.field === 'price') return Number(product.price || 0) > Number(rule.value || 0);
        return actual.includes(expected);
      });
      return input.mode === 'any' ? results.some(Boolean) : results.every(Boolean);
    });
    return { previewOnly: true, add: matches.map((item) => item.id), remove: [], products: matches };
  }
  function activity(session, id) {
    actor(session, true); const state = store.read();
    return { events: state.auditEvents.filter((item) => item.categoryId === id).slice(-200).reverse(), syncEvents: state.syncEvents.filter((item) => item.categoryId === id).slice(-100).reverse() };
  }
  function publicCategory(handle) {
    const state = store.read(); const category = project(state).find((item) => item.slug === handle && item.workflowState === 'live' && item.status === 'active' && item.websiteVisibility);
    if (!category) return null;
    return { ...category, children: project(state).filter((item) => item.parentId === category.id && item.workflowState === 'live' && item.status === 'active' && item.websiteVisibility) };
  }
  async function uploadMedia(session, id, input) {
    const user = actor(session);
    const types = { 'image/jpeg': { ext: '.jpg', signatures: [[0xff,0xd8,0xff]] }, 'image/png': { ext: '.png', signatures: [[0x89,0x50,0x4e,0x47]] }, 'image/webp': { ext: '.webp', signatures: [[0x52,0x49,0x46,0x46]] } };
    const type = types[clean(input.mimeType,80).toLowerCase()]; if (!type) fail('Only JPG, PNG and WEBP category images are supported.');
    const bytes = Buffer.from(String(input.dataBase64||''),'base64');
    if (!bytes.length || bytes.length > 5*1024*1024) fail('Category image must be between 1 byte and 5 MB.');
    if (!type.signatures.some((signature)=>signature.every((byte,index)=>bytes[index]===byte)) || (input.mimeType==='image/webp'&&bytes.slice(8,12).toString()!=='WEBP')) fail('Image content does not match its declared format.');
    const category = store.read().categories.find((item)=>item.id===id); if (!category) fail('Category was not found.','NOT_FOUND');
    const fileName=`${crypto.randomUUID()}${type.ext}`; const directory=path.join(store.paths.mediaDir,id); fs.mkdirSync(directory,{recursive:true,mode:0o700});
    const finalPath=path.join(directory,fileName); const temporaryPath=`${finalPath}.${process.pid}.tmp`; fs.writeFileSync(temporaryPath,bytes,{mode:0o600}); fs.renameSync(temporaryPath,finalPath);
    const field=input.role==='banner'?'bannerImage':'featuredImage';
    try { return await update(session,id,{[field]:`/category-media/${id}/${fileName}`,expectedRevision:input.expectedRevision}); }
    catch(error){try{fs.unlinkSync(finalPath);}catch{} throw error;}
  }
  return { workspace, sync, create, update, workflow, assign, bulk, previewRules, activity, publicCategory, products, uploadMedia };
}

module.exports = { STATUS, BULK_FIELDS, RULE_FIELDS, createCategoryTaxonomyService };
