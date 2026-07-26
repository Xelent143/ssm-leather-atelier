const crypto = require('crypto');

const REVIEW_STATUSES = Object.freeze([
  'Linked',
  'Needs Review',
  'Ignored',
  'Conflict',
  'Import Error',
]);

const MATCH_METHODS = Object.freeze([
  'legacy_identifier',
  'exact_sku',
  'case_insensitive_sku',
  'marketplace_identity',
  'normalized_title',
  'manual',
]);

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeTitle(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an|and|for|with|mens|men|womens|women)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleSimilarity(left, right) {
  const a = new Set(normalizeTitle(left).split(' ').filter(Boolean));
  const b = new Set(normalizeTitle(right).split(' ').filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.max(a.size, b.size);
}

function actorId(session) {
  return session?.userId ? `user:${session.userId}` : null;
}

function createCatalogLinkService(options = {}) {
  const store = options.store;
  const catalogService = options.catalogService;
  const readPlmStore = options.readPlmStore;
  const now = options.now || (() => new Date().toISOString());
  const authorizeOwner = options.authorizeOwner ||
    ((session) => Boolean(session?.actorType === 'named_user' && session?.userId));
  if (!store || !catalogService || !readPlmStore) {
    throw new Error('Catalog link dependencies are required.');
  }

  function assertOwner(session) {
    if (!authorizeOwner(session)) {
      const error = new Error('Named Owner access is required.');
      error.code = 'OWNER_REQUIRED';
      throw error;
    }
  }

  function productDnaRecords(query = '') {
    const plm = readPlmStore();
    const filter = normalizeTitle(query);
    const records = plm.productIdentities.map((identity) => {
      const style = plm.productStyles.find((item) => item.productUuid === identity.id);
      const family = style
        ? plm.productFamilies.find((item) => item.id === style.familyId)
        : null;
      const brand = plm.brands.find((item) => item.id === identity.brandId);
      const sellables = style
        ? plm.sellableItems.filter((item) => item.styleId === style.id)
        : [];
      const mappings = plm.legacyMappings.filter((item) => item.productUuid === identity.id);
      return {
        productUuid: identity.id,
        displayName: identity.displayName || style?.name || 'Untitled Product DNA',
        brand: brand?.name || brand?.displayName || 'Unassigned brand',
        productType: style?.productType || family?.familyType || 'unclassified',
        styleCode: style?.styleCode || null,
        skus: [...new Set([
          ...sellables.map((item) => clean(item.sku)),
          ...mappings.map((item) => clean(item.legacySku)),
        ].filter(Boolean))],
        legacyIdentifiers: mappings.map((item) => ({
          sourceSystem: item.sourceSystem,
          legacyId: clean(item.legacyId),
          legacySlug: clean(item.legacySlug),
        })),
      };
    });
    return records
      .filter((record) => !filter || normalizeTitle([
        record.displayName,
        record.brand,
        record.productType,
        record.styleCode,
        ...record.skus,
      ].join(' ')).includes(filter))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  function marketplaceProductUuids(plm, product) {
    const externalIds = new Set([
      clean(product.source?.sourceId).toLowerCase(),
      clean(product.source?.sourceSku).toLowerCase(),
    ].filter(Boolean));
    const styleById = new Map(plm.productStyles.map((style) => [style.id, style]));
    return plm.marketplaceIdentities
      .filter((identity) => externalIds.has(clean(identity.externalId).toLowerCase()))
      .map((identity) => identity.subjectType === 'product_style'
        ? styleById.get(identity.subjectId)?.productUuid
        : styleById.get(plm.sellableItems.find((item) => item.id === identity.subjectId)?.styleId)?.productUuid)
      .filter(Boolean);
  }

  function suggestions(product) {
    const plm = readPlmStore();
    const dna = productDnaRecords();
    const candidates = new Map();
    const add = (productUuid, method, confidence, reason) => {
      if (!productUuid) return;
      const existing = candidates.get(productUuid);
      if (!existing || confidence > existing.confidence) {
        candidates.set(productUuid, { productUuid, method, confidence, reason });
      }
    };

    const sourceId = clean(product.source?.sourceId);
    for (const mapping of plm.legacyMappings) {
      if (sourceId && clean(mapping.legacyId) === sourceId) {
        add(mapping.productUuid, 'legacy_identifier', 100, 'Website identifier matches an existing legacy mapping.');
      }
    }

    const sku = clean(product.sku);
    for (const record of dna) {
      if (sku && record.skus.includes(sku)) {
        add(record.productUuid, 'exact_sku', 98, 'SKU matches exactly.');
      } else if (sku && record.skus.some((value) => value.toLowerCase() === sku.toLowerCase())) {
        add(record.productUuid, 'case_insensitive_sku', 94, 'SKU matches after case normalization.');
      }
    }

    for (const productUuid of marketplaceProductUuids(plm, product)) {
      add(productUuid, 'marketplace_identity', 90, 'Website identity matches a reserved marketplace identity.');
    }

    for (const record of dna) {
      const similarity = titleSimilarity(product.title, record.displayName);
      if (similarity >= 0.72) {
        add(
          record.productUuid,
          'normalized_title',
          Math.round(similarity * 85),
          'Strong normalized title similarity. Owner confirmation is always required.',
        );
      }
    }

    const rejected = new Set(store.read().rejectedSuggestions
      .filter((item) => item.catalogProductId === product.catalogProductId)
      .map((item) => item.productUuid));
    return [...candidates.values()]
      .filter((candidate) => !rejected.has(candidate.productUuid))
      .map((candidate) => ({
        ...candidate,
        productDna: dna.find((record) => record.productUuid === candidate.productUuid),
        requiresOwnerConfirmation: true,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  function enrichProduct(product, linkStore = store.read()) {
    const link = linkStore.links.find((item) => item.catalogProductId === product.catalogProductId) || null;
    const ignored = linkStore.ignoredProducts.find(
      (item) => item.catalogProductId === product.catalogProductId,
    ) || null;
    const dna = link
      ? productDnaRecords().find((item) => item.productUuid === link.productUuid) || null
      : null;
    const productSuggestions = !link && !ignored && product.syncStatus !== 'Import Error'
      ? suggestions(product)
      : [];
    let reviewStatus = 'Needs Review';
    let reviewReason = product.reviewReason || 'Product DNA link requires Owner review.';
    if (product.syncStatus === 'Import Error') {
      reviewStatus = 'Import Error';
    } else if (ignored) {
      reviewStatus = 'Ignored';
      reviewReason = ignored.reason || 'Ignored by Named Owner.';
    } else if (link && dna) {
      reviewStatus = 'Linked';
      reviewReason = 'Catalog identity is linked to an Owner-confirmed Product DNA record.';
    } else if (link && !dna) {
      reviewStatus = 'Conflict';
      reviewReason = 'The linked Product DNA record is no longer available.';
    } else if (productSuggestions.length > 1 &&
        productSuggestions[0].confidence === productSuggestions[1].confidence) {
      reviewStatus = 'Conflict';
      reviewReason = 'Multiple Product DNA records have equal-priority matches.';
    }
    return {
      ...product,
      productUuid: link?.productUuid || null,
      linkStatus: reviewStatus,
      syncStatus: reviewStatus,
      reviewReason,
      link,
      linkedProductDna: dna,
      suggestions: productSuggestions,
      suggestedProductDnaMatch: productSuggestions[0] || null,
      ignored,
    };
  }

  function catalog(options = {}) {
    const base = options.sync ? catalogService.sync() : catalogService.catalog();
    const linkStore = store.read();
    const products = base.products.map((product) => enrichProduct(product, linkStore));
    const websiteProducts = products.filter((product) => product.linkStatus !== 'Ignored');
    return {
      ...base,
      linkStoreRevision: linkStore.storeRevision,
      products,
      productCount: websiteProducts.length,
      importedProductCount: products.length,
      ignoredProductCount: products.length - websiteProducts.length,
      variantCount: websiteProducts.reduce((sum, product) => sum + product.variantCount, 0),
      totalInventory: websiteProducts.reduce((sum, product) => sum + product.totalInventory, 0),
      needsReviewCount: products.filter((product) =>
        ['Needs Review', 'Conflict', 'Import Error'].includes(product.linkStatus)).length,
      linkedCount: products.filter((product) => product.linkStatus === 'Linked').length,
      statusCounts: Object.fromEntries(REVIEW_STATUSES.map((status) => [
        status,
        products.filter((product) => product.linkStatus === status).length,
      ])),
    };
  }

  function findCatalogProduct(catalogProductId) {
    return catalog().products.find((item) => item.catalogProductId === catalogProductId) || null;
  }

  function appendAudit(draft, action, session, details) {
    draft.auditEvents.push({
      id: crypto.randomUUID(),
      schemaVersion: 1,
      timestamp: now(),
      action,
      actorId: actorId(session),
      actorType: 'named_owner',
      catalogProductId: details.catalogProductId,
      previousProductUuid: details.previousProductUuid || null,
      newProductUuid: details.newProductUuid || null,
      matchMethod: details.matchMethod || null,
      ownerConfirmed: details.ownerConfirmed === true,
      reason: clean(details.reason) || null,
    });
  }

  function link(session, input = {}) {
    assertOwner(session);
    const product = findCatalogProduct(clean(input.catalogProductId));
    if (!product) {
      const error = new Error('Catalog product was not found.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    const target = productDnaRecords().find((item) => item.productUuid === clean(input.productUuid));
    if (!target) {
      const error = new Error('Product DNA record was not found.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    if (input.ownerConfirmed !== true) {
      const error = new Error('Named Owner confirmation is required.');
      error.code = 'VALIDATION';
      throw error;
    }
    const method = MATCH_METHODS.includes(input.matchMethod) ? input.matchMethod : 'manual';
    const current = store.read();
    const existing = current.links.find((item) => item.catalogProductId === product.catalogProductId);
    if (existing?.productUuid === target.productUuid) {
      return { product: enrichProduct(product, current), storeRevision: current.storeRevision };
    }
    const conflictingCatalog = current.links.find((item) =>
      item.productUuid === target.productUuid && item.catalogProductId !== product.catalogProductId);
    if (existing || conflictingCatalog) {
      const error = new Error(existing
        ? 'Catalog product is already linked to another Product DNA record.'
        : 'Product DNA record is already linked to another Catalog product.');
      error.code = 'CONFLICT';
      throw error;
    }
    const timestamp = now();
    const next = structuredClone(current);
    next.ignoredProducts = next.ignoredProducts.filter(
      (item) => item.catalogProductId !== product.catalogProductId,
    );
    next.links.push({
      id: crypto.randomUUID(),
      schemaVersion: 1,
      catalogProductId: product.catalogProductId,
      productUuid: target.productUuid,
      matchMethod: method,
      ownerConfirmed: true,
      linkedAt: timestamp,
      linkedBy: actorId(session),
    });
    appendAudit(next, 'catalog_product_dna_linked', session, {
      catalogProductId: product.catalogProductId,
      newProductUuid: target.productUuid,
      matchMethod: method,
      ownerConfirmed: true,
    });
    const saved = store.write(next, Number(input.expectedRevision));
    return { product: enrichProduct(product, saved), storeRevision: saved.storeRevision };
  }

  function unlink(session, input = {}) {
    assertOwner(session);
    const current = store.read();
    const existing = current.links.find((item) => item.catalogProductId === clean(input.catalogProductId));
    if (!existing) {
      const error = new Error('Catalog product is not linked.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    const next = structuredClone(current);
    next.links = next.links.filter((item) => item.id !== existing.id);
    appendAudit(next, 'catalog_product_dna_unlinked', session, {
      catalogProductId: existing.catalogProductId,
      previousProductUuid: existing.productUuid,
      ownerConfirmed: true,
    });
    const saved = store.write(next, Number(input.expectedRevision));
    return { storeRevision: saved.storeRevision };
  }

  function ignore(session, input = {}) {
    assertOwner(session);
    const product = findCatalogProduct(clean(input.catalogProductId));
    if (!product) {
      const error = new Error('Catalog product was not found.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    const current = store.read();
    if (current.links.some((item) => item.catalogProductId === product.catalogProductId)) {
      const error = new Error('Unlink the Product DNA record before ignoring this product.');
      error.code = 'CONFLICT';
      throw error;
    }
    if (current.ignoredProducts.some((item) => item.catalogProductId === product.catalogProductId)) {
      return { product: enrichProduct(product, current), storeRevision: current.storeRevision };
    }
    const next = structuredClone(current);
    next.ignoredProducts.push({
      catalogProductId: product.catalogProductId,
      ignoredAt: now(),
      ignoredBy: actorId(session),
      reason: clean(input.reason) || 'Staging or non-website product',
    });
    appendAudit(next, 'catalog_product_ignored', session, {
      catalogProductId: product.catalogProductId,
      ownerConfirmed: true,
      reason: clean(input.reason) || 'Staging or non-website product',
    });
    const saved = store.write(next, Number(input.expectedRevision));
    return { product: enrichProduct(product, saved), storeRevision: saved.storeRevision };
  }

  function rejectSuggestion(session, input = {}) {
    assertOwner(session);
    const product = findCatalogProduct(clean(input.catalogProductId));
    const target = productDnaRecords().find((item) => item.productUuid === clean(input.productUuid));
    if (!product || !target) {
      const error = new Error('Catalog product or Product DNA record was not found.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    const current = store.read();
    if (current.rejectedSuggestions.some((item) =>
      item.catalogProductId === product.catalogProductId && item.productUuid === target.productUuid)) {
      return { product: enrichProduct(product, current), storeRevision: current.storeRevision };
    }
    const next = structuredClone(current);
    next.rejectedSuggestions.push({
      catalogProductId: product.catalogProductId,
      productUuid: target.productUuid,
      rejectedAt: now(),
      rejectedBy: actorId(session),
    });
    appendAudit(next, 'catalog_product_dna_suggestion_rejected', session, {
      catalogProductId: product.catalogProductId,
      newProductUuid: target.productUuid,
      ownerConfirmed: true,
    });
    const saved = store.write(next, Number(input.expectedRevision));
    return { product: enrichProduct(product, saved), storeRevision: saved.storeRevision };
  }

  function auditHistory(catalogProductId) {
    return store.read().auditEvents
      .filter((event) => !catalogProductId || event.catalogProductId === catalogProductId)
      .slice()
      .reverse();
  }

  return {
    auditHistory,
    catalog,
    findCatalogProduct,
    ignore,
    link,
    productDnaRecords,
    rejectSuggestion,
    sync: () => catalog({ sync: true }),
    unlink,
  };
}

module.exports = {
  CATALOG_MATCH_METHODS: MATCH_METHODS,
  CATALOG_REVIEW_STATUSES: REVIEW_STATUSES,
  createCatalogLinkService,
  normalizeCatalogTitle: normalizeTitle,
  titleSimilarity,
};
