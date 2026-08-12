const root = document.getElementById('admin-root');

const state = {
  authed: false,
  defaultPasswordInUse: false,
  databaseConfigured: false,
  loading: true,
  view: 'dashboard',
  query: '',
  store: null,
  selectedProductId: null,
  dirty: false,
  pendingImages: [],
  mediaOrder: [],
  editorSaving: false,
};

const nav = [
  ['dashboard', '⌂', 'Home'],
  ['orders', '◇', 'Orders'],
  ['returns', '↩', 'Return Requests'],
  ['products', '□', 'Products'],
  ['mto', '◌', 'Made to Measure'],
  ['content', '✎', 'Brand & imagery'],
  ['settings', '⚙', 'Settings'],
];

function money(value) {
  const currency = state.store?.settings?.currency || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function adminPathForView(view) {
  return view === 'dashboard' ? '/admin' : `/admin/${view}`;
}

function applyRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/admin';
  const editorMatch = path.match(/^\/admin\/products\/([^/]+)$/);
  if (editorMatch) {
    state.view = 'product-editor';
    state.selectedProductId = editorMatch[1] === 'new' ? null : decodeURIComponent(editorMatch[1]);
    return;
  }
  const view = path.match(/^\/admin\/([^/]+)$/)?.[1] || 'dashboard';
  state.view = nav.some(([id]) => id === view) ? view : 'dashboard';
}

function navigateAdmin(path) {
  window.history.pushState({}, '', path);
  state.pendingImages = [];
  state.mediaOrder = [];
  applyRoute();
  if (state.view === 'product-editor' && !state.selectedProductId) createProductDraft();
  render();
}

function assetUrl(value = '') {
  const source = String(value || '').trim();
  if (!source) return '/assets/motogrip-logo-transparent.png';
  if (/^(?:https?:|data:|\/)/i.test(source)) return source;
  return `/${source}`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function markDirty() {
  state.dirty = true;
  const bar = document.querySelector('.savebar');
  if (bar) bar.classList.add('visible');
}

function toast(message) {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  window.setTimeout(() => el.classList.remove('visible'), 2600);
}

function productById(id = state.selectedProductId) {
  return state.store.products.find((product) => product.id === id) || null;
}

function createProductDraft() {
  const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const category = categories()[0]?.name || '';
  const product = {
    id,
    slug: '',
    title: '',
    description: '',
    category,
    subcategory: '',
    gender: 'Unisex',
    price: '',
    compareAtPrice: '',
    inventory: 0,
    status: 'draft',
    uploadedImages: [],
    image: '',
    primaryImage: '',
    galleryImages: [],
    madeToMeasureEnabled: true,
    madeToMeasureSurcharge: Number(state.store.settings.madeToMeasureSurcharge || 50),
    stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0, '4XL': 0, '5XL': 0, '6XL': 0 },
    brand: 'MOTOGRIP GEAR',
    sku: id,
    condition: 'NewCondition',
    material: 'Leather',
    sizeSystem: 'US',
    sizeType: 'Regular',
    ageGroup: 'Adult',
    itemGroupId: id,
    variantOptions: ['Size', 'Leather', 'Fit'],
  };
  state.store.products.unshift(product);
  state.selectedProductId = id;
  state.dirty = true;
  return product;
}

function categories() {
  return state.store.categories || [];
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  if (!query) return state.store.products;
  return state.store.products.filter((product) => [
    product.title,
    product.slug,
    product.category,
    product.gender,
    product.status,
    product.tag,
  ].join(' ').toLowerCase().includes(query));
}

function filteredOrders() {
  const query = state.query.trim().toLowerCase();
  if (!query) return state.store.orders;
  return state.store.orders.filter((order) => [
    order.id,
    order.customer,
    order.email,
    order.status,
    order.fulfillment,
    order.fit,
  ].join(' ').toLowerCase().includes(query));
}

function filteredReturns() {
  const requests = state.store.returnRequests || [];
  const query = state.query.trim().toLowerCase();
  if (!query) return requests;
  return requests.filter((request) => [
    request.id,
    request.orderNumber,
    request.name,
    request.email,
    request.item,
    request.requestType,
    request.reason,
    request.status,
  ].join(' ').toLowerCase().includes(query));
}

function renderLogin(error = '') {
  root.innerHTML = `
    <main class="login-shell">
      <form class="login-card" id="login-form">
        <div class="login-brand">
          <div class="brand-mark wide"><img src="/assets/motogrip-logo-transparent.png" alt=""></div>
          <div>
            <div class="eyebrow">Admin</div>
            <h1>MOTOGRIP GEAR</h1>
          </div>
        </div>
        <p>Sign in to manage products, made-to-measure pricing, order workflow, and brand content.</p>
        ${state.defaultPasswordInUse ? '<p class="pill draft">Default local password: motogrip-admin</p>' : ''}
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" autocomplete="current-password" autofocus>
        </div>
        ${error ? `<p class="pill archived">${escapeHtml(error)}</p>` : ''}
        <div style="height: 18px"></div>
        <button class="btn primary" type="submit">Sign in</button>
      </form>
    </main>
  `;
  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: document.getElementById('password').value }),
      });
      state.authed = true;
      await loadStore();
    } catch (err) {
      renderLogin(err.message);
    }
  });
}

