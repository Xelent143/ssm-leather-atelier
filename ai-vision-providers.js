const crypto = require('crypto');
const { confidence } = require('./ai-vision-schema');

const COVERAGE_ROLES = [
  'Front', 'Back', 'Left Side', 'Right Side', 'Interior', 'Closure', 'Pocket',
  'Hardware', 'Logo', 'Detail', 'White Background', 'Lifestyle', 'Size Chart',
];

function fact(key, value, score, evidenceMediaIds, status = 'detected', notes = '', source = 'fake_test_provider') {
  const normalized = confidence(score);
  return {
    factId: crypto.randomUUID(),
    key, value,
    confidenceScore: normalized.score,
    confidenceLabel: normalized.label,
    evidenceMediaIds: [...evidenceMediaIds],
    evidenceNotes: notes,
    source,
    status,
    needsConfirmation: normalized.score < 80 || ['gender', 'ageGroup', 'material'].includes(key),
    conflict: false,
    userConfirmedValue: null,
    approval: null,
  };
}

function createMetadataVisionProvider() {
  return {
    id: 'metadata_only',
    displayName: 'Metadata Only',
    configured: true,
    available: true,
    executionEnabled: true,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    multipleImages: true,
    maximumImages: 30,
    costEstimate: { amount: 0, currency: 'USD', label: '$0.00' },
    analyze({ product, media, roles }) {
      const usedRoles = media.map((item) => roles[item.id] || 'Unknown');
      return normalizeResult({
        providerId: 'metadata_only',
        facts: [
          fact('productType', product.organization?.productType || 'Unknown', 100, [], 'confirmed',
            'Existing Product Editor value.', 'metadata_only'),
          fact('primaryColor', product.merchantAttributes?.color || product.organization?.color || 'Unknown',
            product.merchantAttributes?.color ? 100 : 0, [],
            product.merchantAttributes?.color ? 'confirmed' : 'unknown', '', 'metadata_only'),
        ],
        suggestedRoles: Object.fromEntries(media.map((item) => [item.id, roles[item.id] || 'Unknown'])),
        quality: media.map((item) => quality(item, roles[item.id])),
        coverage: coverage(usedRoles),
        conflicts: [],
        recommendations: missingRecommendations(usedRoles),
      });
    },
  };
}

function quality(item, role) {
  const name = `${item.title || ''} ${item.originalName || ''}`.toLowerCase();
  const low = /blur|low-quality|cropped/.test(name);
  return {
    mediaId: item.id,
    status: low ? 'Needs Improvement' : 'Unknown',
    resolutionSuitability: 'Unknown',
    blur: low ? 'Possible' : 'Unknown',
    cropping: /cropped/.test(name) ? 'Product may be cropped' : 'Unknown',
    productFullyVisible: role === 'Front' || role === 'Back' ? 'Needs visual confirmation' : 'Unknown',
    backgroundCleanliness: 'Unknown',
    lightingConsistency: 'Unknown',
    colorReliability: 'Unknown',
    shadowSeverity: 'Unknown',
    distortion: 'Unknown',
    watermarkOrText: 'Unknown',
    marketplaceReadiness: low ? 'Needs Improvement' : 'Unknown',
    websiteReadiness: low ? 'Needs Improvement' : 'Unknown',
    recommendations: low ? ['Retake or replace this low-quality reference.'] : ['Visual quality requires an enabled vision provider.'],
  };
}

function coverage(roles) {
  const items = COVERAGE_ROLES.map((role) => {
    const count = roles.filter((item) => item === role).length;
    return { role, confirmed: count > 0, suggested: false, duplicate: count > 1, lowQuality: false };
  });
  return {
    items,
    confirmed: items.filter((item) => item.confirmed).map((item) => item.role),
    suggested: [],
    missing: items.filter((item) => !item.confirmed).map((item) => item.role),
    duplicates: items.filter((item) => item.duplicate).map((item) => item.role),
    lowQuality: [],
    percentage: Math.round(items.filter((item) => item.confirmed).length / items.length * 100),
  };
}

function missingRecommendations(roles) {
  const recommendations = [];
  if (!roles.includes('Back')) recommendations.push('Retake or upload a full back image.');
  if (!roles.includes('Interior')) recommendations.push('Upload an interior lining image.');
  if (!roles.includes('Hardware')) recommendations.push('Upload a clear hardware detail.');
  if (!roles.includes('Lifestyle')) recommendations.push('Add a factual lifestyle image.');
  return recommendations;
}

