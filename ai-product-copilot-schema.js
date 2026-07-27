const CONFIDENCE = new Set(['high', 'medium', 'low']);
const FACT_STATUS = new Set(['confirmed', 'suggested', 'needs_confirmation', 'rejected']);
const ANALYSIS_STATUS = new Set([
  'waiting_for_images', 'ready_to_analyze', 'analyzing', 'analysis_complete',
  'needs_confirmation', 'failed', 'cancelled',
]);
const IMAGE_ROLES = new Set([
  'Front', 'Back', 'Left Side', 'Right Side', 'Interior', 'Detail', 'Hardware',
  'Lifestyle', 'Size Chart', 'Unknown',
]);

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['visualAnalysis', 'productFacts', 'audienceClassification', 'merchantAttributes',
    'suggestedTitle', 'missingInformation', 'categorySuggestions',
    'websiteContent', 'seo', 'aeo', 'geo', 'ebayDraft', 'etsyDraft', 'imageCoverage',
    'risks', 'unsupportedClaims'],
  properties: {
    visualAnalysis: { type: 'array', items: { $ref: '#/$defs/fact' } },
    productFacts: { type: 'array', items: { $ref: '#/$defs/fact' } },
    audienceClassification: {
      type: 'object', additionalProperties: false, required: ['gender', 'ageGroup'],
      properties: { gender: { $ref: '#/$defs/fact' }, ageGroup: { $ref: '#/$defs/fact' } },
    },
    merchantAttributes: { type: 'array', items: { $ref: '#/$defs/fact' } },
    suggestedTitle: { type: 'string' },
    missingInformation: { type: 'array', items: { $ref: '#/$defs/question' } },
    categorySuggestions: { type: 'array', items: { type: 'string' } },
    websiteContent: { $ref: '#/$defs/content' },
    seo: { $ref: '#/$defs/seo' },
    aeo: { type: 'array', items: { $ref: '#/$defs/qa' } },
    geo: { type: 'array', items: { $ref: '#/$defs/qa' } },
    ebayDraft: { $ref: '#/$defs/marketplace' },
    etsyDraft: {
      type: 'object', additionalProperties: false,
      required: ['title', 'description', 'tags'],
      properties: {
        title: { type: 'string' }, description: { type: 'string' },
        tags: { type: 'array', minItems: 13, maxItems: 13, items: { type: 'string' } },
      },
    },
    imageCoverage: { type: 'array', items: { $ref: '#/$defs/coverage' } },
    risks: { type: 'array', items: { type: 'string' } },
    unsupportedClaims: { type: 'array', items: { type: 'string' } },
  },
  $defs: {
    evidence: {
      type: 'object', additionalProperties: false, required: ['imageId', 'imageRole'],
      properties: { imageId: { type: 'string' }, imageRole: { type: 'string' } },
    },
    fact: {
      type: 'object', additionalProperties: false,
      required: ['field', 'value', 'confidence', 'status', 'evidence'],
      properties: {
        field: { type: 'string' }, value: { type: 'string' },
        confidence: { type: 'string', enum: [...CONFIDENCE] },
        status: { type: 'string', enum: [...FACT_STATUS] },
        evidence: { type: 'array', items: { $ref: '#/$defs/evidence' } },
      },
    },
    question: {
      type: 'object', additionalProperties: false,
      required: ['field', 'question', 'options', 'critical'],
      properties: {
        field: { type: 'string' }, question: { type: 'string' },
        options: { type: 'array', items: { type: 'string' } }, critical: { type: 'boolean' },
      },
    },
    content: {
      type: 'object', additionalProperties: false,
      required: ['description', 'features', 'specifications', 'perfectFor', 'whyYouWillLoveIt'],
      properties: {
        description: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
        features: { type: 'array', items: { type: 'string' } },
        specifications: {
          type: 'array', items: {
            type: 'object', additionalProperties: false, required: ['label', 'value'],
            properties: { label: { type: 'string' }, value: { type: 'string' } },
          },
        },
        perfectFor: { type: 'string' }, whyYouWillLoveIt: { type: 'string' },
      },
    },
    seo: {
      type: 'object', additionalProperties: false,
      required: ['title', 'metaDescription', 'handle', 'primaryKeyword',
        'secondaryKeywords', 'searchIntentKeywords', 'altTextSuggestions'],
      properties: {
        title: { type: 'string' }, metaDescription: { type: 'string' },
        handle: { type: 'string' }, primaryKeyword: { type: 'string' },
        secondaryKeywords: { type: 'array', items: { type: 'string' } },
        searchIntentKeywords: { type: 'array', items: { type: 'string' } },
        altTextSuggestions: { type: 'array', items: { type: 'string' } },
      },
    },
    qa: {
      type: 'object', additionalProperties: false, required: ['question', 'answer'],
      properties: { question: { type: 'string' }, answer: { type: 'string' } },
    },
    marketplace: {
      type: 'object', additionalProperties: false, required: ['title', 'description'],
      properties: { title: { type: 'string' }, description: { type: 'string' } },
    },
    coverage: {
      type: 'object', additionalProperties: false, required: ['role', 'available', 'recommendation'],
      properties: {
        role: { type: 'string' }, available: { type: 'boolean' },
        recommendation: { type: 'string' },
      },
    },
  },
};

