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
routeEntries.push(['current-products', '□', 'Current Product Manager', '/admin/products/current', 'existing']);
routeEntries.push(['product-detail', '□', 'Product Detail', '/admin/products/:recordKey', 'active']);

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
  if (state.view === 'product-detail') {
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
        <span class="nav-copy">${state.mvpProducts.length || state.store.products.length} products · Owner workspace</span>
      </div>
    </aside>
  `;
}

function Topbar() {
  const owner = state.identity?.owner;
  const profileName = owner?.displayName || (state.actorType === 'legacy' ? 'Legacy owner' : 'Owner');
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
          <span class="profile-copy"><strong>${escapeHtml(profileName)}</strong><small>${escapeHtml(state.actorType === 'named_user' ? 'Named owner' : 'Compatibility access')}</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div class="profile-menu" id="profile-menu">
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
    ${PageHeader('Current Product Manager', 'The existing catalog editor is preserved here with its original read/write behavior.', '<a class="btn" data-route="products" href="/admin/products">Back to product shell</a><button class="btn primary" id="new-product">Add product</button>', 'existing')}
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
    ${PageHeader('Products', 'A scalable catalog workspace layered safely over the existing product store.', '<button class="btn" type="button" disabled title="Requires a future catalog workflow">Import</button><button class="btn" type="button" disabled>Export</button><a class="btn primary" data-route="current-products" href="/admin/products/current">Open Current Product Manager</a>', 'existing')}
    ${AlertPanel('Existing workflow preserved', 'This overview is read-only. Product creation and editing continue only inside the Current Product Manager.', 'info')}
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
        <thead><tr><th>Product</th><th>Brand</th><th>Type</th><th>Governance</th><th>Inventory</th></tr></thead>
        <tbody>
          ${products.map((product) => `
            <tr class="clickable" data-mvp-product="${escapeHtml(product.recordKey)}" tabindex="0" aria-label="Open ${escapeHtml(product.title)}">
              <td><div class="resource"><div class="thumb product-thumb"><img src="${escapeHtml(product.image)}" alt=""></div><div><strong>${escapeHtml(product.title)}</strong><br><span class="muted">${escapeHtml(product.sku)}${product.legacyId ? ` · ${escapeHtml(product.legacyId)}` : ''}</span></div></div></td>
              <td>${escapeHtml(product.brand)}</td>
              <td>${escapeHtml(formatProductType(product.productType))}</td>
              <td>${governanceBadge(product.governance)}</td>
              <td>${Number(product.inventory || 0)}</td>
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
  return `
    ${PageHeader('Dashboard', 'A focused read-only view of product governance and the work that needs attention.', '<a class="btn primary" data-route="products" href="/admin/products">View products</a>', 'active')}
    <div class="grid stats mvp-stats">
      ${StatCard('Products', String(dashboard.productCount), 'Current internal product records')}
      ${StatCard('Governed', String(dashboard.governedCount), 'Approved release and Knowledge Lock')}
      ${StatCard('Action required', String(dashboard.actionRequiredCount), 'Products not yet fully governed')}
      ${StatCard('Not migrated', String(dashboard.notMigratedCount), 'Still available through legacy compatibility')}
    </div>
    <div class="grid dashboard-two mvp-dashboard-grid">
      <section class="card">
        <div class="card-head"><div><h2>Product work queue</h2><p>Read-only guidance for Micro Sprint 1</p></div>${statusBadge('existing', 'Live data')}</div>
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
          <p class="muted">Micro Sprint 1 is read-only. Governed write actions arrive only after Micro Sprint 2 approval.</p>
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
  const products = filteredMvpProducts();
  return `
    ${PageHeader('Products', 'Browse current product records and inspect their governed PLM readiness.', '<a class="btn" data-route="current-products" href="/admin/products/current">Open Current Product Manager</a>', 'active')}
    ${AlertPanel('Read-only workspace', 'No product, storefront, inventory, pricing, or governance data can be changed from this screen.', 'info')}
    <div class="shell-gap"></div>
    <div class="filter-bar mvp-filter-bar">
      <label class="filter-search"><span class="sr-only">Search products</span><input id="mvp-product-filter" value="${escapeHtml(state.query)}" placeholder="Search products, SKU, type, or governance status"></label>
      <span class="filter-spacer"></span>
      <span class="muted">${products.length} of ${state.mvpProducts.length} products</span>
    </div>
    <section class="card">
      ${mvpProductRows(products)}
    </section>
  `;
}

function definitionRow(label, value, mono = false) {
  return `<div><dt>${escapeHtml(label)}</dt><dd class="${mono ? 'mono' : ''}">${escapeHtml(value || 'Not assigned')}</dd></div>`;
}

function governanceStep(label, complete, value) {
  return `<li class="${complete ? 'complete' : ''}"><span aria-hidden="true">${complete ? '✓' : '○'}</span><div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(value)}</small></div></li>`;
}

function renderMvpProductDetail() {
  const product = state.mvpProduct;
  if (!product) {
    return `${PageHeader('Product Detail', 'Read-only governed product view.', '<a class="btn" data-route="products" href="/admin/products">Back to products</a>')}${state.mvpError ? AlertPanel('Product unavailable', state.mvpError, 'warning') : LoadingSkeleton()}`;
  }
  const governance = product.governance;
  const actions = `
    <a class="btn" data-route="current-products" href="/admin/products/current">Current Product Manager</a>
    ${product.storefrontPath ? `<a class="btn" href="${escapeHtml(product.storefrontPath)}" target="_blank" rel="noreferrer">View storefront</a>` : ''}
  `;
  return `
    ${PageHeader(product.title, `${product.brand} · ${formatProductType(product.productType)} · ${product.styleCode}`, actions, governance.state === 'governed' ? 'active' : 'existing')}
    <div class="product-hero card">
      <div class="product-hero-media"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}"></div>
      <div class="product-hero-copy">
        <div class="button-row">${governanceBadge(governance)} ${statusBadge(product.source === 'plm_linked' ? 'active' : 'planned', product.source === 'plm_linked' ? 'PLM linked' : 'Legacy source')}</div>
        <h2>${escapeHtml(product.title)}</h2>
        <p>${escapeHtml(governance.nextAction)}</p>
        <div class="product-facts-inline"><span><small>SKU</small><strong>${escapeHtml(product.sku)}</strong></span><span><small>Inventory</small><strong>${Number(product.inventory || 0)}</strong></span><span><small>Price</small><strong>${money(product.price)}</strong></span></div>
      </div>
    </div>
    <div class="grid product-detail-grid">
      <section class="card">
        <div class="card-head"><div><h2>Product identity</h2><p>Durable identifiers and ownership</p></div>${statusBadge('existing', 'Read only')}</div>
        <dl class="definition-grid">
          ${definitionRow('Product UUID', product.productUuid || 'Not migrated', true)}
          ${definitionRow('Legacy ID', product.legacyId, true)}
          ${definitionRow('Brand', product.brand)}
          ${definitionRow('Legal entity', product.legalEntity)}
          ${definitionRow('Product family', product.family)}
          ${definitionRow('Product type', formatProductType(product.productType))}
          ${definitionRow('Style code', product.styleCode, true)}
          ${definitionRow('Sellable items', String(product.sellableItemCount))}
        </dl>
      </section>
      <aside class="card">
        <div class="card-head"><h2>Governance checklist</h2></div>
        <ol class="governance-checklist">
          ${governanceStep('Product identity', Boolean(product.productUuid), product.productUuid ? 'Durable UUID assigned' : 'PLM migration required')}
          ${governanceStep('Product hierarchy', product.family !== 'Not assigned' && product.styleCode !== 'Not assigned', `${product.family} · ${product.styleCode}`)}
          ${governanceStep('Product Version', governance.versionCount > 0, governance.latestVersionNumber ? `Version ${governance.latestVersionNumber}` : 'No immutable version')}
          ${governanceStep('Approval Request', governance.approvalRequestCount > 0, governance.approvalRequestCount ? `${governance.approvalRequestCount} request(s)` : 'No approval request')}
          ${governanceStep('Approved Release', ['approved', 'active'].includes(governance.releaseState), governance.latestReleaseNumber ? `Release ${governance.latestReleaseNumber} · ${governance.releaseState}` : 'No release')}
          ${governanceStep('Knowledge Lock', governance.knowledgeLockValid, governance.knowledgeLockValid ? 'Integrity validated on read' : 'No valid lock')}
        </ol>
        <div class="card-pad governance-note"><strong>Micro Sprint 1</strong><p>No actions are available here yet. This screen cannot change product or governance data.</p></div>
      </aside>
    </div>
    <section class="card">
      <div class="card-head"><div><h2>Media references</h2><p>Original media metadata only</p></div><span class="muted">${product.originalMediaReferences.length} reference(s)</span></div>
      <div class="media-reference-grid">
        ${product.originalMediaReferences.length ? product.originalMediaReferences.map((media) => `
          <article><span class="media-reference-icon" aria-hidden="true">▧</span><div><strong>${escapeHtml(media.role || 'Source media')}</strong><p>${escapeHtml(media.reference || 'Reference unavailable')}</p><small>${escapeHtml(media.sourceSystem || 'PLM')}</small></div></article>
        `).join('') : EmptyState('No governed media references', 'Existing legacy product imagery remains visible above without being copied into PLM.')}
      </div>
    </section>
  `;
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
    products: renderMvpProducts,
    'product-detail': renderMvpProductDetail,
    'current-products': renderCurrentProductManager,
    'ai-product': renderAIProductStudio,
    marketing: renderMarketingCenter,
    social: renderSocialCenter,
    factory: renderFactoryShell,
    production: renderFactoryShell,
  };
  root.innerHTML = AdminLayout((views[state.view] || renderGenericModule)());
  bindShell();
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
  document.getElementById('product-shell-filter')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });
  document.getElementById('mvp-product-filter')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
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

function viewFromPath(pathname = window.location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';
  if (/^\/admin\/products\/(?!current$)[^/]+$/.test(normalized)) return 'product-detail';
  const route = routeEntries.find(([, , , path]) => path === normalized);
  return route?.[0] || 'dashboard';
}

async function navigateProduct(recordKey, replace = false) {
  state.view = 'product-detail';
  state.query = '';
  state.mvpProduct = null;
  state.mvpError = '';
  window.history[replace ? 'replaceState' : 'pushState'](
    {},
    '',
    `/admin/products/${encodeURIComponent(recordKey)}`,
  );
  render();
  try {
    state.mvpProduct = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}`);
  } catch (error) {
    state.mvpError = error.message;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function navigate(view, replace = false) {
  const route = routeEntries.find(([id]) => id === view) || routeEntries[0];
  state.view = route[0];
  state.query = '';
  window.history[replace ? 'replaceState' : 'pushState']({}, '', route[3]);
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function loadStore() {
  state.store = await api('/api/admin/store');
  state.selectedProductId = state.store.products[0]?.id || null;
  state.dirty = false;
  render();
}

async function loadMvpWorkspace() {
  try {
    const [dashboard, productResponse] = await Promise.all([
      api('/api/admin/mvp/dashboard'),
      api('/api/admin/mvp/products'),
    ]);
    state.mvpDashboard = dashboard;
    state.mvpProducts = productResponse.products || [];
    state.mvpError = '';
    if (state.view === 'product-detail') {
      const recordKey = decodeURIComponent(window.location.pathname.split('/').pop() || '');
      state.mvpProduct = await api(`/api/admin/mvp/products/${encodeURIComponent(recordKey)}`);
    }
  } catch (error) {
    state.mvpError = error.message;
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
    state.view = viewFromPath();
    try {
      state.sidebarCollapsed = window.localStorage.getItem('motogrip-sidebar-collapsed') === 'true';
    } catch {}
    window.addEventListener('popstate', () => {
      state.view = viewFromPath();
      if (state.view === 'product-detail') {
        const recordKey = decodeURIComponent(window.location.pathname.split('/').pop() || '');
        navigateProduct(recordKey, true);
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
