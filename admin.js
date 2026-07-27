const root = document.getElementById('admin-root');

const state = {
  authed: false,
  configured: true,
  csrfToken: null,
  actorType: null,
  loginMode: 'named',
  identity: null,
  bootstrapSkipped: false,
  loading: true,
  view: 'dashboard',
  query: '',
  store: null,
  selectedProductId: null,
  dirty: false,
  sidebarCollapsed: false,
  mvpDashboard: null,
  mvpProducts: [],
  mvpProduct: null,
  governance: null,
  productIdentityWorkspace: null,
  listingWorkspace: null,
  selectedDraftId: null,
  compareDraftId: null,
  productDetailTab: 'overview',
  listingTab: 'shopify',
  copiedListingKey: null,
  listingInputDirty: false,
  listingContentDirty: false,
  listingEditContent: null,
  latestDraftAvailableId: null,
  catalog: null,
  catalogSyncing: false,
  catalogError: '',
  catalogProduct: null,
  catalogAudit: [],
  productDnaOptions: [],
  catalogReviewFilter: 'all',
  operationalWorkflow: null,
  teamUsers: [],
  profile: null,
  profileTab: 'profile',
  productEditorWorkspace: null,
  productEditorProduct: null,
  productEditorDirty: false,
  productEditorOptionDrafts: [],
  productEditorVariantFilter: '',
  productGrid: null,
  productGridSelection: new Set(),
  productGridFilters: {
    status: 'all',
    brand: 'all',
    productType: 'all',
    collection: 'all',
    inventory: 'all',
  },
  productGridSort: 'updated-desc',
  productGridPage: 1,
  productGridPageSize: 25,
  productGridPreviewId: null,
  productGridBulkEditor: false,
  productGridHistory: null,
  mvpError: '',
};

const navigationGroups = [
  ['Workspace', [
    ['dashboard', '⌂', 'Dashboard', '/admin', 'active'],
    ['my-work', '✓', 'My Work', '/admin/my-work', 'planned'],
    ['approvals', '◎', 'Approvals', '/admin/approvals', 'planned'],
    ['activity', '↻', 'Activity', '/admin/activity', 'planned'],
  ]],
  ['Commerce', [
    ['catalog', '▦', 'Catalog', '/admin/catalog', 'active'],
    ['products', '□', 'Products', '/admin/products', 'active'],
    ['categories', '▦', 'Categories', '/admin/categories', 'planned'],
    ['collections', '◇', 'Collections', '/admin/collections', 'planned'],
    ['inventory', '▤', 'Inventory', '/admin/inventory', 'planned'],
    ['orders', '◫', 'Orders', '/admin/orders', 'planned'],
    ['customers', '♙', 'Customers', '/admin/customers', 'planned'],
    ['reviews', '☆', 'Reviews', '/admin/reviews', 'planned'],
    ['coupons', '%', 'Coupons', '/admin/coupons', 'planned'],
  ]],
  ['Growth', [
    ['marketing', '⌁', 'Marketing Center', '/admin/marketing', 'planned'],
    ['social', '◉', 'Social Media', '/admin/social', 'planned'],
    ['seo', '⌕', 'SEO Center', '/admin/seo', 'planned'],
    ['merchant', 'G', 'Google Merchant', '/admin/google-merchant', 'planned'],
    ['email', '✉', 'Email Marketing', '/admin/email-marketing', 'planned'],
    ['wholesale', 'W', 'Wholesale CRM', '/admin/wholesale', 'planned'],
  ]],
  ['AI Studio', [
    ['ai-product', '✦', 'AI Product Studio', '/admin/ai-product-studio', 'planned'],
    ['media', '▧', 'Media Library', '/admin/media-library', 'planned'],
    ['ai-settings', '⚙', 'AI Settings', '/admin/ai-settings', 'planned'],
  ]],
  ['Operations', [
    ['factory', '⌂', 'Factory Management', '/admin/factory', 'planned'],
    ['production', '◌', 'Production Tracking', '/admin/production', 'planned'],
    ['team', '♧', 'Team Management', '/admin/team', 'restricted'],
  ]],
  ['Insights', [
    ['reports', '▥', 'Reports & Analytics', '/admin/reports', 'planned'],
    ['finance', '$', 'Financial Overview', '/admin/financials', 'restricted'],
  ]],
  ['Configuration', [
    ['website', '⌘', 'Website Settings', '/admin/website-settings', 'planned'],
    ['system', '⚙', 'System Settings', '/admin/system-settings', 'planned'],
  ]],
];

const routeEntries = navigationGroups.flatMap(([, items]) => items);
routeEntries.push(['current-products', '□', 'Legacy Product Manager', '/admin/products/current', 'existing']);
routeEntries.push(['product-editor', '□', 'Product Editor v2', '/admin/product-editor/new', 'active']);
routeEntries.push(['product-detail', '□', 'Product Detail', '/admin/products/:recordKey', 'active']);
routeEntries.push(['listing-studio', '✦', 'Listing Studio', '/admin/products/:recordKey/listing-studio', 'active']);
routeEntries.push(['catalog-review', '▦', 'Catalog Review', '/admin/catalog/review', 'active']);
routeEntries.push(['catalog-detail', '▦', 'Catalog Product Detail', '/admin/catalog/:catalogProductId', 'active']);
routeEntries.push(['profile', '♙', 'My Profile', '/admin/profile', 'active']);

const moduleDetails = {
  'my-work': ['My Work', 'A focused queue for tasks assigned to the signed-in team member.', ['Assigned tasks', 'Due dates', 'Priority views'], 'Task ownership service', 'Phase 2B'],
  approvals: ['Approvals', 'Review sensitive publishing and operational decisions before they take effect.', ['Approval queue', 'Decision notes', 'Escalations'], 'Roles and approval workflow', 'Phase 2B'],
  activity: ['Activity', 'A human-readable view of administrative events across MOTOGRIP OS.', ['Event timeline', 'Actor filters', 'Entity links'], 'Audit query service', 'Phase 2B'],
  categories: ['Categories', 'Organize products into durable storefront taxonomies.', ['Category hierarchy', 'Metadata', 'Sort order'], 'Catalog taxonomy model', 'Commerce phase'],
  collections: ['Collections', 'Curate merchandising groups for campaigns and customer journeys.', ['Manual collections', 'Rules', 'Scheduling'], 'Collection rules engine', 'Commerce phase'],
  inventory: ['Inventory', 'Coordinate stock visibility without changing the current catalog source.', ['Stock overview', 'Locations', 'Alerts'], 'Inventory ledger', 'Operations phase'],
  orders: ['Orders', 'Provide a unified order-management workspace in a future commerce phase.', ['Order list', 'Fulfillment status', 'Returns links'], 'Order service and payment-safe adapters', 'Commerce phase'],
  customers: ['Customers', 'Build customer relationships with privacy-conscious profiles and history.', ['Profiles', 'Segments', 'Consent'], 'Customer data model and privacy controls', 'CRM phase'],
  reviews: ['Reviews', 'Moderate verified customer feedback and surface product insights.', ['Moderation queue', 'Product ratings', 'Responses'], 'Review verification service', 'Growth phase'],
  coupons: ['Coupons', 'Manage controlled promotional rules without discount-led positioning.', ['Codes', 'Eligibility', 'Usage limits'], 'Promotion rules engine', 'Commerce phase'],
  seo: ['SEO Center', 'Coordinate technical and editorial search quality across the catalog.', ['Issue queue', 'Metadata coverage', 'Content briefs'], 'SEO crawler and publishing approvals', 'Growth phase'],
  merchant: ['Google Merchant', 'Monitor feed readiness and Merchant Center diagnostics.', ['Feed status', 'Policy issues', 'Attribute coverage'], 'Merchant API integration', 'Growth phase'],
  email: ['Email Marketing', 'Plan consent-based lifecycle and campaign communication.', ['Campaigns', 'Automations', 'Segments'], 'Email provider and consent model', 'Growth phase'],
  wholesale: ['Wholesale CRM', 'Manage qualified B2B, OEM, private-label, and retailer opportunities.', ['Pipeline', 'Accounts', 'Quotes'], 'Wholesale account model', 'CRM phase'],
  media: ['Media Library', 'Create a governed source of product and campaign assets.', ['Asset browser', 'Usage rights', 'Variants'], 'Object storage and media metadata', 'AI Studio phase'],
  'ai-settings': ['AI Settings', 'Govern future models, prompts, brand rules, and approval boundaries.', ['Providers', 'Prompt policies', 'Usage controls'], 'AI governance and secrets service', 'AI Studio phase'],
  team: ['Team Management', 'Manage named users, roles, access, and account lifecycle.', ['Users', 'Roles', 'Access reviews'], 'Phase 2B identity and RBAC', 'Phase 2B'],
  reports: ['Reports & Analytics', 'Turn operational and commerce data into decision-ready reporting.', ['Executive overview', 'Channel performance', 'Exports'], 'Analytics warehouse', 'Insights phase'],
  finance: ['Financial Overview', 'Summarize business performance without replacing accounting controls.', ['Revenue view', 'Costs', 'Margins'], 'Approved finance integrations', 'Insights phase'],
  website: ['Website Settings', 'Control approved storefront presentation and operational preferences.', ['Brand settings', 'Navigation', 'Policies'], 'Versioned publishing service', 'Configuration phase'],
  system: ['System Settings', 'Configure MOTOGRIP OS platform-level behavior and integrations.', ['Environment status', 'Integrations', 'Data retention'], 'Platform configuration service', 'Platform phase'],
};

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
  const method = String(options.method || 'GET').toUpperCase();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(!['GET', 'HEAD', 'OPTIONS'].includes(method) && state.csrfToken ? { 'X-CSRF-Token': state.csrfToken } : {}),
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
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

function filteredMvpProducts() {
  const query = state.query.trim().toLowerCase();
  if (!query) return state.mvpProducts;
  return state.mvpProducts.filter((product) => [
    product.title,
    product.brand,
    product.productType,
    product.styleCode,
    product.sku,
    product.legacyId,
    product.governance?.label,
  ].join(' ').toLowerCase().includes(query));
}

function productGridRows() {
  const rows = state.productGrid?.products || [];
  const query = state.query.trim().toLowerCase();
  const filters = state.productGridFilters;
  const filtered = rows.filter((product) => {
    const searchable = [
      product.title, product.sku, ...(product.variantSkus || []), product.brand,
      ...(product.tags || []), product.category, ...(product.collections || []), product.handle,
    ].join(' ').toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filters.status !== 'all' && product.status !== filters.status) return false;
    if (filters.brand !== 'all' && product.brand !== filters.brand) return false;
    if (filters.productType !== 'all' && product.productType !== filters.productType) return false;
    if (filters.collection !== 'all' && !(product.collections || []).includes(filters.collection)) return false;
    if (filters.inventory === 'out' && !product.outOfStock) return false;
    if (filters.inventory === 'in' && product.outOfStock) return false;
    if (filters.inventory === 'needs-review' && product.syncStatus !== 'Needs Review') return false;
    if (filters.inventory === 'sync-error' && product.syncStatus !== 'Sync Error') return false;
    if (filters.inventory === 'missing-images' && !product.missingImages) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    const rules = {
      'newest': () => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0),
      'oldest': () => new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0),
      'price-asc': () => a.price - b.price,
      'price-desc': () => b.price - a.price,
      'inventory-asc': () => a.inventory - b.inventory,
      'inventory-desc': () => b.inventory - a.inventory,
      'title-asc': () => a.title.localeCompare(b.title),
      'title-desc': () => b.title.localeCompare(a.title),
      'updated-asc': () => new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0),
      'updated-desc': () => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0),
    };
    return (rules[state.productGridSort] || rules['updated-desc'])();
  });
}

