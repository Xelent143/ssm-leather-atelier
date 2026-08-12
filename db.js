const crypto = require('crypto');

let Pool;
try {
  ({ Pool } = require('pg'));
} catch {
  Pool = null;
}

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const enabled = Boolean(databaseUrl && Pool);
let pool = null;
let cache = null;

function isEnabled() {
  return enabled;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `category-${crypto.randomUUID()}`;
}

function categoryId(name) {
  return `cat-${slugify(name)}`;
}

function productPayload(product, categoryName) {
  return {
    ...product,
    category: categoryName || product.category || 'Uncategorized',
    primaryImage: product.primaryImage || product.image || '',
    image: product.image || product.primaryImage || '',
  };
}

async function query(text, values) {
  return pool.query(text, values);
}

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admin_products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category_id TEXT REFERENCES admin_categories(id) ON UPDATE CASCADE,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      image_bytes BYTEA,
      image_mime TEXT,
      image_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS admin_products_status_idx ON admin_products(status);
    CREATE TABLE IF NOT EXISTS admin_store_state (
      id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      orders JSONB NOT NULL DEFAULT '[]'::jsonb,
      return_requests JSONB NOT NULL DEFAULT '[]'::jsonb,
      custom_consultations JSONB NOT NULL DEFAULT '[]'::jsonb,
      activity JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE admin_store_state ADD COLUMN IF NOT EXISTS custom_consultations JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);
}

function defaultCategoryNames(store) {
  const names = (store.categories || []).map((category) => category.name || category).filter(Boolean);
  for (const product of store.products || []) if (product.category) names.push(product.category);
  return [...new Map(names.map((name) => [String(name).trim().toLowerCase(), String(name).trim()])).values()];
}

async function ensureCategories(client, names) {
  const uniqueNames = [...new Map(names.map((name) => [String(name).trim().toLowerCase(), String(name).trim()])).values()]
    .filter(Boolean);
  for (const [index, name] of uniqueNames.entries()) {
    await client.query(`
      INSERT INTO admin_categories (id, name, slug, sort_order)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    `, [categoryId(name), name, slugify(name), index]);
  }
}

async function upsertProduct(client, product, categoryMap) {
  const categoryName = String(product.category || 'Uncategorized').trim() || 'Uncategorized';
  const category = categoryMap.get(categoryName.toLowerCase());
  const id = String(product.id || crypto.randomUUID());
  const slug = slugify(product.slug || product.title || id);
  const payload = productPayload({ ...product, id, slug }, categoryName);
  await client.query(`
    INSERT INTO admin_products (id, slug, title, description, category_id, status, payload, updated_at, published_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), CASE WHEN $6 = 'active' THEN COALESCE($8, NOW()) ELSE NULL END)
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category_id = EXCLUDED.category_id,
      status = EXCLUDED.status,
      payload = EXCLUDED.payload,
      updated_at = NOW(),
      published_at = CASE
        WHEN EXCLUDED.status = 'active' THEN COALESCE(admin_products.published_at, NOW())
        ELSE NULL
      END
  `, [id, slug, String(payload.title || 'Untitled product'), String(payload.description || ''), category?.id || null,
    ['active', 'draft', 'archived'].includes(payload.status) ? payload.status : 'draft', JSON.stringify(payload),
    payload.publishedAt || null]);
}

async function readStoreFromDatabase() {
  const [categoryResult, productResult, stateResult] = await Promise.all([
    query('SELECT id, name, slug, sort_order, created_at, updated_at FROM admin_categories ORDER BY sort_order, name'),
    query(`
      SELECT p.*, c.name AS category_name
      FROM admin_products p
      LEFT JOIN admin_categories c ON c.id = p.category_id
      ORDER BY p.updated_at DESC, p.title
    `),
    query('SELECT settings, orders, return_requests, custom_consultations, activity, updated_at FROM admin_store_state WHERE id = TRUE'),
  ]);
  const state = stateResult.rows[0] || {};
  const products = productResult.rows.map((row) => ({
    ...(row.payload || {}),
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category_name || row.payload?.category || 'Uncategorized',
    status: row.status,
    primaryImage: row.image_bytes ? `/api/catalog/images/${encodeURIComponent(row.id)}` : (row.payload?.primaryImage || row.payload?.image || ''),
    image: row.image_bytes ? `/api/catalog/images/${encodeURIComponent(row.id)}` : (row.payload?.image || row.payload?.primaryImage || ''),
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }));
  cache = {
    settings: state.settings || {},
    products,
    categories: categoryResult.rows,
    orders: state.orders || [],
    returnRequests: state.return_requests || [],
    customConsultations: state.custom_consultations || [],
    activity: state.activity || [],
    updatedAt: state.updated_at || new Date().toISOString(),
  };
  return cache;
}

