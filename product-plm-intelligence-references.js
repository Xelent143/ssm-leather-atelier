const INTELLIGENCE_REFERENCE_TYPES = Object.freeze({
  competitor_intelligence: Object.freeze(['analysis', 'evidence_set']),
  search_intelligence: Object.freeze(['analysis', 'evidence_set']),
  geo_intelligence: Object.freeze(['analysis', 'recommendation', 'knowledge_node']),
  aeo_intelligence: Object.freeze(['analysis', 'recommendation', 'knowledge_node']),
  seo_intelligence: Object.freeze(['analysis', 'recommendation', 'evidence_set']),
  customer_questions: Object.freeze(['evidence_set', 'knowledge_node']),
  review_intelligence: Object.freeze(['analysis', 'evidence_set']),
  market_trends: Object.freeze(['analysis', 'evidence_set']),
  blog_intelligence: Object.freeze(['analysis', 'recommendation', 'knowledge_node']),
  knowledge_graph: Object.freeze(['knowledge_node']),
  ai_recommendation_engine: Object.freeze(['analysis', 'recommendation', 'human_review']),
  global_commerce_calendar: Object.freeze([
    'country',
    'country_event',
    'region',
    'holiday',
    'shopping_event',
    'religious_event',
    'weather_season',
    'riding_season',
    'fashion_season',
    'sales_event',
    'seasonal_event',
  ]),
  search_intent_engine: Object.freeze([
    'commercial_intent',
    'informational_intent',
    'gift_intent',
    'comparison_intent',
    'seasonal_intent',
    'voice_search',
    'ai_search',
    'image_search',
    'video_search',
  ]),
  opportunity_engine: Object.freeze([
    'trending_score',
    'demand_score',
    'keyword_opportunity',
    'competitor_gap',
    'content_gap',
    'revenue_opportunity',
  ]),
  marketplace_intelligence: Object.freeze([
    'shopify',
    'ebay',
    'etsy',
    'amazon',
    'google_merchant',
    'facebook_shop',
    'instagram_shop',
    'tiktok_shop',
    'pinterest',
  ]),
  listing_intelligence: Object.freeze([
    'seo',
    'geo',
    'aeo',
    'keywords',
    'meta',
    'faq',
    'schema',
    'images',
    'videos',
    'infographics',
  ]),
  performance_intelligence: Object.freeze([
    'traffic',
    'conversion',
    'reviews',
    'merchant',
    'search_console',
    'ctr',
    'revenue',
  ]),
  search_intent_intelligence: Object.freeze([
    'google',
    'ebay',
    'etsy',
    'amazon',
    'facebook',
    'pinterest',
    'chatgpt',
    'gemini',
    'perplexity',
  ]),
  search_behavior: Object.freeze([
    'search_query',
    'search_volume',
    'buyer_intent',
    'trend_score',
    'country',
    'language',
    'seasonality',
  ]),
  keyword_intelligence: Object.freeze([
    'primary_keywords',
    'secondary_keywords',
    'long_tail_keywords',
    'semantic_keywords',
    'nlp_entities',
  ]),
  content_intelligence: Object.freeze([
    'blogs',
    'faq',
    'buying_guides',
    'videos',
    'landing_pages',
  ]),
  opportunity_intelligence: Object.freeze([
    'competitor_gap',
    'keyword_gap',
    'revenue_opportunity',
    'suggested_campaign',
  ]),
  ai_recommendation: Object.freeze([
    'seo_recommendation',
    'geo_recommendation',
    'aeo_recommendation',
    'listing_recommendation',
  ]),
  marketplace_identity_intelligence: Object.freeze([
    'marketplace_health',
    'marketplace_quality',
    'marketplace_visibility',
    'marketplace_restrictions',
    'marketplace_policy',
    'marketplace_recommendation',
  ]),
  search_platforms: Object.freeze([
    'google',
    'google_shopping',
    'search_console',
    'merchant_center',
    'ebay',
    'etsy',
    'amazon',
    'facebook',
    'instagram',
    'pinterest',
    'youtube',
    'reddit',
    'chatgpt',
    'gemini',
    'perplexity',
  ]),
});

const INTELLIGENCE_REFERENCE_CLASSIFICATIONS = Object.freeze([
  'public',
  'internal',
  'confidential',
  'factory_confidential',
  'commercially_sensitive',
]);

const INTELLIGENCE_REFERENCE_KEYS = new Set([
  'domain',
  'namespace',
  'referenceType',
  'referenceId',
  'schemaVersion',
  'status',
  'dataClassification',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function validateIntelligenceReferences(references, entityLabel) {
  if (!Array.isArray(references)) {
    throw new Error(`${entityLabel} intelligence references are invalid.`);
  }
  if (references.length > 100) {
    throw new Error(`${entityLabel} has too many intelligence references.`);
  }
  const unique = new Set();
  for (const reference of references) {
    if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
      throw new Error(`${entityLabel} intelligence reference is invalid.`);
    }
    if (Object.keys(reference).some((key) => !INTELLIGENCE_REFERENCE_KEYS.has(key))) {
      throw new Error(`${entityLabel} intelligence reference contains unsupported data.`);
    }
    const allowedTypes = INTELLIGENCE_REFERENCE_TYPES[reference.domain];
    if (!allowedTypes || !allowedTypes.includes(reference.referenceType)) {
      throw new Error(`${entityLabel} intelligence domain or reference type is invalid.`);
    }
    if (!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(String(reference.namespace || ''))) {
      throw new Error(`${entityLabel} intelligence namespace is invalid.`);
    }
    if (!isUuid(reference.referenceId)) {
      throw new Error(`${entityLabel} intelligence reference ID is invalid.`);
    }
    if (!Number.isInteger(reference.schemaVersion) || reference.schemaVersion < 1) {
      throw new Error(`${entityLabel} intelligence schema version is invalid.`);
    }
    if (!['reserved', 'active', 'retired'].includes(reference.status)) {
      throw new Error(`${entityLabel} intelligence reference status is invalid.`);
    }
    if (!INTELLIGENCE_REFERENCE_CLASSIFICATIONS.includes(reference.dataClassification)) {
      throw new Error(`${entityLabel} intelligence reference classification is invalid.`);
    }
    const key = `${reference.domain}:${reference.namespace}:${reference.referenceId}`;
    if (unique.has(key)) throw new Error(`${entityLabel} contains a duplicate intelligence reference.`);
    unique.add(key);
  }
  return references;
}

module.exports = {
  INTELLIGENCE_REFERENCE_CLASSIFICATIONS,
  INTELLIGENCE_REFERENCE_TYPES,
  validateIntelligenceReferences,
};