function filteredCatalogProducts() {
  const products = state.catalog?.products || [];
  const query = state.query.trim().toLowerCase();
  if (!query) return products;
  return products.filter((product) => [
    product.title,
    product.sku,
    product.brand,
    product.productType,
    product.productStatus,
    product.syncStatus,
    product.productUrl,
    ...(product.availableSizes || []),
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
  const named = state.loginMode === 'named';
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
        <div class="button-row">
          <button class="btn ${named ? 'primary' : ''}" type="button" data-login-mode="named">Named account</button>
          <button class="btn ${!named ? 'primary' : ''}" type="button" data-login-mode="legacy">Legacy compatibility</button>
        </div>
        ${!named && !state.configured ? '<p class="pill archived">Legacy admin access is not configured. Contact the site administrator.</p>' : ''}
        ${named ? `
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" autocomplete="username" autofocus>
          </div>
        ` : ''}
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" autocomplete="current-password" ${named ? '' : 'autofocus'}>
        </div>
        ${error ? `<p class="pill archived">${escapeHtml(error)}</p>` : ''}
        <div style="height: 18px"></div>
        <button class="btn primary" type="submit" ${!named && !state.configured ? 'disabled' : ''}>Sign in</button>
      </form>
    </main>
  `;
  document.querySelectorAll('[data-login-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.loginMode = button.dataset.loginMode;
      renderLogin();
    });
  });
  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const login = await api(named ? '/api/admin/auth/named-login' : '/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          ...(named ? { email: document.getElementById('email').value } : {}),
          password: document.getElementById('password').value,
        }),
      });
      state.csrfToken = login.csrfToken;
      state.authed = true;
      state.bootstrapSkipped = false;
      await loadAdmin();
    } catch (err) {
      renderLogin(err.message);
    }
  });
}

function renderBootstrap(error = '', success = false) {
  root.innerHTML = `
    <main class="login-shell">
      <form class="login-card" id="bootstrap-form">
        <div class="login-brand">
          <div class="brand-mark wide"><img src="/assets/motogrip-logo-transparent.png" alt=""></div>
          <div>
            <div class="eyebrow">Phase 2A</div>
            <h1>Named Owner account</h1>
          </div>
        </div>
        ${success ? `
          <p class="pill active">Named Owner account created successfully.</p>
          <p>Log out, then test the new email and password using Named account login. Legacy compatibility remains enabled.</p>
          <button class="btn primary" id="bootstrap-finish" type="button">Continue to admin</button>
        ` : `
          <p>Create the first named Owner account. This does not disable the legacy compatibility login.</p>
          <div class="field">
            <label for="owner-email">Owner email</label>
            <input id="owner-email" type="email" autocomplete="email" required autofocus>
          </div>
          <div class="field">
            <label for="owner-name">Display name</label>
            <input id="owner-name" type="text" autocomplete="name" maxlength="120" required>
          </div>
          <div class="field">
            <label for="owner-password">New named-account passphrase</label>
            <input id="owner-password" type="password" autocomplete="new-password" minlength="15" maxlength="128" required>
          </div>
          ${error ? `<p class="pill archived">${escapeHtml(error)}</p>` : ''}
          <div style="height: 18px"></div>
          <div class="button-row">
            <button class="btn primary" type="submit">Create named Owner</button>
            <button class="btn" id="bootstrap-skip" type="button">Continue with legacy login</button>
          </div>
        `}
      </form>
    </main>
  `;
  document.getElementById('bootstrap-skip')?.addEventListener('click', async () => {
    state.bootstrapSkipped = true;
    await loadAdmin();
  });
  document.getElementById('bootstrap-finish')?.addEventListener('click', async () => {
    state.bootstrapSkipped = true;
    await loadAdmin();
  });
  document.getElementById('bootstrap-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/api/admin/bootstrap/owner', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('owner-email').value,
          displayName: document.getElementById('owner-name').value,
          password: document.getElementById('owner-password').value,
        }),
      });
      state.identity = await api('/api/admin/me');
      renderBootstrap('', true);
    } catch (err) {
      renderBootstrap(err.message);
    }
  });
}

function statusBadge(status, label = '') {
  return `<span class="status-badge ${escapeHtml(status)}">${escapeHtml(label || status.replace('-', ' '))}</span>`;
}

function breadcrumbs() {
  if (['product-detail', 'listing-studio'].includes(state.view)) {
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a data-route="dashboard" href="/admin">MOTOGRIP OS</a><span>/</span><a data-route="products" href="/admin/products">Products</a><span>/</span><strong>${escapeHtml(state.mvpProduct?.title || 'Product Detail')}</strong></nav>`;
  }
  const route = routeEntries.find(([id]) => id === state.view);
  const group = navigationGroups.find(([, items]) => items.some(([id]) => id === state.view));
  const title = route?.[2] || 'Dashboard';
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a data-route="dashboard" href="/admin">MOTOGRIP OS</a><span>/</span>${group ? `<span>${escapeHtml(group[0])}</span><span>/</span>` : ''}<strong>${escapeHtml(title)}</strong></nav>`;
}

function Sidebar() {
  return `
    <aside class="sidebar" aria-label="Primary navigation">
      <div class="sidebar-brand">
        <div class="brand-mark wide"><img src="/assets/motogrip-logo-transparent.png" alt=""></div>
        <div class="brand-copy"><div class="eyebrow">Operating system</div><div>MOTOGRIP GEAR</div></div>
        <button class="icon-btn collapse-toggle" id="sidebar-toggle" aria-label="${state.sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar">${state.sidebarCollapsed ? '→' : '←'}</button>
      </div>
      <div class="nav-scroll">
        ${navigationGroups.map(([group, items]) => `
          <div class="nav-group">
            <div class="nav-label">${escapeHtml(group)}</div>
            ${items.map(([id, icon, label, path, status]) => `
              <a class="nav-item ${state.view === id ? 'active' : ''}" data-route="${id}" href="${path}" ${state.view === id ? 'aria-current="page"' : ''}>
                <span class="nav-icon" aria-hidden="true">${icon}</span>
                <span class="nav-copy">${escapeHtml(label)}</span>
                ${status === 'restricted' ? '<span class="nav-dot restricted" title="Restricted"></span>' : ''}
              </a>
            `).join('')}
          </div>
        `).join('')}
      </div>
      <div class="sidebar-footer">
        <strong>${escapeHtml(state.store.settings.storeName)}</strong><br>
        <span class="nav-copy">${state.productGrid?.counts?.total ?? (state.mvpProducts.length || state.store.products.length)} products · Owner workspace</span>
      </div>
    </aside>
  `;
}

function Topbar() {
  const signedIn = state.identity?.user || state.identity?.owner;
  const profileName = signedIn?.displayName || (state.actorType === 'legacy' ? 'Legacy owner' : 'Owner');
  const profileRole = state.identity?.user?.accountType === 'listing_editor'
    ? 'Listing Editor'
    : state.actorType === 'named_user' ? 'Named Owner' : 'Compatibility access';
  return `
    <header class="topbar">
      <button class="icon-btn mobile-menu" id="mobile-menu" aria-label="Open navigation">☰</button>
      <label class="search">
        <span class="sr-only">Global search</span>
        <input id="global-search" value="${escapeHtml(state.query)}" placeholder="Search MOTOGRIP OS" autocomplete="off">
      </label>
      <div class="topbar-actions">
        <button class="icon-btn" type="button" disabled title="Notifications are coming soon" aria-label="Notifications, coming soon">♢</button>
        <button class="icon-btn" type="button" disabled title="Approvals are coming soon" aria-label="Approvals, coming soon">◎</button>
        <button class="btn quick-create" type="button" disabled title="Quick create is coming soon">＋ Quick create</button>
        <button class="profile-chip" id="profile-toggle" type="button" aria-expanded="false">
          <span class="avatar">${escapeHtml(profileName.slice(0, 1).toUpperCase())}</span>
          <span class="profile-copy"><strong>${escapeHtml(profileName)}</strong><small>${escapeHtml(profileRole)}</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div class="profile-menu" id="profile-menu">
          ${state.identity?.user?.accountType === 'owner' ? '<a data-route="profile" href="/admin/profile">My Profile</a>' : ''}
          <a href="/" target="_blank" rel="noreferrer">View storefront</a>
          <button id="logout" type="button">Log out</button>
        </div>
      </div>
    </header>
  `;
}

function AdminLayout(content) {
  const owner = state.identity?.owner;
  const compatibilityWarning = state.identity?.legacyCompatibilityWarning;
  return `
    <div class="admin-shell ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      ${Sidebar()}
      <main class="main">
        ${Topbar()}
        <section class="content">
          ${breadcrumbs()}
          ${compatibilityWarning ? `<p class="pill draft">${escapeHtml(compatibilityWarning)}</p><div style="height:16px"></div>` : ''}
          ${content}
        </section>
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

function PageHeader(title, subtitle, actions = '', status = '') {
  return `
    <div class="page-head">
      <div>
        <div class="title-line"><h1>${escapeHtml(title)}</h1>${status ? statusBadge(status) : ''}</div>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="button-row">${actions}</div>
    </div>
  `;
}

function pageHead(title, subtitle, actions = '') {
  return PageHeader(title, subtitle, actions);
}

function StatCard(label, value, note, demo = false) {
  return `<article class="card metric"><div class="metric-label"><span>${escapeHtml(label)}</span>${demo ? statusBadge('demo', 'Demo') : ''}</div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
}

function QuickActionCard(title, description, route, enabled = false) {
  return `<article class="quick-action"><div class="quick-icon" aria-hidden="true">＋</div><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div><${enabled ? 'a' : 'button'} class="btn" ${enabled ? `data-route="${route}" href="${routeEntries.find(([id]) => id === route)?.[3] || '#'}"` : 'type="button" disabled'}>${enabled ? 'Open' : 'Coming soon'}</${enabled ? 'a' : 'button'}></article>`;
}

function AlertPanel(title, message, tone = 'info') {
  return `<article class="alert-panel ${tone}"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></article>`;
}

function ModuleStatusCard(title, status, note) {
  return `<article class="module-status"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(note)}</p></div>${statusBadge(status)}</article>`;
}

function EmptyState(title, description) {
  return `<div class="empty-state"><div class="empty-icon" aria-hidden="true">◇</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>`;
}

function ComingSoonPanel(title, description, dependencies, phase, status = 'planned') {
  return `<div class="card coming-soon"><div class="coming-illustration" aria-hidden="true">MG</div><div><div class="button-row">${statusBadge(status)} ${statusBadge('coming-soon', 'Coming Soon')}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><dl><div><dt>Dependency</dt><dd>${escapeHtml(dependencies)}</dd></div><div><dt>Target</dt><dd>${escapeHtml(phase)}</dd></div></dl></div></div>`;
}

function LoadingSkeleton() {
  return `<div class="loading-shell" aria-label="Loading admin"><div class="skeleton wide"></div><div class="grid stats">${Array.from({ length: 4 }, () => '<div class="skeleton card-shape"></div>').join('')}</div></div>`;
}

function renderDashboard() {
  const products = state.store.products;
  const orders = state.store.orders;
  const lowStock = products.filter((product) => Number(product.inventory) <= 5).length;
  const openOrders = orders.filter((order) => order.status !== 'fulfilled').length;
  return `
    ${PageHeader('Dashboard', 'One premium operating view for commerce, growth, AI, and factory execution.', '', 'active')}
    <div class="grid stats">
      ${StatCard('Revenue today', '—', 'Analytics connection required', true)}
      ${StatCard('Revenue this month', '—', 'Analytics connection required', true)}
      ${StatCard('Orders', String(openOrders), 'Open records in the current store')}
      ${StatCard('Products', String(products.length), 'Current catalog records')}
      ${StatCard('Low stock', String(lowStock), 'Products with five units or fewer')}
      ${StatCard('Pending approvals', '4', 'Illustrative workflow preview', true)}
      ${StatCard('AI drafts', '7', 'Illustrative studio preview', true)}
      ${StatCard('Merchant issues', '2', 'Illustrative feed preview', true)}
      ${StatCard('Social posts', '6', 'Illustrative calendar preview', true)}
      ${StatCard('Wholesale leads', '3', 'Illustrative CRM preview', true)}
      ${StatCard('Production jobs', '8', 'Illustrative factory preview', true)}
      ${StatCard('System health', 'Stable', 'Admin foundation available')}
    </div>
    <section class="dashboard-section">
      <div class="section-head"><div><h2>Quick actions</h2><p>Only the current product manager is operational in this shell.</p></div></div>
      <div class="grid quick-grid">
        ${QuickActionCard('Open product manager', 'Use the existing catalog editor without changing its behavior.', 'current-products', true)}
        ${QuickActionCard('Create AI listing', 'Start a governed product-generation workflow.', 'ai-product')}
        ${QuickActionCard('Review approvals', 'Check content and publishing decisions.', 'approvals')}
        ${QuickActionCard('Add wholesale lead', 'Capture a qualified B2B opportunity.', 'wholesale')}
      </div>
    </section>
    <div class="grid dashboard-two">
      <div class="card">
        <div class="card-head"><h2>Recent products</h2><a class="btn" data-route="products" href="/admin/products">View catalog</a></div>
        <div class="table-wrap">${productTable(products.slice(0, 5), false)}</div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Recent activity</h2>${statusBadge('existing')}</div>
        <div class="card-pad">
          ${(state.store.activity || []).slice(0, 5).map((item) => `
            <p><strong>${escapeHtml(item.message)}</strong><br><span class="muted">${new Date(item.at).toLocaleString()}</span></p>
          `).join('') || '<p>No recent catalog activity.</p>'}
        </div>
      </div>
    </div>
    <div class="grid dashboard-three">
      <div><div class="section-head"><h2>Approval queue</h2>${statusBadge('demo', 'Demo')}</div>${AlertPanel('Four items await review', 'Sample queue only. Approval actions remain disabled until roles and workflows exist.', 'warning')}</div>
      <div><div class="section-head"><h2>Business alerts</h2></div>${AlertPanel(lowStock ? `${lowStock} low-stock products` : 'Inventory looks steady', 'Calculated from the current compatible admin store.', lowStock ? 'warning' : 'success')}</div>
      <div><div class="section-head"><h2>Setup progress</h2></div><div class="card card-pad"><div class="progress-row"><span>Secure admin foundation</span><strong>Complete</strong></div><div class="progress"><span style="width:100%"></span></div><div class="progress-row"><span>MOTOGRIP OS modules</span><strong>Shell only</strong></div><div class="progress"><span style="width:18%"></span></div></div></div>
    </div>
    <section class="dashboard-section">
      <div class="section-head"><div><h2>Module status</h2><p>Clear boundaries prevent prototype screens from being mistaken for live workflows.</p></div></div>
      <div class="grid module-grid">
        ${ModuleStatusCard('Admin foundation', 'active', 'Authentication and compatible store access')}
        ${ModuleStatusCard('Product manager', 'existing', 'Current editor remains available')}
        ${ModuleStatusCard('AI & Growth', 'planned', 'Interfaces only; no integrations')}
        ${ModuleStatusCard('Factory & Finance', 'restricted', 'Requires scoped data and permissions')}
      </div>
    </section>
  `;
}

function productTable(products, interactive = true) {
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
          <tr class="${interactive ? 'clickable' : ''}" ${interactive ? `data-product="${product.id}"` : ''}>
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

function renderCurrentProductManager() {
  const products = filteredProducts();
  if (!state.selectedProductId && products[0]) state.selectedProductId = products[0].id;
  const product = productById();
  return `
    ${PageHeader('Legacy Product Manager', 'The existing catalog editor is preserved here with its original read/write behavior.', '<a class="btn" data-route="products" href="/admin/products">Back to products</a>', 'existing')}
    ${AlertPanel('Compatibility editor', 'This legacy editor is retained for compatibility. Use Product Editor v2 for new products and full variant management.', 'info')}
    <div class="grid two-col">
      <div class="card">
        <div class="card-head"><h2>Catalog</h2><span class="pill">${products.length} shown</span></div>
        <div class="table-wrap">${productTable(products)}</div>
      </div>
      ${product ? productEditor(product) : '<div class="card empty">Select a product to edit.</div>'}
    </div>
  `;
}

function FilterBar() {
  return `<div class="filter-bar"><label class="filter-search"><span class="sr-only">Filter products</span><input id="product-shell-filter" value="${escapeHtml(state.query)}" placeholder="Filter current products"></label><button class="btn" type="button" disabled>Category</button><button class="btn" type="button" disabled>Status</button><span class="filter-spacer"></span><button class="btn" type="button" disabled>Import</button><button class="btn" type="button" disabled>Export</button><button class="btn" type="button" disabled>Bulk actions</button></div>`;
}

function DataTableShell(products) {
  return `<div class="card"><div class="card-head"><div><h2>Current catalog</h2><p>${products.length} compatible product records</p></div>${statusBadge('existing')}</div><div class="table-wrap">${productTable(products, false)}</div></div>`;
}

function renderProductsShell() {
  const products = filteredProducts();
  return `
    ${PageHeader('Products', 'A scalable catalog workspace layered safely over the existing product store.', '<a class="btn" data-route="current-products" href="/admin/products/current">Legacy Product Manager</a><button class="btn primary" id="open-product-editor">Add Product</button>', 'existing')}
    ${AlertPanel('Product Editor v2 available', 'Create complete governed products with media, options, variants, inventory, SEO and Owner publishing.', 'info')}
    <div class="shell-gap"></div>
    ${FilterBar()}
    ${DataTableShell(products)}
  `;
}

function governanceBadge(governance) {
  const tone = governance?.state === 'governed'
    ? 'active'
    : governance?.state === 'not_migrated'
      ? 'planned'
      : 'restricted';
  return statusBadge(tone, governance?.label || 'Unknown');
}

function formatProductType(value = '') {
  return String(value || 'Unclassified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mvpProductRows(products) {
  if (!products.length) {
    return EmptyState('No products found', 'Adjust your search or open the Current Product Manager.');
  }
  return `
    <div class="table-wrap">
      <table class="mvp-products-table">
        <thead><tr><th>Product</th><th>Brand</th><th>Type</th><th>Governance</th><th>Inventory</th><th>Actions</th></tr></thead>
        <tbody>
          ${products.map((product) => `
            <tr class="clickable" data-mvp-product="${escapeHtml(product.recordKey)}" tabindex="0" aria-label="Open ${escapeHtml(product.title)}">
              <td><div class="resource"><div class="thumb product-thumb"><img src="${escapeHtml(product.image)}" alt=""></div><div><strong>${escapeHtml(product.title)}</strong><br><span class="muted">${escapeHtml(product.sku)}${product.legacyId ? ` · ${escapeHtml(product.legacyId)}` : ''}</span></div></div></td>
              <td>${escapeHtml(product.brand)}</td>
              <td>${escapeHtml(formatProductType(product.productType))}</td>
              <td>${governanceBadge(product.governance)}</td>
              <td>${Number(product.inventory || 0)}</td>
              <td><div class="button-row"><button class="btn compact-btn" type="button" data-edit-v2="${escapeHtml(product.legacyId || '')}" data-product-uuid="${escapeHtml(product.productUuid || '')}" data-handle="${escapeHtml(product.slug || '')}">Edit v2</button>${product.governance?.knowledgeLockValid
                ? `<button class="btn compact-btn" type="button" data-open-listing="${escapeHtml(product.recordKey)}">Listing</button>`
                : '<span class="muted">Governance required</span>'}</div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderMvpDashboard() {
  const dashboard = state.mvpDashboard;
  if (state.mvpError) {
    return `${PageHeader('Dashboard', 'Your read-only product operating view.', '', 'active')}${AlertPanel('Workspace unavailable', state.mvpError, 'warning')}`;
  }
  if (!dashboard) return LoadingSkeleton();
  const gridCounts = state.productGrid?.counts || {};
  return `
    ${PageHeader('Dashboard', 'A focused read-only view of product governance and the work that needs attention.', '<a class="btn primary" data-route="products" href="/admin/products">View products</a>', 'active')}
    <div class="pg-stats pg-dashboard-stats">
      ${[['Total products', gridCounts.total], ['Live', gridCounts.live], ['Draft', gridCounts.draft],
        ['Archived', gridCounts.archived], ['Hidden', gridCounts.hidden], ['Needs review', gridCounts.needsReview],
        ['Sync errors', gridCounts.syncErrors], ['Out of stock', gridCounts.outOfStock]]
        .map(([label, count]) => `<div class="pg-stat"><span>${label}</span><strong>${Number(count || 0)}</strong></div>`).join('')}
    </div>
    <div class="grid stats mvp-stats">
      ${StatCard('Products', String(dashboard.productCount), 'Current internal product records')}
      ${StatCard('Governed', String(dashboard.governedCount), 'Approved release and Knowledge Lock')}
      ${StatCard('Action required', String(dashboard.actionRequiredCount), 'Products not yet fully governed')}
      ${StatCard('Not migrated', String(dashboard.notMigratedCount), 'Still available through legacy compatibility')}
    </div>
    <div class="grid dashboard-two mvp-dashboard-grid">
      <section class="card">
        <div class="card-head"><div><h2>Product work queue</h2><p>Owner governance actions for current products</p></div>${statusBadge('existing', 'Live data')}</div>
        <div class="mvp-task-list">
          ${dashboard.actionQueue.length ? dashboard.actionQueue.map((item) => `
            <button class="mvp-task" type="button" data-mvp-product="${escapeHtml(item.recordKey)}">
              <span class="mvp-task-icon" aria-hidden="true">→</span>
              <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.nextAction)}</small></span>
              ${governanceBadge({ state: item.state, label: item.label })}
            </button>
          `).join('') : EmptyState('Everything is governed', 'No product-governance work is currently waiting.')}
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h2>Governance readiness</h2></div>
        <div class="card-pad governance-summary">
          <div><span>Version required</span><strong>${dashboard.versionRequiredCount}</strong></div>
          <div><span>Approval or release required</span><strong>${dashboard.releaseRequiredCount}</strong></div>
          <div><span>Knowledge Lock required</span><strong>${dashboard.knowledgeLockRequiredCount}</strong></div>
          <p class="muted">Open a product to complete its immutable Owner approval and release workflow.</p>
        </div>
      </section>
    </div>
    <section class="card">
      <div class="card-head"><div><h2>Products</h2><p>Open any product to review its identity and governance state.</p></div><a class="btn" data-route="products" href="/admin/products">View all</a></div>
      ${mvpProductRows(dashboard.recentProducts)}
    </section>
  `;
}

function renderMvpProducts() {
  if (!state.productGrid) {
    return `${PageHeader('Products', 'Professional product management for MOTOGRIP OS.', '', 'active')}${LoadingSkeleton()}`;
  }
  const products = productGridRows();
  const pageCount = Math.max(1, Math.ceil(products.length / state.productGridPageSize));
  state.productGridPage = Math.min(state.productGridPage, pageCount);
  const start = (state.productGridPage - 1) * state.productGridPageSize;
  const page = products.slice(start, start + state.productGridPageSize);
  const selected = state.productGridSelection;
  const pageSelected = page.length > 0 && page.every((product) => selected.has(product.id));
  const allFilteredSelected = products.length > 0 && products.every((product) => selected.has(product.id));
  const values = (key) => [...new Set((state.productGrid.products || [])
    .flatMap((product) => key === 'collection' ? product.collections || [] : [product[key] || ''])
    .filter(Boolean))].sort();
  const counts = state.productGrid.counts;
  const preview = state.productGrid.products.find((product) => product.id === state.productGridPreviewId);
  const owner = state.productGrid.permissions.delete;
  const canEdit = state.productGrid.permissions.edit;
  const statusTone = (value) => value === 'Live' || value === 'Synced'
    ? 'active' : value === 'Sync Error' ? 'restricted' : value === 'Archived' || value === 'Hidden' ? 'existing' : 'planned';
  const options = (items, selectedValue) => items.map((value) =>
    `<option value="${escapeHtml(value)}" ${selectedValue === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
  return `
    <div class="pg-page">
      ${PageHeader('Products', 'Manage products, variants, merchandising status, and website synchronization from one fast workspace.', '<a class="btn" data-route="current-products" href="/admin/products/current">Legacy Product Manager</a><button class="btn primary" id="open-product-editor">Add Product</button>', 'active')}
      ${canEdit ? '' : AlertPanel('Legacy compatibility access', 'Use Legacy Product Manager for compatibility editing. Named Owner or Listing Editor access is required for Product Grid mutations.', 'info')}
      <div class="pg-stats">
        ${[['Total products', counts.total, 'all'], ['Live', counts.live, 'Live'], ['Draft', counts.draft, 'Draft'],
          ['Archived', counts.archived, 'Archived'], ['Hidden', counts.hidden, 'Hidden'],
          ['Needs review', counts.needsReview, 'needs-review'], ['Sync errors', counts.syncErrors, 'sync-error'],
          ['Out of stock', counts.outOfStock, 'out']].map(([label, count, filter]) => `
            <button class="pg-stat" data-grid-stat="${filter}" type="button"><span>${label}</span><strong>${count}</strong></button>
          `).join('')}
      </div>
      <section class="card pg-card">
        <div class="pg-toolbar">
          <label class="filter-search pg-search"><span class="sr-only">Search products</span>
            <input id="product-grid-search" value="${escapeHtml(state.query)}" placeholder="Search title, SKU, variant SKU, brand, tags, collection, or handle">
          </label>
          <select class="pg-select" data-grid-filter="status" aria-label="Filter by status">
            <option value="all">All statuses</option>${options(['Live', 'Draft', 'Hidden', 'Archived'], state.productGridFilters.status)}
          </select>
          <select class="pg-select" data-grid-filter="brand" aria-label="Filter by brand">
            <option value="all">All brands</option>${options(values('brand'), state.productGridFilters.brand)}
          </select>
          <select class="pg-select" data-grid-filter="productType" aria-label="Filter by product type">
            <option value="all">All product types</option>${options(values('productType'), state.productGridFilters.productType)}
          </select>
          <select class="pg-select" data-grid-filter="collection" aria-label="Filter by collection">
            <option value="all">All collections</option>${options(values('collection'), state.productGridFilters.collection)}
          </select>
          <select class="pg-select" data-grid-filter="inventory" aria-label="Filter by product condition">
            <option value="all">All inventory</option>
            <option value="in" ${state.productGridFilters.inventory === 'in' ? 'selected' : ''}>In stock</option>
            <option value="out" ${state.productGridFilters.inventory === 'out' ? 'selected' : ''}>Out of stock</option>
            <option value="needs-review" ${state.productGridFilters.inventory === 'needs-review' ? 'selected' : ''}>Needs review</option>
            <option value="sync-error" ${state.productGridFilters.inventory === 'sync-error' ? 'selected' : ''}>Sync errors</option>
            <option value="missing-images" ${state.productGridFilters.inventory === 'missing-images' ? 'selected' : ''}>Missing images</option>
          </select>
          <select class="pg-select" id="product-grid-sort" aria-label="Sort products">
            ${[['updated-desc','Updated: newest'],['updated-asc','Updated: oldest'],['newest','Newest'],['oldest','Oldest'],
              ['title-asc','Title A–Z'],['title-desc','Title Z–A'],['price-asc','Price: low to high'],
              ['price-desc','Price: high to low'],['inventory-asc','Inventory: low to high'],
              ['inventory-desc','Inventory: high to low']].map(([value,label]) =>
                `<option value="${value}" ${state.productGridSort === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <button class="btn" id="clear-product-grid-filters" type="button">Clear</button>
        </div>
        <div class="pg-selection-tools">
          <button class="btn compact-btn" id="select-page-products" type="button">${pageSelected ? 'Clear page' : 'Select page'}</button>
          <button class="btn compact-btn" id="select-filtered-products" type="button">${allFilteredSelected ? 'Clear filtered' : `Select all ${products.length} filtered`}</button>
          <span>${selected.size} selected · ${products.length} results</span>
        </div>
        <div class="pg-table-wrap">
          <table class="pg-table">
            <thead><tr>
              <th class="pg-check"><input id="product-grid-select-page" type="checkbox" ${pageSelected ? 'checked' : ''} aria-label="Select page"></th>
              <th>Product</th><th>SKU</th><th>Status</th><th>Inventory</th><th>Variants</th><th>Price</th>
              <th>Brand</th><th>Category</th><th>Product type</th><th>Collections</th><th>Sync</th><th>Updated</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${page.map((product) => `
                <tr class="pg-row" data-grid-preview="${escapeHtml(product.id)}" tabindex="0">
                  <td class="pg-check"><input data-grid-select="${escapeHtml(product.id)}" type="checkbox" ${selected.has(product.id) ? 'checked' : ''} aria-label="Select ${escapeHtml(product.title)}"></td>
                  <td class="pg-product"><img src="${escapeHtml(product.image)}" alt=""><span><strong>${escapeHtml(product.title)}</strong><small>${escapeHtml(product.handle)}</small></span></td>
                  <td><code>${escapeHtml(product.sku || 'Missing SKU')}</code></td>
                  <td>${statusBadge(statusTone(product.status), product.status)}</td>
                  <td><strong>${product.inventory}</strong>${product.outOfStock ? '<small class="pg-warning">Out of stock</small>' : ''}</td>
                  <td>${product.variantCount}</td>
                  <td>${money(product.price)}${product.compareAtPrice > product.price ? `<small><s>${money(product.compareAtPrice)}</s></small>` : ''}</td>
                  <td>${escapeHtml(product.brand || '—')}</td>
                  <td>${escapeHtml(product.category || '—')}</td>
                  <td>${escapeHtml(product.productType || '—')}</td>
                  <td><span class="pg-clamp">${escapeHtml((product.collections || []).join(', ') || '—')}</span></td>
                  <td>${statusBadge(statusTone(product.syncStatus), product.syncStatus)}</td>
                  <td>${escapeHtml(formatTimestamp(product.lastUpdated))}</td>
                  <td>
                    <details class="pg-actions">
                      <summary aria-label="Actions for ${escapeHtml(product.title)}">•••</summary>
                      <div>
                        <button data-grid-action="preview" data-product-id="${escapeHtml(product.id)}">Preview website</button>
                        ${canEdit ? `
                          <button data-grid-action="edit" data-product-id="${escapeHtml(product.id)}">Edit</button>
                          <button data-grid-action="editor" data-product-id="${escapeHtml(product.id)}">Open Product Editor v2</button>
                          <button data-grid-action="revise" data-product-id="${escapeHtml(product.id)}">Create new revision</button>
                          <button data-grid-action="duplicate" data-product-id="${escapeHtml(product.id)}">Duplicate</button>
                          ${product.status !== 'Archived' ? `<button data-grid-action="archive" data-product-id="${escapeHtml(product.id)}">Archive</button>` : ''}
                          ${product.status !== 'Hidden' ? `<button data-grid-action="hide" data-product-id="${escapeHtml(product.id)}">Hide</button>` : ''}
                          ${['Archived','Hidden'].includes(product.status) ? `<button data-grid-action="restore" data-product-id="${escapeHtml(product.id)}">Restore</button>` : ''}
                          ${owner ? `<button class="danger-text" data-grid-action="delete" data-product-id="${escapeHtml(product.id)}">Delete</button>` : ''}
                          <button data-grid-action="activity" data-product-id="${escapeHtml(product.id)}">View activity</button>
                          <button data-grid-action="history" data-product-id="${escapeHtml(product.id)}">View history</button>
                        ` : ''}
                      </div>
                    </details>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${page.length ? '' : EmptyState('No matching products', 'Clear filters or adjust your search.')}
        </div>
        <div class="pg-pagination">
          <span>Showing ${page.length ? start + 1 : 0}–${Math.min(start + page.length, products.length)} of ${products.length}</span>
          <label>Rows <select id="product-grid-page-size">${[25,50,100].map(size => `<option ${state.productGridPageSize === size ? 'selected' : ''}>${size}</option>`).join('')}</select></label>
          <button class="btn compact-btn" id="product-grid-prev" ${state.productGridPage <= 1 ? 'disabled' : ''}>Previous</button>
          <span>Page ${state.productGridPage} of ${pageCount}</span>
          <button class="btn compact-btn" id="product-grid-next" ${state.productGridPage >= pageCount ? 'disabled' : ''}>Next</button>
        </div>
      </section>
      ${selected.size && canEdit ? `
        <div class="pg-bulk-bar">
          <strong>${selected.size} selected</strong>
          <button class="btn primary" data-grid-bulk="edit">Bulk edit</button>
          <button class="btn" data-grid-bulk="inventory">Bulk inventory</button>
          <button class="btn" data-grid-bulk="price">Bulk price</button>
          <button class="btn" data-grid-bulk="status">Bulk status</button>
          <button class="btn" data-grid-bulk="tags">Bulk tags</button>
          <button class="btn" data-grid-bulk="collections">Bulk collections</button>
          <button class="btn" data-grid-bulk-action="archive">Archive</button>
          <button class="btn" data-grid-bulk-action="hide">Hide</button>
          <button class="btn" data-grid-bulk-action="restore">Restore</button>
          ${owner ? '<button class="btn danger" data-grid-bulk-action="delete">Delete</button>' : ''}
          <button class="btn" id="product-grid-export">Export</button>
          <button class="btn" id="clear-product-grid-selection">Clear</button>
        </div>` : ''}
      ${preview ? renderProductGridPreview(preview) : ''}
      ${state.productGridBulkEditor ? renderProductGridBulkEditor() : ''}
      ${state.productGridHistory ? renderProductGridHistory(state.productGridHistory) : ''}
    </div>
  `;
}

function renderProductGridPreview(product) {
  return `<div class="pg-drawer-backdrop" data-close-grid-panel></div>
    <aside class="pg-drawer" aria-label="Product quick preview">
      <div class="pg-drawer-head"><div><span class="eyebrow">Quick preview</span><h2>${escapeHtml(product.title)}</h2></div><button class="icon-button" data-close-grid-panel aria-label="Close preview">×</button></div>
      <img class="pg-preview-image" src="${escapeHtml(product.image)}" alt="">
      <div class="pg-preview-actions">
        <button class="btn primary" data-grid-action="editor" data-product-id="${escapeHtml(product.id)}">Edit</button>
        <button class="btn" data-grid-action="preview" data-product-id="${escapeHtml(product.id)}">Preview</button>
        ${statusBadge(product.status === 'Live' ? 'active' : 'planned', product.status)}
        <button class="btn" data-grid-action="edit" data-product-id="${escapeHtml(product.id)}">Open product</button>
      </div>
      <div class="pg-preview-grid">
        <div><span>SKU</span><strong>${escapeHtml(product.sku || 'Missing SKU')}</strong></div>
        <div><span>Variants</span><strong>${product.variantCount}</strong></div>
        <div><span>Inventory</span><strong>${product.inventory}</strong></div>
        <div><span>Sync</span><strong>${escapeHtml(product.syncStatus)}</strong></div>
      </div>
      <section><h3>Variants</h3>${product.variants.length ? `<div class="pg-variant-list">${product.variants.slice(0,12).map(variant =>
        `<div><span>${escapeHtml(Object.values(variant.attributes || {}).join(' / ') || 'Default')}</span><code>${escapeHtml(variant.sku || 'Pending SKU')}</code><strong>${variant.quantity}</strong></div>`).join('')}</div>` : '<p class="muted">No variant details available.</p>'}</section>
      <section><h3>SEO</h3><p><strong>${escapeHtml(product.seo.title || 'SEO title not set')}</strong></p><p class="muted">${escapeHtml(product.seo.metaDescription || 'Meta description not set')}</p></section>
      <section><h3>Activity</h3><p>${product.activityCount} recorded Product Editor events.</p></section>
      <section><h3>Recent drafts</h3>${product.recentDrafts?.length
        ? product.recentDrafts.map((draft) => `<div class="pg-draft"><strong>Draft ${escapeHtml(draft.version || '—')}</strong><span>${escapeHtml(draft.approvalState)}</span><small>${escapeHtml(formatTimestamp(draft.createdAt))}</small></div>`).join('')
        : `<p class="muted">${escapeHtml(product.reviewStatus || 'No active review')}</p>`}</section>
    </aside>`;
}

function renderProductGridBulkEditor() {
  return `<div class="pg-modal-backdrop" data-close-grid-panel>
    <form class="pg-modal" id="product-grid-bulk-form">
      <div class="pg-drawer-head"><div><span class="eyebrow">Spreadsheet-style bulk editor</span><h2>Edit ${state.productGridSelection.size} products</h2></div><button class="icon-button" type="button" data-close-grid-panel>×</button></div>
      <p class="muted">Only completed fields are applied. Product SKU, variant SKU, Product Identity, governance, and publishing remain locked.</p>
      <div class="pg-bulk-grid">
        <label>Price<input name="price" type="number" min="0" step="0.01"></label>
        <label>Compare price<input name="compareAtPrice" type="number" min="0" step="0.01"></label>
        <label>Inventory per variant<input name="variantInventory" type="number" min="0" step="1"></label>
        <label>Variant price<input name="variantPrice" type="number" min="0" step="0.01"></label>
        <label>Status<select name="status"><option value="">No change</option><option>draft</option><option>active</option><option>hidden</option><option>archived</option></select></label>
        <label>Brand<input name="brand"></label>
        <label>Category<input name="category"></label>
        <label>Product type<input name="productType"></label>
        <label>Collections<input name="collections" placeholder="Comma separated"></label>
        <label>Tags<input name="tags" placeholder="Comma separated"></label>
        <label>Weight<input name="weight" type="number" min="0" step="0.01"></label>
        <label>Processing time<input name="processingTime"></label>
      </div>
      <div class="pg-locked-row"><span>Product SKU</span><code>Locked by Product Identity Engine</code></div>
      <div class="button-row end"><button class="btn" type="button" data-close-grid-panel>Cancel</button><button class="btn primary" type="submit">Apply changes</button></div>
    </form>
  </div>`;
}

function renderProductGridHistory(history) {
  return `<div class="pg-modal-backdrop" data-close-grid-panel>
    <section class="pg-modal pg-history">
      <div class="pg-drawer-head"><div><span class="eyebrow">Activity and history</span><h2>${escapeHtml(history.product.title)}</h2></div><button class="icon-button" data-close-grid-panel>×</button></div>
      ${history.events.length ? history.events.map(event => `<article><span>${escapeHtml(formatTimestamp(event.timestamp))}</span><strong>${escapeHtml(event.action.replaceAll('_',' '))}</strong><small>${escapeHtml(event.actorRole || 'system')} · revision ${event.newRevision ?? '—'}</small></article>`).join('') : EmptyState('No activity yet', 'Product events will appear here.')}
    </section>
  </div>`;
}

function catalogImage(value = '') {
  const source = String(value || 'assets/generated/leather-detail.png');
  return source.startsWith('/') ? source : `/${source}`;
}

function formatTimestamp(value) {
  if (!value) return 'Not synced';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function catalogStatusBadge(status) {
  const tone = status === 'Linked'
    ? 'active'
    : ['Import Error', 'Conflict'].includes(status)
      ? 'restricted'
      : status === 'Ignored'
        ? 'existing'
      : 'planned';
  return statusBadge(tone, status);
}

function renderCatalogVariants(product) {
  if (!product.variants.length) return '<span class="muted">No variant quantities</span>';
  return `
    <details class="catalog-variants">
      <summary>${product.variantCount} variants</summary>
      <div>
        ${product.variants.map((variant) => `
          <span><strong>${escapeHtml(variant.value)}</strong><small>${Number(variant.quantity)} available</small></span>
        `).join('')}
      </div>
    </details>
  `;
}

function renderCatalog() {
  const catalog = state.catalog;
  if (state.catalogError) {
    return `${PageHeader('Catalog', 'Read-only website catalog synchronization.', '', 'active')}${AlertPanel('Catalog unavailable', state.catalogError, 'warning')}`;
  }
  if (!catalog) return LoadingSkeleton();
  const products = filteredCatalogProducts();
  return `
    ${PageHeader(
      'Catalog',
      'A read-only identity and inventory projection of the products currently displayed by the MOTOGRIP website.',
      `<a class="btn" data-route="catalog-review" href="/admin/catalog/review">Review queue</a><button class="btn primary" id="catalog-sync" type="button" ${state.catalogSyncing ? 'disabled' : ''}>${state.catalogSyncing ? 'Syncing…' : 'Sync website catalog'}</button>`,
      'active',
    )}
    ${AlertPanel('Read-only connection', 'Sync reads the existing website catalog and updates only MOTOGRIP OS catalog metadata. It cannot edit, publish, archive, price, or overwrite a website product.', 'info')}
    <div class="grid stats catalog-stats">
      ${StatCard('Products', String(catalog.productCount), 'Unique website products')}
      ${StatCard('Variants', String(catalog.variantCount), 'Size-level quantity records')}
      ${StatCard('Total inventory', String(catalog.totalInventory), 'Website inventory projection')}
      ${StatCard('Needs review', String(catalog.needsReviewCount), 'Identity or data checks')}
    </div>
    <section class="card catalog-summary">
      <div>
        <span class="eyebrow">Last sync</span>
        <strong>${escapeHtml(formatTimestamp(catalog.lastSyncAt))}</strong>
      </div>
      <div>
        <span class="eyebrow">Connection</span>
        <strong>Website → Dashboard</strong>
      </div>
      <div>
        <span class="eyebrow">Mode</span>
        <strong>Read only</strong>
      </div>
      <div>
        <span class="eyebrow">Store revision</span>
        <strong>${Number(catalog.storeRevision)}</strong>
      </div>
    </section>
    <div class="filter-bar catalog-filter">
      <label class="filter-search"><span class="sr-only">Search catalog</span><input id="catalog-filter" value="${escapeHtml(state.query)}" placeholder="Search title, SKU, brand, type, size, or sync status"></label>
      <span class="filter-spacer"></span>
      <span class="muted">${products.length} of ${catalog.importedProductCount || catalog.productCount} imported products</span>
    </div>
    <section class="card catalog-table-card">
      <div class="table-wrap">
        <table class="catalog-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU / identity</th>
              <th>Type</th>
              <th>Price</th>
              <th>Variants & sizes</th>
              <th>Inventory</th>
              <th>Status</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((product) => `
              <tr class="catalog-row" data-catalog-product="${escapeHtml(product.catalogProductId)}" tabindex="0">
                <td data-label="Product">
                  <div class="resource catalog-product">
                    <div class="thumb catalog-thumb"><img src="${escapeHtml(catalogImage(product.image))}" alt=""></div>
                    <div>
                      <strong>${escapeHtml(product.title)}</strong>
                      <small>${escapeHtml(product.brand)}</small>
                      ${product.productUrl ? `<a href="${escapeHtml(product.productUrl)}" target="_blank" rel="noreferrer">View website product ↗</a>` : '<span class="muted">Website URL unavailable</span>'}
                    </div>
                  </div>
                </td>
                <td data-label="SKU / identity">
                  <strong class="mono">${escapeHtml(product.sku || 'Missing SKU')}</strong>
                  <small class="catalog-id mono">${escapeHtml(product.catalogProductId)}</small>
                </td>
                <td data-label="Type">${escapeHtml(formatProductType(product.productType))}</td>
                <td data-label="Price">${money(product.price)}</td>
                <td data-label="Variants & sizes">
                  ${renderCatalogVariants(product)}
                  <small>${escapeHtml(product.availableSizes.join(', ') || 'No available sizes')}</small>
                </td>
                <td data-label="Inventory"><strong>${Number(product.totalInventory)}</strong></td>
                <td data-label="Status">
                  <div class="catalog-statuses">
                    ${statusBadge(product.productStatus === 'active' ? 'active' : 'planned', product.productStatus)}
                    ${catalogStatusBadge(product.syncStatus)}
                  </div>
                  ${product.reviewReason ? `<small class="catalog-review">${escapeHtml(product.reviewReason)}</small>` : ''}
                </td>
                <td data-label="Last updated">${escapeHtml(formatTimestamp(product.lastUpdated))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${products.length ? '' : EmptyState('No catalog products found', 'Adjust the search or run a manual website sync.')}
    </section>
  `;
}

function catalogReviewProducts() {
  const products = filteredCatalogProducts();
  const filter = state.catalogReviewFilter;
  if (filter === 'all') {
    return products.filter((product) => ['Needs Review', 'Conflict', 'Import Error'].includes(product.linkStatus));
  }
  if (filter === 'unlinked') return products.filter((product) => product.linkStatus === 'Needs Review');
  return products.filter((product) => product.linkStatus === filter);
}

function renderCatalogReview() {
  if (!state.catalog) return LoadingSkeleton();
  const products = catalogReviewProducts();
  return `
    ${PageHeader(
      'Catalog Review',
      'Owner-controlled matching between read-only website identities and governed Product DNA.',
      '<a class="btn" data-route="catalog" href="/admin/catalog">Back to Catalog</a>',
      'active',
    )}
    ${AlertPanel('Owner confirmation required', 'Suggestions never create trusted links automatically. Title similarity is advisory only, and website records remain unchanged.', 'info')}
    <div class="grid stats catalog-stats">
      ${StatCard('Review queue', String(state.catalog.needsReviewCount), 'Needs review, conflicts, and errors')}
      ${StatCard('Linked', String(state.catalog.linkedCount || 0), 'Owner-confirmed Product DNA links')}
      ${StatCard('Ignored', String(state.catalog.ignoredProductCount || 0), 'Excluded from website metrics')}
      ${StatCard('Imported', String(state.catalog.importedProductCount || state.catalog.products.length), 'All persistent Catalog records')}
    </div>
    <div class="filter-bar catalog-filter">
      <label class="filter-search"><span class="sr-only">Search review queue</span><input id="catalog-filter" value="${escapeHtml(state.query)}" placeholder="Search title, SKU, Catalog ID, or review reason"></label>
      <select id="catalog-review-filter" aria-label="Catalog review status">
        ${[
          ['all', 'Open review items'],
          ['unlinked', 'Unlinked Product DNA'],
          ['Conflict', 'Conflicts'],
          ['Import Error', 'Import errors'],
          ['Ignored', 'Ignored'],
          ['Linked', 'Linked'],
        ].map(([value, label]) => `<option value="${value}" ${state.catalogReviewFilter === value ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
      <span class="filter-spacer"></span>
      <span class="muted">${products.length} product(s)</span>
    </div>
    <section class="catalog-review-grid">
      ${products.map((product) => {
        const suggestion = product.suggestedProductDnaMatch;
        return `<article class="card catalog-review-card" data-catalog-product="${escapeHtml(product.catalogProductId)}" tabindex="0">
          <div class="catalog-review-product">
            <div class="thumb catalog-review-thumb"><img src="${escapeHtml(catalogImage(product.image))}" alt=""></div>
            <div>
              <div class="button-row">${catalogStatusBadge(product.linkStatus)} ${statusBadge(product.productStatus === 'active' ? 'active' : 'planned', product.productStatus)}</div>
              <h2>${escapeHtml(product.title)}</h2>
              <p>${escapeHtml(product.brand)} · ${escapeHtml(formatProductType(product.productType))}</p>
              <span class="mono">${escapeHtml(product.sku || 'Missing SKU')}</span>
            </div>
          </div>
          <dl class="catalog-review-facts">
            ${definitionRow('Catalog ID', product.catalogProductId, true)}
            ${definitionRow('Website identifier', product.source?.sourceId || 'Unavailable', true)}
            ${definitionRow('Price', money(product.price))}
            ${definitionRow('Sizes', product.availableSizes.join(', ') || 'None')}
            ${definitionRow('Variants', String(product.variantCount))}
            ${definitionRow('Inventory', String(product.totalInventory))}
          </dl>
          <div class="match-suggestion ${suggestion ? '' : 'empty'}">
            <span class="eyebrow">Suggested Product DNA</span>
            ${suggestion ? `
              <strong>${escapeHtml(suggestion.productDna?.displayName || suggestion.productUuid)}</strong>
              <p>${escapeHtml(suggestion.reason)}</p>
              <div><span class="confidence-meter"><i style="width:${Number(suggestion.confidence)}%"></i></span><b>${Number(suggestion.confidence)}% confidence</b></div>
            ` : '<strong>No safe suggestion</strong><p>Search Product DNA records manually or leave this product unlinked.</p>'}
          </div>
          <div class="catalog-review-reason"><strong>Review reason</strong><p>${escapeHtml(product.reviewReason || 'Owner review required.')}</p></div>
          <button class="btn primary" type="button" data-open-catalog-product="${escapeHtml(product.catalogProductId)}">Review product</button>
        </article>`;
      }).join('') || EmptyState('Review queue is clear', 'No products match the selected review status.')}
    </section>
  `;
}

function linkedMvpProduct(product) {
  return product?.productUuid
    ? state.mvpProducts.find((item) => item.productUuid === product.productUuid) || null
    : null;
}

function renderCatalogProductDetail() {
  const product = state.catalogProduct;
  if (!product) {
    return `${PageHeader('Catalog Product', 'Loading read-only website identity.', '<a class="btn" data-route="catalog-review" href="/admin/catalog/review">Back to review</a>')}${state.catalogError ? AlertPanel('Product unavailable', state.catalogError, 'warning') : LoadingSkeleton()}`;
  }
  const mvpProduct = linkedMvpProduct(product);
  const eligible = Boolean(mvpProduct?.governance?.knowledgeLockValid &&
    ['approved', 'active'].includes(mvpProduct?.governance?.releaseState));
  const dna = product.linkedProductDna;
  const suggestions = product.suggestions || [];
  const actions = `<a class="btn" data-route="catalog-review" href="/admin/catalog/review">Back to review</a>
    ${mvpProduct ? `<button class="btn" type="button" id="open-linked-product-dna">Open Product DNA</button>` : ''}
    ${eligible ? '<button class="btn primary" type="button" id="open-linked-listing-studio">Create / Continue Listing</button>' : ''}`;
  return `
    ${PageHeader('Catalog Product Detail', 'Review and confirm the relationship to governed Product DNA.', actions, product.linkStatus === 'Linked' ? 'active' : 'planned')}
    <section class="product-summary card catalog-detail-summary">
      <div class="product-summary-media"><img src="${escapeHtml(catalogImage(product.image))}" alt="${escapeHtml(product.title)}"></div>
      <div class="product-summary-main">
        <div class="button-row">${catalogStatusBadge(product.linkStatus)} ${statusBadge(product.productStatus === 'active' ? 'active' : 'planned', product.productStatus)}</div>
        <h1>${escapeHtml(product.title)}</h1>
        <p>${escapeHtml(product.brand)} · ${escapeHtml(formatProductType(product.productType))}</p>
        <div class="product-summary-meta">
          <span><small>SKU</small><strong>${escapeHtml(product.sku || 'Missing')}</strong></span>
          <span><small>Variants</small><strong>${Number(product.variantCount)}</strong></span>
          <span><small>Inventory</small><strong>${Number(product.totalInventory)}</strong></span>
          <span><small>Price</small><strong>${money(product.price)}</strong></span>
        </div>
      </div>
      <div class="product-summary-actions">${product.productUrl ? `<a class="btn" href="${escapeHtml(product.productUrl)}" target="_blank" rel="noreferrer">View website product</a>` : ''}</div>
    </section>
    <div class="catalog-detail-grid">
      <section class="card">
        <div class="card-head"><div><h2>Catalog identity</h2><p>Stable read-only website projection</p></div>${statusBadge('existing', 'Read only')}</div>
        <dl class="definition-grid compact">
          ${definitionRow('Catalog ID', product.catalogProductId, true)}
          ${definitionRow('Website identifier', product.source?.sourceId, true)}
          ${definitionRow('Website URL', product.productUrl)}
          ${definitionRow('Available sizes', product.availableSizes.join(', ') || 'None')}
          ${definitionRow('Total inventory', String(product.totalInventory))}
          ${definitionRow('Last imported', formatTimestamp(product.importedAt))}
        </dl>
        ${renderCatalogVariants(product)}
      </section>
      <section class="card">
        <div class="card-head"><div><h2>Product DNA relationship</h2><p>Owner-confirmed PLM identity</p></div>${catalogStatusBadge(product.linkStatus)}</div>
        ${dna ? `
          <dl class="definition-grid compact">
            ${definitionRow('Product UUID', dna.productUuid, true)}
            ${definitionRow('Product DNA', dna.displayName)}
            ${definitionRow('Brand', dna.brand)}
            ${definitionRow('Product type', formatProductType(dna.productType))}
            ${definitionRow('Style code', dna.styleCode, true)}
            ${definitionRow('Match method', product.link?.matchMethod)}
            ${definitionRow('Linked at', formatTimestamp(product.link?.linkedAt))}
            ${definitionRow('Linked by', product.link?.linkedBy, true)}
          </dl>
          ${state.actorType === 'named_user' ? '<button class="btn danger-outline" id="unlink-catalog-product" type="button">Unlink Product DNA</button>' : ''}
        ` : `
          <div class="catalog-dna-search">
            <label for="catalog-dna-search">Search available Product DNA</label>
            <input id="catalog-dna-search" placeholder="Search title, SKU, style code, brand, or type">
          </div>
          <div id="catalog-dna-results" class="dna-match-list">
            ${renderDnaMatchOptions(suggestions.length ? suggestions.map((item) => ({
              ...item.productDna,
              matchMethod: item.method,
              confidence: item.confidence,
              reason: item.reason,
              suggested: true,
            })) : state.productDnaOptions)}
          </div>
          ${state.actorType === 'named_user' ? '<button class="btn" id="ignore-catalog-product" type="button">Mark as Ignored</button>' : ''}
        `}
        ${!eligible && product.linkStatus === 'Linked' ? AlertPanel('Listing Studio remains governed', 'This link does not bypass Product Version, Owner Approval, Product Release, or valid Knowledge Lock requirements.', 'warning') : ''}
      </section>
    </div>
    <section class="card catalog-audit-card">
      <div class="card-head"><div><h2>Link audit history</h2><p>Append-only Owner actions for this Catalog identity</p></div><span class="muted">${state.catalogAudit.length} event(s)</span></div>
      <div class="audit-timeline">${state.catalogAudit.map((event) => `
        <article><span>${escapeHtml(formatTimestamp(event.timestamp))}</span><strong>${escapeHtml(event.action.replaceAll('_', ' '))}</strong><small>${escapeHtml(event.actorId || 'System')} · ${escapeHtml(event.matchMethod || 'No match method')}</small></article>
      `).join('') || '<p class="muted">No link actions have been recorded.</p>'}</div>
    </section>
  `;
}

function renderDnaMatchOptions(records = []) {
  if (!records.length) return EmptyState('No Product DNA matches', 'Try another title, SKU, style code, brand, or product type.');
  return records.slice(0, 12).map((record) => `
    <article class="dna-match-option">
      <div>
        <span class="eyebrow">${record.suggested ? `Suggested · ${Number(record.confidence)}%` : 'Available Product DNA'}</span>
        <strong>${escapeHtml(record.displayName)}</strong>
        <p>${escapeHtml(record.brand)} · ${escapeHtml(formatProductType(record.productType))}</p>
        <small class="mono">${escapeHtml(record.styleCode || record.productUuid)}${record.skus?.length ? ` · ${escapeHtml(record.skus.join(', '))}` : ''}</small>
        ${record.reason ? `<small>${escapeHtml(record.reason)}</small>` : ''}
      </div>
      <div class="button-row">
        ${record.suggested ? `<button class="btn" type="button" data-reject-dna="${escapeHtml(record.productUuid)}">Reject</button>` : ''}
        <button class="btn primary" type="button" data-link-dna="${escapeHtml(record.productUuid)}" data-match-method="${escapeHtml(record.matchMethod || 'manual')}">Confirm link</button>
      </div>
    </article>
  `).join('');
}

function definitionRow(label, value, mono = false) {
  return `<div><dt>${escapeHtml(label)}</dt><dd class="${mono ? 'mono' : ''}">${escapeHtml(value || 'Not assigned')}</dd></div>`;
}

function governanceStep(label, complete, value) {
  const status = complete ? 'complete' : 'required';
  return `<li class="${status}"><span class="governance-step-icon" aria-hidden="true">${complete ? '✓' : '!'}</span><div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(value)}</small></div><span class="step-status">${complete ? 'Complete' : 'Required'}</span></li>`;
}

function renderMvpProductDetail() {
  const product = state.mvpProduct;
  if (!product) {
    return `${PageHeader('Product Detail', 'Read-only governed product view.', '<a class="btn" data-route="products" href="/admin/products">Back to products</a>')}${state.mvpError ? AlertPanel('Product unavailable', state.mvpError, 'warning') : LoadingSkeleton()}`;
  }
  const governance = product.governance;
  const actions = `<a class="btn" data-route="current-products" href="/admin/products/current">Current Product Manager</a>${governance.knowledgeLockValid ? `<button class="btn primary" type="button" id="open-listing-studio">Create / Continue Listing</button>` : ''}`;
  const productTabs = [
    ['overview', 'Overview'], ['media', 'Media'], ['dna', 'Product DNA'],
    ['evidence', 'Evidence'], ['versions', 'Versions'], ['releases', 'Releases'],
    ['ai-studio', 'AI Studio'], ['listings', 'Listings'], ['history', 'History'],
  ];
  const activeTab = state.productDetailTab || 'overview';
  const tabContent = activeTab === 'overview'
    ? renderProductOverview(product)
    : activeTab === 'media'
      ? renderProductMedia(product)
      : activeTab === 'dna'
        ? renderProductDna(product)
        : renderProductPlannedTab(product, activeTab);
  return `
    ${PageHeader('Product Detail', 'Governed product workspace', actions, governance.state === 'governed' ? 'active' : 'existing')}
    <section class="product-summary card">
      <div class="product-summary-media"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}"></div>
      <div class="product-summary-main">
        <div class="button-row">${governanceBadge(governance)} ${statusBadge(product.source === 'plm_linked' ? 'active' : 'planned', product.source === 'plm_linked' ? 'PLM linked' : 'Legacy source')}</div>
        <h1>${escapeHtml(product.title)}</h1>
        <p>${escapeHtml(product.brand)} · ${escapeHtml(formatProductType(product.productType))}</p>
        <div class="product-summary-meta">
          <span><small>SKU</small><strong>${escapeHtml(product.sku)}</strong></span>
          <span><small>Style</small><strong>${escapeHtml(product.styleCode)}</strong></span>
          <span><small>Inventory</small><strong>${Number(product.inventory || 0)}</strong></span>
          <span><small>Price</small><strong>${money(product.price)}</strong></span>
        </div>
      </div>
      <div class="product-summary-actions">
        ${product.storefrontPath ? `<a class="btn" href="${escapeHtml(product.storefrontPath)}" target="_blank" rel="noreferrer">View storefront</a>` : ''}
      </div>
    </section>
    <nav class="workspace-tabs" aria-label="Product sections">
      ${productTabs.map(([id, label]) => `<button type="button" class="workspace-tab ${activeTab === id ? 'active' : ''}" data-product-tab="${id}" aria-selected="${activeTab === id}">${label}</button>`).join('')}
    </nav>
    <div class="product-tab-content">${tabContent}</div>
    <div class="sticky-action-bar">
      <div><strong>${escapeHtml(governance.nextAction)}</strong><span>Governance steps remain sequential and immutable.</span></div>
      ${renderGovernancePrimaryButton(product)}
    </div>
  `;
}

function renderProductOverview(product) {
  const governance = product.governance;
  const managed = state.productIdentityWorkspace?.identity;
  const eligible = governance.knowledgeLockValid && ['approved', 'active'].includes(governance.releaseState);
  return `
    <div class="product-workspace-grid">
      <section class="card">
        <div class="card-head"><div><h2>Product Identity Engine</h2><p>Durable commerce and factory identifiers</p></div>${statusBadge(managed?.state === 'locked' ? 'active' : 'existing', managed?.state || 'Not generated')}</div>
        <dl class="definition-grid compact">
          ${definitionRow('Product UUID', product.productUuid || 'Not migrated', true)}
          ${definitionRow('Product SKU', managed?.productSku || product.sku || 'Missing SKU', true)}
          ${definitionRow('Internal Product Code', managed?.internalProductCode || 'Generated after Owner action', true)}
          ${definitionRow('Factory Code', managed?.factoryCode || 'Generated after Owner action', true)}
          ${definitionRow('Variant SKUs', String(managed?.variantSkus?.length || 0))}
          ${definitionRow('Barcode ID', managed?.barcodeId || 'Reserved')}
          ${definitionRow('QR ID', managed?.qrId || 'Reserved')}
        </dl>
        <div class="card-pad identity-actions">
          ${!managed ? '<button class="btn primary" id="generate-product-identity" type="button">Generate identity preview</button>' : ''}
          ${managed?.state === 'preview' ? '<button class="btn primary" id="approve-product-identity" type="button">Approve identity</button>' : ''}
          ${managed?.state === 'approved' ? '<button class="btn primary" id="lock-product-identity" type="button">Lock identity</button>' : ''}
          ${managed?.state === 'locked' ? '<button class="btn" id="unlock-product-identity" type="button">Owner unlock</button>' : ''}
          ${managed && managed.state !== 'locked' ? '<button class="btn" id="override-product-sku" type="button">Modify SKU</button>' : ''}
        </div>
      </section>
      <aside class="card governance-card">
        <div class="card-head"><div><h2>Governance checklist</h2><p>Trusted product readiness</p></div></div>
        <ol class="governance-checklist">
          ${governanceStep('Product Identity', Boolean(product.productUuid), product.productUuid ? 'Durable UUID assigned' : 'PLM identity required')}
          ${governanceStep('Product Hierarchy', product.family !== 'Not assigned' && product.styleCode !== 'Not assigned', `${product.family} · ${product.styleCode}`)}
          ${governanceStep('Product Version', governance.versionCount > 0, governance.latestVersionNumber ? `Version ${governance.latestVersionNumber}` : 'Immutable version required')}
          ${governanceStep('Owner Approval', Boolean(state.governance?.latestApprovalDecision), state.governance?.latestApprovalDecision ? 'Approved by Named Owner' : 'Owner decision required')}
          ${governanceStep('Product Release', ['approved', 'active'].includes(governance.releaseState), governance.latestReleaseNumber ? `Release ${governance.latestReleaseNumber} · ${governance.releaseState}` : 'Approved release required')}
          ${governanceStep('Knowledge Lock', governance.knowledgeLockValid, governance.knowledgeLockValid ? 'Valid integrity lock' : 'Knowledge Lock required')}
          ${governanceStep('Listing Studio Eligibility', eligible, eligible ? 'Valid — trusted release available' : 'Blocked until governance is complete')}
        </ol>
        ${renderGovernanceAction(product)}
      </aside>
    </div>
  `;
}

function renderProductMedia(product) {
  return `<section class="card"><div class="card-head"><div><h2>Media</h2><p>Original governed media references</p></div><span class="muted">${product.originalMediaReferences.length} reference(s)</span></div><div class="media-reference-grid">${product.originalMediaReferences.length ? product.originalMediaReferences.map((media) => `
    <article><span class="media-reference-icon" aria-hidden="true">▧</span><div><strong>${escapeHtml(media.role || 'Source media')}</strong><p>${escapeHtml(media.reference || 'Reference unavailable')}</p><small>${escapeHtml(media.sourceSystem || 'PLM')}</small></div></article>`).join('') : EmptyState('No governed media references', 'Existing legacy imagery remains available without being copied into PLM.')}</div></section>`;
}

function renderProductDna(product) {
  return `<section class="card"><div class="card-head"><div><h2>Product DNA</h2><p>Durable product identity projection</p></div>${statusBadge(product.productUuid ? 'active' : 'restricted', product.productUuid ? 'Available' : 'Blocked')}</div><dl class="definition-grid">${definitionRow('Product UUID', product.productUuid || 'Required', true)}${definitionRow('Brand', product.brand)}${definitionRow('Product family', product.family)}${definitionRow('Style code', product.styleCode, true)}${definitionRow('Versions', String(product.governance.versionCount))}${definitionRow('Approved releases', String(product.governance.releaseCount))}</dl></section>`;
}

function renderProductPlannedTab(product, tab) {
  const labels = {
    evidence: ['Evidence', 'No governed evidence is attached yet. Missing evidence remains visible in Listing Studio.'],
    versions: ['Versions', product.governance.versionCount ? `Latest immutable version: Version ${product.governance.latestVersionNumber}.` : 'No Product Version exists yet.'],
    releases: ['Releases', product.governance.latestReleaseNumber ? `Latest release: Release ${product.governance.latestReleaseNumber} · ${product.governance.releaseState}.` : 'No Product Release exists yet.'],
    'ai-studio': ['AI Studio', product.governance.knowledgeLockValid ? 'This product is eligible for trusted Listing Studio generation.' : 'Complete governance before entering Listing Studio.'],
    listings: ['Listings', product.governance.knowledgeLockValid ? 'Open Listing Studio to review immutable listing drafts.' : 'No trusted listing drafts are available yet.'],
    history: ['History', 'Immutable PLM history is recorded. A dedicated human-readable history view is planned.'],
  };
  const [title, description] = labels[tab] || ['Planned', 'This view is safely reserved for a later phase.'];
  const listingLabel = tab === 'listings' ? 'View Existing Drafts' : 'Create Listing';
  return `<section class="card planned-tab-panel">${EmptyState(title, description)}${['ai-studio', 'listings'].includes(tab) && product.governance.knowledgeLockValid ? `<button class="btn primary" type="button" id="open-listing-studio">${listingLabel}</button>` : ''}</section>`;
}

function renderGovernancePrimaryButton(product) {
  const governance = state.governance || {};
  if (state.actorType !== 'named_user') return '<button class="btn primary" disabled>Named Owner required</button>';
  if (governance.knowledgeLock) return '<button class="btn primary" type="button" id="open-listing-studio">Open Listing Studio</button>';
  if (governance.latestRelease) return '<button class="btn primary" type="button" id="create-knowledge-lock">Create Knowledge Lock</button>';
  if (governance.latestApprovalDecision) return '<button class="btn primary" type="button" id="create-release">Create Release</button>';
  if (governance.latestApprovalRequest) return '<button class="btn primary" type="button" id="approve-version">Approve</button>';
  if (governance.latestVersion) return '<button class="btn primary" type="button" id="request-approval">Create Approval Request</button>';
  return `<button class="btn primary" type="button" id="create-version">${product.productUuid ? 'Create Product Version' : 'Create identity & Product Version'}</button>`;
}

function renderGovernanceAction(product) {
  const governance = state.governance || {};
  if (state.actorType !== 'named_user') {
    return '<div class="card-pad governance-note"><strong>Named Owner required</strong><p>Legacy compatibility login remains read-only for governed operations.</p></div>';
  }
  let id = 'create-version';
  let label = product.productUuid ? 'Create Product Version' : 'Create identity & Product Version';
  if (governance.latestVersion && !governance.latestApprovalRequest) {
    id = 'request-approval'; label = 'Request Owner Approval';
  } else if (governance.latestApprovalRequest && !governance.latestApprovalDecision) {
    id = 'approve-version'; label = 'Approve Product Version';
  } else if (governance.latestApprovalDecision && !governance.latestRelease) {
    id = 'create-release'; label = 'Create Approved Release';
  } else if (governance.latestRelease && !governance.knowledgeLock) {
    id = 'create-knowledge-lock'; label = 'Create Knowledge Lock';
  } else if (governance.knowledgeLock) {
    return '<div class="card-pad governance-note success-note"><strong>Trusted knowledge ready</strong><p>This active release has a valid Knowledge Lock and may enter Listing Studio.</p></div>';
  }
  return `<div class="card-pad governance-note"><strong>Next governed action</strong><p>Each step is immutable and recorded in Product history.</p><button class="btn primary" type="button" id="${id}">${label}</button></div>`;
}

function listingText(section, content) {
  if (content?.manualText) return content.manualText;
  if (section === 'seo') {
    return `SEO Title\n${content.title}\n\nMeta Description\n${content.metaDescription}\n\nKeywords\n${content.keywords.join(', ')}\n\nTags\n${content.tags.join(', ')}`;
  }
  if (section === 'faq') {
    return content.map((item) => `${item.question}\n${item.answer}`).join('\n\n');
  }
  if (section === 'buyingGuide') return content;
  if (section === 'shopify') {
    return [
      content.title, content.shortDescription, content.fullDescription,
      `Perfect For\n${content.perfectFor}`, `Why You’ll Love It\n${content.whyYouWillLoveIt}`,
      `URL handle: ${content.urlHandle}`, `Tags: ${(content.tags || []).join(', ')}`,
    ].filter(Boolean).join('\n\n');
  }
  if (section === 'ebay' || section === 'etsy') {
    return [
      content.title, content.shortDescription, content.fullDescription,
      content.perfectFor && `Perfect For\n${content.perfectFor}`,
      content.whyYouWillLoveIt && `Why You’ll Love It\n${content.whyYouWillLoveIt}`,
      content.personalizationInstructions && `Personalization\n${content.personalizationInstructions}`,
      content.tags && `Tags\n${content.tags.join(', ')}`,
    ].filter(Boolean).join('\n\n');
  }
  return `${content.title || ''}\n\n${content.description || content.fullDescription || ''}`;
}

function qualityLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  return 'Needs Improvement';
}

function listingField(label, value, limit = null, warning = '') {
  const text = Array.isArray(value) ? value.join(', ') : String(value || '');
  return `<div class="listing-field">
    <div class="listing-field-head"><label>${escapeHtml(label)}</label>${limit ? `<span class="${text.length > limit ? 'over-limit' : ''}">${text.length}/${limit}</span>` : ''}</div>
    <div class="listing-field-value">${escapeHtml(text)}</div>
    ${warning ? `<p class="field-warning">${escapeHtml(warning)}</p>` : ''}
  </div>`;
}

function renderListingChannel(section, draft) {
  const content = draft.content[section];
  const warnings = draft.warnings.filter((item) => item.missing);
  const warningText = warnings.length
    ? `${warnings.length} product-information warning${warnings.length === 1 ? '' : 's'} remain.`
    : '';
  const value = listingText(section, content);
  const limit = section === 'ebay' ? 80 : section === 'etsy' ? 140 : section === 'seo' ? 160 : null;
  return `
    ${section === 'ebay' || section === 'etsy' ? listingField('Marketplace title', content.title, limit, warningText) : ''}
    ${section === 'seo' ? `${listingField('SEO title', content.title, 60)}${listingField('Meta description', content.metaDescription, 160)}` : ''}
    <div class="listing-field listing-edit-field">
      <div class="listing-field-head"><label for="listing-content-editor">Editable ${escapeHtml(section === 'buyingGuide' ? 'buying guide' : section)} package</label><span>${value.length} characters</span></div>
      <textarea id="listing-content-editor" rows="18" data-listing-content-editor>${escapeHtml(value)}</textarea>
      <p class="field-warning">${escapeHtml(warningText || 'Edits are saved as a new immutable draft version.')}</p>
    </div>`;
}

const listingInputGroups = [
  ['Core identity', ['productTitle', 'productType', 'brand', 'sku', 'leatherType', 'leatherColor', 'gender', 'style', 'fit', 'condition']],
  ['Construction', ['outerMaterial', 'liningMaterial', 'closure', 'hardware', 'pocketCount', 'insidePockets', 'concealedCarryPockets', 'stitching', 'collar', 'sleeves', 'adjustments', 'armorCompatibility']],
  ['Commerce', ['price', 'availableSizes', 'customSizingAvailable', 'quantity', 'processingTime', 'shippingTime', 'returns', 'personalization', 'targetMarket']],
  ['Measurements', ['sizeRange', 'productLength', 'chestWaistMeasurements', 'customMeasurementInstructions']],
  ['References', ['imageReferenceIds', 'evidenceReferenceIds']],
];

function inputFieldLabel(field) {
  return field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderListingInputWorkspace(workspace) {
  const input = workspace.inputDraft || { values: {}, notApplicable: {}, inputVersion: 0 };
  const missing = workspace.missingInformation || [];
  return `<section class="card listing-input-workspace">
    <div class="card-head">
      <div><span class="eyebrow">Listing Input Draft ${input.inputVersion || 0}</span><h2>Real product information</h2><p>Complete factual listing information without changing the website product or Product DNA.</p></div>
      <button class="btn primary" id="save-listing-input" type="button">Save progress</button>
    </div>
    <div class="listing-input-groups">${listingInputGroups.map(([group, fields]) => `
      <details class="listing-input-group" ${group === 'Core identity' || group === 'Commerce' ? 'open' : ''}>
        <summary>${escapeHtml(group)} <span>${fields.filter((field) => missing.some((item) => item.field === field && item.missing)).length} missing</span></summary>
        <div class="listing-input-grid">${fields.map((field) => {
          const info = missing.find((item) => item.field === field) || {};
          const value = input.values?.[field];
          const array = ['availableSizes', 'imageReferenceIds', 'evidenceReferenceIds'].includes(field);
          const boolean = field === 'customSizingAvailable';
          return `<label class="listing-input-field ${info.missing ? `missing ${info.severity}` : ''}">
            <span>${escapeHtml(inputFieldLabel(field))}<b>${escapeHtml(info.severity || 'optional')}</b></span>
            ${boolean
              ? `<input type="checkbox" data-listing-input="${field}" ${value ? 'checked' : ''}>`
              : `<input type="${['price', 'quantity', 'pocketCount', 'insidePockets'].includes(field) ? 'number' : 'text'}" data-listing-input="${field}" value="${escapeHtml(array ? (value || []).join(', ') : value ?? '')}" ${input.notApplicable?.[field] || field === 'sku' ? 'disabled' : ''}>`}
            ${field === 'sku' ? '<small>Managed by Product Identity Engine</small>' : !boolean ? `<small><input type="checkbox" data-listing-na="${field}" ${input.notApplicable?.[field] ? 'checked' : ''}> Not applicable</small>` : ''}
          </label>`;
        }).join('')}</div>
      </details>`).join('')}</div>
    <label class="listing-owner-note"><span>Owner note</span><textarea rows="3" id="listing-owner-note">${escapeHtml(input.ownerNote || '')}</textarea></label>
  </section>`;
}

function renderListingStudio() {
  const product = state.mvpProduct;
  const workspace = state.listingWorkspace;
  if (!product || !workspace) return LoadingSkeleton();
  const drafts = workspace.drafts || [];
  const selected = drafts.find((item) => item.id === state.selectedDraftId) || drafts.at(-1);
  const intelligence = selected?.copyIntelligence;
  const compared = drafts.find((item) => item.id === state.compareDraftId) || null;
  const warnings = selected?.warnings || [
    { label: 'Missing measurements', missing: true },
    { label: 'Missing images', missing: !product.originalMediaReferences.length },
    { label: 'Missing leather specifications', missing: true },
    { label: 'Missing evidence', missing: true },
  ];
  const channels = [
    ['shopify', 'Website (Shopify-compatible)'], ['ebay', 'eBay'], ['etsy', 'Etsy'],
    ['seo', 'SEO'], ['faq', 'FAQ'], ['buyingGuide', 'Buying Guide'],
  ];
  const activeChannel = state.listingTab || 'shopify';
  const workflowStatus = state.operationalWorkflow?.workflow?.status || 'Draft';
  const generateLabel = workflowStatus === 'Live'
    ? 'Create New Revision'
    : drafts.length ? 'Regenerate Listing' : 'Generate Listing';
  const latestDraft = drafts.find((item) => item.id === state.latestDraftAvailableId);
  const actions = `<button class="btn" type="button" id="back-to-product">Back to Product</button><button class="btn primary" type="button" data-generate-listing>${generateLabel}</button>`;
  return `
    ${PageHeader('Listing Studio', `${product.title} · Trusted release content only`, actions, 'active')}
    ${latestDraft && latestDraft.id !== selected?.id ? `<section class="governance-note warning-note newer-draft-notice" role="status">
      <div><strong>A newer draft is available.</strong><p>Draft Version ${latestDraft.draftVersion} was created by another editor. Open it before review or continue your current draft without approving it.</p></div>
      <div class="button-row"><button class="btn primary" type="button" id="open-latest-draft">Open Latest Draft</button><button class="btn" type="button" id="continue-current-draft">Continue Current Draft</button></div>
    </section>` : ''}
    ${renderListingInputWorkspace(workspace)}
    ${selected ? `
      <section class="listing-status-row">
        <div><span class="trust-dot"></span><strong>Trusted source</strong><span>Release ${product.governance.latestReleaseNumber} · Knowledge Lock valid</span></div>
        <span>Draft Version ${selected.draftVersion} · ${new Date(selected.createdAt).toLocaleString()}</span>
      </section>
      <div class="listing-insights-grid">
        <section class="card card-pad missing-panel">
          <div class="card-head"><div><h2>Missing information</h2><p>Critical fields block export; recommended and optional fields remain warnings.</p></div><span class="warning-count">${warnings.filter((item) => item.missing).length} open</span></div>
          <div class="missing-summary">${['critical', 'recommended', 'optional'].map((severity) => `<span class="${severity}"><strong>${warnings.filter((item) => item.missing && item.severity === severity).length}</strong>${severity}</span>`).join('')}</div>
          <ul class="warning-list">${warnings.filter((item) => item.missing).slice(0, 12).map((item) => `<li class="missing ${escapeHtml(item.severity)}"><span>!</span><div><strong>${escapeHtml(item.label)}</strong><small>${item.severity === 'critical' ? 'Required before final export' : 'Recommended for stronger listing quality'}</small></div></li>`).join('') || '<li class="complete"><span>✓</span><div><strong>All information complete</strong><small>Ready for export review</small></div></li>'}</ul>
        </section>
        <section class="card card-pad quality-panel">
          <div class="card-head"><div><h2>Listing quality</h2><p>Rule-based readiness indicators</p></div></div>
          <div class="quality-grid">${[
            ['SEO Score', selected.quality.seoScore],
            ['GEO Readiness', selected.quality.geoReadiness],
            ['AEO Readiness', selected.quality.aeoReadiness],
            ['Marketplace Completeness', selected.quality.marketplaceCompleteness],
          ].map(([label, score]) => `<div><div class="quality-score"><strong>${score}</strong><span>/100</span></div><span>${label}</span><progress max="100" value="${score}"></progress><small class="quality-label">${qualityLabel(score)}</small></div>`).join('')}</div>
        </section>
      </div>
      ${intelligence ? `
        <section class="card card-pad copy-intelligence-panel">
          <div class="card-head"><div><span class="eyebrow">Read-only review</span><h2>AI Copy Intelligence</h2><p>Suggestions never overwrite Owner or Listing Editor content.</p></div><span class="warning-count">${intelligence.issueCount} issue${intelligence.issueCount === 1 ? '' : 's'}</span></div>
          <div class="quality-grid intelligence-score-grid">${[
            ['Overall Quality', intelligence.scores.overallQuality],
            ['Google SEO', intelligence.scores.googleSeo],
            ['Website / Shopify', intelligence.scores.shopify],
            ['eBay', intelligence.scores.ebay],
            ['Etsy', intelligence.scores.etsy],
            ['Human Readability', intelligence.scores.humanReadability],
            ['Conversion Potential', intelligence.scores.conversionPotential],
            ['Leather Accuracy', intelligence.scores.leatherAccuracy],
            ['Unsupported Claim Safety', 100 - intelligence.scores.unsupportedClaimRisk],
          ].map(([label, score]) => `<div><div class="quality-score"><strong>${score}</strong><span>/100</span></div><span>${escapeHtml(label)}</span><progress max="100" value="${score}"></progress><small class="quality-label">${qualityLabel(score)}</small></div>`).join('')}</div>
          <div class="copy-issue-list">${intelligence.issues.length ? intelligence.issues.map((item) => `
            <article class="copy-issue ${escapeHtml(item.severity)}">
              <div><span class="status-badge ${item.severity === 'error' ? 'restricted' : 'existing'}">${escapeHtml(item.category.replaceAll('_', ' '))}</span><strong>${escapeHtml(item.message)}</strong></div>
              <code>${escapeHtml(item.location.field)} · ${item.location.start}–${item.location.end}</code>
              <blockquote>${escapeHtml(item.location.excerpt || 'Empty field')}</blockquote>
              <p><strong>Suggestion:</strong> ${escapeHtml(item.suggestion)}</p>
            </article>`).join('') : '<div class="success-note card-pad"><strong>No copy-quality issues detected</strong><p>Continue human review before approval.</p></div>'}</div>
          <details class="advanced-details"><summary>Human writing score details</summary><dl class="definition-grid compact">${Object.entries(intelligence.scores.humanWriting || {}).map(([key, value]) => definitionRow(inputFieldLabel(key), `${value}/100`)).join('')}</dl></details>
          <details class="advanced-details"><summary>SEO intelligence details</summary><dl class="definition-grid compact">${Object.entries(intelligence.scores.seoIntelligence || {}).map(([key, value]) => definitionRow(inputFieldLabel(key), typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? 'Not available'))).join('')}</dl></details>
        </section>
      ` : ''}
      <section class="card listing-draft-bar">
        <div><strong>Draft history</strong><span>Every regeneration creates a new immutable draft.</span></div>
        <label><span>Current</span><select id="draft-select">${drafts.map((item) => `<option value="${item.id}" ${selected?.id === item.id ? 'selected' : ''}>Draft Version ${item.draftVersion}</option>`).join('')}</select></label>
        <label><span>Compare</span><select id="compare-select"><option value="">No comparison</option>${drafts.filter((item) => item.id !== selected?.id).map((item) => `<option value="${item.id}" ${compared?.id === item.id ? 'selected' : ''}>Draft Version ${item.draftVersion}</option>`).join('')}</select></label>
        <span class="review-state">Review state: ${escapeHtml(selected.approvalState || 'unreviewed')} · ${escapeHtml(selected.generationMode)}</span>
      </section>
      <section class="card copy-workspace">
        <div class="card-head"><div><h2>One-click copy</h2><p>Copy channel-ready drafts without publishing.</p></div></div>
        <div class="copy-panel">${['shopify', 'ebay', 'etsy', 'seo', 'faq', 'buyingGuide', 'all'].map((item) => {
          const label = item === 'shopify' ? 'Website' : item === 'buyingGuide' ? 'Buying Guide' : item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1);
          return `<button class="btn ${item === 'all' ? 'primary' : ''} ${state.copiedListingKey === item ? 'copied' : ''}" type="button" data-copy-listing="${item}">${state.copiedListingKey === item ? '✓ Copied' : `Copy ${label}`}</button>`;
        }).join('')}</div>
      </section>
      <nav class="workspace-tabs listing-tabs" aria-label="Listing channels">
        ${channels.map(([id, label]) => `<button type="button" class="workspace-tab ${activeChannel === id ? 'active' : ''}" data-listing-tab="${id}" aria-selected="${activeChannel === id}">${label}</button>`).join('')}
      </nav>
      <section class="card listing-editor">
        <div class="listing-editor-head"><div><span class="channel-kicker">${escapeHtml(channels.find(([id]) => id === activeChannel)?.[1] || '')}</span><h2>Generated content</h2><p>Review and edit. Saving creates a new immutable draft.</p></div><div class="button-row"><button class="btn" data-copy-listing="${activeChannel}">${state.copiedListingKey === activeChannel ? '✓ Copied' : 'Copy full tab'}</button><button class="btn primary" id="save-listing-edit" type="button" disabled>Save as new version</button></div></div>
        <div class="listing-editor-body">${renderListingChannel(activeChannel, selected)}</div>
        ${compared ? `<div class="comparison"><div><strong>Compared with Draft Version ${compared.draftVersion}</strong><span>Generated ${new Date(compared.createdAt).toLocaleString()}</span></div><pre>${escapeHtml(listingText(activeChannel, compared.content[activeChannel]))}</pre></div>` : ''}
      </section>
      <details class="card advanced-details"><summary>Advanced provenance details</summary><dl class="definition-grid compact">${definitionRow('Product Version hash', selected.productVersionHash, true)}${definitionRow('Release manifest hash', selected.releaseManifestHash, true)}${definitionRow('Knowledge Lock hash', selected.knowledgeLockHash, true)}${definitionRow('Draft content hash', selected.contentHash, true)}</dl></details>
      <section class="card export-panel"><div><strong>Review, copy or export</strong><span>Exports remain Owner-only and do not publish.</span></div><div class="button-row">${selected.approvalState !== 'owner_approved' && workspace.permissions?.canApprove ? '<button class="btn" type="button" id="approve-listing-draft">Approve draft package</button>' : ''}<button class="btn" type="button" data-export-listing="json" ${workspace.permissions?.canExport ? '' : 'disabled'}>Download JSON</button><button class="btn" type="button" data-export-listing="text" ${workspace.permissions?.canExport ? '' : 'disabled'}>Download text package</button>${compared ? '<button class="btn" type="button" id="restore-listing-version">Restore compared version</button>' : ''}</div></section>
      ${renderOperationalWorkflow(selected)}
      <div class="sticky-action-bar listing-sticky"><div><strong>Draft Version ${selected.draftVersion}</strong><span>${escapeHtml(workflowStatus)} · Website is the primary destination.</span></div><button class="btn primary" type="button" data-generate-listing>${workflowStatus === 'Live' ? 'Create New Revision' : 'Regenerate as New Version'}</button></div>
    ` : `<section class="card">${EmptyState('No listing drafts', 'Generate from the active Approved Product Release and valid Knowledge Lock.')}</section>`}
  `;
}

function renderOperationalWorkflow(selected) {
  const data = state.operationalWorkflow || {};
  const workflow = data.workflow;
  const status = workflow?.status || 'Draft';
  const owner = state.identity?.user?.accountType === 'owner';
  const workflowDraftIsSelected = !workflow?.draftId || workflow.draftId === selected.id;
  const actions = [];
  if (status === 'Changes Requested' ||
      (['Draft', 'In Progress'].includes(status) && workflowDraftIsSelected)) {
    actions.push(`<button class="btn primary" data-workflow-action="submit">Submit for Review</button>`);
  }
  if (owner && status === 'Submitted for Review' && workflowDraftIsSelected) {
    actions.push('<button class="btn" data-workflow-action="request-changes">Request Changes</button>');
    actions.push('<button class="btn primary" data-workflow-action="approve">Approve</button>');
  }
  if (owner && status === 'Approved' && workflowDraftIsSelected) {
    actions.push('<button class="btn primary" data-workflow-action="publish">Approve &amp; Publish Website</button>');
  }
  if (owner && status === 'Failed') {
    actions.push('<button class="btn primary" data-workflow-action="publish">Retry Website Publication</button>');
  }
  return `<section class="card card-pad operational-workflow">
    <div class="card-head"><div><span class="eyebrow">Website workflow</span><h2>${escapeHtml(status)}</h2><p>Governed review and revision-checked website publishing.</p></div>${statusBadge(status === 'Live' ? 'active' : 'existing', status)}</div>
    ${!workflowDraftIsSelected && ['Submitted for Review', 'Approved'].includes(status) ? `<div class="governance-note warning-note"><strong>A newer submitted draft is available.</strong><p>Open the submitted draft before reviewing or publishing. Stale content cannot be approved.</p><button class="btn primary" type="button" id="open-workflow-draft">Open Submitted Draft</button></div>` : ''}
    ${status === 'Live' ? '<div class="governance-note"><strong>Published website listing</strong><p>Create New Revision to start another governed Draft → Review → Publish cycle without creating another website product.</p></div>' : ''}
    <div class="button-row">${actions.join('') || '<span class="muted">No action is available for the current role and state.</span>'}</div>
    ${workflow?.note ? `<div class="governance-note warning-note"><strong>Review note</strong><p>${escapeHtml(workflow.note)}</p></div>` : ''}
    <details class="advanced-details"><summary>Publication history and activity</summary>
      <div class="activity-list">${(data.activity || []).slice(0, 12).map((event) => `<div><strong>${escapeHtml(event.action)}</strong><span>${escapeHtml(event.actorRole)} · ${new Date(event.timestamp).toLocaleString()}</span></div>`).join('') || '<p class="muted">No workflow activity yet.</p>'}</div>
    </details>
  </section>`;
}

function renderTeamManagement() {
  if (state.identity?.user?.accountType !== 'owner') {
    return `${PageHeader('Team Management', 'Owner-only named account management.', '', 'restricted')}${AlertPanel('Access restricted', 'Named Owner access is required.', 'warning')}`;
  }
  return `${PageHeader('Team Management', 'Manage real Listing Editor access without sharing Owner credentials.', '', 'active')}
    <div class="grid two">
      <section class="card card-pad">
        <div class="card-head"><div><h2>Create Listing Editor</h2><p>The temporary password is hashed immediately and is never returned.</p></div></div>
        <form id="create-listing-editor" class="form-grid">
          <div class="field"><label>VA name</label><input name="displayName" required maxlength="120" autocomplete="off"></div>
          <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="off"></div>
          <div class="field full"><label>Temporary password</label><input name="password" type="password" required minlength="15" maxlength="128" autocomplete="new-password"></div>
          <div class="field full"><button class="btn primary" type="submit">Create Listing Editor</button></div>
        </form>
      </section>
      <section class="card card-pad">
        <div class="card-head"><div><h2>Listing Editors</h2><p>Activation and session controls are Owner-only.</p></div><span class="pill">${state.teamUsers.length}</span></div>
        <div class="activity-list">${state.teamUsers.map((user) => `<article>
          <div><strong>${escapeHtml(user.displayName)}</strong><span>${escapeHtml(user.email)} · ${escapeHtml(user.status)}</span><small>Last login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} · ${user.activeSessionCount || 0} session(s)</small></div>
          <div class="button-row"><button class="btn" data-team-status="${user.id}" data-active="${user.status !== 'active'}">${user.status === 'active' ? 'Deactivate' : 'Activate'}</button><button class="btn" data-team-reset="${user.id}">Reset password</button><button class="btn" data-team-revoke="${user.id}">Revoke sessions</button></div>
        </article>`).join('') || '<p class="muted">No Listing Editor accounts yet.</p>'}</div>
      </section>
    </div>`;
}

function renderOwnerProfile() {
  if (state.identity?.user?.accountType !== 'owner') {
    return `${PageHeader('My Profile', 'Owner account and security settings.', '', 'restricted')}${AlertPanel('Access restricted', 'Named Owner access is required.', 'warning')}`;
  }
  const profile = state.profile?.user || state.identity.user;
  const sessions = state.profile?.sessions || [];
  const activeTab = state.profileTab === 'security' ? 'security' : 'profile';
  const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not available';
  const content = activeTab === 'security' ? `
    <div class="grid two">
      <section class="card card-pad">
        <div class="card-head"><div><h2>Change password</h2><p>Changing your password signs out every other Owner session while keeping this session active.</p></div></div>
        <form id="owner-password-form" class="form-grid">
          <div class="field full"><label for="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" required autocomplete="current-password"></div>
          <div class="field full"><label for="new-password">New password</label><input id="new-password" name="newPassword" type="password" required minlength="15" maxlength="128" autocomplete="new-password" aria-describedby="password-policy"><small id="password-policy">Use 15–128 characters and avoid account, company, or predictable password terms.</small></div>
          <div class="field full"><label for="confirm-new-password">Confirm new password</label><input id="confirm-new-password" name="confirmNewPassword" type="password" required minlength="15" maxlength="128" autocomplete="new-password"></div>
          <div class="field full"><button class="btn primary" type="submit">Change password</button></div>
        </form>
      </section>
      <section class="card card-pad">
        <div class="card-head"><div><h2>Active sessions</h2><p>Review Owner sessions without exposing cookies, tokens, or network identifiers.</p></div><span class="pill">${sessions.length}</span></div>
        <div class="activity-list">${sessions.map((item) => `<article>
          <div><strong>${item.current ? 'Current session' : 'Owner session'}</strong><span>Last active: ${escapeHtml(formatDate(item.lastActivityAt))}</span><small>Started ${escapeHtml(formatDate(item.createdAt))} · Expires ${escapeHtml(formatDate(item.expiresAt))}</small></div>
          ${item.current ? statusBadge('active', 'Current') : ''}
        </article>`).join('') || '<p class="muted">No active sessions found.</p>'}</div>
        <div class="button-row"><button class="btn" id="logout-other-sessions" type="button" ${sessions.filter((item) => !item.current).length ? '' : 'disabled'}>Log out other sessions</button></div>
      </section>
    </div>` : `
    <div class="grid two">
      <section class="card card-pad">
        <div class="card-head"><div><h2>Owner profile</h2><p>Your permanent named identity for MOTOGRIP OS governance.</p></div>${statusBadge('active', 'Named Owner')}</div>
        <dl class="detail-list">
          <div><dt>Display name</dt><dd>${escapeHtml(profile.displayName)}</dd></div>
          <div><dt>Email</dt><dd>${escapeHtml(profile.email)}</dd></div>
          <div><dt>Role</dt><dd>Named Owner</dd></div>
          <div><dt>Account status</dt><dd>${escapeHtml(profile.status)}</dd></div>
        </dl>
      </section>
      <section class="card card-pad">
        <div class="card-head"><div><h2>Security summary</h2><p>Authentication activity for this Owner account.</p></div></div>
        <dl class="detail-list">
          <div><dt>Last password change</dt><dd>${escapeHtml(formatDate(profile.passwordChangedAt))}</dd></div>
          <div><dt>Last login</dt><dd>${escapeHtml(formatDate(profile.lastLoginAt))}</dd></div>
          <div><dt>Active sessions</dt><dd>${sessions.length}</dd></div>
          <div><dt>Password protection</dt><dd>Argon2id</dd></div>
        </dl>
      </section>
    </div>`;
  return `${PageHeader('My Profile', 'Manage the permanent Named Owner identity and account security.', '', 'active')}
    <nav class="workspace-tabs" aria-label="Profile sections">
      <button type="button" class="workspace-tab ${activeTab === 'profile' ? 'active' : ''}" data-profile-tab="profile" aria-selected="${activeTab === 'profile'}">Profile</button>
      <button type="button" class="workspace-tab ${activeTab === 'security' ? 'active' : ''}" data-profile-tab="security" aria-selected="${activeTab === 'security'}">Security</button>
    </nav>
    ${content}`;
}

function renderGenericModule() {
  const detail = moduleDetails[state.view] || ['Planned module', 'This operating area is defined in the MOTOGRIP OS blueprint.', ['Overview', 'Workflow', 'Reporting'], 'Approved data model and services', 'Future phase'];
  const [title, purpose, capabilities, dependency, phase] = detail;
  const status = routeEntries.find(([id]) => id === state.view)?.[4] || 'planned';
  return `
    ${PageHeader(title, purpose, '<button class="btn primary" type="button" disabled>New item</button>', status)}
    <div class="grid placeholder-layout">
      ${ComingSoonPanel(title, purpose, dependency, phase, status)}
      <div class="card card-pad">
        <div class="section-head"><div><h2>Planned capabilities</h2><p>These labels define information architecture, not available actions.</p></div></div>
        <ul class="capability-list">${capabilities.map((item) => `<li><span aria-hidden="true">○</span>${escapeHtml(item)}${statusBadge('planned')}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

function renderAIProductStudio() {
  const steps = ['Image upload', 'AI analysis', 'Listing generation', 'SEO', 'Publishing', 'Social media', 'Google Merchant', 'Analytics'];
  return `
    ${PageHeader('AI Product Studio', 'A governed future workflow for turning approved product imagery into channel-ready content.', '<button class="btn primary" type="button" disabled>Upload images</button>', 'planned')}
    ${AlertPanel('Interface preview only', 'No images are uploaded, analyzed, generated, or published from this screen.', 'info')}
    <div class="workflow-rail">${steps.map((step, index) => `<div class="workflow-step"><span>${index + 1}</span><strong>${escapeHtml(step)}</strong>${statusBadge('planned')}</div>`).join('')}</div>
    ${ComingSoonPanel('AI Product Studio', 'Future AI assistance will remain subject to human review and channel-specific approvals.', 'Media library, AI governance, approvals, and publishing adapters', 'AI Studio phase')}
  `;
}

function renderMarketingCenter() {
  return `
    ${PageHeader('Marketing Center', 'Plan campaigns across owned channels with approvals and measurable outcomes.', '<button class="btn primary" type="button" disabled>Create campaign</button>', 'planned')}
    <div class="grid module-grid">${['Campaign calendar', 'Audience strategy', 'Content approvals', 'Performance'].map((title) => ModuleStatusCard(title, 'planned', 'Defined shell; integration not connected')).join('')}</div>
    <div class="shell-gap"></div>${ComingSoonPanel('Marketing orchestration', 'Campaign actions will become available only after channel, consent, and approval services are implemented.', 'Email, social, analytics, and approval services', 'Growth phase')}
  `;
}

function renderSocialCenter() {
  return `
    ${PageHeader('Social Media Center', 'Coordinate premium brand content without publishing from this prototype.', '<button class="btn primary" type="button" disabled>Schedule post</button>', 'planned')}
    <div class="social-preview"><div class="card card-pad"><h2>Content queue</h2>${EmptyState('No connected channels', 'Future channel connections and permissions will be configured here.')}</div><div class="card card-pad"><h2>Calendar preview</h2><div class="calendar-shell">${Array.from({ length: 14 }, (_, index) => `<span>${index + 1}</span>`).join('')}</div></div></div>
  `;
}

function renderFactoryShell() {
  const production = state.view === 'production';
  const title = production ? 'Production Tracking' : 'Factory Management';
  return `
    ${PageHeader(title, production ? 'A future job-level view from approved order handoff through quality control.' : 'A future operating view for capacity, work centers, quality, and manufacturing accountability.', '<button class="btn primary" type="button" disabled>Create job</button>', 'planned')}
    <div class="grid stats">${StatCard('Open jobs', '8', 'Illustrative factory preview', true)}${StatCard('Due this week', '5', 'Illustrative factory preview', true)}${StatCard('Quality holds', '1', 'Illustrative factory preview', true)}${StatCard('Capacity', '72%', 'Illustrative factory preview', true)}</div>
    <div class="shell-gap"></div>${ComingSoonPanel(title, 'No production or order data is created or modified by this shell.', 'Production data model, factory roles, and approved order handoff', 'Operations phase')}
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
          <div class="field full"><h3>SEO and AI discovery</h3></div>
          ${field('SEO title', 'seoTitle', product.seoTitle, 'text', true)}
          ${textareaField('SEO description', 'seoDescription', product.seoDescription)}
          ${textareaField('Schema description', 'schemaDescription', product.schemaDescription)}
          ${field('Canonical URL', 'canonicalUrl', product.canonicalUrl, 'url', true)}
          ${field('Brand', 'brand', product.brand)}
          ${field('SKU', 'sku', product.sku)}
          ${field('MPN', 'mpn', product.mpn)}
          ${field('GTIN / UPC / EAN', 'gtin', product.gtin)}
          ${field('Google product category', 'googleProductCategory', product.googleProductCategory, 'text', true)}
          ${field('Product type', 'productType', product.productType)}
          ${selectField('Condition', 'condition', product.condition || 'NewCondition', ['NewCondition', 'UsedCondition', 'RefurbishedCondition'])}
          ${field('Price valid until', 'priceValidUntil', product.priceValidUntil, 'date')}
          ${field('Primary image', 'primaryImage', product.primaryImage || product.image, 'text', true)}
          ${textareaField('Gallery images', 'galleryImagesText', (product.galleryImages || []).join('\\n'))}
          ${field('Image alt text', 'imageAltText', product.imageAltText, 'text', true)}
          <div class="field full"><h3>Variants, apparel attributes, and merchant fields</h3></div>
          ${field('Material', 'material', product.material)}
          ${field('Color', 'color', product.color)}
          ${field('Size system', 'sizeSystem', product.sizeSystem)}
          ${field('Size type', 'sizeType', product.sizeType)}
          ${field('Age group', 'ageGroup', product.ageGroup)}
          ${field('Item group ID', 'itemGroupId', product.itemGroupId)}
          ${field('Variant options', 'variantOptionsText', (product.variantOptions || []).join(', '), 'text', true)}
          ${field('Shipping weight', 'shippingWeight', product.shippingWeight)}
          ${textareaField('Shipping policy', 'shippingPolicy', product.shippingPolicy)}
          ${textareaField('Return policy', 'returnPolicy', product.returnPolicy)}
          ${field('Rating value', 'ratingValue', product.ratingValue || '', 'number')}
          ${field('Review count', 'reviewCount', product.reviewCount || '', 'number')}
          <div class="field full"><h3>MOTOGRIP product authority</h3></div>
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
          ${textareaField('Care instructions', 'careInstructions', product.careInstructions)}
          ${textareaField('Fit notes', 'fitNotes', product.fitNotes)}
          ${field('Craft method', 'craftMethod', product.craftMethod, 'text', true)}
          ${field('Warranty', 'warranty', product.warranty, 'text', true)}
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
    root.innerHTML = `<main class="login-shell">${LoadingSkeleton()}</main>`;
    return;
  }
  const views = {
    dashboard: renderMvpDashboard,
    catalog: renderCatalog,
    'catalog-review': renderCatalogReview,
    'catalog-detail': renderCatalogProductDetail,
    products: renderMvpProducts,
    'product-detail': renderMvpProductDetail,
    'listing-studio': renderListingStudio,
    'product-editor': () => window.ProductEditorV2UI.render(
      state.productEditorProduct,
      state.productEditorWorkspace,
      { owner: state.identity?.user?.accountType === 'owner' },
    ),
    'current-products': renderCurrentProductManager,
    'ai-product': renderAIProductStudio,
    marketing: renderMarketingCenter,
    social: renderSocialCenter,
    factory: renderFactoryShell,
    production: renderFactoryShell,
    team: renderTeamManagement,
    profile: renderOwnerProfile,
  };
  root.innerHTML = AdminLayout((views[state.view] || renderGenericModule)());
  bindShell();
  if (state.view === 'product-editor') {
    window.ProductEditorV2UI.bind(state.productEditorProduct, state.productEditorWorkspace, {
      owner: state.identity?.user?.accountType === 'owner',
      api,
      toast,
      dirty: () => { state.productEditorDirty = true; },
      update: (product, workspace) => {
        state.productEditorProduct = product;
        state.productEditorWorkspace = workspace;
        state.productEditorDirty = false;
        if (product?.id && window.location.pathname.endsWith('/new')) {
          window.history.replaceState({}, '', `/admin/product-editor/${product.id}`);
        }
        render();
      },
    });
  }
  if (state.dirty) document.querySelector('.savebar')?.classList.add('visible');
}

function bindShell() {
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(link.dataset.route);
    });
  });

  document.getElementById('global-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    if (state.view === 'products') render();
  });
  document.querySelectorAll('#open-product-editor').forEach((button) =>
    button.addEventListener('click', () => navigateProductEditor(null)));
  document.querySelectorAll('[data-edit-v2]').forEach((button) => button.addEventListener('click', async (event) => {
    event.stopPropagation();
    try {
      const result = await api('/api/admin/product-editor-v2/import', {
        method: 'POST',
        body: JSON.stringify({
          websiteProductId: button.dataset.editV2,
          productUuid: button.dataset.productUuid,
          handle: button.dataset.handle,
          expectedRevision: state.productEditorWorkspace?.storeRevision,
        }),
      });
      await navigateProductEditor(result.product.id);
    } catch (error) {
      toast(error.message);
    }
  }));
  document.getElementById('product-shell-filter')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });
  document.getElementById('mvp-product-filter')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });
  document.getElementById('product-grid-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    state.productGridPage = 1;
    render();
  });
  document.querySelectorAll('[data-grid-filter]').forEach((select) => select.addEventListener('change', () => {
    state.productGridFilters[select.dataset.gridFilter] = select.value;
    state.productGridPage = 1;
    render();
  }));
  document.getElementById('product-grid-sort')?.addEventListener('change', (event) => {
    state.productGridSort = event.target.value;
    render();
  });
  document.getElementById('clear-product-grid-filters')?.addEventListener('click', () => {
    state.query = '';
    state.productGridFilters = { status: 'all', brand: 'all', productType: 'all', collection: 'all', inventory: 'all' };
    state.productGridPage = 1;
    render();
  });
  document.querySelectorAll('[data-grid-stat]').forEach((button) => button.addEventListener('click', () => {
    const value = button.dataset.gridStat;
    state.productGridFilters = { status: 'all', brand: 'all', productType: 'all', collection: 'all', inventory: 'all' };
    if (['Live', 'Draft', 'Archived', 'Hidden'].includes(value)) state.productGridFilters.status = value;
    if (['needs-review', 'sync-error', 'out'].includes(value)) state.productGridFilters.inventory = value;
    state.productGridPage = 1;
    render();
  }));
  const toggleGridPage = (checked) => {
    const rows = productGridRows();
    const start = (state.productGridPage - 1) * state.productGridPageSize;
    rows.slice(start, start + state.productGridPageSize).forEach((product) =>
      checked ? state.productGridSelection.add(product.id) : state.productGridSelection.delete(product.id));
    render();
  };
  document.getElementById('product-grid-select-page')?.addEventListener('change', (event) => toggleGridPage(event.target.checked));
  document.getElementById('select-page-products')?.addEventListener('click', () => {
    const rows = productGridRows();
    const start = (state.productGridPage - 1) * state.productGridPageSize;
    const page = rows.slice(start, start + state.productGridPageSize);
    toggleGridPage(!page.every((product) => state.productGridSelection.has(product.id)));
  });
  document.getElementById('select-filtered-products')?.addEventListener('click', () => {
    const rows = productGridRows();
    const allSelected = rows.every((product) => state.productGridSelection.has(product.id));
    rows.forEach((product) => allSelected
      ? state.productGridSelection.delete(product.id)
      : state.productGridSelection.add(product.id));
    render();
  });
  document.querySelectorAll('[data-grid-select]').forEach((input) => input.addEventListener('change', (event) => {
    event.stopPropagation();
    event.target.checked
      ? state.productGridSelection.add(input.dataset.gridSelect)
      : state.productGridSelection.delete(input.dataset.gridSelect);
    render();
  }));
  document.querySelectorAll('[data-grid-preview]').forEach((row) => {
    const open = (event) => {
      if (event.target.closest('button,input,a,details,summary,select')) return;
      state.productGridPreviewId = row.dataset.gridPreview;
      render();
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') open(event);
    });
  });
  document.querySelectorAll('[data-close-grid-panel]').forEach((button) => button.addEventListener('click', (event) => {
    if (button.classList.contains('pg-modal-backdrop') && event.target !== button) return;
    if (button.classList.contains('pg-drawer-backdrop') && event.target !== button) return;
    state.productGridPreviewId = null;
    state.productGridBulkEditor = false;
    state.productGridHistory = null;
    render();
  }));
  document.getElementById('clear-product-grid-selection')?.addEventListener('click', () => {
    state.productGridSelection.clear();
    render();
  });
  document.getElementById('product-grid-page-size')?.addEventListener('change', (event) => {
    state.productGridPageSize = Number(event.target.value);
    state.productGridPage = 1;
    render();
  });
  document.getElementById('product-grid-prev')?.addEventListener('click', () => {
    state.productGridPage = Math.max(1, state.productGridPage - 1);
    render();
  });
  document.getElementById('product-grid-next')?.addEventListener('click', () => {
    state.productGridPage += 1;
    render();
  });
  document.querySelectorAll('[data-grid-bulk]').forEach((button) => button.addEventListener('click', () => {
    state.productGridBulkEditor = true;
    render();
    const focusNames = { inventory: 'variantInventory', price: 'price', status: 'status', tags: 'tags', collections: 'collections' };
    document.querySelector(`[name="${focusNames[button.dataset.gridBulk] || 'price'}"]`)?.focus();
  }));
  document.querySelectorAll('[data-grid-bulk-action]').forEach((button) => button.addEventListener('click', async () => {
    if (button.dataset.gridBulkAction === 'delete' && !window.confirm('Remove the selected products from the active grid? This keeps an audit-safe tombstone.')) return;
    await runProductGridMutation(button.dataset.gridBulkAction, [...state.productGridSelection]);
  }));
  document.getElementById('product-grid-bulk-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = {};
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (String(value).trim() !== '') values[key] = value;
    }
    if (!Object.keys(values).length) return toast('Enter at least one bulk value');
    await runProductGridMutation('bulk_edit', [...state.productGridSelection], values);
    state.productGridBulkEditor = false;
  });
  document.getElementById('product-grid-export')?.addEventListener('click', () => {
    const selectedRows = (state.productGrid.products || []).filter((product) => state.productGridSelection.has(product.id));
    const safe = selectedRows.map(({ id, title, sku, status, inventory, variantCount, price, brand, category, productType, collections, tags, syncStatus, handle }) =>
      ({ id, title, sku, status, inventory, variantCount, price, brand, category, productType, collections, tags, syncStatus, handle }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `motogrip-products-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Product export prepared');
  });
  document.querySelectorAll('[data-grid-action]').forEach((button) => button.addEventListener('click', async (event) => {
    event.stopPropagation();
    await runProductGridAction(button.dataset.gridAction, button.dataset.productId);
  }));
  document.getElementById('catalog-filter')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });
  document.getElementById('catalog-review-filter')?.addEventListener('change', (event) => {
    state.catalogReviewFilter = event.target.value;
    render();
  });
  document.querySelectorAll('[data-catalog-product], [data-open-catalog-product]').forEach((element) => {
    const open = (event) => {
      if (event?.target?.closest('a, button, summary')) return;
      navigateCatalogProduct(element.dataset.catalogProduct || element.dataset.openCatalogProduct);
    };
    element.addEventListener('click', open);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateCatalogProduct(element.dataset.catalogProduct || element.dataset.openCatalogProduct);
      }
    });
  });
  document.querySelectorAll('[data-open-catalog-product]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      navigateCatalogProduct(button.dataset.openCatalogProduct);
    });
  });
  document.getElementById('catalog-sync')?.addEventListener('click', async () => {
    state.catalogSyncing = true;
    render();
    try {
      state.catalog = await api('/api/admin/catalog/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      state.catalogError = '';
      toast(`Catalog synced: ${state.catalog.productCount} products`);
    } catch (error) {
      state.catalogError = error.message;
      toast(error.message);
    } finally {
      state.catalogSyncing = false;
      render();
    }
  });
  let dnaSearchTimer;
  document.getElementById('catalog-dna-search')?.addEventListener('input', (event) => {
    window.clearTimeout(dnaSearchTimer);
    dnaSearchTimer = window.setTimeout(async () => {
      try {
        const result = await api(`/api/admin/catalog/product-dna?q=${encodeURIComponent(event.target.value)}`);
        state.productDnaOptions = result.products || [];
        const container = document.getElementById('catalog-dna-results');
        if (container) {
          container.innerHTML = renderDnaMatchOptions(state.productDnaOptions);
          bindCatalogDnaActions();
        }
      } catch (error) {
        toast(error.message);
      }
    }, 180);
  });
  bindCatalogDnaActions();
  document.getElementById('unlink-catalog-product')?.addEventListener('click', async () => {
    try {
      await api(`/api/admin/catalog/products/${state.catalogProduct.catalogProductId}/unlink`, {
        method: 'POST',
        body: JSON.stringify({ expectedRevision: state.catalog.linkStoreRevision }),
      });
      await refreshCatalogProduct();
      toast('Product DNA link removed');
    } catch (error) {
      toast(error.message);
    }
  });
  document.getElementById('ignore-catalog-product')?.addEventListener('click', async () => {
    try {
      await api(`/api/admin/catalog/products/${state.catalogProduct.catalogProductId}/ignore`, {
        method: 'POST',
        body: JSON.stringify({
          expectedRevision: state.catalog.linkStoreRevision,
          reason: 'Staging or non-website product',
        }),
      });
      await refreshCatalogProduct();
      toast('Catalog product ignored');
    } catch (error) {
      toast(error.message);
    }
  });
  document.getElementById('open-linked-product-dna')?.addEventListener('click', () => {
    const product = linkedMvpProduct(state.catalogProduct);
    if (product) navigateProduct(product.recordKey);
  });
  document.getElementById('open-linked-listing-studio')?.addEventListener('click', () => {
    const product = linkedMvpProduct(state.catalogProduct);
    if (product) navigateListingStudio(product.recordKey);
  });

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    try {
      window.localStorage.setItem('motogrip-sidebar-collapsed', String(state.sidebarCollapsed));
    } catch {}
    render();
  });
  document.getElementById('mobile-menu')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('mobile-open');
  });
  document.getElementById('profile-toggle')?.addEventListener('click', (event) => {
    const menu = document.getElementById('profile-menu');
    const open = menu?.classList.toggle('visible');
    event.currentTarget.setAttribute('aria-expanded', String(Boolean(open)));
  });
  document.querySelectorAll('[data-profile-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.profileTab = button.dataset.profileTab;
      render();
    });
  });

  document.getElementById('owner-password-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') || '');
    const newPassword = String(form.get('newPassword') || '');
    const confirmNewPassword = String(form.get('confirmNewPassword') || '');
    if (newPassword !== confirmNewPassword) {
      toast('New password confirmation does not match');
      return;
    }
    try {
      await api('/api/admin/profile/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      event.currentTarget.reset();
      await loadProfile();
      state.identity = await api('/api/admin/me');
      render();
      toast('Password changed. Other Owner sessions were signed out.');
    } catch (error) {
      event.currentTarget.reset();
      toast(error.message);
    }
  });

  document.getElementById('logout-other-sessions')?.addEventListener('click', async () => {
    try {
      const result = await api('/api/admin/profile/sessions/logout-others', { method: 'POST' });
      await loadProfile();
      render();
      toast(`${result.revokedSessions} other session(s) signed out`);
    } catch (error) {
      toast(error.message);
    }
  });

  document.getElementById('logout')?.addEventListener('click', async () => {
    try {
      await api('/api/admin/logout', { method: 'POST' });
      state.authed = false;
      state.store = null;
      state.csrfToken = null;
      state.actorType = null;
      state.identity = null;
      renderLogin();
    } catch (err) {
      toast(err.message);
    }
  });

  document.getElementById('save')?.addEventListener('click', saveStore);
  document.getElementById('discard')?.addEventListener('click', loadStore);

  document.querySelectorAll('[data-product]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedProductId = row.dataset.product;
      render();
    });
  });

  document.querySelectorAll('[data-mvp-product]').forEach((row) => {
    const openProduct = () => navigateProduct(row.dataset.mvpProduct);
    row.addEventListener('click', openProduct);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProduct();
      }
    });
  });
  document.querySelectorAll('[data-open-listing]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      navigateListingStudio(button.dataset.openListing);
    });
  });

  const governanceAction = async (action, body = {}) => {
    const recordKey = state.mvpProduct.recordKey;
    try {
      const result = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}/governance/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await loadMvpWorkspace();
      state.mvpProduct = result.product || await api(
        `/api/admin/mvp/products/${encodeURIComponent(recordKey)}`,
      );
      window.history.replaceState(
        {},
        '',
        `/admin/products/${encodeURIComponent(state.mvpProduct.recordKey)}`,
      );
      state.governance = await api(`/api/admin/mvp/products/${encodeURIComponent(
        state.mvpProduct.recordKey,
      )}/governance`);
      render();
      toast('Governance step completed');
    } catch (error) {
      toast(error.message);
    }
  };
  document.querySelectorAll('#create-version').forEach((button) => button.addEventListener('click', () =>
    governanceAction('version')));
  document.querySelectorAll('#request-approval').forEach((button) => button.addEventListener('click', () =>
    governanceAction('approval-request', {
      productVersionId: state.governance.latestVersion.id,
      expectedRevision: state.governance.storeRevision,
    })));
  document.querySelectorAll('#approve-version').forEach((button) => button.addEventListener('click', () =>
    governanceAction('approve', {
      approvalRequestId: state.governance.latestApprovalRequest.id,
      expectedRevision: state.governance.storeRevision,
    })));
  document.querySelectorAll('#create-release').forEach((button) => button.addEventListener('click', () =>
    governanceAction('release', {
      approvalRequestId: state.governance.latestApprovalRequest.id,
      expectedRevision: state.governance.storeRevision,
    })));
  document.querySelectorAll('#create-knowledge-lock').forEach((button) => button.addEventListener('click', () =>
    governanceAction('knowledge-lock', {
      releaseId: state.governance.latestRelease.id,
      expectedRevision: state.governance.storeRevision,
    })));
  document.querySelectorAll('#open-listing-studio').forEach((button) =>
    button.addEventListener('click', () => navigateListingStudio(state.mvpProduct.recordKey)));
  const identityAction = async (action, body = {}) => {
    try {
      state.productIdentityWorkspace = await api(
        `/api/admin/mvp/products/${state.mvpProduct.productUuid}/identity/${action}`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...body,
            expectedRevision: state.productIdentityWorkspace?.storeRevision,
          }),
        },
      );
      render();
      toast(`Product identity ${action} completed`);
    } catch (error) {
      toast(error.message);
    }
  };
  document.getElementById('generate-product-identity')?.addEventListener('click', () =>
    identityAction('generate'));
  document.getElementById('approve-product-identity')?.addEventListener('click', () =>
    identityAction('approve'));
  document.getElementById('lock-product-identity')?.addEventListener('click', () =>
    identityAction('lock'));
  document.getElementById('unlock-product-identity')?.addEventListener('click', () => {
    const reason = window.prompt('Reason for unlocking this identity:');
    if (reason) identityAction('unlock', { reason });
  });
  document.getElementById('override-product-sku')?.addEventListener('click', () => {
    const productSku = window.prompt(
      'Enter the replacement Product SKU:',
      state.productIdentityWorkspace?.identity?.productSku || '',
    );
    if (!productSku) return;
    const reason = window.prompt('Reason for this SKU override:');
    if (reason) identityAction('override', { productSku, reason });
  });
  document.querySelectorAll('[data-product-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.productDetailTab = button.dataset.productTab;
      render();
    });
  });
  document.querySelectorAll('[data-listing-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.listingTab = button.dataset.listingTab;
      state.copiedListingKey = null;
      render();
    });
  });
  document.querySelectorAll('[data-workflow-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.dataset.workflowAction;
      const selected = state.listingWorkspace.drafts.find((item) =>
        item.id === state.selectedDraftId) || state.listingWorkspace.drafts.at(-1);
      const note = action === 'request-changes'
        ? window.prompt('Describe the required change without including secrets:') : '';
      if (action === 'request-changes' && !note) return;
      try {
        state.operationalWorkflow = await api(
          `/api/admin/mvp/products/${state.mvpProduct.productUuid}/operational/${action === 'request-changes' ? 'request-changes' : action}`,
          {
            method: 'POST',
            body: JSON.stringify({
              draftId: selected.id,
              catalogId: state.catalogProduct?.catalogProductId || null,
              note,
              expectedRevision: state.operationalWorkflow?.storeRevision,
              expectedOperationalRevision: state.operationalWorkflow?.storeRevision,
              expectedWebsiteRevision: state.operationalWorkflow?.websiteRevision,
              idempotencyKey: action === 'publish' ? crypto.randomUUID() : undefined,
            }),
          },
        );
        if (action === 'publish') {
          state.catalog = await api('/api/admin/catalog');
        }
        render();
        toast(action === 'publish' ? 'Website published and Catalog synced' : 'Workflow updated');
      } catch (error) {
        toast(error.message);
        state.operationalWorkflow = await api(
          `/api/admin/mvp/products/${state.mvpProduct.productUuid}/operational`,
        ).catch(() => state.operationalWorkflow);
        render();
      }
    });
  });
  document.getElementById('create-listing-editor')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api('/api/admin/team/users', {
        method: 'POST',
        body: JSON.stringify({
          displayName: form.get('displayName'),
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      formElement.reset();
      await loadTeamUsers();
      render();
      toast('Listing Editor created');
    } catch (error) {
      toast(error.message);
    }
  });
  document.querySelectorAll('[data-team-status]').forEach((button) =>
    button.addEventListener('click', async () => {
      await api(`/api/admin/team/users/${button.dataset.teamStatus}/status`, {
        method: 'POST',
        body: JSON.stringify({ active: button.dataset.active === 'true' }),
      }).then(loadTeamUsers).then(render).catch((error) => toast(error.message));
    }));
  document.querySelectorAll('[data-team-revoke]').forEach((button) =>
    button.addEventListener('click', async () => {
      await api(`/api/admin/team/users/${button.dataset.teamRevoke}/revoke-sessions`, {
        method: 'POST',
        body: '{}',
      }).then(loadTeamUsers).then(render).then(() => toast('Sessions revoked'))
        .catch((error) => toast(error.message));
    }));
  document.querySelectorAll('[data-team-reset]').forEach((button) =>
    button.addEventListener('click', async () => {
      const password = window.prompt('Enter a temporary password (15–128 characters):');
      if (!password) return;
      try {
        await api(`/api/admin/team/users/${button.dataset.teamReset}/reset-password`, {
          method: 'POST',
          body: JSON.stringify({ password }),
        });
        toast('Temporary password updated and sessions revoked');
      } catch (error) {
        toast(error.message);
      }
    }));
  document.getElementById('back-to-product')?.addEventListener('click', () =>
    navigateProduct(state.mvpProduct.recordKey));
  document.querySelectorAll('[data-listing-input]').forEach((input) => {
    input.addEventListener('input', () => {
      state.listingInputDirty = true;
      document.getElementById('save-listing-input')?.classList.add('attention');
    });
  });
  document.querySelectorAll('[data-listing-na]').forEach((input) => {
    input.addEventListener('change', () => {
      const field = input.dataset.listingNa;
      const fieldInput = document.querySelector(`[data-listing-input="${field}"]`);
      if (fieldInput) fieldInput.disabled = input.checked;
      state.listingInputDirty = true;
    });
  });
  document.getElementById('listing-owner-note')?.addEventListener('input', () => {
    state.listingInputDirty = true;
  });
  document.getElementById('save-listing-input')?.addEventListener('click', async () => {
    const values = {};
    const notApplicable = {};
    document.querySelectorAll('[data-listing-input]').forEach((input) => {
      values[input.dataset.listingInput] = input.type === 'checkbox' ? input.checked : input.value;
    });
    document.querySelectorAll('[data-listing-na]').forEach((input) => {
      if (input.checked) notApplicable[input.dataset.listingNa] = true;
    });
    try {
      state.listingWorkspace = await api(
        `/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio/input`,
        {
          method: 'POST',
          body: JSON.stringify({
            values,
            notApplicable,
            ownerNote: document.getElementById('listing-owner-note')?.value || '',
            expectedRevision: state.listingWorkspace.storeRevision,
          }),
        },
      );
      state.listingInputDirty = false;
      render();
      toast(`Listing Input Draft ${state.listingWorkspace.inputDraft.inputVersion} saved`);
    } catch (error) {
      toast(error.message);
    }
  });
  document.querySelectorAll('[data-generate-listing]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (state.listingInputDirty) {
        toast('Save product information before generating');
        return;
      }
      try {
        const workflowStatus = state.operationalWorkflow?.workflow?.status;
        const wasLive = workflowStatus === 'Live';
        const shouldRevise = ['Live', 'Draft', 'In Progress', 'Changes Requested'].includes(workflowStatus);
        state.listingWorkspace = await api(
          `/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio/generate`,
          {
            method: 'POST',
            body: JSON.stringify({ expectedRevision: state.listingWorkspace.storeRevision }),
          },
        );
        state.selectedDraftId = state.listingWorkspace.draft.id;
        state.latestDraftAvailableId = null;
        if (shouldRevise) {
          state.operationalWorkflow = await api(
            `/api/admin/mvp/products/${state.mvpProduct.productUuid}/operational/revise`,
            {
              method: 'POST',
              body: JSON.stringify({
                draftId: state.selectedDraftId,
                catalogId: state.catalogProduct?.catalogProductId || null,
                expectedRevision: state.operationalWorkflow.storeRevision,
              }),
            },
          );
        }
        render();
        toast(wasLive
          ? `Draft Version ${state.listingWorkspace.draft.draftVersion} revision created`
          : `Draft Version ${state.listingWorkspace.draft.draftVersion} created`);
      } catch (error) {
        toast(error.message);
      }
    });
  });
  document.getElementById('open-latest-draft')?.addEventListener('click', () => {
    state.selectedDraftId = state.latestDraftAvailableId;
    state.latestDraftAvailableId = null;
    state.compareDraftId = null;
    state.listingContentDirty = false;
    state.listingEditContent = null;
    render();
  });
  document.getElementById('continue-current-draft')?.addEventListener('click', () => {
    state.latestDraftAvailableId = null;
    render();
  });
  document.getElementById('open-workflow-draft')?.addEventListener('click', () => {
    state.selectedDraftId = state.operationalWorkflow?.workflow?.draftId || state.selectedDraftId;
    state.latestDraftAvailableId = null;
    state.compareDraftId = null;
    state.listingContentDirty = false;
    state.listingEditContent = null;
    render();
  });
  document.getElementById('draft-select')?.addEventListener('change', (event) => {
    state.selectedDraftId = event.target.value;
    state.compareDraftId = null;
    render();
  });
  document.getElementById('compare-select')?.addEventListener('change', (event) => {
    state.compareDraftId = event.target.value || null;
    render();
  });
  document.querySelector('[data-listing-content-editor]')?.addEventListener('input', (event) => {
    const draft = state.listingWorkspace.drafts.find((item) =>
      item.id === state.selectedDraftId) || state.listingWorkspace.drafts.at(-1);
    state.listingEditContent = structuredClone(draft.content);
    const section = state.listingTab || 'shopify';
    if (section === 'buyingGuide') state.listingEditContent[section] = event.target.value;
    else if (section === 'faq') state.listingEditContent[section] = {
      manualText: event.target.value,
    };
    else state.listingEditContent[section] = {
      ...state.listingEditContent[section],
      manualText: event.target.value,
    };
    state.listingContentDirty = true;
    const save = document.getElementById('save-listing-edit');
    if (save) save.disabled = false;
  });
  document.getElementById('save-listing-edit')?.addEventListener('click', async () => {
    const selected = state.listingWorkspace.drafts.find((item) =>
      item.id === state.selectedDraftId) || state.listingWorkspace.drafts.at(-1);
    try {
      state.listingWorkspace = await api(
        `/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio/edit`,
        {
          method: 'POST',
          body: JSON.stringify({
            draftId: selected.id,
            content: state.listingEditContent,
            expectedRevision: state.listingWorkspace.storeRevision,
          }),
        },
      );
      state.selectedDraftId = state.listingWorkspace.draft.id;
      state.listingContentDirty = false;
      state.listingEditContent = null;
      render();
      toast(`Edited Draft Version ${state.listingWorkspace.draft.draftVersion} saved`);
    } catch (error) {
      toast(error.message);
    }
  });
  document.getElementById('restore-listing-version')?.addEventListener('click', async () => {
    if (!state.compareDraftId) return;
    try {
      state.listingWorkspace = await api(
        `/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio/restore`,
        {
          method: 'POST',
          body: JSON.stringify({
            draftId: state.compareDraftId,
            expectedRevision: state.listingWorkspace.storeRevision,
          }),
        },
      );
      state.selectedDraftId = state.listingWorkspace.draft.id;
      state.compareDraftId = null;
      render();
      toast(`Restored as Draft Version ${state.listingWorkspace.draft.draftVersion}`);
    } catch (error) {
      toast(error.message);
    }
  });
  document.getElementById('approve-listing-draft')?.addEventListener('click', async () => {
    const selected = state.listingWorkspace.drafts.find((item) =>
      item.id === state.selectedDraftId) || state.listingWorkspace.drafts.at(-1);
    try {
      state.listingWorkspace = await api(
        `/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            draftId: selected.id,
            expectedRevision: state.listingWorkspace.storeRevision,
          }),
        },
      );
      state.selectedDraftId = state.listingWorkspace.draft.id;
      render();
      toast(`Draft Version ${state.listingWorkspace.draft.draftVersion} Owner approved`);
    } catch (error) {
      toast(error.message);
    }
  });
  document.querySelectorAll('[data-export-listing]').forEach((button) => {
    button.addEventListener('click', async () => {
      const selected = state.listingWorkspace.drafts.find((item) =>
        item.id === state.selectedDraftId) || state.listingWorkspace.drafts.at(-1);
      try {
        const payload = await api(
          `/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio/export`,
          {
            method: 'POST',
            body: JSON.stringify({
              draftId: selected.id,
              catalogId: state.catalogProduct?.catalogProductId || '',
            }),
          },
        );
        const format = button.dataset.exportListing;
        const body = format === 'json'
          ? JSON.stringify(payload, null, 2)
          : Object.entries(payload.marketplaceContent)
            .map(([section, content]) => `${section.toUpperCase()}\n${listingText(section, content)}`)
            .join('\n\n');
        const blob = new Blob([body], { type: format === 'json' ? 'application/json' : 'text/plain' });
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = `${state.mvpProduct.sku || 'motogrip'}-listing-v${selected.draftVersion}.${format === 'json' ? 'json' : 'txt'}`;
        anchor.click();
        URL.revokeObjectURL(anchor.href);
        toast(`${format.toUpperCase()} package downloaded`);
      } catch (error) {
        toast(error.message);
      }
    });
  });
  document.querySelectorAll('[data-copy-listing]').forEach((button) => {
    button.addEventListener('click', async () => {
      const draft = state.listingWorkspace.drafts.find((item) =>
        item.id === state.selectedDraftId) || state.listingWorkspace.drafts.at(-1);
      const section = button.dataset.copyListing;
      const sections = ['shopify', 'ebay', 'etsy', 'seo', 'faq', 'buyingGuide'];
      const text = section === 'all'
        ? sections.map((item) => `${item.toUpperCase()}\n${listingText(item, draft.content[item])}`).join('\n\n')
        : listingText(section, draft.content[section]);
      try {
        await navigator.clipboard.writeText(text);
        state.copiedListingKey = section;
        render();
        toast(`${section === 'all' ? 'All listings' : section} copied`);
        window.setTimeout(() => {
          if (state.copiedListingKey === section) {
            state.copiedListingKey = null;
            render();
          }
        }, 1800);
      } catch {
        toast('Clipboard access was unavailable');
      }
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
      seoTitle: '',
      seoDescription: '',
      canonicalUrl: '',
      schemaDescription: '',
      brand: 'MOTOGRIP GEAR',
      sku: id,
      mpn: '',
      gtin: '',
      googleProductCategory: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
      productType: 'Motorcycle leather gear',
      condition: 'NewCondition',
      priceValidUntil: '',
      primaryImage: 'assets/generated/leather-detail.png',
      galleryImages: [],
      imageAltText: 'MOTOGRIP GEAR leather product',
      material: 'Leather',
      color: '',
      sizeSystem: 'US',
      sizeType: 'Regular',
      ageGroup: 'Adult',
      itemGroupId: id,
      variantOptions: ['Size', 'Leather', 'Fit'],
      shippingWeight: '',
      shippingPolicy: 'Complimentary express shipping on stock pieces',
      returnPolicy: '30-day returns on stock pieces; made-to-measure pieces are final sale with alteration support',
      ratingValue: '',
      reviewCount: '',
      careInstructions: '',
      fitNotes: '',
      leatherType: '',
      leatherOrigin: '',
      leatherThickness: '',
      lining: '',
      hardware: '',
      closureType: '',
      armorCompatibility: '',
      weatherResistance: '',
      ridingUseCase: '',
      season: '',
      craftMethod: '',
      warranty: '',
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

function bindCatalogDnaActions() {
  document.querySelectorAll('[data-link-dna]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/api/admin/catalog/products/${state.catalogProduct.catalogProductId}/link`, {
          method: 'POST',
          body: JSON.stringify({
            productUuid: button.dataset.linkDna,
            matchMethod: button.dataset.matchMethod || 'manual',
            ownerConfirmed: true,
            expectedRevision: state.catalog.linkStoreRevision,
          }),
        });
        await refreshCatalogProduct();
        toast('Product DNA link confirmed');
      } catch (error) {
        toast(error.message);
      }
    });
  });
  document.querySelectorAll('[data-reject-dna]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/api/admin/catalog/products/${state.catalogProduct.catalogProductId}/reject-suggestion`, {
          method: 'POST',
          body: JSON.stringify({
            productUuid: button.dataset.rejectDna,
            expectedRevision: state.catalog.linkStoreRevision,
          }),
        });
        await refreshCatalogProduct();
        toast('Suggested match rejected');
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function viewFromPath(pathname = window.location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';
  if (normalized === '/admin/catalog/review') return 'catalog-review';
  if (/^\/admin\/catalog\/[^/]+$/.test(normalized)) return 'catalog-detail';
  if (/^\/admin\/products\/[^/]+\/listing-studio$/.test(normalized)) return 'listing-studio';
  if (/^\/admin\/product-editor\/(?:new|[0-9a-f-]+)$/.test(normalized)) return 'product-editor';
  if (/^\/admin\/products\/(?!current$)[^/]+$/.test(normalized)) return 'product-detail';
  const route = routeEntries.find(([, , , path]) => path === normalized);
  return route?.[0] || 'dashboard';
}