async function init(seedStore) {
  if (!enabled) return null;
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DATABASE_POOL_MAX || 5),
  });
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const count = await client.query('SELECT COUNT(*)::int AS count FROM admin_products');
    const state = await client.query('SELECT id FROM admin_store_state WHERE id = TRUE');
    if (count.rows[0].count === 0 && (seedStore.products || []).length) {
      const names = defaultCategoryNames(seedStore);
      await ensureCategories(client, names);
      const categoryRows = await client.query('SELECT id, name FROM admin_categories');
      const categoryMap = new Map(categoryRows.rows.map((row) => [row.name.toLowerCase(), row]));
      for (const product of seedStore.products) await upsertProduct(client, product, categoryMap);
    }
    if (!state.rows.length) {
      await client.query(`
        INSERT INTO admin_store_state (id, settings, orders, return_requests, custom_consultations, activity)
        VALUES (TRUE, $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb)
      `, [JSON.stringify(seedStore.settings || {}), JSON.stringify(seedStore.orders || []), JSON.stringify(seedStore.returnRequests || []), JSON.stringify(seedStore.customConsultations || []), JSON.stringify(seedStore.activity || [])]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return readStoreFromDatabase();
}

async function saveStore(store) {
  if (!enabled) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureCategories(client, defaultCategoryNames(store));
    const categoryRows = await client.query('SELECT id, name FROM admin_categories');
    const categoryMap = new Map(categoryRows.rows.map((row) => [row.name.toLowerCase(), row]));
    for (const product of store.products || []) await upsertProduct(client, product, categoryMap);
    await client.query(`
      INSERT INTO admin_store_state (id, settings, orders, return_requests, custom_consultations, activity, updated_at)
      VALUES (TRUE, $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, orders = EXCLUDED.orders,
        return_requests = EXCLUDED.return_requests, custom_consultations = EXCLUDED.custom_consultations,
        activity = EXCLUDED.activity, updated_at = NOW()
    `, [JSON.stringify(store.settings || {}), JSON.stringify(store.orders || []), JSON.stringify(store.returnRequests || []), JSON.stringify(store.customConsultations || []), JSON.stringify(store.activity || [])]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return readStoreFromDatabase();
}

async function saveProductImage(id, buffer, mime, name) {
  if (!enabled) return null;
  const result = await query('UPDATE admin_products SET image_bytes = $2, image_mime = $3, image_name = $4, updated_at = NOW() WHERE id = $1', [id, buffer, mime, name]);
  if (!result.rowCount) throw new Error('Save the product draft before uploading an image.');
  return readStoreFromDatabase();
}

async function getImage(id) {
  if (!enabled) return null;
  const result = await query('SELECT image_bytes, image_mime, image_name, status FROM admin_products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function addCategory(name) {
  if (!enabled) return null;
  const cleanName = String(name || '').trim().slice(0, 80);
  if (!cleanName) throw new Error('Category name is required.');
  await query('INSERT INTO admin_categories (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING', [categoryId(cleanName), cleanName, slugify(cleanName)]);
  return readStoreFromDatabase();
}

async function removeCategory(id) {
  if (!enabled) return null;
  const used = await query('SELECT COUNT(*)::int AS count FROM admin_products WHERE category_id = $1', [id]);
  if (used.rows[0].count) throw new Error('Reassign products in this category before removing it.');
  await query('DELETE FROM admin_categories WHERE id = $1', [id]);
  return readStoreFromDatabase();
}

function getCache() {
  return cache;
}

module.exports = {
  addCategory,
  getCache,
  getImage,
  init,
  isEnabled,
  removeCategory,
  saveProductImage,
  saveStore,
};
