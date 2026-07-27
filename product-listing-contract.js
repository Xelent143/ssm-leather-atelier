const GENDERS = new Set(['male', 'female', 'unisex']);
const AGE_GROUPS = new Set(['newborn', 'infant', 'toddler', 'kids', 'adult']);
const CONDITIONS = new Set(['new', 'used', 'refurbished']);
const AVAILABILITY = new Set(['in_stock', 'out_of_stock', 'preorder', 'backorder']);
const SIZE_SYSTEMS = new Set(['US', 'UK', 'EU', 'AU', 'JP', 'CN', 'BR', 'MEX']);
const SIZE_TYPES = new Set(['regular', 'petite', 'plus', 'tall', 'big', 'maternity']);

function clean(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}
function lines(value, max = 8) {
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return source.map((item) => clean(String(item).replace(/^[✔•*-]\s*/, ''), 500)).filter(Boolean).slice(0, max);
}
function paragraphs(value) {
  const source = Array.isArray(value) ? value : String(value || '')
    .replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .split(/\n{2,}/);
  return source.map((item) => clean(item, 3000)).filter(Boolean).slice(0, 3);
}
function specifications(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return source.slice(0, 50).map((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return { label: clean(item.label, 100), value: clean(item.value, 500) };
    }
    const [label, entry] = String(item || '').split(/:(.*)/s);
    return { label: clean(label, 100), value: clean(entry, 500) };
  }).filter((item) => item.label && item.value);
}
function normalizeWebsiteContent(input = {}, legacy = {}) {
  return {
    description: paragraphs(input.description ?? legacy.fullDescription ?? legacy.description ?? ''),
    features: lines(input.features ?? legacy.features ?? '', 8),
    specifications: specifications(input.specifications ?? legacy.specifications ?? ''),
    perfectFor: clean(input.perfectFor ?? legacy.perfectFor, 1000),
    whyYouWillLoveIt: clean(input.whyYouWillLoveIt ?? legacy.whyYouWillLoveIt, 1000),
  };
}
function normalizeGender(value) {
  const normalized = clean(value, 40).toLowerCase();
  if (['men', 'man', 'boys', 'boy', 'male'].includes(normalized)) return 'male';
  if (['women', 'woman', 'girls', 'girl', 'female'].includes(normalized)) return 'female';
  if (['unisex', 'kids / unisex kids', 'unisex kids'].includes(normalized)) return 'unisex';
  return '';
}
function genderLabel(value, ageGroup = 'adult') {
  if (ageGroup !== 'adult') {
    if (value === 'male') return 'Boys';
    if (value === 'female') return 'Girls';
    if (value === 'unisex') return 'Kids / Unisex Kids';
  }
  return value === 'male' ? 'Men' : value === 'female' ? 'Women' : value === 'unisex' ? 'Unisex' : '';
}
function normalizeAgeGroup(value) {
  const normalized = clean(value, 40).toLowerCase();
  if (['baby', 'babies', 'infants'].includes(normalized)) return 'infant';
  if (['children', 'child', 'kid'].includes(normalized)) return 'kids';
  if (['adults'].includes(normalized)) return 'adult';
  return AGE_GROUPS.has(normalized) ? normalized : '';
}
function statusRecord(value = {}, allowed, fallbackValue = '') {
  const normalized = allowed(value.value || value.suggestedValue || fallbackValue);
  const confidence = ['high', 'medium', 'low'].includes(value.confidence) ? value.confidence : 'low';
  const status = ['confirmed', 'suggested', 'needs_confirmation', 'rejected'].includes(value.status)
    ? value.status : 'needs_confirmation';
  return {
    value: normalized,
    confidence,
    status: confidence === 'high' && status === 'confirmed' ? 'confirmed' :
      status === 'rejected' ? 'rejected' : 'needs_confirmation',
    evidence: Array.isArray(value.evidence) ? value.evidence.slice(0, 20) : [],
    source: clean(value.source || '', 80),
  };
}
function normalizeClassification(input = {}, fallback = {}) {
  return {
    gender: statusRecord(input.gender, normalizeGender, fallback.gender),
    ageGroup: statusRecord(input.ageGroup, normalizeAgeGroup, fallback.ageGroup),
  };
}
function normalizeMerchantAttributes(input = {}, product = {}) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const option = (name) => (product.options || []).find((item) => item.name?.toLowerCase() === name)?.values || [];
  const classification = product.classification || {};
  const condition = clean(input.condition || 'new', 30).toLowerCase();
  const availability = clean(input.availability ||
    (variants.some((item) => item.status !== 'disabled' && Number(item.quantity) > 0) ? 'in_stock' : 'out_of_stock'), 30);
  const gtin = clean(input.gtin, 20);
  const mpn = clean(input.mpn, 100);
  return {
    gender: normalizeGender(input.gender || classification.gender?.value),
    age_group: normalizeAgeGroup(input.age_group || classification.ageGroup?.value),
    color: clean(input.color || option('color').join(', '), 200),
    material: clean(input.material || product.metafields?.leatherType || product.metafields?.outerMaterial, 200),
    pattern: clean(input.pattern, 120),
    condition: CONDITIONS.has(condition) ? condition : '',
    availability: AVAILABILITY.has(availability) ? availability : '',
    brand: clean(input.brand || product.organization?.brand, 160),
    size: clean(input.size || option('size').join(', '), 300),
    size_system: SIZE_SYSTEMS.has(clean(input.size_system).toUpperCase()) ? clean(input.size_system).toUpperCase() : '',
    size_type: SIZE_TYPES.has(clean(input.size_type).toLowerCase()) ? clean(input.size_type).toLowerCase() : '',
    product_type: clean(input.product_type || product.organization?.productType, 160),
    google_product_category: clean(input.google_product_category, 300),
    mpn,
    gtin,
    identifier_exists: gtin || mpn ? true : input.identifier_exists === false ? false : null,
    item_group_id: clean(input.item_group_id || product.identity?.productSku, 120),
    shipping_weight: clean(input.shipping_weight ||
      (product.shipping?.weight ? `${product.shipping.weight} ${product.shipping.weightUnit}` : ''), 80),
  };
}
function merchantReadiness(attributes = {}, classification = {}) {
  const required = [
    'gender', 'age_group', 'color', 'material', 'condition', 'availability', 'brand',
    'size', 'size_system', 'size_type', 'product_type', 'google_product_category',
  ];
  const missing = required.filter((key) => !attributes[key]);
  const needsConfirmation = [];
  if (classification.gender?.status !== 'confirmed') needsConfirmation.push('gender');
  if (classification.ageGroup?.status !== 'confirmed') needsConfirmation.push('age_group');
  if (attributes.identifier_exists === null) needsConfirmation.push('identifier_exists');
  const invalid = [];
  if (attributes.gender && !GENDERS.has(attributes.gender)) invalid.push('gender');
  if (attributes.age_group && !AGE_GROUPS.has(attributes.age_group)) invalid.push('age_group');
  if (attributes.identifier_exists === true && !attributes.gtin && !attributes.mpn) invalid.push('identifier_exists');
  if (attributes.identifier_exists === false && (attributes.gtin || attributes.mpn)) invalid.push('identifier_exists');
  const completed = required.filter((key) => attributes[key]).length +
    (attributes.identifier_exists !== null ? 1 : 0);
  const percentage = Math.round((completed / (required.length + 1)) * 100);
  const status = invalid.length || missing.length ? 'Not Ready' :
    needsConfirmation.length ? 'Needs Confirmation' :
      percentage === 100 ? 'Google Merchant Ready' : 'Ready for Review';
  return { percentage, status, completed, required: required.length + 1, missing, needsConfirmation, invalid };
}

module.exports = {
  AGE_GROUPS, GENDERS, genderLabel, merchantReadiness, normalizeAgeGroup,
  normalizeClassification, normalizeGender, normalizeMerchantAttributes, normalizeWebsiteContent,
};
