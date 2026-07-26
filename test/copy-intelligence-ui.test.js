const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');

test('Listing Studio renders required Copy Intelligence scores and locations', () => {
  for (const marker of [
    'AI Copy Intelligence',
    'Overall Quality',
    'Google SEO',
    'Shopify',
    'eBay',
    'Etsy',
    'Human Readability',
    'Conversion Potential',
    'Leather Accuracy',
    'Unsupported Claim Safety',
    'item.location.start',
    'item.suggestion',
  ]) assert.ok(admin.includes(marker), marker);
  assert.match(admin, /Suggestions never overwrite Owner or Listing Editor content/);
  assert.match(css, /\.copy-intelligence-panel/);
  assert.match(css, /\.copy-issue\.error/);
});
