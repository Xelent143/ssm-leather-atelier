const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dataSource = fs.readFileSync(path.join(root, 'ssm-data.jsx'), 'utf8');
const serverSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

const slugs = [
  'types-of-leather-for-jackets-guide',
  'leather-jacket-colors-style-guide',
  'cowhide-vs-lambskin-leather-jackets',
  'aniline-semi-aniline-pigmented-leather',
  'suede-vs-smooth-leather-jackets',
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

test('all five approved blogs are mirrored, routed, dated, and use 3:2 assets', () => {
  for (const slug of slugs) {
    assert.match(indexHtml, new RegExp(`"id": "${slug}"`));
    assert.match(dataSource, new RegExp(`"id": "${slug}"`));
    assert.match(serverSource, new RegExp(`'/blog/${slug}'`));
    assert.match(serverSource, new RegExp(`"articleId": "${slug}"`));

    for (const kind of ['card', 'hero']) {
      const filePath = path.join(root, 'assets/generated/blog', `${slug}-${kind}.jpg`);
      assert.ok(fs.existsSync(filePath), `Missing ${kind} image for ${slug}`);
      assert.deepEqual(jpegDimensions(filePath), { width: 1536, height: 1024 });
    }
  }

  assert.match(serverSource, /"datePublished": "2026-08-14"/);
  assert.match(indexHtml, /RELATED MOTOGRIP PAGES/);
});

test('approved release contains only MOTOGRIP links and no competitor references', () => {
  const inserted = indexHtml.slice(
    indexHtml.indexOf('"id": "types-of-leather-for-jackets-guide"'),
    indexHtml.indexOf("id: 'how-to-buy-your-first-leather-jacket'"),
  );
  assert.doesNotMatch(inserted, /the\s*jacket\s*maker|thejacketmaker|first\s*mfg|firstmfg/i);

  const urls = [...inserted.matchAll(/"url": "([^"]+)"/g)].map(match => match[1]);
  assert.ok(urls.length >= 15, 'Expected at least three verified links per blog');
  for (const url of urls) {
    assert.ok(url.startsWith('https://www.motogripgear.com/'), `Unapproved link: ${url}`);
  }
});