async function refreshCatalogProduct() {
  state.catalog = await api('/api/admin/catalog');
  const result = await api(`/api/admin/catalog/products/${state.catalogProduct.catalogProductId}`);
  state.catalogProduct = result.product;
  state.catalogAudit = result.auditEvents || [];
  state.productDnaOptions = [];
  render();
}

async function navigateCatalogProduct(catalogProductId, replace = false) {
  state.view = 'catalog-detail';
  state.catalogProduct = null;
  state.catalogAudit = [];
  state.productDnaOptions = [];
  state.catalogError = '';
  window.history[replace ? 'replaceState' : 'pushState'](
    {},
    '',
    `/admin/catalog/${encodeURIComponent(catalogProductId)}`,
  );
  render();
  try {
    const [detail, dna] = await Promise.all([
      api(`/api/admin/catalog/products/${encodeURIComponent(catalogProductId)}`),
      api('/api/admin/catalog/product-dna'),
    ]);
    state.catalogProduct = detail.product;
    state.catalogAudit = detail.auditEvents || [];
    state.productDnaOptions = dna.products || [];
  } catch (error) {
    state.catalogError = error.message;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function navigateProduct(recordKey, replace = false) {
  state.view = 'product-detail';
  state.query = '';
  state.mvpProduct = null;
  state.productIdentityWorkspace = null;
  state.mvpError = '';
  window.history[replace ? 'replaceState' : 'pushState'](
    {},
    '',
    `/admin/products/${encodeURIComponent(recordKey)}`,
  );
  render();
  try {
    state.mvpProduct = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}`);
    [state.governance, state.productIdentityWorkspace] = await Promise.all([
      api(`/api/admin/mvp/products/${encodeURIComponent(state.mvpProduct.recordKey)}/governance`),
      api(`/api/admin/mvp/products/${state.mvpProduct.productUuid}/identity`),
    ]);
  } catch (error) {
    state.mvpError = error.message;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function navigateListingStudio(recordKey, replace = false) {
  state.view = 'listing-studio';
  state.listingWorkspace = null;
  window.history[replace ? 'replaceState' : 'pushState'](
    {},
    '',
    `/admin/products/${encodeURIComponent(recordKey)}/listing-studio`,
  );
  render();
  try {
    state.mvpProduct = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}`);
    [state.listingWorkspace, state.operationalWorkflow] = await Promise.all([
      api(`/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio`),
      api(`/api/admin/mvp/products/${state.mvpProduct.productUuid}/operational`),
    ]);
    state.selectedDraftId = state.listingWorkspace.drafts.at(-1)?.id || null;
    state.latestDraftAvailableId = null;
  } catch (error) {
    state.mvpError = error.message;
  }
  render();
}

