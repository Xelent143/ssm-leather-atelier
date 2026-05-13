const root = document.getElementById('admin-root');

const state = {
  authed: false,
  defaultPasswordInUse: false,
  loading: true,
  view: 'dashboard',
  query: '',
  store: null,
  selectedProductId: null,
  dirty: false,
};

const nav = [
  ['dashboard', '⌂', 'Home'],
  ['orders', '◇', 'Orders'],
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
  return state.store.products.find((product) => product.id === id) || state.store.products[0];
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

function renderLogin(error = '') {
  root.innerHTML = `
    <main class="login-shell">
      <form class="login-card" id="login-form">
        <div class="login-brand">
          <div class="brand-mark"><img src="/assets/motogrip-logo.svg" alt=""></div>
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
          <div class="brand-mark"><img src="/assets/motogrip-logo.svg" alt=""></div>
          <div>
            <div class="eyebrow">Admin</div>
            <div>MOTOGRIP GEAR</div>
          </div>
        </div>
        <div class="nav-group">
          <div class="nav-label">Store</div>
          ${nav.map(([id, icon, label]) => `
            <button class="nav-item ${state.view === id ? 'active' : ''}" data-view="${id}">
              <span class="nav-icon">${icon}</span>
              <span>${label}</span>
            </button>
          `).join('')}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.store.settings.storeName)}</strong><br>
          ${state.store.products.length} products · ${state.store.orders.length} orders
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
                <div class="thumb"><img src="/${escapeHtml(product.image)}" alt=""></div>
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
  if (!state.selectedProductId && products[0]) state.selectedProductId = products[0].id;
  const product = productById();
  return `
    ${pageHead('Products', 'Create, edit, publish, archive, and tune product-level made-to-measure pricing.', '<button class="btn primary" id="new-product">Add product</button>')}
    <div class="grid two-col">
      <div class="card">
        <div class="card-head"><h2>Catalog</h2><span class="pill">${products.length} shown</span></div>
        <div class="table-wrap">${productTable(products)}</div>
      </div>
      ${product ? productEditor(product) : '<div class="card empty">Select a product to edit.</div>'}
    </div>
  `;
}

function productEditor(product) {
  const stock = product.stock || {};
  return `
    <div class="card">
      <div class="card-head">
        <h2>${escapeHtml(product.title)}</h2>
        <span class="pill ${product.status}">${escapeHtml(product.status)}</span>
      </div>
      <div class="card-pad">
        <div class="form-grid" id="product-form" data-id="${product.id}">
          ${field('Title', 'title', product.title)}
          ${field('Slug', 'slug', product.slug)}
          ${selectField('Status', 'status', product.status, ['active', 'draft', 'archived'])}
          ${selectField('Category', 'category', product.category, ['Jackets', 'Vests', 'Pants', 'Accessories'])}
          ${selectField('Gender', 'gender', product.gender, ['Men', 'Women', 'Unisex'])}
          ${field('Tag', 'tag', product.tag)}
          ${field('Price', 'price', product.price, 'number')}
          ${field('Compare-at price', 'compareAtPrice', product.compareAtPrice || '', 'number')}
          ${field('Inventory', 'inventory', product.inventory, 'number')}
          ${field('Maker', 'maker', product.maker)}
          ${field('Image path', 'image', product.image, 'text', true)}
          ${textareaField('Description', 'description', product.description)}
          <div class="field full">
            <div class="toggle-line">
              <div>
                <strong>Made to measure</strong><br>
                <span class="muted">Show this fit option on the product and add its surcharge.</span>
              </div>
              <input type="checkbox" data-product-field="madeToMeasureEnabled" ${product.madeToMeasureEnabled ? 'checked' : ''}>
            </div>
          </div>
          ${field('Made-to-measure surcharge', 'madeToMeasureSurcharge', product.madeToMeasureSurcharge, 'number')}
          <div class="field full">
            <label>Size stock</label>
            <div class="form-grid">
              ${['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => `
                <div class="field">
                  <label>${size}</label>
                  <input data-stock-size="${size}" value="${Number(stock[size] || 0)}" type="number" min="0">
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
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
            <td>${escapeHtml(order.fulfillment || '')}</td>
            <td>${money(order.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderOrders() {
  const orders = filteredOrders();
  return `
    ${pageHead('Orders', 'Review payment, fulfillment, and made-to-measure production status.', '<button class="btn" id="add-demo-order">Create test order</button>')}
    <div class="card">
      <div class="card-head"><h2>All orders</h2><span class="pill">${orders.length} shown</span></div>
      <div class="table-wrap">${ordersTable(orders)}</div>
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
    orders: renderOrders,
    mto: renderMto,
    content: renderContent,
    settings: renderSettings,
  };
  root.innerHTML = shell((views[state.view] || renderDashboard)());
  bindShell();
  if (state.dirty) document.querySelector('.savebar')?.classList.add('visible');
}

function bindShell() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.getElementById('global-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    if (['products', 'orders'].includes(state.view)) render();
  });

  document.getElementById('logout')?.addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' });
    state.authed = false;
    state.store = null;
    renderLogin();
  });

  document.getElementById('save')?.addEventListener('click', saveStore);
  document.getElementById('discard')?.addEventListener('click', loadStore);

  document.querySelectorAll('[data-product]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedProductId = row.dataset.product;
      render();
    });
  });

  document.querySelectorAll('[data-product-field]').forEach((input) => {
    input.addEventListener('input', () => {
      const product = productById();
      const key = input.dataset.productField;
      if (input.type === 'checkbox') product[key] = input.checked;
      else if (input.type === 'number') product[key] = input.value === '' ? '' : Number(input.value);
      else product[key] = input.value;
      if (key === 'title' && !product.slug) product.slug = slugify(input.value);
      markDirty();
    });
    input.addEventListener('change', () => {
      const product = productById();
      const key = input.dataset.productField;
      if (input.type === 'checkbox') product[key] = input.checked;
      else if (input.type === 'number') product[key] = input.value === '' ? '' : Number(input.value);
      else product[key] = input.value;
      markDirty();
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

  document.querySelectorAll('[data-setting-field]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.settingField;
      state.store.settings[key] = input.type === 'number' ? Number(input.value || 0) : input.value;
      markDirty();
    });
  });

  document.getElementById('new-product')?.addEventListener('click', () => {
    const id = `p-${Date.now()}`;
    state.store.products.unshift({
      id,
      slug: 'new-product',
      title: 'New product',
      category: 'Jackets',
      gender: 'Unisex',
      price: 0,
      compareAtPrice: null,
      status: 'draft',
      inventory: 0,
      madeToMeasureEnabled: true,
      madeToMeasureSurcharge: state.store.settings.madeToMeasureSurcharge,
      tag: '',
      description: '',
      image: 'assets/generated/leather-detail.png',
      stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      maker: '',
    });
    state.selectedProductId = id;
    markDirty();
    render();
  });

  document.getElementById('add-demo-order')?.addEventListener('click', () => {
    state.store.orders.unshift({
      id: `MG-${Math.floor(1000 + Math.random() * 8999)}`,
      date: new Date().toISOString().slice(0, 10),
      customer: 'New customer',
      email: 'customer@example.com',
      status: 'open',
      payment: 'paid',
      fulfillment: 'unfulfilled',
      total: 1280,
      items: 1,
      channel: 'Online Store',
      fit: 'Made to measure',
    });
    markDirty();
    render();
  });

  document.getElementById('apply-default-mto')?.addEventListener('click', () => {
    state.store.products.forEach((product) => {
      if (product.madeToMeasureEnabled) product.madeToMeasureSurcharge = Number(state.store.settings.madeToMeasureSurcharge || 0);
    });
    markDirty();
    render();
  });
}

async function loadStore() {
  state.store = await api('/api/admin/store');
  state.selectedProductId = state.store.products[0]?.id || null;
  state.dirty = false;
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
    if (state.authed) await loadStore();
    else renderLogin();
  } catch (err) {
    root.innerHTML = `<main class="login-shell"><div class="login-card">Admin failed to load: ${escapeHtml(err.message)}</div></main>`;
  }
}

init();
