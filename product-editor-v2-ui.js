(function productEditorV2Ui() {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', 'Custom Size'];
  const colors = ['Black', 'Brown', 'Dark Brown', 'Tan', 'Cognac', 'Burgundy', 'Red', 'Blue', 'White', 'Green', 'Grey', 'Custom Color'];
  const productTypes = ['Leather Jacket', 'Motorcycle Jacket', 'Leather Vest', 'Biker Vest', 'Western Vest', 'Waistcoat', 'Leather Pants', 'Leather Shorts', 'Chaps', 'Leather Bag', 'Gloves', 'Accessories', 'Other'];
  const metafields = [
    ['outerMaterial', 'Outer material'], ['leatherType', 'Leather type'], ['leatherThickness', 'Leather thickness'],
    ['liningMaterial', 'Lining material'], ['closure', 'Closure'], ['hardware', 'Hardware'],
    ['pocketCount', 'Pocket count'], ['concealedCarryPockets', 'Concealed carry pockets'],
    ['armorCompatibility', 'Armor compatibility'], ['collar', 'Collar'], ['sleeveType', 'Sleeve type'],
    ['fit', 'Fit'], ['careInstructions', 'Care instructions'], ['customSizingAvailable', 'Custom sizing available'],
    ['personalizationAvailable', 'Personalization available'], ['manufacturer', 'Manufacturer / Maker'],
    ['countryOfManufacture', 'Country of manufacture'],
  ];
  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const empty = () => ({
    id: null, revision: 0, workflowState: 'draft', ownerReviewStatus: 'not_submitted',
    websiteSyncStatus: 'not_published', title: '', descriptionHtml: '', sections: {}, media: [],
    organization: { brand: 'MOTOGRIP GEAR', vendor: 'MOTOGRIP GEAR', productType: 'Leather Vest', category: '', gender: 'Men', collections: [], tags: [], themeTemplate: 'default', status: 'draft' },
    pricing: { price: 0, compareAtPrice: null, cost: null, taxable: true },
    inventory: { trackInventory: true, continueSellingWhenOutOfStock: false },
    shipping: { physicalProduct: true, weight: 0, weightUnit: 'lb', packagePreset: '', countryOfOrigin: 'PK', hsCode: '', processingTime: '' },
    metafields: {}, seo: { title: '', metaDescription: '', handle: '' }, options: [], variants: [],
  });
  const input = (label, name, value = '', type = 'text', attrs = '') =>
    `<label class="pe-field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value ?? '')}" ${attrs}></label>`;
  const textarea = (label, name, value = '') =>
    `<label class="pe-field"><span>${esc(label)}</span><textarea name="${name}">${esc(value ?? '')}</textarea></label>`;
  const select = (label, name, value, choices) =>
    `<label class="pe-field"><span>${esc(label)}</span><select name="${name}">${choices.map((choice) => {
      const pair = Array.isArray(choice) ? choice : [choice, choice];
      return `<option value="${esc(pair[0])}" ${pair[0] === value ? 'selected' : ''}>${esc(pair[1])}</option>`;
    }).join('')}</select></label>`;
  const status = (label, value) =>
    `<div class="pe-status"><span>${esc(label)}</span><strong>${esc(String(value || '').replaceAll('_', ' '))}</strong></div>`;
  const csv = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  const code = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  function media(product) {
    if (!product.media.length) return `<label class="pe-drop" id="pe-drop"><input id="pe-files" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple hidden><strong>Drop product images here</strong><span>or choose JPG, PNG or WEBP files up to 5 MB</span><span class="btn">Choose files</span></label>`;
    return `<div class="pe-media-grid">${[...product.media].sort((a, b) => a.order - b.order).map((item) => `
      <article class="pe-media" draggable="true" data-media-id="${item.id}">
        <img src="${esc(item.path)}" alt="${esc(item.altText || item.title || 'Product image')}">
        ${item.featured ? '<b>Featured</b>' : ''}
        <input data-media-field="altText" value="${esc(item.altText)}" placeholder="Alt text">
        <input data-media-field="title" value="${esc(item.title)}" placeholder="Image title">
        <select data-media-field="role">${['Front', 'Back', 'Side', 'Detail', 'Lifestyle', 'Size Chart', 'Other'].map((role) => `<option ${role === item.role ? 'selected' : ''}>${role}</option>`).join('')}</select>
        <div class="button-row"><button class="btn" type="button" data-feature="${item.id}">Featured</button><button class="btn danger" type="button" data-remove="${item.id}">Remove</button></div>
      </article>`).join('')}</div><label class="btn pe-add-media"><input id="pe-files" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple hidden>＋ Add media</label>`;
  }

  function options(product) {
    return `<div id="pe-options">${product.options.map((option, index) => `
      <div class="pe-option" data-option="${index}">
        <input data-option-name value="${esc(option.name)}" placeholder="Option name">
        <input data-option-values value="${esc(option.values.join(', '))}" placeholder="Values separated by commas">
        <button class="btn" type="button" data-option-remove="${index}">Remove</button>
        ${['size', 'color'].includes(option.name.toLowerCase()) ? `<div class="pe-presets">${(option.name.toLowerCase() === 'size' ? sizes : colors).map((value) => `<button type="button" data-preset="${index}" data-value="${esc(value)}">${esc(value)}</button>`).join('')}</div>` : ''}
      </div>`).join('')}</div><div class="button-row"><button class="btn" id="pe-add-size" type="button">＋ Size</button><button class="btn" id="pe-add-color" type="button">＋ Color</button><button class="btn" id="pe-add-custom" type="button">＋ Custom</button><button class="btn primary" id="pe-generate" type="button">Generate combinations</button></div>`;
  }

  function variants(product) {
    if (!product.variants.length) return '<div class="pe-empty">Add options and generate sellable combinations.</div>';
    return `<div class="pe-bulk"><input id="pe-variant-search" type="search" placeholder="Search variants"><input id="pe-bulk-price" type="number" min="0" step=".01" placeholder="Bulk price"><button class="btn" id="pe-apply-price" type="button">Apply</button><input id="pe-bulk-qty" type="number" min="0" placeholder="Bulk quantity"><button class="btn" id="pe-apply-qty" type="button">Apply</button><select id="pe-bulk-status"><option value="active">Active</option><option value="disabled">Disabled</option></select><button class="btn" id="pe-apply-status" type="button">Apply status</button></div>
      <div class="pe-table-scroll"><table class="pe-table"><thead><tr><th><input id="pe-all" type="checkbox"></th><th>Variant</th><th>Image</th><th>Variant SKU</th><th>Price</th><th>Compare at</th><th>Cost</th><th>Quantity</th><th>Weight</th><th>Status</th><th>Sell</th></tr></thead><tbody>${product.variants.map((variant) => `<tr data-variant="${variant.id}" data-signature="${esc(variant.signature)}"><td><input data-v-select type="checkbox"></td><td><strong>${esc(Object.values(variant.attributes).join(' / ') || 'Default')}</strong></td><td><select data-v="imageId"><option value="">Default</option>${product.media.map((item) => `<option value="${item.id}" ${variant.imageId === item.id ? 'selected' : ''}>${esc(item.title || item.role || item.originalName)}</option>`).join('')}</select></td><td><code>${esc(variant.sku || 'Generated after approval')}</code></td><td><input data-v="price" type="number" min="0" step=".01" value="${variant.price}"></td><td><input data-v="compareAtPrice" type="number" min="0" step=".01" value="${variant.compareAtPrice ?? ''}"></td><td><input data-v="cost" type="number" min="0" step=".01" value="${variant.cost ?? ''}"></td><td><input data-v="quantity" type="number" min="0" value="${variant.quantity}"></td><td><input data-v="weight" type="number" min="0" step=".01" value="${variant.weight}"></td><td><select data-v="status"><option ${variant.status === 'active' ? 'selected' : ''}>active</option><option ${variant.status === 'disabled' ? 'selected' : ''}>disabled</option></select></td><td><input data-v="availableForSale" type="checkbox" ${variant.availableForSale ? 'checked' : ''}></td></tr>`).join('')}</tbody></table></div>`;
  }

  function render(productInput, workspace, context) {
    const product = productInput || empty();
    const owner = context.owner;
    const editable = ['draft', 'changes_requested'].includes(product.workflowState);
    const identity = product.identity;
    const inventory = product.variants.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const margin = product.pricing.cost != null && product.pricing.price
      ? `${Math.round(((product.pricing.price - product.pricing.cost) / product.pricing.price) * 100)}% estimated margin`
      : 'Add cost to calculate margin';
    return `<div class="pe-page">
      <header class="pe-head"><div><a href="/admin/products" data-route="products">Products</a><h1>${esc(product.id ? product.title || 'Product Editor v2' : 'Add Product')}</h1><p>Complete website product content, media, variants, inventory, SEO and governed publishing.</p></div><div class="button-row"><a class="btn" href="/admin/products" data-route="products">Back</a>${editable ? '<button class="btn" id="pe-save-continue">Save and continue</button><button class="btn primary" id="pe-save">Save Draft</button>' : ''}</div></header>
      ${!product.id ? '<div class="alert info"><strong>New governed product</strong><p>Save the draft first. Product DNA and automatic identities are created only after explicit Owner approval.</p></div>' : ''}
      <form id="pe-form" class="pe-layout">
        <main class="pe-main">
          <section class="card pe-card"><h2>Product content</h2>${input('Product title', 'title', product.title, 'text', 'required maxlength="300"')}
            <label class="pe-field"><span>Rich description</span><div class="pe-toolbar">${[['bold', 'B'], ['italic', 'I'], ['underline', 'U'], ['formatBlock:h2', 'H2'], ['insertUnorderedList', '• List'], ['insertOrderedList', '1. List'], ['justifyLeft', 'Left'], ['justifyCenter', 'Center'], ['undo', 'Undo'], ['redo', 'Redo']].map(([cmd, label]) => `<button type="button" data-rich="${cmd}">${label}</button>`).join('')}<button type="button" id="pe-link">Link</button><button type="button" id="pe-table">Table</button></div><div id="pe-rich" class="pe-rich" contenteditable="${editable}">${product.descriptionHtml || ''}</div></label>
            <details open><summary>Structured website listing sections</summary><div class="pe-grid-2">${[['shortDescription', 'Short Description'], ['fullDescription', 'Full Description'], ['features', 'Features'], ['specifications', 'Specifications'], ['perfectFor', 'Perfect For'], ['whyYouWillLoveIt', 'Why You’ll Love It'], ['faq', 'FAQ'], ['buyingGuide', 'Buying Guide']].map(([key, label]) => textarea(label, `section.${key}`, product.sections[key])).join('')}</div></details>
          </section>
          <section class="card pe-card"><div class="card-head"><div><h2>Media</h2><p>Upload, reorder, classify and describe product images.</p></div><button class="btn" id="pe-library" type="button">Media Library</button></div>${media(product)}</section>
          <section class="card pe-card"><h2>Category</h2><div class="pe-grid-2">${workspace?.taxonomy?.length ? `<label>Category<select name="organization.category" required><option value="">Select synced category</option>${workspace.taxonomy.map((item) => `<option value="${esc(item.name)}" ${item.name === product.organization.category ? 'selected' : ''}>${esc(item.hierarchyPath)}</option>`).join('')}</select><small>Published MOTOGRIP taxonomy · searchable hierarchy path</small></label>` : input('Category', 'organization.category', product.organization.category, 'text', 'required')}${select('Gender', 'organization.gender', product.organization.gender, ['Men', 'Women', 'Unisex'])}</div></section>
          <section class="card pe-card"><h2>Pricing</h2><div class="pe-grid-3">${input('Base price', 'pricing.price', product.pricing.price, 'number', 'min="0" step=".01" required')}${input('Compare-at price', 'pricing.compareAtPrice', product.pricing.compareAtPrice, 'number', 'min="0" step=".01"')}${input('Cost per item', 'pricing.cost', product.pricing.cost, 'number', 'min="0" step=".01"')}</div><label class="pe-toggle"><input name="pricing.taxable" type="checkbox" ${product.pricing.taxable ? 'checked' : ''}> Taxable</label><p>${margin}</p></section>
          <section class="card pe-card"><h2>Inventory & identity</h2><div class="pe-grid-4">${input('Product SKU', 'identity.productSku', identity?.productSku || 'Generated after approval', 'text', 'readonly')}${input('Internal Product Code', 'identity.internalProductCode', identity?.internalProductCode || 'Generated automatically', 'text', 'readonly')}${input('Factory Code', 'identity.factoryCode', identity?.factoryCode || 'Generated automatically', 'text', 'readonly')}${input('Total inventory', 'inventory.total', inventory, 'number', 'readonly')}</div><div class="button-row"><label class="pe-toggle"><input name="inventory.trackInventory" type="checkbox" ${product.inventory.trackInventory ? 'checked' : ''}> Track inventory</label><label class="pe-toggle"><input name="inventory.continueSellingWhenOutOfStock" type="checkbox" ${product.inventory.continueSellingWhenOutOfStock ? 'checked' : ''}> Continue selling when out of stock</label></div></section>
          <section class="card pe-card"><h2>Variants</h2><p>Add up to three options. Disable combinations that are not sold.</p>${options(product)}${variants(product)}</section>
          <section class="card pe-card"><h2>Shipping</h2><label class="pe-toggle"><input name="shipping.physicalProduct" type="checkbox" ${product.shipping.physicalProduct ? 'checked' : ''}> Physical product</label><div class="pe-grid-3">${input('Weight', 'shipping.weight', product.shipping.weight, 'number', 'min="0" step=".01"')}${select('Weight unit', 'shipping.weightUnit', product.shipping.weightUnit, ['lb', 'oz', 'kg', 'g'])}${input('Package preset', 'shipping.packagePreset', product.shipping.packagePreset)}${input('Country of origin', 'shipping.countryOfOrigin', product.shipping.countryOfOrigin, 'text', 'maxlength="2"')}${input('HS code', 'shipping.hsCode', product.shipping.hsCode)}${input('Processing time', 'shipping.processingTime', product.shipping.processingTime)}</div></section>
          <section class="card pe-card"><h2>Product metafields</h2><div class="pe-grid-2">${metafields.map(([key, label]) => input(label, `metafield.${key}`, product.metafields[key] ?? '')).join('')}</div></section>
          <section class="card pe-card"><h2>Search engine listing</h2><div class="pe-search-preview"><strong>${esc(product.seo.title || product.title || 'Product SEO title')}</strong><span>${esc(`${location.origin}/products/${product.seo.handle || 'product-handle'}`)}</span><p>${esc(product.seo.metaDescription || 'Add a useful meta description for customers in search.')}</p></div>${input(`SEO title (${product.seo.title.length}/60)`, 'seo.title', product.seo.title)}${product.seo.title.length && (product.seo.title.length < 50 || product.seo.title.length > 60) ? '<p class="pe-warning">Recommended target: 50–60 characters.</p>' : ''}${textarea(`Meta description (${product.seo.metaDescription.length}/160)`, 'seo.metaDescription', product.seo.metaDescription)}${product.seo.metaDescription.length && (product.seo.metaDescription.length < 150 || product.seo.metaDescription.length > 160) ? '<p class="pe-warning">Recommended target: 150–160 characters.</p>' : ''}${input('URL handle', 'seo.handle', product.seo.handle)}${product.workflowState === 'live' ? '<p class="pe-warning">Changing a live handle needs explicit confirmation and a future redirect.</p>' : ''}</section>
        </main>
        <aside class="pe-side">
          <section class="card pe-card pe-sticky"><h2>Status</h2>${select('Product status', 'organization.status', product.organization.status, [['draft', 'Draft'], ['active', 'Active'], ['archived', 'Archived']])}${status('Publishing state', product.workflowState)}${status('Owner review', product.ownerReviewStatus)}${status('Website sync', product.websiteSyncStatus)}${status('Identity', identity?.state || 'not generated')}<button class="btn full" id="pe-preview" type="button">Preview Website</button></section>
          <section class="card pe-card"><h2>Product organization</h2>${select('Brand / Vendor', 'organization.brand', product.organization.brand, ['MOTOGRIP GEAR', 'BLACKTOP GEAR', 'Vintage Leather Goods', 'BRANDS JACKET HUB', 'The Western Hides', 'Custom Jacket Co', 'Be Smart'])}${input('Vendor', 'organization.vendor', product.organization.vendor)}${select('Product type', 'organization.productType', product.organization.productType, workspace?.productTypes || productTypes)}${input('Collections (comma separated)', 'organization.collections', product.organization.collections.join(', '))}${input('Tags (comma separated)', 'organization.tags', product.organization.tags.join(', '))}${input('Theme template', 'organization.themeTemplate', product.organization.themeTemplate)}</section>
          <section class="card pe-card"><h2>Publishing requirements</h2><ul class="pe-checks"><li class="done">Product UUID reserved</li><li class="${identity?.state === 'locked' ? 'done' : ''}">Locked Product Identity</li><li>Trusted Product Release</li><li>Valid Knowledge Lock</li><li class="${product.title && product.media.length && product.organization.category ? 'done' : ''}">Critical fields complete</li><li class="${product.workflowState === 'approved' ? 'done' : ''}">Owner-approved revision</li></ul></section>
        </aside>
      </form>
      <div class="pe-actions"><div><strong>Revision ${product.revision}</strong><span>${product.updatedAt ? `Updated ${new Date(product.updatedAt).toLocaleString()}` : 'Not saved yet'}</span></div><div class="button-row">${product.id && product.workflowState === 'live' ? '<button class="btn" id="pe-revise">Create New Revision</button>' : ''}${editable && product.id ? '<button class="btn primary" id="pe-submit">Submit for Review</button>' : ''}${owner && product.workflowState === 'submitted' ? '<button class="btn" id="pe-changes">Request Changes</button><button class="btn primary" id="pe-approve">Approve</button>' : ''}${owner && product.workflowState === 'approved' ? '<button class="btn primary" id="pe-publish">Approve & Publish</button>' : ''}</div></div>
    </div>`;
  }

  function collect(product) {
    const form = document.getElementById('pe-form');
    const get = (name) => form.elements.namedItem(name);
    const value = (name) => get(name)?.value ?? '';
    const checked = (name) => Boolean(get(name)?.checked);
    const optionRows = [...form.querySelectorAll('.pe-option')];
    const optionsValue = optionRows.map((row) => ({
      name: row.querySelector('[data-option-name]').value.trim(),
      values: csv(row.querySelector('[data-option-values]').value),
    })).filter((item) => item.name && item.values.length);
    const variantsValue = [...form.querySelectorAll('tr[data-variant]')].map((row) => {
      const original = product.variants.find((item) => item.id === row.dataset.variant) || {};
      const field = (name) => row.querySelector(`[data-v="${name}"]`);
      return {
        ...original, id: row.dataset.variant, signature: row.dataset.signature,
        imageId: field('imageId').value || null,
        price: Number(field('price').value || 0),
        compareAtPrice: field('compareAtPrice').value === '' ? null : Number(field('compareAtPrice').value),
        cost: field('cost').value === '' ? null : Number(field('cost').value),
        quantity: Number(field('quantity').value || 0), weight: Number(field('weight').value || 0),
        status: field('status').value, availableForSale: field('availableForSale').checked,
      };
    });
    return {
      expectedRevision: product.id ? window.__peWorkspace.storeRevision : undefined,
      title: value('title'), descriptionHtml: document.getElementById('pe-rich').innerHTML,
      sections: Object.fromEntries(['shortDescription', 'fullDescription', 'features', 'specifications', 'perfectFor', 'whyYouWillLoveIt', 'faq', 'buyingGuide'].map((key) => [key, value(`section.${key}`)])),
      organization: {
        brand: value('organization.brand'), vendor: value('organization.vendor'),
        productType: value('organization.productType'), category: value('organization.category'),
        gender: value('organization.gender'), collections: csv(value('organization.collections')),
        tags: csv(value('organization.tags')), themeTemplate: value('organization.themeTemplate'),
        status: value('organization.status'),
      },
      pricing: { price: Number(value('pricing.price') || 0), compareAtPrice: value('pricing.compareAtPrice'), cost: value('pricing.cost'), taxable: checked('pricing.taxable') },
      inventory: { trackInventory: checked('inventory.trackInventory'), continueSellingWhenOutOfStock: checked('inventory.continueSellingWhenOutOfStock') },
      shipping: { physicalProduct: checked('shipping.physicalProduct'), weight: Number(value('shipping.weight') || 0), weightUnit: value('shipping.weightUnit'), packagePreset: value('shipping.packagePreset'), countryOfOrigin: value('shipping.countryOfOrigin'), hsCode: value('shipping.hsCode'), processingTime: value('shipping.processingTime') },
      metafields: Object.fromEntries(metafields.map(([key]) => [key, value(`metafield.${key}`)])),
      seo: { title: value('seo.title'), metaDescription: value('seo.metaDescription'), handle: value('seo.handle') },
      options: optionsValue, variants: variantsValue,
    };
  }

  function combinations(optionValues, product) {
    const active = optionValues.filter((option) => option.name && option.values.length);
    const rows = active.length ? active.reduce((items, option) => items.flatMap((item) =>
      option.values.map((value) => ({ ...item, [code(option.name)]: value }))), [{}]) : [{}];
    const prior = new Map(product.variants.map((item) => [item.signature, item]));
    return rows.map((attributes) => {
      const signature = Object.entries(attributes).map(([key, value]) => `${key}:${value}`).join('|') || 'default';
      return prior.get(signature) || {
        id: crypto.randomUUID(), signature, attributes, sku: '', imageId: null,
        price: product.pricing.price, compareAtPrice: product.pricing.compareAtPrice,
        cost: product.pricing.cost, quantity: 0, weight: product.shipping.weight,
        barcodeId: null, status: 'active', availableForSale: true,
      };
    });
  }

  function bind(productInput, workspace, context) {
    const product = productInput || empty();
    window.__peWorkspace = workspace || { storeRevision: 0 };
    const action = async (path, method = 'POST', payload = {}) => {
      try {
        const result = await context.api(path, { method, body: JSON.stringify(payload) });
        context.update(result.product, result);
        context.toast('Product Editor updated');
      } catch (error) { context.toast(error.message); }
    };
    document.querySelectorAll('[data-rich]').forEach((button) => button.addEventListener('click', () => {
      const [command, value] = button.dataset.rich.split(':');
      document.execCommand(command, false, value || null);
    }));
    document.getElementById('pe-link')?.addEventListener('click', () => {
      const url = prompt('Enter a safe HTTPS URL');
      if (url && /^https:\/\//i.test(url)) document.execCommand('createLink', false, url);
    });
    document.getElementById('pe-table')?.addEventListener('click', () =>
      document.execCommand('insertHTML', false, '<table><tbody><tr><th>Specification</th><th>Details</th></tr><tr><td></td><td></td></tr></tbody></table>'));
    document.getElementById('pe-rich')?.addEventListener('paste', (event) => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
    const save = async () => {
      const payload = collect(product);
      if (product.id) return action(`/api/admin/product-editor-v2/products/${product.id}`, 'PUT', payload);
      return action('/api/admin/product-editor-v2/products', 'POST', payload);
    };
    document.getElementById('pe-save')?.addEventListener('click', save);
    document.getElementById('pe-save-continue')?.addEventListener('click', save);
    document.getElementById('pe-form')?.addEventListener('input', () => context.dirty());
    const preserveForm = () => {
      const payload = collect(product);
      payload.options = [...document.querySelectorAll('.pe-option')].map((row) => ({
        name: row.querySelector('[data-option-name]').value.trim(),
        values: csv(row.querySelector('[data-option-values]').value),
      }));
      Object.assign(product, payload);
      return payload;
    };
    const addOption = (name) => {
      if (product.options.length >= 3) return context.toast('A maximum of three options is supported');
      preserveForm();
      product.options.push({ id: crypto.randomUUID(), name, values: [] });
      context.update(product, workspace);
    };
    document.getElementById('pe-add-size')?.addEventListener('click', () => addOption('Size'));
    document.getElementById('pe-add-color')?.addEventListener('click', () => addOption('Color'));
    document.getElementById('pe-add-custom')?.addEventListener('click', () => addOption('Custom option'));
    document.querySelectorAll('[data-option-remove]').forEach((button) => button.addEventListener('click', () => {
      preserveForm();
      product.options.splice(Number(button.dataset.optionRemove), 1); context.update(product, workspace);
    }));
    document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => {
      const row = document.querySelector(`[data-option="${button.dataset.preset}"]`);
      const field = row.querySelector('[data-option-values]');
      field.value = [...new Set([...csv(field.value), button.dataset.value])].join(', ');
    }));
    document.getElementById('pe-generate')?.addEventListener('click', () => {
      const payload = preserveForm();
      product.options = payload.options; product.variants = combinations(payload.options, product);
      context.update(product, workspace); context.toast(`${product.variants.length} variant combinations generated`);
    });
    document.getElementById('pe-all')?.addEventListener('change', (event) =>
      document.querySelectorAll('[data-v-select]').forEach((checkbox) => { checkbox.checked = event.target.checked; }));
    const bulk = (field, source) => {
      const value = document.getElementById(source).value;
      if (value === '') return;
      document.querySelectorAll('tr[data-variant]').forEach((row) => {
        if (row.querySelector('[data-v-select]').checked) row.querySelector(`[data-v="${field}"]`).value = value;
      });
    };
    document.getElementById('pe-apply-price')?.addEventListener('click', () => bulk('price', 'pe-bulk-price'));
    document.getElementById('pe-apply-qty')?.addEventListener('click', () => bulk('quantity', 'pe-bulk-qty'));
    document.getElementById('pe-apply-status')?.addEventListener('click', () => bulk('status', 'pe-bulk-status'));
    document.getElementById('pe-variant-search')?.addEventListener('input', (event) =>
      document.querySelectorAll('tr[data-variant]').forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(event.target.value.toLowerCase()); }));
    document.getElementById('pe-files')?.addEventListener('change', async (event) => {
      if (!product.id) return context.toast('Save the product draft before uploading media');
      for (const file of event.target.files) {
        const dataBase64 = await new Promise((resolve) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(file);
        });
        await action(`/api/admin/product-editor-v2/products/${product.id}/media`, 'POST', {
          expectedRevision: window.__peWorkspace.storeRevision, fileName: file.name,
          mimeType: file.type, dataBase64, role: 'Other', altText: product.title,
        });
      }
    });
    document.querySelectorAll('[data-feature]').forEach((button) => button.addEventListener('click', () => {
      const next = product.media.map((item) => ({ ...item, featured: item.id === button.dataset.feature }));
      action(`/api/admin/product-editor-v2/products/${product.id}/media`, 'PUT', { expectedRevision: workspace.storeRevision, media: next });
    }));
    document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/media/${button.dataset.remove}`, 'DELETE', { expectedRevision: workspace.storeRevision })));
    let dragged = null;
    document.querySelectorAll('.pe-media').forEach((card) => {
      card.addEventListener('dragstart', () => { dragged = card.dataset.mediaId; });
      card.addEventListener('dragover', (event) => event.preventDefault());
      card.addEventListener('drop', () => {
        const ids = product.media.map((item) => item.id);
        const from = ids.indexOf(dragged); const to = ids.indexOf(card.dataset.mediaId);
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        const next = ids.map((id) => product.media.find((item) => item.id === id));
        action(`/api/admin/product-editor-v2/products/${product.id}/media`, 'PUT', { expectedRevision: workspace.storeRevision, media: next });
      });
    });
    document.getElementById('pe-submit')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/submit`, 'POST', { expectedRevision: workspace.storeRevision }));
    document.getElementById('pe-changes')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/request-changes`, 'POST', { expectedRevision: workspace.storeRevision, note: prompt('Requested changes') || '' }));
    document.getElementById('pe-approve')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/approve`, 'POST', { expectedRevision: workspace.storeRevision }));
    document.getElementById('pe-publish')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/publish`, 'POST', { expectedRevision: workspace.storeRevision, expectedWebsiteRevision: product.websiteRevision, idempotencyKey: crypto.randomUUID() }));
    document.getElementById('pe-revise')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/revise`, 'POST', { expectedRevision: workspace.storeRevision }));
    document.getElementById('pe-preview')?.addEventListener('click', () => {
      if (product.seo.handle) window.open(`/products/${encodeURIComponent(product.seo.handle)}`, '_blank', 'noopener');
      else context.toast('Save a URL handle before previewing');
    });
    document.getElementById('pe-library')?.addEventListener('click', async () => {
      if (!product.id) return context.toast('Save the product draft before selecting Media Library assets');
      const choices = (workspace.mediaLibrary || []).filter((item) =>
        !product.media.some((current) => current.path === item.path));
      if (!choices.length) return context.toast('No additional Product Editor media is available');
      const selected = prompt(`Enter the number of an existing asset:\n${choices.map((item, index) => `${index + 1}. ${item.title || item.originalName || item.role}`).join('\n')}`);
      const asset = choices[Number(selected) - 1];
      if (asset) await action(`/api/admin/product-editor-v2/products/${product.id}/media-library`, 'POST', {
        expectedRevision: workspace.storeRevision, sourceMediaId: asset.id,
      });
    });
  }

  window.ProductEditorV2UI = { bind, empty, render };
}());
