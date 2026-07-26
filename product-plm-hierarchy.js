const crypto = require('crypto');
const { cleanText, PRODUCT_TYPES } = require('./product-plm-schema');

const INITIAL_BRANDS = Object.freeze([
  { id: '8b5a60b1-c92b-4cab-9b51-a530428c093d', name: 'MOTOGRIP GEAR', code: 'MOTOGRIP_GEAR' },
  { id: '1a6a7169-8a16-4e70-956d-f482b8460902', name: 'BLACKTOP GEAR', code: 'BLACKTOP_GEAR' },
  { id: '01350839-6955-4a2f-b76e-d7de954e6d9c', name: 'Vintage Leather Goods', code: 'VINTAGE_LEATHER_GOODS' },
  { id: '03498019-bb82-4e10-b7e6-87d8d31ca1c1', name: 'BRANDS JACKET HUB', code: 'BRANDS_JACKET_HUB' },
  { id: 'c4f5464d-ddb9-40c8-bcce-56cf556b5224', name: 'The Western Hides', code: 'THE_WESTERN_HIDES' },
  { id: 'f769ed5d-73c7-4594-90b9-8b699f245c29', name: 'Custom Jacket Co', code: 'CUSTOM_JACKET_CO' },
]);

const PRODUCT_TYPE_LABELS = Object.freeze({
  motorcycle_jacket: 'Motorcycle Jackets',
  motorcycle_vest: 'Motorcycle Vests',
  leather_vest: 'Leather Vests',
  western_vest: 'Western Vests',
  waistcoat: 'Waistcoats',
  bomber_jacket: 'Bomber Jackets',
  varsity_jacket: 'Varsity Jackets',
  trucker_jacket: 'Trucker Jackets',
  cafe_racer_jacket: 'Cafe Racer Jackets',
  chaps: 'Chaps',
  leather_pants: 'Leather Pants',
  leather_shorts: 'Leather Shorts',
  leather_coat: 'Leather Coats',
  leather_bag: 'Leather Bags',
  tool_bag: 'Tool Bags',
  saddle_bag: 'Saddle Bags',
  gloves: 'Gloves',
  accessories: 'Accessories',
});

function normalizeName(value) {
  return cleanText(value, 160).normalize('NFKC').toLocaleLowerCase('en-US');
}

function brandDefinitionForName(value) {
  const key = normalizeName(value);
  if (!key) return INITIAL_BRANDS[0];
  return INITIAL_BRANDS.find((brand) => normalizeName(brand.name) === key) || null;
}

function inferProductType(source) {
  const text = [
    source.title,
    source.category,
    source.productType,
    source.legacySlug,
  ].map((value) => normalizeName(value)).join(' ');
  const rules = [
    ['saddle_bag', /\bsaddle\s*bag/],
    ['tool_bag', /\btool\s*bag/],
    ['leather_bag', /\b(bag|bags)\b/],
    ['western_vest', /\bwestern\b.*\b(vest|waistcoat)\b|\b(vest|waistcoat)\b.*\bwestern\b/],
    ['motorcycle_vest', /\b(moto|motorcycle|biker|riding)\b.*\bvest\b|\bvest\b.*\b(moto|motorcycle|biker|riding)\b/],
    ['waistcoat', /\bwaistcoat\b/],
    ['leather_vest', /\bvests?\b/],
    ['bomber_jacket', /\bbomber\b/],
    ['varsity_jacket', /\bvarsity\b/],
    ['trucker_jacket', /\btrucker\b/],
    ['cafe_racer_jacket', /\bcafe\s*racer\b/],
    ['leather_coat', /\b(coat|overcoat)\b/],
    ['chaps', /\bchaps?\b/],
    ['leather_shorts', /\bshorts?\b/],
    ['leather_pants', /\b(pants?|trousers?)\b/],
    ['gloves', /\bgloves?\b/],
    ['accessories', /\b(accessories|accessory|care\s*kit|keychain|wallet|belt)\b/],
    ['motorcycle_jacket', /\b(moto|motorcycle|biker|rider|riding|double\s*rider)\b.*\b(jacket|gear)\b|\bdouble\s*rider\b/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'motorcycle_jacket';
}

function hierarchyProposal(source) {
  const productType = inferProductType(source);
  const brand = brandDefinitionForName(source.brandName);
  return {
    brandCode: brand?.code || null,
    brandName: brand?.name || cleanText(source.brandName, 160),
    brandRecognized: Boolean(brand),
    productType,
    familyCode: productType.toUpperCase(),
    familyName: PRODUCT_TYPE_LABELS[productType],
    styleName: cleanText(source.title || 'Untitled product', 300),
    confidence: 'suggested',
    requiresReview: true,
  };
}

function seedInitialBrands(existingBrands, timestamp, actorId, defaultLegalEntityId = null) {
  const brands = existingBrands;
  for (const definition of INITIAL_BRANDS) {
    let brand = brands.find((item) =>
      item.code === definition.code || normalizeName(item.name) === normalizeName(definition.name));
    if (!brand) {
      brand = {
        id: definition.id,
        schemaVersion: 1,
        name: definition.name,
        code: definition.code,
        status: 'active',
        defaultLegalEntityId,
        dataClassification: 'internal',
        createdAt: timestamp,
        createdBy: actorId,
        updatedAt: timestamp,
        updatedBy: actorId,
      };
      brands.push(brand);
    } else if (!brand.defaultLegalEntityId && defaultLegalEntityId) {
      brand.defaultLegalEntityId = defaultLegalEntityId;
      brand.updatedAt = timestamp;
      brand.updatedBy = actorId;
    }
  }
  return brands;
}

function findOrCreateFamily(draft, proposal, brand, legalEntity, timestamp, actorId) {
  let family = draft.productFamilies.find((item) =>
    item.brandId === brand.id && item.code === proposal.familyCode);
  if (!family) {
    family = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      code: proposal.familyCode,
      name: proposal.familyName,
      description: 'Business grouping created from an approved legacy migration preview.',
      brandId: brand.id,
      legalEntityId: legalEntity.id,
      parentFamilyId: null,
      familyType: proposal.productType,
      status: 'active',
      dataClassification: 'internal',
      legacyReferences: [],
      createdAt: timestamp,
      createdBy: actorId,
      updatedAt: timestamp,
      updatedBy: actorId,
    };
    draft.productFamilies.push(family);
  }
  return family;
}

function createStyle(draft, identity, family, proposal, timestamp, actorId) {
  const existing = draft.productStyles.find((item) => item.productUuid === identity.id);
  if (existing) return existing;
  const style = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    productUuid: identity.id,
    familyId: family.id,
    brandId: identity.brandId,
    legalEntityId: identity.legalEntityId,
    styleCode: `STYLE-${identity.id.slice(0, 8).toUpperCase()}`,
    name: proposal.styleName,
    productType: proposal.productType,
    status: 'active',
    dataClassification: 'internal',
    configurationPolicyRef: null,
    privateLabelProgramRef: null,
    legacyReferences: [],
    createdAt: timestamp,
    createdBy: actorId,
    updatedAt: timestamp,
    updatedBy: actorId,
  };
  draft.productStyles.push(style);
  return style;
}

module.exports = {
  INITIAL_BRANDS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  brandDefinitionForName,
  createStyle,
  findOrCreateFamily,
  hierarchyProposal,
  inferProductType,
  normalizeName,
  seedInitialBrands,
};
