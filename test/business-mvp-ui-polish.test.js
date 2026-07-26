const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const adminJs = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, '..', 'admin.css'), 'utf8');

test('Product Detail exposes Shopify-familiar workspace tabs and sequential governance states', () => {
  for (const label of [
    'Overview', 'Media', 'Product DNA', 'Evidence', 'Versions',
    'Releases', 'AI Studio', 'Listings', 'History',
  ]) {
    assert.match(adminJs, new RegExp(`['"]${label.replace(' ', '\\s')}['"]`));
  }
  for (const label of [
    'Product Identity', 'Product Hierarchy', 'Product Version', 'Owner Approval',
    'Product Release', 'Knowledge Lock', 'Listing Studio Eligibility',
  ]) {
    assert.match(adminJs, new RegExp(label));
  }
  assert.match(adminJs, /renderGovernancePrimaryButton/);
  assert.match(adminJs, /Create Product Version/);
  assert.match(adminJs, /Create Approval Request/);
  assert.match(adminJs, />Approve</);
  assert.match(adminJs, /Create Release/);
  assert.match(adminJs, /Create Knowledge Lock/);
  assert.match(adminJs, /Open Listing Studio/);
});

test('Listing Studio has channel tabs, counters, quality labels and immutable draft comparison', () => {
  for (const label of ['Shopify', 'eBay', 'Etsy', 'SEO', 'FAQ', 'Buying Guide']) {
    assert.match(adminJs, new RegExp(label));
  }
  assert.match(adminJs, /text\.length/);
  assert.match(adminJs, /Excellent/);
  assert.match(adminJs, /Good/);
  assert.match(adminJs, /Needs Improvement/);
  assert.match(adminJs, /Draft Version/);
  assert.match(adminJs, /Compare/);
  assert.match(adminJs, /Generated \$\{new Date/);
  assert.match(adminJs, /Advanced provenance details/);
});

test('copy controls include every approved output and visible success feedback', () => {
  for (const key of ['shopify', 'ebay', 'etsy', 'seo', 'faq', 'buyingGuide', 'all']) {
    assert.match(adminJs, new RegExp(`['"]${key}['"]`));
  }
  assert.match(adminJs, /navigator\.clipboard\.writeText/);
  assert.match(adminJs, /copiedListingKey/);
  assert.match(adminJs, /✓ Copied/);
  assert.match(adminCss, /\.copy-panel \.copied/);
});

test('polished workspaces include responsive, sticky and overflow-safe foundations', () => {
  assert.match(adminCss, /\.workspace-tabs/);
  assert.match(adminCss, /overflow-x: auto/);
  assert.match(adminCss, /\.sticky-action-bar/);
  assert.match(adminCss, /\.product-workspace-grid/);
  assert.match(adminCss, /\.listing-insights-grid/);
  assert.match(adminCss, /@media \(max-width: 960px\)/);
  assert.match(adminCss, /@media \(max-width: 680px\)/);
  assert.match(adminCss, /overflow-wrap: anywhere/);
  assert.match(adminJs, /aria-selected=/);
});