async function navigateProductEditor(productId = null, replace = false) {
  state.view = 'product-editor';
  state.productEditorDirty = false;
  state.productEditorProduct = productId ? null : window.ProductEditorV2UI.empty();
  state.productEditorWorkspace = null;
  window.history[replace ? 'replaceState' : 'pushState'](
    {},
    '',
    `/admin/product-editor/${productId || 'new'}`,
  );
  render();
  try {
    const result = await api(productId
      ? `/api/admin/product-editor-v2/products/${encodeURIComponent(productId)}`
      : '/api/admin/product-editor-v2');
    state.productEditorWorkspace = result;
    state.productEditorProduct = productId ? result.product : window.ProductEditorV2UI.empty();
  } catch (error) {
    state.mvpError = error.message;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function refreshProductGrid() {
  state.productGrid = await api('/api/admin/product-grid');
  const validIds = new Set(state.productGrid.products.map((product) => product.id));
  state.productGridSelection = new Set([...state.productGridSelection].filter((id) => validIds.has(id)));
}

async function ensureGridEditorProduct(productId) {
  const product = state.productGrid.products.find((item) => item.id === productId);
  if (!product) throw new Error('Product was not found');
  if (product.editorProductId) return product;
  const result = await api('/api/admin/product-editor-v2/import', {
    method: 'POST',
    body: JSON.stringify({ websiteProductId: product.websiteProductId, handle: product.handle }),
  });
  await refreshProductGrid();
  return state.productGrid.products.find((item) => item.editorProductId === result.product.id) || {
    ...product,
    id: result.product.id,
    editorProductId: result.product.id,
    productUuid: result.product.productUuid,
  };
}

async function runProductGridMutation(action, productIds, values = {}) {
  try {
    state.productGrid = await api('/api/admin/product-grid/actions', {
      method: 'POST',
      body: JSON.stringify({
        action,
        productIds,
        values,
        expectedRevision: state.productGrid.storeRevision,
      }),
    });
    state.productGridSelection.clear();
    state.productGridPreviewId = null;
    toast(action === 'bulk_edit' ? 'Bulk changes saved' : `Products ${action}d`);
    render();
  } catch (error) {
    toast(error.message);
  }
}

async function runProductGridAction(action, productId) {
  try {
    const source = state.productGrid.products.find((item) => item.id === productId);
    if (!source) throw new Error('Product was not found');
    if (action === 'preview') {
      window.open(`/products/${encodeURIComponent(source.handle)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (['edit', 'editor'].includes(action)) {
      const product = await ensureGridEditorProduct(productId);
      await navigateProductEditor(product.editorProductId);
      return;
    }
    if (action === 'revise') {
      const product = await ensureGridEditorProduct(productId);
      const workspace = await api(`/api/admin/product-editor-v2/products/${encodeURIComponent(product.editorProductId)}`);
      await api(`/api/admin/product-editor-v2/products/${encodeURIComponent(product.editorProductId)}/revise`, {
        method: 'POST',
        body: JSON.stringify({ expectedRevision: workspace.storeRevision }),
      });
      await refreshProductGrid();
      toast('New product revision created');
      render();
      return;
    }
    if (action === 'duplicate') {
      state.productGrid = await api('/api/admin/product-grid/duplicate', {
        method: 'POST',
        body: JSON.stringify({ productId, expectedRevision: state.productGrid.storeRevision }),
      });
      toast('Product duplicated as a new draft');
      render();
      return;
    }
    if (['activity', 'history'].includes(action)) {
      const product = await ensureGridEditorProduct(productId);
      state.productGridHistory = await api(`/api/admin/product-grid/products/${encodeURIComponent(product.editorProductId)}/history`);
      render();
      return;
    }
    if (action === 'delete' && !window.confirm('Remove this product from the active grid? An audit-safe tombstone will remain.')) return;
    await runProductGridMutation(action, [productId]);
  } catch (error) {
    toast(error.message);
  }
}

function navigate(view, replace = false) {
  const route = routeEntries.find(([id]) => id === view) || routeEntries[0];
  state.view = route[0];
  state.query = '';
  window.history[replace ? 'replaceState' : 'pushState']({}, '', route[3]);
  render();
  if (view === 'team') loadTeamUsers().then(render).catch((error) => toast(error.message));
  if (view === 'profile') loadProfile().then(render).catch((error) => toast(error.message));
  if (view === 'product-editor') navigateProductEditor(null, true);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function loadTeamUsers() {
  if (state.identity?.user?.accountType !== 'owner') {
    state.teamUsers = [];
    return;
  }
  const response = await api('/api/admin/team/users');
  state.teamUsers = response.users || [];
}

async function loadProfile() {
  if (state.identity?.user?.accountType !== 'owner') {
    state.profile = null;
    return;
  }
  state.profile = await api('/api/admin/profile');
}

async function loadStore() {
  state.store = await api('/api/admin/store');
  state.selectedProductId = state.store.products[0]?.id || null;
  state.dirty = false;
  render();
}

async function loadMvpWorkspace() {
  try {
    const [dashboard, productResponse, productGrid] = await Promise.all([
      api('/api/admin/mvp/dashboard'),
      api('/api/admin/mvp/products'),
      api('/api/admin/product-grid'),
    ]);
    state.mvpDashboard = dashboard;
    state.mvpProducts = productResponse.products || [];
    state.productGrid = productGrid;
    state.mvpError = '';
    if (state.view === 'product-detail') {
      const recordKey = decodeURIComponent(window.location.pathname.split('/').pop() || '');
      state.mvpProduct = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}`);
      [state.governance, state.productIdentityWorkspace] = await Promise.all([
        api(`/api/admin/mvp/products/${encodeURIComponent(state.mvpProduct.recordKey)}/governance`),
        api(`/api/admin/mvp/products/${state.mvpProduct.productUuid}/identity`),
      ]);
    } else if (state.view === 'listing-studio') {
      const parts = window.location.pathname.split('/');
      const recordKey = decodeURIComponent(parts.at(-2) || '');
      state.mvpProduct = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}`);
      [state.listingWorkspace, state.operationalWorkflow] = await Promise.all([
        api(`/api/admin/mvp/products/${state.mvpProduct.productUuid}/listing-studio`),
        api(`/api/admin/mvp/products/${state.mvpProduct.productUuid}/operational`),
      ]);
      state.selectedDraftId = state.listingWorkspace.drafts.at(-1)?.id || null;
      state.latestDraftAvailableId = null;
    } else if (state.view === 'catalog-detail') {
      const catalogProductId = decodeURIComponent(window.location.pathname.split('/').pop() || '');
      const detail = await api(`/api/admin/catalog/products/${encodeURIComponent(catalogProductId)}`);
      state.catalogProduct = detail.product;
      state.catalogAudit = detail.auditEvents || [];
    } else if (state.view === 'product-editor') {
      const productId = decodeURIComponent(window.location.pathname.split('/').pop() || '');
      const result = await api(productId === 'new'
        ? '/api/admin/product-editor-v2'
        : `/api/admin/product-editor-v2/products/${encodeURIComponent(productId)}`);
      state.productEditorWorkspace = result;
      state.productEditorProduct = productId === 'new' ? window.ProductEditorV2UI.empty() : result.product;
    }
  } catch (error) {
    state.mvpError = error.message;
  }
  if (state.view === 'team') {
    try { await loadTeamUsers(); } catch {}
  }
  if (state.view === 'profile') {
    try { await loadProfile(); } catch {}
  }
  try {
    state.catalog = await api('/api/admin/catalog');
    state.catalogError = '';
  } catch (error) {
    state.catalogError = error.message;
  }
}

async function loadAdmin() {
  state.identity = await api('/api/admin/me');
  state.actorType = state.identity.actorType;
  if (state.identity.bootstrapAvailable && !state.bootstrapSkipped) {
    renderBootstrap();
    return;
  }
  await loadStore();
  await loadMvpWorkspace();
  startActivityStream();
  render();
}

let activityStream = null;
function startActivityStream() {
  if (activityStream || typeof EventSource === 'undefined') return;
  activityStream = new EventSource('/api/admin/activity-stream');
  activityStream.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (!['draft.updated', 'workflow.updated', 'website.published', 'product.grid.updated'].includes(message.type)) return;
      if (state.mvpProduct?.productUuid === message.productUuid) {
        const previousDraftId = state.selectedDraftId;
        const [workflow, workspace] = await Promise.all([
          api(`/api/admin/mvp/products/${message.productUuid}/operational`),
          api(`/api/admin/mvp/products/${message.productUuid}/listing-studio`),
        ]);
        state.operationalWorkflow = workflow;
        state.listingWorkspace = workspace;
        const latest = workspace.drafts.at(-1);
        if (latest && latest.id !== previousDraftId) {
          if (!state.listingContentDirty && !previousDraftId) {
            state.selectedDraftId = latest.id;
          } else {
            state.latestDraftAvailableId = latest.id;
          }
        }
      }
      if (['website.published', 'product.grid.updated'].includes(message.type)) {
        state.catalog = await api('/api/admin/catalog');
        const products = await api('/api/admin/mvp/products');
        state.mvpProducts = products.products || [];
        await refreshProductGrid();
      }
      render();
    } catch {}
  });
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
    state.view = viewFromPath();
    try {
      state.sidebarCollapsed = window.localStorage.getItem('motogrip-sidebar-collapsed') === 'true';
    } catch {}
    window.addEventListener('popstate', () => {
      state.view = viewFromPath();
      if (state.view === 'catalog-detail') {
        const catalogProductId = decodeURIComponent(window.location.pathname.split('/').pop() || '');
        navigateCatalogProduct(catalogProductId, true);
      } else if (state.view === 'product-detail') {
        const recordKey = decodeURIComponent(window.location.pathname.split('/').pop() || '');
        navigateProduct(recordKey, true);
      } else if (state.view === 'listing-studio') {
        const parts = window.location.pathname.split('/');
        navigateListingStudio(decodeURIComponent(parts.at(-2) || ''), true);
      } else if (state.view === 'profile') {
        loadProfile().then(render).catch((error) => toast(error.message));
      } else {
        render();
      }
    });
    window.addEventListener('keydown', (event) => {
      const target = event.target;
      const typing = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        document.getElementById(state.view === 'products' ? 'mvp-product-filter' : 'global-search')?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    });
    window.addEventListener('beforeunload', (event) => {
      if (!state.listingInputDirty && !state.listingContentDirty && !state.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
    const session = await api('/api/admin/session');
    state.authed = session.authenticated;
    state.configured = session.configured;
    state.csrfToken = session.csrfToken;
    state.actorType = session.actorType;
    if (state.authed) await loadAdmin();
    else renderLogin();
  } catch (err) {
    root.innerHTML = `<main class="login-shell"><div class="login-card">Admin failed to load: ${escapeHtml(err.message)}</div></main>`;
  }
}

init();
