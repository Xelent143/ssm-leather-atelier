const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { publicProductForPdp } = require(path.join(root, 'server.js'));

for (const file of ['ssm-pdp.jsx', 'index.html']) {
  test(`${file} keeps merchant PDP galleries contained and exposes fit controls`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /className="factual-pdp-grid pdp-commerce-layout"/);
    assert.match(source, /objectFit: 'contain'/);
    assert.match(source, /title: 'Standard size'/);
    assert.match(source, /title: 'Made to measure'/);
    assert.match(source, /Customize in Fit Lab/);
    assert.match(source, /SIZE GUIDE/);
    assert.match(source, /className=\{option\.name\.toLowerCase\(\) === 'size' \? 'pdp-size-option-grid'/);
    assert.match(source, /'pdp-size-option-button'/);
    assert.match(source, /surcharge: isMadeToMeasure \? madeToMeasureSurcharge : 0/);
    assert.match(source, /className="pdp-editorial-story"/);
    assert.match(source, /className="pdp-category-size-chart"/);
    assert.match(source, /SSM_MENS_VEST_SIZE_CHART/);
    assert.match(source, /SSM_WOMENS_VEST_SIZE_CHART/);
    assert.match(source, /SSM_JACKET_SIZE_CHART/);
    assert.match(source, /SSM_WOMENS_JACKET_SIZE_CHART/);
    assert.match(source, /SSM_UNISEX_CHAPS_SIZE_CHART/);
    assert.match(source, /SELECT WAIST AND INSEAM SEPARATELY WHERE OFFERED/);
    assert.match(source, /const isPuffer = categoryText\.includes\('puffer'\)/);
    assert.match(source, /const isVest = categoryText\.includes\('vest'\) && !isPuffer/);
    assert.match(source, /categoryText\.includes\('coat'\)/);
    assert.match(source, /categoryText\.includes\('blazer'\)/);
    assert.match(source, /\$\{editorialOwner\.toUpperCase\(\)\} JACKET SIZE CHART/);
    assert.match(source, /function selectEditorialCloseUp\(images = \[\]\)/);
    assert.match(source, /className="ph grain pdp-editorial-close-up"/);
    assert.match(source, /Close-up detail of \$\{p\.name\}/);
    assert.doesNotMatch(source, /<img src=\{p\.alt \|\| p\.img\}/);
  });
}

test('the storefront keeps every PDP size selector in the approved responsive grid', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(source, /\.pdp-size-option-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(source, /\.pdp-size-option-button\s*\{[\s\S]*?min-height:\s*44px !important/);
  assert.match(source, /@media \(max-width: 720px\)[\s\S]*?\.pdp-size-option-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('all newly released SWAT vests retain made-to-measure support', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
  const swatIds = new Set(['p35', 'p36', 'p37', 'p38', 'p39', 'p40', 'p41', 'p42']);
  const vests = catalog.products.filter(product => swatIds.has(product.id));
  assert.equal(vests.length, swatIds.size);
  for (const vest of vests) {
    assert.equal(vest.madeToMeasureEnabled, true, `${vest.id} should support made to measure`);
    assert.equal(vest.madeToMeasureSurcharge, 50, `${vest.id} should use the approved surcharge`);
  }
});

test('every active catalog product can supply the editorial close-up slot', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
  const activeProducts = catalog.products.filter(product => product.status === 'active');
  assert.ok(activeProducts.length > 0);
  for (const product of activeProducts) {
    const images = [product.primaryImage || product.image, ...(product.galleryImages || [])].filter(Boolean);
    assert.ok(images.length > 0, `${product.id} must have a genuine image for the editorial detail slot`);
  }
});

test('shirts, jackets, coats, blazers and puffers route to the jacket chart while vests stay on the vest chart', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
  const activeProducts = catalog.products.filter(product => product.status === 'active');
  const jacketChartProducts = activeProducts.filter(product => /jacket|shirt|coat|blazer|puffer/i.test(`${product.category} ${product.productType}`));
  const vestChartProducts = activeProducts.filter(product => /vest/i.test(`${product.category} ${product.productType}`) && !/puffer/i.test(`${product.category} ${product.productType}`));
  assert.ok(jacketChartProducts.some(product => product.category === 'Leather Shirts'));
  assert.ok(jacketChartProducts.some(product => /puffer/i.test(product.category)));
  assert.ok(vestChartProducts.length > 0);
  assert.ok(jacketChartProducts.every(product => !vestChartProducts.includes(product)));
});

test('every active merchant listing exposes an image-based color selector, including single-color products', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
  const activeProducts = catalog.products.filter(product => product.status === 'active');
  assert.ok(activeProducts.length > 0);
  for (const product of activeProducts) {
    const publicProduct = publicProductForPdp(product);
    const colorOption = publicProduct.options.find(option => option.name.toLowerCase() === 'color');
    assert.ok(colorOption, `${product.id} must expose a Color option`);
    assert.ok(colorOption.values.length > 0, `${product.id} must expose at least one color`);
    assert.equal(publicProduct.colors.length, colorOption.values.length, `${product.id} color sequence must stay synchronized`);
    assert.ok(publicProduct.colors.every(color => color.image), `${product.id} must use image-based color swatches`);
    const sizeIndex = publicProduct.options.findIndex(option => option.name.toLowerCase() === 'size');
    const colorIndex = publicProduct.options.findIndex(option => option.name.toLowerCase() === 'color');
    if (sizeIndex >= 0) assert.ok(colorIndex < sizeIndex, `${product.id} must show Color before Size`);
  }
});

for (const file of ['ssm-data.jsx', 'index.html']) {
  test(`${file} backfills image-based color selectors for every legacy product`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /SSM_PRODUCTS\.forEach\(\(product\) =>/);
    assert.match(source, /product\.colors = \[\{ id: name\.toLowerCase\(\)/);
    assert.match(source, /image: color\.image \|\| color\.modelImage \|\| genuineColorImage/);
    assert.match(source, /product\.defaultColor = product\.defaultColor \|\| product\.colors\[0\]\?\.id/);
  });
}
