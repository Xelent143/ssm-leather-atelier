const ANALYSIS_SCHEMA_VERSION = 1;

const UNSUPPORTED_CLAIMS = Object.freeze([
  { pattern: /\b100%\s+waterproof\b/gi, claim: '100% Waterproof' },
  { pattern: /\bce[\s-]+(?:approved|certified)\b/gi, claim: 'CE Approved' },
  { pattern: /\bmilitary[\s-]+grade\b/gi, claim: 'Military Grade' },
  { pattern: /\bgenuine\s+ykk\b/gi, claim: 'Genuine YKK' },
]);

function clean(value) {
  return String(value ?? '').trim();
}

function textFields(value, path = '', output = []) {
  if (typeof value === 'string') output.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((item, index) =>
    textFields(item, `${path}[${index}]`, output));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) =>
    textFields(item, path ? `${path}.${key}` : key, output));
  return output;
}

function issue(code, severity, category, field, text, start, length, message, suggestion) {
  return {
    code,
    severity,
    category,
    location: {
      field,
      start,
      end: start + length,
      excerpt: text.slice(Math.max(0, start - 24), start + length + 24),
    },
    message,
    suggestion,
  };
}

function occurrences(text, pattern) {
  return [...text.matchAll(pattern)];
}

function analyzeWritingField(field, text) {
  const issues = [];
  for (const match of occurrences(text, /\b([a-z][a-z'-]{2,})\s+\1\b/gi)) {
    issues.push(issue(
      'duplicate_word', 'warning', 'copy_quality', field, text,
      match.index, match[0].length,
      `Duplicate word “${match[1]}” detected.`,
      `Remove one occurrence of “${match[1]}”.`,
    ));
  }
  for (const match of occurrences(text, /\b((?:[a-z][a-z'-]*\s+){2,5}[a-z][a-z'-]*)\s+\1\b/gi)) {
    issues.push(issue(
      'duplicate_phrase', 'warning', 'copy_quality', field, text,
      match.index, match[0].length,
      'A phrase is repeated consecutively.',
      'Keep the clearest occurrence and remove the duplicate phrase.',
    ));
  }
  for (const match of occurrences(text, /[!?.,]{2,}/g)) {
    issues.push(issue(
      'punctuation', 'warning', 'copy_quality', field, text,
      match.index, match[0].length,
      'Repeated punctuation reduces professionalism.',
      'Use one appropriate punctuation mark.',
    ));
  }
  const grammarRules = [
    [/\b(?:this|it)\s+(?:are|were)\b/gi, 'Possible subject–verb disagreement.', 'Review singular subject and verb agreement.'],
    [/\b(?:jacket|vest|coat|bag|product|item)\s+(?:are|were)\b/gi, 'Possible subject–verb disagreement.', 'Use a singular verb with this product noun.'],
    [/\b(?:these|they)\s+(?:is|was)\b/gi, 'Possible subject–verb disagreement.', 'Review plural subject and verb agreement.'],
    [/\b(?:a|an)\s+(?:a|an)\b/gi, 'Repeated article detected.', 'Keep the grammatically correct article.'],
  ];
  for (const [pattern, message, suggestion] of grammarRules) {
    for (const match of occurrences(text, pattern)) {
      issues.push(issue(
        'grammar', 'warning', 'copy_quality', field, text,
        match.index, match[0].length, message, suggestion,
      ));
    }
  }
  for (const match of occurrences(text, /\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/gi)) {
    issues.push(issue(
      'passive_voice', 'info', 'copy_quality', field, text,
      match.index, match[0].length,
      'Possible passive construction detected.',
      'Consider an active construction when it improves clarity.',
    ));
  }
  for (const match of occurrences(text, /\b(?:unlock the potential|elevate your style|game changer|must-have|perfect blend)\b/gi)) {
    issues.push(issue(
      'robotic_wording', 'info', 'copy_quality', field, text,
      match.index, match[0].length,
      'Generic promotional wording may sound robotic.',
      'Replace it with a specific, verified product benefit.',
    ));
  }
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let offset = 0;
  for (const sentence of sentences) {
    const start = text.indexOf(sentence, offset);
    offset = start + sentence.length;
    const words = sentence.match(/\b[\w'-]+\b/g) || [];
    if (words.length > 32) {
      issues.push(issue(
        'long_sentence', 'warning', 'copy_quality', field, text,
        start, sentence.length,
        `Sentence contains ${words.length} words.`,
        'Split this sentence into shorter, scannable statements.',
      ));
    }
  }
  const words = (text.toLowerCase().match(/\b[a-z][a-z'-]{3,}\b/g) || [])
    .filter((word) => !['this', 'that', 'with', 'from', 'your', 'have', 'will', 'into'].includes(word));
  const counts = new Map();
  words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  for (const [word, count] of counts) {
    if (count >= 5 && count / Math.max(words.length, 1) > 0.08) {
      const start = text.toLowerCase().indexOf(word);
      issues.push(issue(
        'keyword_stuffing', 'error', 'copy_quality', field, text,
        start, word.length,
        `“${word}” appears ${count} times in this field.`,
        'Reduce repetition and use natural, factually accurate alternatives.',
      ));
    }
  }
  return issues;
}

function marketplaceIssues(content) {
  const issues = [];
  const checks = [
    ['shopify.title', content.shopify?.title, 1, 255, 'Shopify title'],
    ['shopify.seoTitle', content.shopify?.seoTitle, 1, 60, 'Shopify SEO title'],
    ['shopify.metaDescription', content.shopify?.metaDescription, 120, 160, 'Shopify meta description'],
    ['ebay.title', content.ebay?.title, 1, 80, 'eBay title'],
    ['etsy.title', content.etsy?.title, 100, 140, 'Etsy title'],
    ['seo.title', content.seo?.title, 1, 60, 'SEO title'],
    ['seo.metaDescription', content.seo?.metaDescription, 120, 160, 'SEO meta description'],
  ];
  for (const [field, raw, min, max, label] of checks) {
    const text = clean(raw);
    if (!text) {
      issues.push(issue('empty_section', 'error', 'marketplace', field, text, 0, 0,
        `${label} is empty.`, `Add a factual ${label.toLowerCase()}.`));
    } else if (text.length < min || text.length > max) {
      issues.push(issue('length', 'warning', 'marketplace', field, text, 0, text.length,
        `${label} contains ${text.length} characters; expected ${min}–${max}.`,
        `Revise within ${min}–${max} characters without adding unsupported facts.`));
    }
  }
  const tags = Array.isArray(content.etsy?.tags) ? content.etsy.tags : [];
  if (tags.length !== 13) {
    issues.push(issue('etsy_tag_count', 'error', 'marketplace', 'etsy.tags',
      tags.join(', '), 0, tags.join(', ').length,
      `Etsy has ${tags.length} tags; exactly 13 are required.`,
      'Provide exactly 13 distinct, relevant tags.',
    ));
  }
  const requiredSections = [
    ['shopify.description', content.shopify?.description || content.shopify?.fullDescription],
    ['ebay.description', content.ebay?.description || content.ebay?.fullDescription],
    ['etsy.description', content.etsy?.description || content.etsy?.fullDescription],
    ['faq', content.faq],
    ['buyingGuide', content.buyingGuide],
  ];
  for (const [field, value] of requiredSections) {
    const text = Array.isArray(value) ? value.map((item) => clean(item?.question || item)).join(' ') : clean(value);
    if (!text) {
      issues.push(issue(
        'empty_section', 'error', 'marketplace', field, text, 0, 0,
        `${field} is empty.`,
        'Add only verified product information to this section.',
      ));
    }
  }
  for (const { path, text } of textFields(content)) {
    if (/<[^>]*$/.test(text) || /(?:\n\s*){4,}/.test(text)) {
      issues.push(issue('broken_formatting', 'warning', 'marketplace', path, text, 0,
        Math.min(text.length, 40), 'Possible broken formatting detected.',
        'Repair incomplete markup or excessive blank lines.'));
    }
  }
  return issues;
}

function factualIssues(content, facts = {}) {
  const issues = [];
  const fields = textFields(content);
  const expected = [
    ['outerMaterial', facts.outerMaterial || facts.leatherType,
      ['cowhide', 'lambskin', 'goatskin', 'sheepskin', 'faux leather']],
    ['leatherColor', facts.leatherColor,
      ['black', 'brown', 'tan', 'red', 'blue', 'green', 'white', 'burgundy']],
    ['closure', facts.closure, ['zipper', 'zip', 'buttons', 'button', 'snaps', 'snap']],
  ];
  for (const [factName, expectedValue, vocabulary] of expected) {
    const expectedText = clean(expectedValue).toLowerCase();
    if (!expectedText) continue;
    for (const { path, text } of fields) {
      const lower = text.toLowerCase();
      const conflicts = vocabulary.filter((term) =>
        new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text) &&
        !expectedText.includes(term) &&
        !(term === 'zip' && expectedText.includes('zipper')) &&
        !(term === 'button' && expectedText.includes('buttons')));
      for (const conflict of [...new Set(conflicts)]) {
        const start = lower.search(new RegExp(`\\b${conflict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
        issues.push(issue(
          `${factName}_mismatch`, 'error', 'leather_consistency', path, text,
          start, conflict.length,
          `Listing says “${conflict}”, but the approved listing input says “${expectedValue}”.`,
          `Verify this wording against the approved “${factName}” fact; do not infer a correction.`,
        ));
      }
    }
  }
  const pocketCount = Number(facts.pocketCount);
  if (Number.isFinite(pocketCount)) {
    for (const { path, text } of fields) {
      for (const match of occurrences(text, /\b(\d+)\s+(?:exterior\s+)?pockets?\b/gi)) {
        if (Number(match[1]) !== pocketCount) {
          issues.push(issue(
            'pocket_count_mismatch', 'error', 'leather_consistency', path, text,
            match.index, match[0].length,
            `Listing states ${match[1]} pockets; approved input states ${pocketCount}.`,
            'Verify the pocket count and align the listing with approved evidence.',
          ));
        }
      }
    }
  }
  return issues;
}

function unsupportedClaimIssues(content, supportedClaims = []) {
  const supported = new Set(supportedClaims.map((value) => clean(value).toLowerCase()));
  const issues = [];
  for (const { path, text } of textFields(content)) {
    for (const rule of UNSUPPORTED_CLAIMS) {
      for (const match of occurrences(text, new RegExp(rule.pattern.source, rule.pattern.flags))) {
        if (supported.has(rule.claim.toLowerCase())) continue;
        issues.push(issue(
          'unsupported_claim', 'error', 'unsupported_claim', path, text,
          match.index, match[0].length,
          `“${match[0]}” has no approved evidence reference.`,
          'Remove the claim or attach approved evidence before using it.',
        ));
      }
    }
  }
  return issues;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function seoIntelligence(content, issues) {
  const primary = clean(content.seo?.keywords?.[0]).toLowerCase();
  const secondary = (Array.isArray(content.seo?.keywords) ? content.seo.keywords.slice(1) : [])
    .map((value) => clean(value).toLowerCase()).filter(Boolean);
  const searchableText = textFields(content).map((item) => item.text).join(' ').toLowerCase();
  const count = (term) => term ? searchableText.split(term).length - 1 : 0;
  const title = clean(content.seo?.title || content.shopify?.seoTitle);
  const meta = clean(content.seo?.metaDescription || content.shopify?.metaDescription);
  const handle = clean(content.shopify?.urlHandle);
  const titleWords = new Set(title.toLowerCase().match(/\b[a-z0-9]+\b/g) || []);
  const metaWords = new Set(meta.toLowerCase().match(/\b[a-z0-9]+\b/g) || []);
  const shared = [...titleWords].filter((word) => word.length > 3 && metaWords.has(word)).length;
  const keywordIssues = issues.filter((item) => item.code === 'keyword_stuffing');
  return {
    primaryKeyword: primary || null,
    primaryKeywordUsage: count(primary),
    secondaryKeywordUsage: Object.fromEntries(secondary.map((term) => [term, count(term)])),
    keywordRepetition: clamp(100 - keywordIssues.length * 20),
    headingQuality: clamp((title.length >= 25 && title.length <= 60 ? 85 : 55) +
      (primary && title.toLowerCase().includes(primary) ? 15 : 0)),
    metaQuality: clamp((meta.length >= 120 && meta.length <= 160 ? 85 : 50) +
      (primary && meta.toLowerCase().includes(primary) ? 15 : 0)),
    internalConsistency: clamp(55 + shared * 9),
    urlSuggestionQuality: clamp(
      (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle) ? 75 : 35) +
      (handle.length >= 15 && handle.length <= 75 ? 15 : 0) +
      (primary && handle.includes(primary.replace(/\s+/g, '-')) ? 10 : 0),
    ),
  };
}

function scoreReport(content, issues) {
  const penalty = (items) => items.reduce((sum, item) =>
    sum + (item.severity === 'error' ? 14 : item.severity === 'warning' ? 7 : 3), 0);
  const by = (predicate) => issues.filter(predicate);
  const writing = by((item) => item.category === 'copy_quality');
  const marketplace = by((item) => item.category === 'marketplace');
  const leather = by((item) => item.category === 'leather_consistency');
  const claims = by((item) => item.category === 'unsupported_claim');
  const allText = textFields(content).map((item) => item.text).join(' ');
  const sentences = allText.split(/[.!?]+/).filter((item) => clean(item));
  const sentenceLengths = sentences.map((sentence) =>
    (sentence.match(/\b[\w'-]+\b/g) || []).length);
  const sentenceVariety = sentenceLengths.length > 1
    ? new Set(sentenceLengths).size / sentenceLengths.length
    : 0.5;
  const humanReadability = clamp(96 - penalty(writing));
  const marketplaceBase = (channel) => clamp(98 - penalty(marketplace.filter((item) =>
    item.location.field.startsWith(channel))));
  const seoIssues = issues.filter((item) =>
    /seo|meta|keyword|heading|url/i.test(`${item.code} ${item.location.field}`));
  const seo = seoIntelligence(content, issues);
  const googleSeo = clamp((
    seo.keywordRepetition + seo.headingQuality + seo.metaQuality +
    seo.internalConsistency + seo.urlSuggestionQuality
  ) / 5 - penalty(seoIssues));
  const leatherAccuracy = clamp(100 - penalty(leather));
  const unsupportedClaimRisk = clamp(penalty(claims) * 2);
  const overall = clamp((
    humanReadability + marketplaceBase('shopify') + marketplaceBase('ebay') +
    marketplaceBase('etsy') + googleSeo + leatherAccuracy +
    clamp(100 - unsupportedClaimRisk)
  ) / 7);
  return {
    overallQuality: overall,
    googleSeo,
    shopify: marketplaceBase('shopify'),
    ebay: marketplaceBase('ebay'),
    etsy: marketplaceBase('etsy'),
    humanReadability,
    conversionPotential: clamp(overall - claims.length * 6 - writing.length * 2),
    leatherAccuracy,
    unsupportedClaimRisk,
    seoIntelligence: seo,
    humanWriting: {
      humanReadability,
      naturalFlow: clamp(96 - penalty(writing.filter((item) =>
        ['duplicate_phrase', 'robotic_wording', 'long_sentence'].includes(item.code)))),
      professionalTone: clamp(98 - penalty(writing.filter((item) =>
        ['grammar', 'punctuation', 'robotic_wording'].includes(item.code)))),
      buyerConfidence: clamp(98 - penalty([...leather, ...claims])),
      scannability: clamp(96 - penalty(writing.filter((item) => item.code === 'long_sentence'))),
      sentenceVariety: clamp(60 + sentenceVariety * 40),
    },
  };
}

function analyzeCopy(input = {}) {
  const content = structuredClone(input.content || {});
  const issues = [
    ...textFields(content).flatMap(({ path, text }) => analyzeWritingField(path, text)),
    ...marketplaceIssues(content),
    ...factualIssues(content, input.facts || {}),
    ...unsupportedClaimIssues(content, input.supportedClaims || []),
  ];
  const unique = [...new Map(issues.map((item) => [
    `${item.code}:${item.location.field}:${item.location.start}:${item.location.end}`,
    item,
  ])).values()];
  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    analyzedAt: input.analyzedAt || new Date().toISOString(),
    readOnly: true,
    issueCount: unique.length,
    issues: unique,
    suggestions: unique.map((item) => ({
      issueCode: item.code,
      location: item.location,
      suggestion: item.suggestion,
      automaticChangeApplied: false,
    })),
    scores: scoreReport(content, unique),
  };
}

module.exports = {
  ANALYSIS_SCHEMA_VERSION,
  UNSUPPORTED_CLAIMS,
  analyzeCopy,
};
