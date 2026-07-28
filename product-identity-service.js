const crypto = require('crypto');

const BRAND_PREFIXES = Object.freeze({
  'motogrip gear': 'MG',
  motogrip: 'MG',
  'blacktop gear': 'BTG',
  'vintage leather goods': 'VLG',
  'be smart': 'BS',
});
const TYPE_RULES = Object.freeze([
  ['JKT', /\b(jacket|bomber|varsity|trucker|cafe racer)\b/i],
  ['VST', /\bvest\b/i],
  ['WCT', /\bwaistcoat\b/i],
  ['PNT', /\b(pant|trouser)\b/i],
  ['CHP', /\bchap\b/i],
  ['SHT', /\bshort\b/i],
  ['BAG', /\b(bag|satchel|luggage)\b/i],
  ['GLV', /\bglove\b/i],
  ['ACC', /\b(accessor|belt|wallet|patch|armor)\b/i],
]);
const COLOR_CODES = Object.freeze({
  black: 'BLK', brown: 'BRN', tan: 'TAN', red: 'RED', blue: 'BLU',
  green: 'GRN', grey: 'GRY', gray: 'GRY', white: 'WHT', burgundy: 'BRG',
});

function clean(value, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}
function codePart(value, max = 8) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, max);
}
function brandPrefix(brand) {
  return BRAND_PREFIXES[clean(brand).toLowerCase()] || 'MG';
}
function productTypeCode(...values) {
  const source = values.map((value) => clean(value)).join(' ');
  return TYPE_RULES.find(([, pattern]) => pattern.test(source))?.[0] || 'OTH';
}
function variantParts(attributes = {}, sellableAttributeKeys = []) {
  const transforms = [
    ['size', (value) => codePart(value)],
    ['color', (value) => COLOR_CODES[clean(value).toLowerCase()] || codePart(value, 3)],
    ['leatherType', (value) => codePart(value)],
    ['leather_type', (value) => codePart(value)],
    ['fit', (value) => codePart(value)],
    ['length', (value) => codePart(value)],
    ['hardwareFinish', (value) => codePart(value)],
    ['hardware_color', (value) => COLOR_CODES[clean(value).toLowerCase()] || codePart(value, 3)],
    ['lining', (value) => codePart(value)],
    ['armor', (value) => codePart(value)],
  ];
  const known = new Set(transforms.map(([key]) => key));
  const standard = transforms.map(([key, transform]) => transform(attributes[key])).filter(Boolean);
  const approvedCustomKeys = new Set((Array.isArray(sellableAttributeKeys) ? sellableAttributeKeys : [])
    .map((key) => clean(key, 80)).filter(Boolean));
  const custom = Object.entries(attributes)
    .filter(([key, value]) => !known.has(key) && approvedCustomKeys.has(key) && clean(value))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => key.includes('color')
      ? (COLOR_CODES[clean(value).toLowerCase()] || codePart(value, 3))
      : codePart(value));
  return [...standard, ...custom];
}

