const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  genderLabel, merchantReadiness, normalizeClassification, normalizeMerchantAttributes,
  normalizeWebsiteContent,
} = require('../product-listing-contract');

function completeProduct(gender = 'male', ageGroup = 'adult') {
  const product = {
    organization: { brand: 'MOTOGRIP GEAR', productType: 'Leather Vest' },
    classification: {
      gender: { value: gender, confidence: 'high', status: 'confirmed' },
      ageGroup: { value: ageGroup, confidence: 'high', status: 'confirmed' },
    },
    metafields: { leatherType: 'Cowhide' },
    options: [
      { name: 'Size', values: ageGroup === 'kids' ? ['8', '10'] : ['S', 'M'] },
      { name: 'Color', values: ['Brown'] },
    ],
    variants: [{ quantity: 10, status: 'active' }],
    shipping: { weight: 3, weightUnit: 'lb' },
  };
  const merchant = normalizeMerchantAttributes({
    color: 'Brown', material: 'Cowhide', condition: 'new', availability: 'in_stock',
    size_system: 'US', size_type: 'regular',
    google_product_category: 'Apparel & Accessories > Clothing > Vests',
    identifier_exists: false,
  }, product);
  return { product, merchant };
}

test('adult men, women, and kids classifications use supported Merchant values', () => {
  for (const [gender, ageGroup, label] of [
    ['male', 'adult', 'Men'], ['female', 'adult', 'Women'], ['unisex', 'kids', 'Kids / Unisex Kids'],
  ]) {
    const classification = normalizeClassification({
      gender: { value: gender, confidence: 'high', status: 'confirmed' },
      ageGroup: { value: ageGroup, confidence: 'high', status: 'confirmed' },
    });
    assert.equal(classification.gender.value, gender);
    assert.equal(classification.ageGroup.value, ageGroup);
    assert.equal(genderLabel(gender, ageGroup), label);
  }
});

test('Merchant readiness requires confirmed gender, age group and identifier decision', () => {
  const { product, merchant } = completeProduct();
  const ready = merchantReadiness(merchant, product.classification);
  assert.equal(ready.status, 'Google Merchant Ready');
  assert.equal(ready.percentage, 100);
  const ambiguous = merchantReadiness({ ...merchant, age_group: '' }, {
    gender: product.classification.gender,
    ageGroup: { value: '', confidence: 'low', status: 'needs_confirmation' },
  });
  assert.equal(ambiguous.status, 'Not Ready');
  assert.ok(ambiguous.missing.includes('age_group'));
  assert.ok(ambiguous.needsConfirmation.includes('age_group'));
});

test('website content contract has exactly five ordered fields and structured specifications', () => {
  const content = normalizeWebsiteContent({
    description: ['First premium paragraph.', 'Second factual paragraph.'],
    features: ['Brown finish', 'Front closure'],
    specifications: [{ label: 'Gender', value: 'Men' }, { label: 'Age group', value: 'Adult' }],
    perfectFor: 'Adult men seeking a factual leather vest.',
    whyYouWillLoveIt: 'A clean brown design grounded in confirmed details.',
  });
  assert.deepEqual(Object.keys(content), [
    'description', 'features', 'specifications', 'perfectFor', 'whyYouWillLoveIt',
  ]);
  assert.deepEqual(content.specifications[0], { label: 'Gender', value: 'Men' });
});

test('public factual PDP renders only the permanent five-section accordion in order', () => {
  for (const file of ['ssm-pdp.jsx', 'index.html']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const start = source.indexOf('const sections = [');
    const end = source.indexOf('].filter', start);
    const contract = source.slice(start, end);
    const labels = ['Description', 'Features', 'Specifications', 'Perfect for', 'Why you’ll love it'];
    labels.reduce((prior, label) => {
      const index = contract.indexOf(`'${label}'`);
      assert.ok(index > prior, `${file}: ${label} must follow the permanent order`);
      return index;
    }, -1);
    assert.doesNotMatch(contract, /Product details|FAQ|Buying guide/);
    assert.match(source, /openSection === id \? '−' : '\+'/);
  }
});
