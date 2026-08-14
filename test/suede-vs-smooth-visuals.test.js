const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dataSource = fs.readFileSync(path.join(root, 'ssm-data.jsx'), 'utf8');

const assets = [
  'suede-vs-smooth-leather-jackets-card.jpg',
  'suede-vs-smooth-leather-jackets-hero.jpg',
  'suede-vs-smooth-leather-suede-swatch.jpg',
  'suede-vs-smooth-leather-smooth-swatch.jpg',
];

function jpegDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  assert.equal(data[0], 0xff, `${filePath} is not a JPEG`);
  assert.equal(data[1], 0xd8, `${filePath} is not a JPEG`);
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = data.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: data.readUInt16BE(offset + 3), width: data.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  throw new Error(`No JPEG size marker found in ${filePath}`);
}

test('pilot blog mirrors approved banner and swatch visuals in both data sources', () => {
  for (const source of [indexHtml, dataSource]) {
    assert.match(source, /suede-vs-smooth-leather-suede-swatch\.jpg/);
    assert.match(source, /suede-vs-smooth-leather-smooth-swatch\.jpg/);
    assert.match(source, /Verified MOTOGRIP tan-brown suede fringe biker jacket close-up/);
    assert.match(source, /Verified MOTOGRIP Aegis black cowhide biker jacket close-up/);
    assert.match(source, /Tan-brown suede and black smooth leather MOTOGRIP jackets/);
    assert.doesNotMatch(source, /Black MOTOGRIP suede fringe jacket beside a brown smooth leather cafe-racer/);
  }
});

test('pilot blog images are native 1536 by 1024 JPEGs', () => {
  for (const asset of assets) {
    const filePath = path.join(root, 'assets/generated/blog', asset);
    assert.ok(fs.existsSync(filePath), `Missing ${asset}`);
    assert.deepEqual(jpegDimensions(filePath), { width: 1536, height: 1024 });
  }
});

test('pilot blog release contains no competitor names or image URLs', () => {
  const start = indexHtml.indexOf('"id": "suede-vs-smooth-leather-jackets"');
  const end = indexHtml.indexOf("id: 'how-to-buy-your-first-leather-jacket'", start);
  const article = indexHtml.slice(start, end);
  assert.doesNotMatch(article, /the\s*jacket\s*maker|thejacketmaker|first\s*mfg|firstmfg/i);
});
