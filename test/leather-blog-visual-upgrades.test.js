const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dataSource = fs.readFileSync(path.join(root, 'ssm-data.jsx'), 'utf8');

const swatches = [
  'types-of-leather-cowhide-swatch-v2.jpg',
  'types-of-leather-lambskin-swatch-v2.jpg',
  'types-of-leather-sheepskin-swatch-v2.jpg',
  'types-of-leather-goatskin-suede-swatch-v2.jpg',
  'types-of-leather-suede-swatch-v2.jpg',
  'leather-colors-black-swatch-v2.jpg',
  'leather-colors-dark-brown-swatch-v2.jpg',
  'leather-colors-tan-cognac-swatch-v2.jpg',
  'leather-colors-navy-swatch-v2.jpg',
  'leather-colors-green-swatch-v2.jpg',
  'leather-colors-burgundy-swatch-v2.jpg',
  'leather-colors-red-swatch-v2.jpg',
  'leather-colors-white-swatch-v2.jpg',
  'cowhide-vs-lambskin-cowhide-swatch-v2.jpg',
  'cowhide-vs-lambskin-lambskin-swatch-v2.jpg',
  'leather-finishes-aniline-swatch-v2.jpg',
  'leather-finishes-semi-aniline-swatch-v2.jpg',
  'leather-finishes-pigmented-editorial-swatch-v2.jpg',
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

test('four upgraded blogs mirror charts, captions, and swatches in both article sources', () => {
  for (const source of [indexHtml, dataSource]) {
    assert.match(source, /LEATHER TYPES AT A GLANCE/);
    assert.match(source, /COLOR COMPARISON/);
    assert.match(source, /COWHIDE VS LAMBSKIN/);
    assert.match(source, /How surface treatment changes the leather/);
    assert.match(source, /Original MOTOGRIP editorial material reference for pigmented real leather/);
    assert.match(source, /This napped surface is a goatskin suede example/);
    for (const swatch of swatches) assert.match(source, new RegExp(swatch.replaceAll('.', '\\.')));
  }
});

test('comparison chart renderer is responsive, accessible, and brand-native', () => {
  assert.match(indexHtml, /function LeatherComparisonChart\(\{ chart \}\)/);
  assert.match(indexHtml, /role="region" aria-label=\{chart\.title\} tabIndex="0"/);
  assert.match(indexHtml, /overflowX: 'auto'/);
  assert.match(indexHtml, /scope="col"/);
  assert.match(indexHtml, /scope="row"/);
  assert.match(indexHtml, /var\(--accent-2\)/);
  assert.match(indexHtml, /section\.comparisonChart && <LeatherComparisonChart/);
});

test('all supporting swatches are unique native 1536 by 1024 JPEG assets', () => {
  for (const swatch of swatches) {
    const filePath = path.join(root, 'assets/generated/blog', swatch);
    assert.ok(fs.existsSync(filePath), `Missing ${swatch}`);
    assert.deepEqual(jpegDimensions(filePath), { width: 1536, height: 1024 });
  }
});

test('upgraded material guidance contains no competitor references or copied scoring pattern', () => {
  const start = indexHtml.indexOf('"id": "types-of-leather-for-jackets-guide"');
  const end = indexHtml.indexOf('"id": "suede-vs-smooth-leather-jackets"', start);
  const upgraded = indexHtml.slice(start, end);
  assert.doesNotMatch(upgraded, /the\s*jacket\s*maker|thejacketmaker|first\s*mfg|firstmfg/i);
  assert.doesNotMatch(upgraded, /★|☆|five-star|star rating/i);
});
