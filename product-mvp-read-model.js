const { deriveReleaseLifecycle } = require('./product-plm-releases');

function clean(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function legacyImage(product) {
  const value = clean(product?.primaryImage || product?.image);
  if (!value) return '/assets/generated/leather-detail.png';
  return value.startsWith('/') ? value : `/${value}`;
}

function legacyKey(id) {
  return `legacy-${encodeURIComponent(clean(id, 'unknown'))}`;
}

function latestBy(records, field) {
  return [...records].sort((left, right) =>
    Number(right[field] || 0) - Number(left[field] || 0))[0] || null;
}

function governanceProjection(plm, productUuid) {
  if (!productUuid) {
    return {
      state: 'not_migrated',
      label: 'Not migrated',
      versionCount: 0,
      latestVersionId: null,
      latestVersionNumber: null,
      approvalRequestCount: 0,
      releaseCount: 0,
      latestReleaseId: null,
      latestReleaseNumber: null,
      releaseState: 'absent',
      knowledgeLockId: null,
      knowledgeLockValid: false,
      readiness: 'identity_required',
      nextAction: 'Create a PLM migration preview from the existing migration workflow.',
    };
  }
  const versions = plm.productVersions.filter((item) => item.productUuid === productUuid);
  const latestVersion = latestBy(versions, 'versionNumber');
  const approvals = plm.approvalRequests.filter((item) => item.productUuid === productUuid);
  const releases = plm.productReleases.filter((item) => item.productUuid === productUuid);
  const latestRelease = latestBy(releases, 'releaseNumber');
  const lifecycle = latestRelease
    ? plm.releaseLifecycleEvents.filter((event) => event.releaseId === latestRelease.id)
    : [];
  const releaseState = latestRelease ? deriveReleaseLifecycle(lifecycle) : 'absent';
  const lock = latestRelease
    ? plm.knowledgeLocks.find((item) => item.releaseId === latestRelease.id) || null
    : null;
  let state = 'version_required';
  let label = 'Version required';
  let readiness = 'blocked';
  let nextAction = 'Create an immutable Product Version in Micro Sprint 2.';
  if (latestVersion && !latestRelease) {
    state = approvals.length ? 'release_required' : 'approval_required';
    label = approvals.length ? 'Release required' : 'Approval required';
    nextAction = approvals.length
      ? 'Create a Product Release in Micro Sprint 2.'
      : 'Create an Approval Request in Micro Sprint 2.';
  } else if (latestRelease && !['approved', 'active'].includes(releaseState)) {
    state = releaseState === 'draft' ? 'release_draft' : `release_${releaseState}`;
    label = releaseState === 'draft' ? 'Release draft' : `Release ${releaseState}`;
    nextAction = 'Complete the governed release lifecycle in Micro Sprint 2.';
  } else if (latestRelease && !lock) {
    state = 'lock_required';
    label = 'Knowledge Lock required';
    nextAction = 'Create a Knowledge Lock in Micro Sprint 2.';
  } else if (latestRelease && lock) {
    state = 'governed';
    label = 'Governed';
    readiness = 'ready';
    nextAction = 'Product is governed and ready for Listing Studio.';
  }
  return {
    state,
    label,
    versionCount: versions.length,
    latestVersionId: latestVersion?.id || null,
    latestVersionNumber: latestVersion?.versionNumber || null,
    approvalRequestCount: approvals.length,
    releaseCount: releases.length,
    latestReleaseId: latestRelease?.id || null,
    latestReleaseNumber: latestRelease?.releaseNumber || null,
    releaseState,
    knowledgeLockId: lock?.id || null,
    knowledgeLockValid: Boolean(lock),
    readiness,
    nextAction,
  };
}

function buildProductRecord(plm, legacyProduct, mapping = null) {
  const productUuid = mapping?.productUuid || null;
  const identity = productUuid
    ? plm.productIdentities.find((item) => item.id === productUuid) || null
    : null;
  const style = productUuid
    ? plm.productStyles.find((item) => item.productUuid === productUuid) || null
    : null;
  const family = style
    ? plm.productFamilies.find((item) => item.id === style.familyId) || null
    : null;
  const brand = identity
    ? plm.brands.find((item) => item.id === identity.brandId) || null
    : null;
  const legalEntity = identity
    ? plm.legalEntities.find((item) => item.id === identity.legalEntityId) || null
    : null;
  const sellables = style
    ? plm.sellableItems.filter((item) => item.styleId === style.id)
    : [];
  const governance = governanceProjection(plm, productUuid);
  const legacyId = clean(legacyProduct?.id || mapping?.legacyId);
  return {
    recordKey: productUuid || legacyKey(legacyId),
    productUuid,
    legacyId,
    legacySlug: clean(legacyProduct?.slug || mapping?.legacySlug),
    title: clean(identity?.displayName || style?.name || legacyProduct?.title, 'Untitled product'),
    brand: clean(brand?.name || legacyProduct?.brand, 'MOTOGRIP GEAR'),
    legalEntity: clean(legalEntity?.legalName, 'Not assigned'),
    family: clean(family?.name || family?.code, 'Not assigned'),
    productType: clean(
      style?.productType || legacyProduct?.productType || legacyProduct?.category,
      'Unclassified',
    ),
    styleCode: clean(style?.styleCode, 'Not assigned'),
    status: clean(identity?.identityStatus || legacyProduct?.status, 'unknown'),
    category: clean(legacyProduct?.category, 'Unclassified'),
    gender: clean(legacyProduct?.gender, 'Unspecified'),
    sku: clean(sellables[0]?.sku || legacyProduct?.sku, 'Not assigned'),
    price: Number(legacyProduct?.price || 0),
    inventory: Number(legacyProduct?.inventory || 0),
    image: legacyImage(legacyProduct),
    storefrontPath: legacyProduct?.slug ? `/products/${clean(legacyProduct.slug)}` : null,
    source: productUuid ? 'plm_linked' : 'legacy_source',
    governance,
    originalMediaReferences: identity?.originalMediaReferences || [],
    sellableItemCount: sellables.length,
    legacyMappingCount: productUuid
      ? plm.legacyMappings.filter((item) => item.productUuid === productUuid).length
      : 0,
  };
}

function createProductMvpReadModel(options) {
  const plmStore = options.plmStore;
  const readLegacyStore = options.readLegacyStore;

  function products() {
    const plm = plmStore.read();
    const legacyProducts = readLegacyStore().products || [];
    const byLegacyId = new Map(legacyProducts.map((item) => [clean(item.id), item]));
    const adminMappings = plm.legacyMappings.filter((mapping) =>
      mapping.sourceSystem === 'admin-store' && mapping.sourceEntityType === 'product');
    const records = [];
    const mappedLegacyIds = new Set();
    for (const mapping of adminMappings) {
      const legacyProduct = byLegacyId.get(clean(mapping.legacyId)) || {};
      records.push(buildProductRecord(plm, legacyProduct, mapping));
      mappedLegacyIds.add(clean(mapping.legacyId));
    }
    for (const legacyProduct of legacyProducts) {
      if (!mappedLegacyIds.has(clean(legacyProduct.id))) {
        records.push(buildProductRecord(plm, legacyProduct));
      }
    }
    for (const identity of plm.productIdentities) {
      if (!records.some((record) => record.productUuid === identity.id)) {
        records.push(buildProductRecord(plm, {}, {
          productUuid: identity.id,
          legacyId: '',
        }));
      }
    }
    return records.sort((left, right) => left.title.localeCompare(right.title));
  }

  function dashboard() {
    const records = products();
    const governed = records.filter((record) => record.governance.state === 'governed').length;
    const notMigrated = records.filter((record) =>
      record.governance.state === 'not_migrated').length;
    return {
      productCount: records.length,
      governedCount: governed,
      actionRequiredCount: records.length - governed,
      notMigratedCount: notMigrated,
      versionRequiredCount: records.filter((record) =>
        record.governance.state === 'version_required').length,
      releaseRequiredCount: records.filter((record) =>
        ['approval_required', 'release_required', 'release_draft']
          .includes(record.governance.state)).length,
      knowledgeLockRequiredCount: records.filter((record) =>
        record.governance.state === 'lock_required').length,
      recentProducts: records.slice(0, 5),
      actionQueue: records
        .filter((record) => record.governance.state !== 'governed')
        .slice(0, 6)
        .map((record) => ({
          recordKey: record.recordKey,
          title: record.title,
          state: record.governance.state,
          label: record.governance.label,
          nextAction: record.governance.nextAction,
        })),
    };
  }

  function product(recordKey) {
    return products().find((record) => record.recordKey === recordKey) || null;
  }

  return { dashboard, product, products };
}

module.exports = {
  createProductMvpReadModel,
  governanceProjection,
};
