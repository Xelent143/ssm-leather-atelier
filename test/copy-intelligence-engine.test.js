const assert = require('node:assert/strict');
const test = require('node:test');
const { analyzeCopy } = require('../copy-intelligence-service');

const facts = {
  productTitle: 'Dean Brown Leather Biker Jacket',
  productType: 'Motorcycle Jacket',
  brand: 'MOTOGRIP GEAR',
  outerMaterial: 'Cowhide leather',
  leatherType: 'Cowhide leather',
  leatherColor: 'Brown',
  closure: 'Front zipper',
  pocketCount: 5,
};

function compliantContent() {
  return {
    shopify: {
      title: 'Dean Brown Leather Biker Jacket',
      seoTitle: 'Dean Brown Leather Biker Jacket | MOTOGRIP GEAR',
      metaDescription: 'Explore the Dean brown cowhide leather biker jacket with a front zipper, five practical pockets, clear sizing details and a structured motorcycle-inspired fit.',
      description: 'The Dean jacket uses brown cowhide leather, a front zipper and five practical pockets. Its clear construction details help buyers compare fit and features.',
      urlHandle: 'dean-brown-leather-biker-jacket',
    },
    ebay: {
      title: 'MOTOGRIP Dean Brown Cowhide Leather Biker Jacket MG-MJ01',
      description: 'Brown cowhide leather, front zipper and five practical pockets.',
    },
    etsy: {
      title: 'Dean Brown Cowhide Leather Biker Jacket, Men’s Motorcycle Style Outerwear, Front Zip Jacket by MOTOGRIP GEAR',
      description: 'A brown cowhide leather biker jacket with a front zipper and five practical pockets.',
      tags: [
        'brown jacket', 'biker jacket', 'cowhide leather', 'mens outerwear',
        'motorcycle style', 'front zip jacket', 'leather jacket', 'motogrip gear',
        'rider gift', 'brown leather', 'structured fit', 'mens jacket', 'road style',
      ],
    },
    seo: {
      title: 'Dean Brown Leather Biker Jacket | MOTOGRIP GEAR',
      metaDescription: 'Explore the Dean brown cowhide leather biker jacket with a front zipper, five practical pockets, clear sizing details and a structured motorcycle-inspired fit.',
      keywords: ['brown leather biker jacket', 'cowhide motorcycle jacket'],
    },
    faq: [{
      question: 'What material is the Dean jacket made from?',
      answer: 'The approved listing input specifies brown cowhide leather.',
    }],
    buyingGuide: 'Compare the confirmed fit, material, pocket details and sizing before ordering.',
  };
}

test('Dean acceptance defects are detected with exact locations and suggestions', () => {
  const content = compliantContent();
  content.shopify.description = [
    'Leather leather jacket are built for riders.',
    'Leather jacket leather jacket leather jacket leather jacket leather jacket.',
    'This black Lambskin jacket has buttons and 6 pockets.',
    'It is 100% Waterproof, CE Approved, Military Grade and uses Genuine YKK.',
  ].join(' ');
  const report = analyzeCopy({
    content,
    facts,
    analyzedAt: '2026-07-26T12:00:00.000Z',
  });
  const codes = new Set(report.issues.map((item) => item.code));
  for (const code of [
    'duplicate_word',
    'grammar',
    'keyword_stuffing',
    'outerMaterial_mismatch',
    'leatherColor_mismatch',
    'closure_mismatch',
    'pocket_count_mismatch',
    'unsupported_claim',
  ]) assert.ok(codes.has(code), `missing ${code}`);
  assert.ok(report.issues.every((item) =>
    item.location.field && Number.isInteger(item.location.start) &&
    Number.isInteger(item.location.end)));
  assert.ok(report.suggestions.every((item) =>
    item.suggestion && item.automaticChangeApplied === false));
  assert.equal(report.readOnly, true);
  assert.ok(report.scores.overallQuality < 80);
  assert.ok(report.scores.leatherAccuracy < 100);
  assert.ok(report.scores.unsupportedClaimRisk > 0);
  assert.ok('primaryKeywordUsage' in report.scores.seoIntelligence);
  assert.ok('secondaryKeywordUsage' in report.scores.seoIntelligence);
  assert.ok('headingQuality' in report.scores.seoIntelligence);
  assert.ok('metaQuality' in report.scores.seoIntelligence);
  assert.ok('internalConsistency' in report.scores.seoIntelligence);
  assert.ok('urlSuggestionQuality' in report.scores.seoIntelligence);
});

test('correcting issues raises scores without inventing facts', () => {
  const broken = compliantContent();
  broken.shopify.description = 'Leather leather. This black lambskin jacket are 100% Waterproof.';
  const before = analyzeCopy({ content: broken, facts });
  const corrected = compliantContent();
  const after = analyzeCopy({ content: corrected, facts });
  assert.ok(after.scores.overallQuality > before.scores.overallQuality);
  assert.ok(after.scores.humanReadability > before.scores.humanReadability);
  assert.equal(after.scores.leatherAccuracy, 100);
  assert.equal(after.scores.unsupportedClaimRisk, 0);
  assert.deepEqual(corrected, compliantContent());
});

test('marketplace rules are scored independently', () => {
  const content = compliantContent();
  content.shopify.metaDescription = 'Too short';
  content.ebay.title = 'X'.repeat(81);
  content.etsy.title = 'Short Etsy title';
  content.etsy.tags = ['one'];
  content.seo.metaDescription = '';
  const report = analyzeCopy({ content, facts });
  const fields = report.issues.filter((item) => item.category === 'marketplace')
    .map((item) => item.location.field);
  assert.ok(fields.includes('shopify.metaDescription'));
  assert.ok(fields.includes('ebay.title'));
  assert.ok(fields.includes('etsy.title'));
  assert.ok(fields.includes('etsy.tags'));
  assert.ok(fields.includes('seo.metaDescription'));
  assert.ok(report.scores.shopify < 100);
  assert.ok(report.scores.ebay < 100);
  assert.ok(report.scores.etsy < 100);
});

test('approved evidence allowlist suppresses only the exact supported claim', () => {
  const content = compliantContent();
  content.shopify.description = 'The approved specification states Genuine YKK. It is CE Approved.';
  const report = analyzeCopy({
    content,
    facts,
    supportedClaims: ['Genuine YKK'],
  });
  const messages = report.issues.filter((item) => item.code === 'unsupported_claim')
    .map((item) => item.message);
  assert.equal(messages.some((message) => /Genuine YKK/i.test(message)), false);
  assert.equal(messages.some((message) => /CE Approved/i.test(message)), true);
});

test('analysis does not mutate listing content', () => {
  const content = compliantContent();
  const before = JSON.stringify(content);
  analyzeCopy({ content, facts });
  assert.equal(JSON.stringify(content), before);
});