function createFakeVisionProvider() {
  return {
    id: 'fake_test_provider',
    displayName: 'Deterministic Test Vision',
    configured: true,
    available: true,
    executionEnabled: true,
    developmentOnly: true,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    multipleImages: true,
    maximumImages: 20,
    costEstimate: { amount: 0, currency: 'USD', label: '$0.00 test provider' },
    analyze({ product, media, roles }) {
      const ids = media.map((item) => item.id);
      const names = media.map((item) => `${item.title || ''} ${item.originalName || ''}`.toLowerCase());
      const roleValues = media.map((item, index) => roles[item.id] !== 'Unknown' ? roles[item.id]
        : names[index].includes('back') ? 'Back'
          : names[index].includes('interior') ? 'Interior'
            : names[index].includes('lifestyle') ? 'Lifestyle' : index === 0 ? 'Front' : 'Detail');
      const isVest = /vest|waistcoat/.test(`${product.title} ${product.organization?.productType}`.toLowerCase());
      const isConflict = names.some((name) => name.includes('conflict'));
      const visibleFacts = [
        fact('productType', isVest ? 'Leather Vest' : 'Leather Jacket', 94, ids.slice(0, 2)),
        fact('productSubtype', isVest ? 'Western Vest' : 'Motorcycle Jacket', 72, ids.slice(0, 1), 'inferred'),
        fact('primaryColor', isConflict ? 'Black' : 'Brown', isConflict ? 58 : 92, ids.slice(0, 2)),
        fact('style', isVest ? 'Western' : 'Biker', 74, ids.slice(0, 2), 'inferred'),
        fact('closure', isVest ? 'Button closure' : 'Main zipper', 86, ids.slice(0, 1)),
        fact('visibleExteriorPocketCount', 2, 64, ids.slice(0, 1)),
        fact('hardwareColor', 'Antique brass', 61, ids.slice(0, 1)),
        fact('material', 'Leather-like material', 35, ids.slice(0, 2), 'inferred', 'Exact leather species cannot be determined visually.'),
        fact('gender', 'Unknown', 0, [], 'unknown', 'Gender is not inferred from appearance alone.'),
        fact('ageGroup', 'Unknown', 0, [], 'unknown', 'Age group requires trusted data or confirmation.'),
        fact('waterproofing', 'Unknown', 0, [], 'unknown'),
        fact('hardwareBrand', 'Unknown', 0, [], 'unknown'),
      ];
      const conflicts = [];
      const trustedColor = product.merchantAttributes?.color || product.organization?.color;
      const colorFact = visibleFacts.find((item) => item.key === 'primaryColor');
      if (trustedColor && colorFact.value !== trustedColor) {
        colorFact.conflict = true;
        colorFact.status = 'conflicted';
        conflicts.push({
          conflictId: crypto.randomUUID(),
          key: 'primaryColor',
          trustedValue: trustedColor,
          observedValue: colorFact.value,
          evidenceMediaIds: colorFact.evidenceMediaIds,
          status: 'unresolved',
          resolution: null,
        });
      }
      if (isConflict) conflicts.push({
        conflictId: crypto.randomUUID(), key: 'imageSetConsistency',
        trustedValue: 'Same product', observedValue: 'Images may show different variants or products',
        evidenceMediaIds: ids, status: 'unresolved', resolution: null,
      });
      const resultCoverage = coverage(roleValues);
      const qualityRows = media.map((item, index) => {
        const row = quality(item, roleValues[index]);
        if (!/blur|low-quality|cropped/.test(names[index])) {
          row.status = 'Good';
          row.resolutionSuitability = 'Suitable';
          row.marketplaceReadiness = roleValues[index] === 'Front' ? 'Good' : 'Acceptable';
          row.websiteReadiness = 'Good';
          row.recommendations = [];
        }
        return row;
      });
      resultCoverage.lowQuality = qualityRows.filter((item) => item.status === 'Needs Improvement').map((item) => item.mediaId);
      return normalizeResult({
        providerId: 'fake_test_provider',
        facts: visibleFacts,
        suggestedRoles: Object.fromEntries(media.map((item, index) => [item.id, roleValues[index]])),
        quality: qualityRows,
        coverage: resultCoverage,
        conflicts,
        recommendations: missingRecommendations(roleValues),
      });
    },
  };
}

function createOpenAiVisionAdapter(options = {}) {
  const env = options.env || process.env;
  const configured = Boolean(env.OPENAI_API_KEY);
  return {
    id: 'openai_vision',
    displayName: 'OpenAI Vision',
    configured,
    available: false,
    executionEnabled: false,
    status: configured ? 'Configured but Execution Disabled' : 'Not Configured',
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    multipleImages: true,
    maximumImages: null,
    costEstimate: { amount: null, currency: null, label: 'Unavailable until provider configuration is approved' },
    analyze() {
      throw Object.assign(new Error('Real vision execution is disabled in this sprint.'), {
        code: 'VISION_PROVIDER_EXECUTION_DISABLED',
      });
    },
  };
}

function normalizeResult(result) {
  return {
    providerId: result.providerId,
    facts: Array.isArray(result.facts) ? result.facts : [],
    suggestedRoles: result.suggestedRoles || {},
    quality: Array.isArray(result.quality) ? result.quality : [],
    coverage: result.coverage || coverage([]),
    conflicts: Array.isArray(result.conflicts) ? result.conflicts : [],
    recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
  };
}

function createVisionProviderRegistry(options = {}) {
  const env = options.env || process.env;
  const fake = createFakeVisionProvider();
  if (env.NODE_ENV === 'production') {
    fake.available = false;
    fake.executionEnabled = false;
    fake.status = 'Development/Test Only';
  }
  const providers = [
    createMetadataVisionProvider(),
    createOpenAiVisionAdapter(options),
    fake,
  ];
  return {
    list: () => providers.map(({ analyze, ...provider }) => ({ ...provider })),
    get: (id) => providers.find((provider) => provider.id === id) || null,
  };
}

module.exports = {
  COVERAGE_ROLES,
  createFakeVisionProvider,
  createMetadataVisionProvider,
  createOpenAiVisionAdapter,
  createVisionProviderRegistry,
  normalizeResult,
};