function createProductIdentityService(options = {}) {
  const {
    store, identity,
    authorizeUser = (user, module, action) => user.accountType === 'owner',
  } = options;
  const now = options.now || (() => Date.now());
  const year = options.year || (() => new Date(now()).getUTCFullYear());

  function authorized(session, action, ownerOnly = false) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.status !== 'active' ||
        (ownerOnly ? user.accountType !== 'owner' : !authorizeUser(user, 'productIdentity', action))) {
      throw Object.assign(new Error(ownerOnly
        ? 'Named Owner access is required.'
        : 'Product Identity permission is required.'), {
        code: 'OWNER_REQUIRED',
      });
    }
    return user;
  }
  function audit(state, action, user, record, details = {}) {
    state.auditEvents.push({
      id: crypto.randomUUID(),
      timestamp: new Date(now()).toISOString(),
      action,
      actorId: `user:${user.id}`,
      identityId: record.id,
      productUuid: record.productUuid,
      brand: record.brand,
      productType: record.productType,
      sequence: details.sequence ?? null,
      previousSku: details.previousSku ?? null,
      newSku: details.newSku ?? record.productSku,
      override: Boolean(details.override),
      reasonProvided: Boolean(clean(details.reason, 240)),
    });
  }
  function assertUnique(state, candidate, ownId = null) {
    const values = [
      candidate.productSku, candidate.internalProductCode, candidate.factoryCode,
      ...(candidate.variantSkus || []).map((variant) => variant.sku),
    ].filter(Boolean);
    if (new Set(values).size !== values.length) {
      throw Object.assign(new Error('Generated identities must be unique.'), {
        code: 'DUPLICATE_IDENTITY',
      });
    }
    for (const record of state.identities) {
      if (record.id === ownId) continue;
      const existing = new Set([
        record.productSku, record.internalProductCode, record.factoryCode,
        ...(record.variantSkus || []).map((variant) => variant.sku),
      ].filter(Boolean));
      if (values.some((value) => existing.has(value))) {
        throw Object.assign(new Error('An identity value is already allocated.'), {
          code: 'DUPLICATE_IDENTITY',
        });
      }
    }
  }
  function allocate(state, group, key) {
    const next = Number(state.sequences[group][key] || 0) + 1;
    state.sequences[group][key] = next;
    return next;
  }
  function view(productUuid) {
    const state = store.read();
    return {
      storeRevision: state.storeRevision,
      identity: state.identities.find((item) => item.productUuid === productUuid) || null,
      auditEvents: state.auditEvents.filter((item) => item.productUuid === productUuid),
    };
  }

  async function generate(session, input) {
    const user = authorized(session, 'create');
    if (!clean(input.productUuid)) {
      throw Object.assign(new Error('Product UUID is required.'), { code: 'VALIDATION' });
    }
    await store.mutate((state) => {
      const existing = state.identities.find((item) => item.productUuid === input.productUuid);
      if (existing) return { store: state, value: existing };
      const prefix = brandPrefix(input.brand);
      const typeCode = productTypeCode(input.productType, input.category, input.title);
      const productSequence = allocate(state, 'productSku', `${prefix}:${typeCode}`);
      const currentYear = String(year());
      const internalSequence = allocate(state, 'internalProductCode', currentYear);
      const factorySequence = allocate(state, 'factoryCode', currentYear);
      const generatedSku = `${prefix}-${typeCode}-${String(productSequence).padStart(4, '0')}`;
      const productSku = clean(input.existingSku, 64) || generatedSku;
      const variantSkus = (Array.isArray(input.variants) ? input.variants : []).map((attributes) => {
        const parts = variantParts(attributes, input.sellableAttributeKeys);
        return {
          id: crypto.randomUUID(),
          attributes: Object.fromEntries(Object.entries(attributes)
            .filter(([, value]) => clean(value))),
          signature: parts.join('-'),
          sku: parts.length ? `${productSku}-${parts.join('-')}` : `${productSku}-DEFAULT`,
          barcodeId: null,
          qrId: null,
        };
      });
      const record = {
        id: crypto.randomUUID(),
        productUuid: input.productUuid,
        catalogProductId: clean(input.catalogProductId, 120) || null,
        brand: clean(input.brand) || 'MOTOGRIP GEAR',
        brandPrefix: prefix,
        productType: clean(input.productType || input.category || input.title) || 'Other',
        productTypeCode: typeCode,
        productSku,
        generatedProductSku: generatedSku,
        existingSkuPreserved: Boolean(clean(input.existingSku)),
        internalProductCode: `P-${currentYear}-${String(internalSequence).padStart(6, '0')}`,
        factoryCode: `F-${currentYear}-${String(factorySequence).padStart(6, '0')}`,
        variantSkus,
        barcodeId: null,
        qrId: null,
        state: 'preview',
        generatedAt: new Date(now()).toISOString(),
        generatedBy: `user:${user.id}`,
        approvedAt: null,
        approvedBy: null,
        lockedAt: null,
        lockedBy: null,
      };
      assertUnique(state, record);
      state.identities.push(record);
      audit(state, 'product_identity_generated', user, record, {
        sequence: productSequence, newSku: productSku,
      });
      return { store: state, value: record };
    }, input.expectedRevision);
    return view(input.productUuid);
  }

  async function overrideSku(session, input) {
    const user = authorized(session, 'approve', true);
    const nextSku = clean(input.productSku, 64).toUpperCase();
    if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(nextSku)) {
      throw Object.assign(new Error('SKU format is invalid.'), { code: 'VALIDATION' });
    }
    await store.mutate((state) => {
      const record = state.identities.find((item) => item.productUuid === input.productUuid);
      if (!record) throw Object.assign(new Error('Product Identity was not found.'), { code: 'VALIDATION' });
      if (record.state === 'locked') throw Object.assign(new Error('Locked SKU cannot be modified.'), { code: 'IDENTITY_LOCKED' });
      const previousSku = record.productSku;
      record.productSku = nextSku;
      record.variantSkus = record.variantSkus.map((variant) => ({
        ...variant,
        sku: variant.signature ? `${nextSku}-${variant.signature}` : `${nextSku}-DEFAULT`,
      }));
      assertUnique(state, record, record.id);
      audit(state, 'product_sku_overridden', user, record, {
        previousSku, newSku: nextSku, override: true, reason: input.reason,
      });
      return { store: state, value: record };
    }, input.expectedRevision);
    return view(input.productUuid);
  }

  async function transition(session, input, target) {
    const user = authorized(session, target === 'approved' ? 'approve' : 'edit', target === 'unlocked');
    await store.mutate((state) => {
      const record = state.identities.find((item) => item.productUuid === input.productUuid);
      if (!record) throw Object.assign(new Error('Product Identity was not found.'), { code: 'VALIDATION' });
      const valid = (target === 'approved' && record.state === 'preview') ||
        (target === 'locked' && record.state === 'approved') ||
        (target === 'unlocked' && record.state === 'locked');
      if (!valid) throw Object.assign(new Error('Product Identity state transition is invalid.'), { code: 'INVALID_STATE' });
      if (target === 'approved') {
        record.state = 'approved';
        record.approvedAt = new Date(now()).toISOString();
        record.approvedBy = `user:${user.id}`;
        audit(state, 'product_identity_approved', user, record);
      } else if (target === 'locked') {
        record.state = 'locked';
        record.lockedAt = new Date(now()).toISOString();
        record.lockedBy = `user:${user.id}`;
        audit(state, 'product_identity_locked', user, record);
      } else {
        record.state = 'approved';
        record.lockedAt = null;
        record.lockedBy = null;
        audit(state, 'product_identity_unlocked', user, record, {
          override: true, reason: input.reason,
        });
      }
      return { store: state, value: record };
    }, input.expectedRevision);
    return view(input.productUuid);
  }

  return {
    view,
    generate,
    overrideSku,
    approve: (session, input) => transition(session, input, 'approved'),
    lock: (session, input) => transition(session, input, 'locked'),
    unlock: (session, input) => transition(session, input, 'unlocked'),
  };
}

module.exports = {
  BRAND_PREFIXES,
  productTypeCode,
  variantParts,
  createProductIdentityService,
};