function shell(content) {
  return `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-mark wide"><img src="/assets/motogrip-logo-transparent.png" alt=""></div>
          <div>
            <div class="eyebrow">Admin</div>
            <div>MOTOGRIP GEAR</div>
          </div>
        </div>
        <div class="nav-group">
          <div class="nav-label">Store</div>
          ${nav.map(([id, icon, label]) => `
            <div class="nav-entry">
              <button class="nav-item ${(state.view === id || (id === 'products' && state.view === 'product-editor')) ? 'active' : ''}" data-view="${id}">
                <span class="nav-icon">${icon}</span>
                <span>${label}</span>
              </button>
              ${id === 'products' ? `
                <button class="nav-subitem ${state.view === 'product-editor' && window.location.pathname.endsWith('/new') ? 'active' : ''}" id="sidebar-add-product">
                  <span>＋</span><span>Add Product</span>
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.store.settings.storeName)}</strong><br>
          ${state.store.products.length} products · ${state.store.orders.length} orders<br>
          <span class="database-state ${state.databaseConfigured ? 'connected' : ''}">${state.databaseConfigured ? '● PostgreSQL connected' : '○ Local data mode'}</span>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="search">
            <input id="global-search" value="${escapeHtml(state.query)}" placeholder="Search products, orders, customers">
          </div>
          <div class="button-row">
            <a class="btn" href="/" target="_blank" rel="noreferrer">View store</a>
            <button class="btn" id="logout">Log out</button>
          </div>
        </header>
        <section class="content">${content}</section>
      </main>
      <div class="savebar">
        <span>Unsaved changes</span>
        <button class="btn" id="discard">Discard</button>
        <button class="btn primary" id="save">Save</button>
      </div>
      <div class="toast"></div>
    </div>
  `;
}

function pageHead(title, subtitle, actions = '') {
  return `
    <div class="page-head">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="button-row">${actions}</div>
    </div>
  `;
}

function renderDashboard() {
  const products = state.store.products;
  const orders = state.store.orders;
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lowStock = products.filter((product) => Number(product.inventory) <= 5).length;
  const mto = products.filter((product) => product.madeToMeasureEnabled).length;
  return `
    ${pageHead('Home', 'A concise operating view for catalog, orders, and fit-lab workflow.')}
    <div class="grid stats">
      <div class="card metric"><span>Revenue</span><strong>${money(revenue)}</strong></div>
      <div class="card metric"><span>Open orders</span><strong>${orders.filter((o) => o.status !== 'fulfilled').length}</strong></div>
      <div class="card metric"><span>Low stock</span><strong>${lowStock}</strong></div>
      <div class="card metric"><span>MTO products</span><strong>${mto}</strong></div>
    </div>
    <div style="height:16px"></div>
    <div class="grid two-col">
      <div class="card">
        <div class="card-head"><h2>Orders needing attention</h2><button class="btn" data-view="orders">View all</button></div>
        <div class="table-wrap">${ordersTable(orders.filter((order) => order.status !== 'fulfilled').slice(0, 5))}</div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Recent activity</h2><span class="pill">Live JSON store</span></div>
        <div class="card-pad">
          ${state.store.activity.slice(0, 5).map((item) => `
            <p><strong>${escapeHtml(item.message)}</strong><br><span class="muted">${new Date(item.at).toLocaleString()}</span></p>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function productTable(products) {
  if (!products.length) return '<div class="empty">No products match this search.</div>';
  return `
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Status</th>
          <th>Inventory</th>
          <th>MTO</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((product) => `
          <tr class="clickable" data-product="${product.id}">
            <td>
              <div class="resource">
                <div class="thumb"><img src="${escapeHtml(assetUrl(product.image || product.primaryImage))}" alt=""></div>
                <div>
                  <strong>${escapeHtml(product.title)}</strong><br>
                  <span class="muted">${escapeHtml(product.category)} · ${escapeHtml(product.gender)}</span>
                </div>
              </div>
            </td>
            <td><span class="pill ${product.status}">${escapeHtml(product.status)}</span></td>
            <td>${Number(product.inventory || 0)}</td>
            <td>${product.madeToMeasureEnabled ? `<span class="pill active">+${money(product.madeToMeasureSurcharge)}</span>` : '<span class="pill">Off</span>'}</td>
            <td>${money(product.price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderProducts() {
  const products = filteredProducts();
  return `
    ${pageHead('Products', 'Create, edit, publish, and organize your complete product catalog.', '<button class="btn primary" id="new-product">Add product</button>')}
    <div class="card category-manager">
      <div class="card-head">
        <div><h2>Categories</h2><span class="muted">Categories and their subcategories are stored in PostgreSQL.</span></div>
        <button class="btn" id="add-category">Add category</button>
      </div>
      <div class="card-pad category-list">
        ${categories().length ? categories().map((category) => `
          <span class="category-chip"><span>${escapeHtml(category.name)}</span><button type="button" data-delete-category="${escapeHtml(category.id)}" aria-label="Remove ${escapeHtml(category.name)}">×</button></span>
        `).join('') : '<span class="muted">No categories yet. Add your first category above.</span>'}
      </div>
    </div>
    <div style="height:16px"></div>
    <div class="card">
      <div class="card-head"><h2>Catalog</h2><span class="pill">${products.length} shown</span></div>
      <div class="table-wrap">${productTable(products)}</div>
    </div>
  `;
}

function productEditor(product) {
  const stock = product.stock || {};
  const selectedCategory = categories().find((category) => category.name === product.category);
  const categoryNames = categories().map((category) => category.name);
  if (product.category && !categoryNames.includes(product.category)) categoryNames.push(product.category);
  const subcategories = [...(selectedCategory?.subcategories || [])];
  if (product.subcategory && !subcategories.some((item) => item.name === product.subcategory)) {
    subcategories.push({ id: '', name: product.subcategory });
  }
  const uploaded = product.uploadedImages || [];
  const catalogImages = uploaded.length ? [] : [...new Set([product.primaryImage || product.image, ...(product.galleryImages || [])].filter(Boolean))];
  const unorderedMedia = [
    ...uploaded.map((image, index) => ({ kind: 'uploaded', id: image.id, name: image.name, src: image.url, index })),
    ...catalogImages.map((src, index) => ({ kind: 'catalog', id: `catalog-${index}`, name: src.split('/').pop() || `Catalog image ${index + 1}`, src, index })),
    ...state.pendingImages.map((image, index) => ({ kind: 'pending', id: image.id, name: image.name, src: image.data, index })),
  ];
  const mediaByKey = new Map(unorderedMedia.map((image) => [`${image.kind}:${image.id}`, image]));
  const orderedKeys = [...state.mediaOrder.filter((key) => mediaByKey.has(key))];
  for (const key of mediaByKey.keys()) if (!orderedKeys.includes(key)) orderedKeys.push(key);
  state.mediaOrder = orderedKeys;
  const media = orderedKeys.map((key) => mediaByKey.get(key));
  const livePath = `/products/${encodeURIComponent(product.slug || slugify(product.title))}`;
  return `
    <div class="product-editor-page" id="product-form" data-id="${escapeHtml(product.id)}">
      ${pageHead(
        product.title ? escapeHtml(product.title) : 'Add product',
        'Essential product details stay visible. Advanced fields remain tucked away until you need them.',
        `<button class="btn" id="back-products">Back to products</button>
         <button class="btn" id="save-draft">Save draft</button>
         <button class="btn" id="save-product">Save</button>
         <button class="btn primary" id="save-publish">Save &amp; publish</button>`,
      )}
      ${product.status === 'active' ? `
        <div class="live-product-banner">
          <div><strong>Published</strong><span>Your product is live on the storefront.</span></div>
          <a class="btn" href="${livePath}" target="_blank" rel="noreferrer">View live product ↗</a>
        </div>
      ` : ''}
      <div class="editor-layout">
        <div class="editor-main">
          <section class="card editor-section">
            <div class="card-head"><div><h2>Product details</h2><span class="muted">The information customers see first.</span></div></div>
            <div class="card-pad form-grid">
              ${field('Title', 'title', product.title, 'text', true)}
              ${textareaField('Description', 'description', product.description)}
            </div>
          </section>

          <section class="card editor-section">
            <div class="card-head"><div><h2>Media</h2><span class="muted">Upload up to 10 images. Drag image cards to set their order; the first is the cover.</span></div></div>
            <div class="card-pad">
              <label class="media-dropzone" id="media-dropzone" for="product-images">
                <input id="product-images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple>
                <span class="dropzone-icon">＋</span>
                <strong>Drop product images here</strong>
                <span>or click to select multiple files at once · PNG, JPG, WEBP or GIF · 8 MB each</span>
              </label>
              <div class="media-grid" id="media-grid">
                ${media.length ? media.map((image, index) => `
                  <article class="media-card" draggable="true" data-image-kind="${image.kind}" data-image-id="${escapeHtml(image.id)}" data-image-index="${image.index}">
                    <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name || product.title)}">
                    <div class="media-card-meta">
                      <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                      <span class="media-name">${index === 0 ? '<strong>Cover</strong> · ' : ''}${escapeHtml(image.name || `Image ${index + 1}`)}</span>
                      <button type="button" class="media-remove" data-remove-image="${escapeHtml(image.id)}" data-image-kind="${image.kind}" aria-label="Remove image">×</button>
                    </div>
                  </article>
                `).join('') : '<div class="media-empty">No product images yet.</div>'}
              </div>
            </div>
          </section>

          <section class="card editor-section">
            <div class="card-head"><h2>Pricing and inventory</h2></div>
            <div class="card-pad form-grid">
              ${field('Price', 'price', product.price, 'number')}
              ${field('Compare-at price', 'compareAtPrice', product.compareAtPrice || '', 'number')}
              ${field('Quantity', 'inventory', product.inventory, 'number')}
            </div>
          </section>

          <section class="optional-fields">
            ${optionalSection('Search engine listing', 'SEO title, description, URL, schema, and product identifiers.', `
              ${field('SEO title', 'seoTitle', product.seoTitle, 'text', true)}
              ${textareaField('SEO description', 'seoDescription', product.seoDescription)}
              ${textareaField('Schema description', 'schemaDescription', product.schemaDescription)}
              ${field('URL handle', 'slug', product.slug, 'text', true)}
              ${field('Canonical URL', 'canonicalUrl', product.canonicalUrl, 'url', true)}
              ${field('SKU', 'sku', product.sku)}
              ${field('MPN', 'mpn', product.mpn)}
              ${field('GTIN / UPC / EAN', 'gtin', product.gtin)}
              ${field('Google product category', 'googleProductCategory', product.googleProductCategory, 'text', true)}
            `)}
            ${optionalSection('Product content', 'Add structured details when they are available.', `
              ${textareaField('Features', 'features', product.features)}
              ${textareaField('Specifications', 'specifications', product.specifications)}
              ${textareaField('Perfect for', 'perfectFor', product.perfectFor)}
              ${textareaField('Why you’ll love it', 'whyYouWillLoveIt', product.whyYouWillLoveIt)}
            `)}
            ${optionalSection('Apparel and merchant details', 'Material, color, sizing, condition, variants, and ratings.', `
              ${field('Brand', 'brand', product.brand)}
              ${field('Product type', 'productType', product.productType)}
              ${selectField('Condition', 'condition', product.condition || 'NewCondition', ['NewCondition', 'UsedCondition', 'RefurbishedCondition'])}
              ${field('Material', 'material', product.material)}
              ${field('Color', 'color', product.color)}
              ${field('Size system', 'sizeSystem', product.sizeSystem)}
              ${field('Size type', 'sizeType', product.sizeType)}
              ${field('Age group', 'ageGroup', product.ageGroup)}
              ${field('Item group ID', 'itemGroupId', product.itemGroupId)}
              ${field('Variant options', 'variantOptionsText', (product.variantOptions || []).join(', '), 'text', true)}
              ${field('Shipping weight', 'shippingWeight', product.shippingWeight)}
              ${field('Rating value', 'ratingValue', product.ratingValue || '', 'number')}
              ${field('Review count', 'reviewCount', product.reviewCount || '', 'number')}
            `)}
            ${optionalSection('Shipping and returns', 'Customer-facing delivery and return information.', `
              ${textareaField('Shipping policy', 'shippingPolicy', product.shippingPolicy)}
              ${textareaField('Return policy', 'returnPolicy', product.returnPolicy)}
              ${textareaField('Care instructions', 'careInstructions', product.careInstructions)}
              ${textareaField('Fit notes', 'fitNotes', product.fitNotes)}
              ${field('Warranty', 'warranty', product.warranty, 'text', true)}
            `)}
            ${optionalSection('Leather product authority', 'Construction and riding-specific attributes.', `
              ${field('Leather type', 'leatherType', product.leatherType)}
              ${field('Leather origin', 'leatherOrigin', product.leatherOrigin)}
              ${field('Leather thickness', 'leatherThickness', product.leatherThickness)}
              ${field('Lining', 'lining', product.lining)}
              ${field('Hardware', 'hardware', product.hardware)}
              ${field('Closure type', 'closureType', product.closureType)}
              ${field('Armor compatibility', 'armorCompatibility', product.armorCompatibility)}
              ${field('Weather resistance', 'weatherResistance', product.weatherResistance)}
              ${field('Riding use case', 'ridingUseCase', product.ridingUseCase)}
              ${field('Season', 'season', product.season)}
              ${field('Craft method', 'craftMethod', product.craftMethod, 'text', true)}
            `)}
            ${optionalSection('Made to measure and size stock', 'Configure fit service and optional per-size quantities.', `
              <div class="field full">
                <div class="toggle-line"><div><strong>Made to measure</strong><br><span class="muted">Offer custom measurements with a surcharge.</span></div><input type="checkbox" data-product-field="madeToMeasureEnabled" ${product.madeToMeasureEnabled ? 'checked' : ''}></div>
              </div>
              ${field('Made-to-measure surcharge', 'madeToMeasureSurcharge', product.madeToMeasureSurcharge, 'number')}
              <div class="field full"><label>Size stock</label><div class="size-stock-grid">
                ${['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'].map((size) => `<div class="field"><label>${size}</label><input data-stock-size="${size}" value="${Number(stock[size] || 0)}" type="number" min="0"></div>`).join('')}
              </div></div>
            `)}
          </section>
        </div>

        <aside class="editor-sidebar">
          <section class="card editor-section sticky-editor-card">
            <div class="card-head"><h2>Organization</h2></div>
            <div class="card-pad form-grid one-column">
              ${selectField('Status', 'status', product.status || 'draft', product.status === 'active' ? ['active', 'draft', 'archived'] : ['draft', 'archived'])}
              ${selectField('Gender', 'gender', product.gender || 'Unisex', ['Men', 'Women', 'Unisex'])}
              ${selectField('Category', 'category', product.category, categoryNames)}
              <div class="field">
                <label>Subcategory</label>
                <select data-product-field="subcategory">
                  <option value="">No subcategory</option>
                  ${subcategories.map((item) => `<option value="${escapeHtml(item.name)}" ${item.name === product.subcategory ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
                </select>
              </div>
              <div class="button-row organization-actions">
                <button class="btn" type="button" id="add-category">Add category</button>
                <button class="btn" type="button" id="add-subcategory">Add subcategory</button>
                ${product.subcategory && subcategories.find((item) => item.name === product.subcategory)?.id ? `<button class="btn danger" type="button" data-delete-subcategory="${escapeHtml(subcategories.find((item) => item.name === product.subcategory).id)}">Remove selected</button>` : ''}
              </div>
            </div>
          </section>
        </aside>
      </div>
      <div class="editor-footer-actions">
        <span class="muted">${state.pendingImages.length ? `${state.pendingImages.length} image${state.pendingImages.length === 1 ? '' : 's'} ready to upload` : 'All product data is saved together.'}</span>
        <div class="button-row"><button class="btn" id="footer-save">Save</button><button class="btn primary" id="footer-publish">Save &amp; publish</button></div>
      </div>
    </div>
  `;
}

function renderProductEditor() {
  let product = productById();
  if (!product && window.location.pathname.replace(/\/$/, '').endsWith('/products/new')) product = createProductDraft();
  if (!product) {
    return `${pageHead('Product not found', 'This product may have been removed.', '<button class="btn" id="back-products">Back to products</button>')}<div class="card empty">Choose a product from the catalog.</div>`;
  }
  return productEditor(product);
}

function optionalSection(title, subtitle, fields) {
  return `
    <details class="card optional-section">
      <summary><span><strong>${title}</strong><small>${subtitle}</small></span><span class="optional-chevron">⌄</span></summary>
      <div class="card-pad form-grid">${fields}</div>
    </details>
  `;
}

function field(label, key, value, type = 'text', full = false) {
  return `
    <div class="field ${full ? 'full' : ''}">
      <label>${label}</label>
      <input data-product-field="${key}" value="${escapeHtml(value ?? '')}" type="${type}">
    </div>
  `;
}

function textareaField(label, key, value) {
  return `
    <div class="field full">
      <label>${label}</label>
      <textarea data-product-field="${key}">${escapeHtml(value ?? '')}</textarea>
    </div>
  `;
}

function selectField(label, key, value, options) {
  return `
    <div class="field">
      <label>${label}</label>
      <select data-product-field="${key}">
        ${options.map((option) => `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
      </select>
    </div>
  `;
}

function ordersTable(orders) {
  if (!orders.length) return '<div class="empty">No orders found.</div>';
  return `
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Payment</th>
          <th>Fulfillment</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((order) => `
          <tr>
            <td><strong>${escapeHtml(order.id)}</strong><br><span class="muted">${escapeHtml(order.fit || '')}</span></td>
            <td>${escapeHtml(order.date || '')}</td>
            <td>${escapeHtml(order.customer || '')}<br><span class="muted">${escapeHtml(order.email || '')}</span></td>
            <td><span class="pill ${escapeHtml(order.status)}">${escapeHtml(order.status)}</span></td>
            <td>${escapeHtml(order.paymentStatus || order.payment || 'pending')}<br><span class="muted">${escapeHtml(order.provider || '')}</span></td>
            <td>${escapeHtml(order.fulfillment || '')}</td>
            <td>${money(order.total)}<br><span class="muted">${escapeHtml(String(order.items || 0))} item(s)</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderOrders() {
  const orders = filteredOrders();
  return `
    ${pageHead('Orders', 'Review payment, fulfillment, and made-to-measure production status.')}
    <div class="card">
      <div class="card-head"><h2>All orders</h2><span class="pill">${orders.length} shown</span></div>
      <div class="table-wrap">${ordersTable(orders)}</div>
    </div>
  `;
}

function renderReturns() {
  const requests = filteredReturns();
  return `
    ${pageHead('Return Requests', 'Review refund, exchange, store-credit, and fit-alteration requests submitted from the storefront.')}
    <div class="card">
      <div class="card-head"><h2>Customer requests</h2><span class="pill">${requests.length} shown</span></div>
      <div class="table-wrap">
        ${requests.length ? `
          <table>
            <thead><tr><th>Request</th><th>Order</th><th>Customer</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              ${requests.map((request) => `
                <tr>
                  <td><strong>${escapeHtml(request.id)}</strong><br><span class="muted">${request.submittedAt ? new Date(request.submittedAt).toLocaleString() : ''}</span></td>
                  <td>${escapeHtml(request.orderNumber)}<br><span class="muted">${escapeHtml(request.item || '')}</span></td>
                  <td>${escapeHtml(request.name)}<br><span class="muted">${escapeHtml(request.email)}</span></td>
                  <td>${escapeHtml(request.requestType)}</td>
                  <td>${escapeHtml(request.reason)}<br><span class="muted">${escapeHtml(request.details)}</span></td>
                  <td><span class="pill ${escapeHtml(request.status)}">${escapeHtml(request.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty">No return requests found.</div>'}
      </div>
    </div>
  `;
}

function renderMto() {
  const enabled = state.store.products.filter((product) => product.madeToMeasureEnabled);
  return `
    ${pageHead('Made to Measure', 'Control the default surcharge, lead time, and product-level fit availability.')}
    <div class="grid two-col">
      <div class="card">
        <div class="card-head"><h2>Fit service settings</h2><span class="pill active">${enabled.length} active products</span></div>
        <div class="card-pad form-grid">
          ${settingsField('Default surcharge', 'madeToMeasureSurcharge', state.store.settings.madeToMeasureSurcharge, 'number')}
          ${settingsField('Lead time', 'madeToMeasureLeadTime', state.store.settings.madeToMeasureLeadTime)}
          <div class="field full">
            <label>Customer-facing note</label>
            <textarea data-setting-field="brandVoice">${escapeHtml(state.store.settings.brandVoice)}</textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Product surcharges</h2><button class="btn" id="apply-default-mto">Apply default to all</button></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Enabled</th><th>Surcharge</th></tr></thead>
            <tbody>
              ${state.store.products.map((product) => `
                <tr>
                  <td>${escapeHtml(product.title)}</td>
                  <td>${product.madeToMeasureEnabled ? '<span class="pill active">On</span>' : '<span class="pill">Off</span>'}</td>
                  <td>${money(product.madeToMeasureSurcharge)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderContent() {
  return `
    ${pageHead('Brand & imagery', 'Keep the storefront voice and generated product imagery consistent.')}
    <div class="card">
      <div class="card-head"><h2>Generation preset</h2><span class="pill">Light theme</span></div>
      <div class="card-pad form-grid">
        <div class="field full">
          <label>Brand voice</label>
          <textarea data-setting-field="brandVoice">${escapeHtml(state.store.settings.brandVoice)}</textarea>
        </div>
        <div class="field full">
          <label>Product imagery prompt</label>
          <textarea data-setting-field="imageryPrompt" style="min-height:150px">${escapeHtml(state.store.settings.imageryPrompt)}</textarea>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    ${pageHead('Settings', 'Store identity, currency, support, and operational defaults.')}
    <div class="card">
      <div class="card-head"><h2>General</h2><span class="pill">Admin controlled</span></div>
      <div class="card-pad form-grid">
        ${settingsField('Store name', 'storeName', state.store.settings.storeName)}
        ${settingsField('Currency', 'currency', state.store.settings.currency)}
        ${settingsField('Support email', 'supportEmail', state.store.settings.supportEmail)}
        ${settingsField('Default MTO surcharge', 'madeToMeasureSurcharge', state.store.settings.madeToMeasureSurcharge, 'number')}
      </div>
    </div>
  `;
}

function settingsField(label, key, value, type = 'text') {
  return `
    <div class="field">
      <label>${label}</label>
      <input data-setting-field="${key}" value="${escapeHtml(value ?? '')}" type="${type}">
    </div>
  `;
}

function render() {
  if (!state.authed) {
    renderLogin();
    return;
  }
  if (!state.store) {
    root.innerHTML = '<main class="login-shell"><div class="login-card">Loading admin...</div></main>';
    return;
  }
  const views = {
    dashboard: renderDashboard,
    products: renderProducts,
    'product-editor': renderProductEditor,
    orders: renderOrders,
    returns: renderReturns,
    mto: renderMto,
    content: renderContent,
    settings: renderSettings,
  };
  root.innerHTML = shell((views[state.view] || renderDashboard)());
  bindShell();
  if (state.dirty && state.view !== 'product-editor') document.querySelector('.savebar')?.classList.add('visible');
}

function bindShell() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateAdmin(adminPathForView(button.dataset.view));
    });
  });

  document.getElementById('global-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    if (['products', 'orders', 'returns'].includes(state.view)) render();
  });

  document.getElementById('logout')?.addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' });
    state.authed = false;
    state.store = null;
    renderLogin();
  });

  document.getElementById('save')?.addEventListener('click', () => state.view === 'product-editor' ? saveProductWorkflow() : saveStore());
  document.getElementById('discard')?.addEventListener('click', loadStore);
  document.getElementById('back-products')?.addEventListener('click', () => navigateAdmin('/admin/products'));
  document.getElementById('sidebar-add-product')?.addEventListener('click', () => navigateAdmin('/admin/products/new'));

  document.getElementById('add-category')?.addEventListener('click', async () => {
    const name = window.prompt('New category name');
    if (!name?.trim()) return;
    try {
      const selectedId = state.selectedProductId;
      if (state.view === 'product-editor' && state.dirty) {
        state.store = await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(state.store) });
        state.selectedProductId = selectedId;
      }
      state.store = await api('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      state.selectedProductId = selectedId;
      state.dirty = false;
      render();
      toast('Category added');
    } catch (error) {
      toast(error.message);
    }
  });

  document.getElementById('add-subcategory')?.addEventListener('click', async () => {
    const product = productById();
    const category = categories().find((item) => item.name === product?.category);
    if (!category) {
      toast('Choose a category first');
      return;
    }
    const name = window.prompt(`New subcategory under ${category.name}`);
    if (!name?.trim()) return;
    try {
      const selectedId = state.selectedProductId;
      if (state.dirty) state.store = await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(state.store) });
      state.store = await api(`/api/admin/categories/${encodeURIComponent(category.id)}/subcategories`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      state.selectedProductId = selectedId;
      const savedProduct = productById();
      if (savedProduct) savedProduct.subcategory = name.trim();
      state.dirty = true;
      render();
      toast('Subcategory added');
    } catch (error) {
      toast(error.message);
    }
  });

  document.querySelectorAll('[data-delete-subcategory]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Remove this subcategory? Existing products keep their saved text until reassigned.')) return;
      try {
        const productId = state.selectedProductId;
        if (state.dirty) state.store = await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(state.store) });
        state.store = await api(`/api/admin/subcategories/${encodeURIComponent(button.dataset.deleteSubcategory)}`, { method: 'DELETE' });
        state.selectedProductId = productId;
        const product = productById();
        if (product) product.subcategory = '';
        state.dirty = true;
        render();
        toast('Subcategory removed');
      } catch (error) {
        toast(error.message);
      }
    });
  });

  document.querySelectorAll('[data-delete-category]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Remove this category? Products assigned to it must be moved first.')) return;
      try {
        state.store = await api(`/api/admin/categories/${encodeURIComponent(button.dataset.deleteCategory)}`, { method: 'DELETE' });
        state.dirty = false;
        render();
        toast('Category removed');
      } catch (error) {
        toast(error.message);
      }
    });
  });

  document.querySelectorAll('[data-product]').forEach((row) => {
    row.addEventListener('click', () => {
      navigateAdmin(`/admin/products/${encodeURIComponent(row.dataset.product)}`);
    });
  });

  document.querySelectorAll('[data-product-field]').forEach((input) => {
    const assignProductField = () => {
      const product = productById();
      const key = input.dataset.productField;
      if (key === 'galleryImagesText') {
        product.galleryImages = input.value.split('\n').map((value) => value.trim()).filter(Boolean);
      } else if (key === 'variantOptionsText') {
        product.variantOptions = input.value.split(',').map((value) => value.trim()).filter(Boolean);
      } else if (input.type === 'checkbox') {
        product[key] = input.checked;
      } else if (input.type === 'number') {
        product[key] = input.value === '' ? '' : Number(input.value);
      } else {
        product[key] = input.value;
      }
      if (key === 'title' && !product.slug) product.slug = slugify(input.value);
    };
    input.addEventListener('input', () => {
      assignProductField();
      markDirty();
    });
    input.addEventListener('change', () => {
      assignProductField();
      markDirty();
      if (input.dataset.productField === 'category') {
        const product = productById();
        if (product) product.subcategory = '';
        render();
      }
    });
  });

  document.querySelectorAll('[data-stock-size]').forEach((input) => {
    input.addEventListener('input', () => {
      const product = productById();
      product.stock = product.stock || {};
      product.stock[input.dataset.stockSize] = Number(input.value || 0);
      product.inventory = Object.values(product.stock).reduce((sum, value) => sum + Number(value || 0), 0);
      markDirty();
    });
  });

  const saveButtonBindings = [
    ['save-draft', { forceDraft: true }],
    ['save-product', {}],
    ['footer-save', {}],
    ['save-publish', { publish: true }],
    ['footer-publish', { publish: true }],
  ];
  for (const [id, options] of saveButtonBindings) {
    document.getElementById(id)?.addEventListener('click', () => saveProductWorkflow(options));
  }

  const addFiles = async (files) => {
    const product = productById();
    if (!product || !files.length) return;
    const available = 10 - (product.uploadedImages || []).length - state.pendingImages.length;
    if (available <= 0) {
      toast('This product already has 10 images');
      return;
    }
    const accepted = [...files].slice(0, available);
    try {
      const pending = await Promise.all(accepted.map(async (file) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error(`${file.name} is not a supported image.`);
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is larger than 8 MB.`);
        return {
          id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: file.type,
          data: await readFileAsDataUrl(file),
        };
      }));
      state.pendingImages.push(...pending);
      state.mediaOrder.push(...pending.map((image) => `pending:${image.id}`));
      markDirty();
      render();
      toast(`${pending.length} image${pending.length === 1 ? '' : 's'} ready to upload`);
    } catch (error) {
      toast(error.message);
    }
  };

  document.getElementById('product-images')?.addEventListener('change', (event) => addFiles(event.target.files || []));
  const dropzone = document.getElementById('media-dropzone');
  for (const eventName of ['dragenter', 'dragover']) {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragging');
    });
  }
  for (const eventName of ['dragleave', 'drop']) {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragging');
    });
  }
  dropzone?.addEventListener('drop', (event) => addFiles(event.dataTransfer?.files || []));

  document.querySelectorAll('.media-card').forEach((card) => {
    const key = `${card.dataset.imageKind}:${card.dataset.imageId}`;
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key);
      card.classList.add('dragging-card');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging-card'));
    card.addEventListener('dragover', (event) => event.preventDefault());
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      const sourceKey = event.dataTransfer.getData('text/plain');
      const sourceIndex = state.mediaOrder.indexOf(sourceKey);
      const targetIndex = state.mediaOrder.indexOf(key);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
      state.mediaOrder.splice(sourceIndex, 1);
      state.mediaOrder.splice(targetIndex, 0, sourceKey);
      const product = productById();
      if (product && state.mediaOrder.every((item) => item.startsWith('catalog:'))) {
        const catalogById = new Map([...new Set([product.primaryImage || product.image, ...(product.galleryImages || [])].filter(Boolean))]
          .map((src, index) => [`catalog-${index}`, src]));
        const orderedUrls = state.mediaOrder.map((item) => catalogById.get(item.slice('catalog:'.length))).filter(Boolean);
        product.primaryImage = orderedUrls[0] || '';
        product.image = orderedUrls[0] || '';
        product.galleryImages = orderedUrls.slice(1);
        state.mediaOrder = orderedUrls.map((_, index) => `catalog:catalog-${index}`);
      }
      markDirty();
      render();
    });
  });

  document.querySelectorAll('[data-remove-image]').forEach((button) => {
    button.addEventListener('click', async () => {
      const key = `${button.dataset.imageKind}:${button.dataset.removeImage}`;
      if (button.dataset.imageKind === 'pending') {
        state.pendingImages = state.pendingImages.filter((image) => image.id !== button.dataset.removeImage);
        state.mediaOrder = state.mediaOrder.filter((item) => item !== key);
        markDirty();
        render();
        return;
      }
      if (button.dataset.imageKind === 'catalog') {
        const product = productById();
        if (!product) return;
        const currentUrls = [...new Set([product.primaryImage || product.image, ...(product.galleryImages || [])].filter(Boolean))];
        const removeIndex = Number(button.dataset.removeImage.replace('catalog-', ''));
        const nextUrls = currentUrls.filter((_, index) => index !== removeIndex);
        product.primaryImage = nextUrls[0] || '';
        product.image = nextUrls[0] || '';
        product.galleryImages = nextUrls.slice(1);
        state.mediaOrder = nextUrls.map((_, index) => `catalog:catalog-${index}`);
        markDirty();
        render();
        return;
      }
      const product = productById();
      if (!product || !window.confirm('Remove this uploaded image?')) return;
      try {
        if (state.dirty) {
          state.store = await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(state.store) });
          state.selectedProductId = product.id;
        }
        state.store = await api(`/api/admin/products/${encodeURIComponent(product.id)}/images/${encodeURIComponent(button.dataset.removeImage)}`, { method: 'DELETE' });
        state.selectedProductId = product.id;
        state.mediaOrder = state.mediaOrder.filter((item) => item !== key);
        state.dirty = state.pendingImages.length > 0;
        render();
        toast('Image removed');
      } catch (error) {
        toast(error.message);
      }
    });
  });

  document.querySelectorAll('[data-setting-field]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.settingField;
      state.store.settings[key] = input.type === 'number' ? Number(input.value || 0) : input.value;
      markDirty();
    });
  });

  document.getElementById('new-product')?.addEventListener('click', () => {
    navigateAdmin('/admin/products/new');
  });

  document.getElementById('apply-default-mto')?.addEventListener('click', () => {
    state.store.products.forEach((product) => {
      if (product.madeToMeasureEnabled) product.madeToMeasureSurcharge = Number(state.store.settings.madeToMeasureSurcharge || 0);
    });
    markDirty();
    render();
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function saveProductWorkflow({ publish = false, forceDraft = false } = {}) {
  if (state.editorSaving) return;
  const product = productById();
  if (!product) return;
  state.editorSaving = true;
  const productId = product.id;
  const wasNewRoute = window.location.pathname.replace(/\/$/, '').endsWith('/products/new');
  try {
    product.slug = slugify(product.slug || product.title || product.id);
    if (forceDraft || (!publish && product.status === 'active' && !product.publishedAt)) product.status = 'draft';

    const requestedOrder = [...state.mediaOrder];
    const existingIds = new Set((product.uploadedImages || []).map((image) => image.id));
    const pendingById = new Map(state.pendingImages.map((image) => [image.id, image]));
    const pendingInOrder = requestedOrder
      .filter((key) => key.startsWith('pending:'))
      .map((key) => pendingById.get(key.slice('pending:'.length)))
      .filter(Boolean);
    for (const image of state.pendingImages) if (!pendingInOrder.includes(image)) pendingInOrder.push(image);

    state.store = await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(state.store) });
    state.selectedProductId = productId;

    const pendingToUploaded = new Map();
    if (pendingInOrder.length) {
      state.store = await api(`/api/admin/products/${encodeURIComponent(productId)}/images`, {
        method: 'POST',
        body: JSON.stringify({
          images: pendingInOrder.map((image) => ({ data: image.data, name: image.name, altText: product.imageAltText || product.title })),
        }),
      });
      state.selectedProductId = productId;
      const uploadedAfter = productById()?.uploadedImages || [];
      const newImages = uploadedAfter.filter((image) => !existingIds.has(image.id));
      pendingInOrder.forEach((image, index) => {
        if (newImages[index]) pendingToUploaded.set(image.id, newImages[index].id);
      });
    }

    const uploadedNow = productById()?.uploadedImages || [];
    const desiredIds = requestedOrder.map((key) => {
      if (key.startsWith('uploaded:')) return key.slice('uploaded:'.length);
      if (key.startsWith('pending:')) return pendingToUploaded.get(key.slice('pending:'.length));
      return '';
    }).filter(Boolean);
    for (const image of uploadedNow) if (!desiredIds.includes(image.id)) desiredIds.push(image.id);
    if (state.databaseConfigured && desiredIds.length > 1 && desiredIds.length === uploadedNow.length) {
      state.store = await api(`/api/admin/products/${encodeURIComponent(productId)}/images/order`, {
        method: 'PUT',
        body: JSON.stringify({ imageIds: desiredIds }),
      });
      state.selectedProductId = productId;
    }

    state.pendingImages = [];
    state.mediaOrder = [];
    if (publish) {
      state.store = await api(`/api/admin/products/${encodeURIComponent(productId)}/publish`, { method: 'POST' });
      state.selectedProductId = productId;
    }
    state.dirty = false;
    if (wasNewRoute) window.history.replaceState({}, '', `/admin/products/${encodeURIComponent(productId)}`);
    render();
    toast(publish ? 'Product published — live link ready' : forceDraft ? 'Draft saved' : 'Product saved');
  } catch (error) {
    toast(error.message);
  } finally {
    state.editorSaving = false;
  }
}

async function loadStore() {
  state.store = await api('/api/admin/store');
  state.pendingImages = [];
  state.mediaOrder = [];
  state.dirty = false;
  applyRoute();
  if (state.view === 'product-editor' && !state.selectedProductId) createProductDraft();
  render();
}

async function saveStore() {
  state.store = await api('/api/admin/store', {
    method: 'PUT',
    body: JSON.stringify(state.store),
  });
  state.dirty = false;
  render();
  toast('Saved');
}

async function init() {
  try {
    const session = await api('/api/admin/session');
    state.authed = session.authenticated;
    state.defaultPasswordInUse = session.defaultPasswordInUse;
    state.databaseConfigured = session.databaseConfigured;
    if (state.authed) await loadStore();
    else renderLogin();
  } catch (err) {
    root.innerHTML = `<main class="login-shell"><div class="login-card">Admin failed to load: ${escapeHtml(err.message)}</div></main>`;
  }
}

window.addEventListener('popstate', () => {
  state.pendingImages = [];
  state.mediaOrder = [];
  applyRoute();
  if (state.view === 'product-editor' && !state.selectedProductId && state.store) createProductDraft();
  render();
});

init();