function cleanString(value, max = 20000) {
  if (typeof value !== 'string') throw Object.assign(new Error('AI response contains an invalid string field.'), { code: 'AI_SCHEMA_INVALID' });
  return value.slice(0, max);
}

function validateFact(value, imageIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('AI fact is malformed.'), { code: 'AI_SCHEMA_INVALID' });
  if (!CONFIDENCE.has(value.confidence) || !FACT_STATUS.has(value.status)) throw Object.assign(new Error('AI fact confidence or status is invalid.'), { code: 'AI_SCHEMA_INVALID' });
  const evidence = (Array.isArray(value.evidence) ? value.evidence : []).map((item) => {
    if (!imageIds.has(item.imageId) || !IMAGE_ROLES.has(item.imageRole)) throw Object.assign(new Error('AI evidence references an unknown image.'), { code: 'AI_SCHEMA_INVALID' });
    return { imageId: item.imageId, imageRole: item.imageRole };
  });
  return {
    field: cleanString(value.field, 100), value: cleanString(value.value, 500),
    confidence: value.confidence, status: value.status, evidence,
  };
}

function validateResponse(value, images) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('AI response is malformed.'), { code: 'AI_SCHEMA_INVALID' });
  const required = RESPONSE_SCHEMA.required;
  if (required.some((key) => !(key in value))) throw Object.assign(new Error('AI response is incomplete.'), { code: 'AI_SCHEMA_INVALID' });
  const allowed = new Set(required);
  if (Object.keys(value).some((key) => !allowed.has(key))) throw Object.assign(new Error('AI response contains unsupported fields.'), { code: 'AI_SCHEMA_INVALID' });
  const imageIds = new Set(images.map((image) => image.id));
  const visualFacts = (value.visualAnalysis || []).map((fact) => validateFact(fact, imageIds));
  const productFacts = (value.productFacts || []).map((fact) => validateFact(fact, imageIds));
  const gender = validateFact(value.audienceClassification?.gender, imageIds);
  const ageGroup = validateFact(value.audienceClassification?.ageGroup, imageIds);
  if (!['male', 'female', 'unisex', ''].includes(gender.value.toLowerCase())) {
    throw Object.assign(new Error('AI gender classification is invalid.'), { code: 'AI_SCHEMA_INVALID' });
  }
  if (!['newborn', 'infant', 'toddler', 'kids', 'adult', ''].includes(ageGroup.value.toLowerCase())) {
    throw Object.assign(new Error('AI age-group classification is invalid.'), { code: 'AI_SCHEMA_INVALID' });
  }
  const merchantAttributes = (value.merchantAttributes || []).map((fact) => validateFact(fact, imageIds));
  const content = value.websiteContent || {};
  const seo = value.seo || {};
  const etsyTags = Array.isArray(value.etsyDraft?.tags) ? value.etsyDraft.tags.map((tag) => cleanString(tag, 40)) : [];
  if (etsyTags.length !== 13 || new Set(etsyTags.map((tag) => tag.toLowerCase())).size !== 13) {
    throw Object.assign(new Error('AI response must contain exactly 13 distinct Etsy tags.'), { code: 'AI_SCHEMA_INVALID' });
  }
  if (cleanString(value.ebayDraft?.title || '', 200).length > 80) throw Object.assign(new Error('eBay title exceeds 80 characters.'), { code: 'AI_SCHEMA_INVALID' });
  const etsyLength = cleanString(value.etsyDraft?.title || '', 200).length;
  if (etsyLength < 100 || etsyLength > 140) throw Object.assign(new Error('Etsy title must contain 100–140 characters.'), { code: 'AI_SCHEMA_INVALID' });
  return {
    visualAnalysis: visualFacts,
    productFacts,
    audienceClassification: { gender, ageGroup },
    merchantAttributes,
    suggestedTitle: cleanString(value.suggestedTitle || '', 300),
    missingInformation: (value.missingInformation || []).slice(0, 50).map((item) => ({
      field: cleanString(item.field, 100), question: cleanString(item.question, 500),
      options: (item.options || []).slice(0, 20).map((option) => cleanString(option, 100)),
      critical: item.critical === true,
    })),
    categorySuggestions: (value.categorySuggestions || []).slice(0, 20).map((item) => cleanString(item, 120)),
    websiteContent: {
      description: (content.description || []).slice(0, 3).map((item) => cleanString(item, 3000)),
      features: (content.features || []).slice(0, 8).map((item) => cleanString(item, 500)),
      specifications: (content.specifications || []).slice(0, 50).map((item) => ({
        label: cleanString(item.label, 100), value: cleanString(item.value, 500),
      })).filter((item) => item.label && item.value),
      perfectFor: cleanString(content.perfectFor || ''),
      whyYouWillLoveIt: cleanString(content.whyYouWillLoveIt || ''),
    },
    seo: {
      title: cleanString(seo.title || '', 100), metaDescription: cleanString(seo.metaDescription || '', 300),
      handle: cleanString(seo.handle || '', 160), primaryKeyword: cleanString(seo.primaryKeyword || '', 120),
      secondaryKeywords: (seo.secondaryKeywords || []).slice(0, 30).map((item) => cleanString(item, 120)),
      searchIntentKeywords: (seo.searchIntentKeywords || []).slice(0, 30).map((item) => cleanString(item, 120)),
      altTextSuggestions: (seo.altTextSuggestions || []).slice(0, 50).map((item) => cleanString(item, 300)),
    },
    aeo: (value.aeo || []).slice(0, 20).map((item) => ({ question: cleanString(item.question, 500), answer: cleanString(item.answer, 2000) })),
    geo: (value.geo || []).slice(0, 20).map((item) => ({ question: cleanString(item.question, 500), answer: cleanString(item.answer, 2000) })),
    ebayDraft: { title: value.ebayDraft.title, description: cleanString(value.ebayDraft.description || '') },
    etsyDraft: { title: value.etsyDraft.title, description: cleanString(value.etsyDraft.description || ''), tags: etsyTags },
    imageCoverage: (value.imageCoverage || []).slice(0, 20).map((item) => ({
      role: cleanString(item.role, 50), available: item.available === true,
      recommendation: cleanString(item.recommendation, 500),
    })),
    risks: (value.risks || []).slice(0, 50).map((item) => cleanString(item, 500)),
    unsupportedClaims: (value.unsupportedClaims || []).slice(0, 50).map((item) => cleanString(item, 500)),
  };
}

module.exports = {
  ANALYSIS_STATUS, CONFIDENCE, FACT_STATUS, IMAGE_ROLES, RESPONSE_SCHEMA, validateResponse,
};
