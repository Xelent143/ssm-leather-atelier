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
    CREATE TABLE IF NOT EXISTS admin_subcategories (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES admin_categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (category_id, slug)
    );
    CREATE INDEX IF NOT EXISTS admin_subcategories_category_idx ON admin_subcategories(category_id, sort_order);
    CREATE TABLE IF NOT EXISTS admin_product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES admin_products(id) ON UPDATE CASCADE ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      image_bytes BYTEA NOT NULL,
      image_mime TEXT NOT NULL,
      image_name TEXT NOT NULL,
      alt_text TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS admin_product_images_product_idx ON admin_product_images(product_id, position, created_at);
    INSERT INTO admin_product_images (id, product_id, position, image_bytes, image_mime, image_name)
    SELECT 'legacy-' || id, id, 0, image_bytes, COALESCE(image_mime, 'image/jpeg'), COALESCE(image_name, 'product-image')
    FROM admin_products
    WHERE image_bytes IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
    UPDATE admin_products
    SET image_bytes = NULL, image_mime = NULL, image_name = NULL
    WHERE image_bytes IS NOT NULL;
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
  `, [id, slug, String(payload.title || ''), String(payload.description || ''), category?.id || null,
    ['active', 'draft', 'archived'].includes(payload.status) ? payload.status : 'draft', JSON.stringify(payload),
    payload.publishedAt || null]);
}

async function readStoreFromDatabase() {
  const [categoryResult, subcategoryResult, productResult, imageResult, stateResult] = await Promise.all([
    query('SELECT id, name, slug, sort_order, created_at, updated_at FROM admin_categories ORDER BY sort_order, name'),
    query('SELECT id, category_id, name, slug, sort_order FROM admin_subcategories ORDER BY category_id, sort_order, name'),
    query(`
      SELECT p.*, c.name AS category_name
      FROM admin_products p
      LEFT JOIN admin_categories c ON c.id = p.category_id
      ORDER BY p.updated_at DESC, p.title
    `),
    query('SELECT id, product_id, position, image_mime, image_name, alt_text FROM admin_product_images ORDER BY product_id, position, created_at'),
    query('SELECT settings, orders, return_requests, custom_consultations, activity, updated_at FROM admin_store_state WHERE id = TRUE'),
  ]);
  const state = stateResult.rows[0] || {};
  const imagesByProduct = new Map();
  for (const row of imageResult.rows) {
    const image = {
      id: row.id,
      name: row.image_name,
      mime: row.image_mime,
      altText: row.alt_text || '',
      position: row.position,
      url: `/api/catalog/images/${encodeURIComponent(row.product_id)}/${encodeURIComponent(row.id)}`,
    };
    if (!imagesByProduct.has(row.product_id)) imagesByProduct.set(row.product_id, []);
    imagesByProduct.get(row.product_id).push(image);
  }
  const products = productResult.rows.map((row) => {
    const uploadedImages = imagesByProduct.get(row.id) || [];
    const primaryImage = uploadedImages[0]?.url || row.payload?.primaryImage || row.payload?.image || '';
    return {
      ...(row.payload || {}),
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category_name || row.payload?.category || 'Uncategorized',
      status: row.status,
      uploadedImages,
      primaryImage,
      image: primaryImage,
      galleryImages: uploadedImages.length ? uploadedImages.slice(1).map((image) => image.url) : (row.payload?.galleryImages || []),
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    };
  });
  const subcategoriesByCategory = new Map();
  for (const row of subcategoryResult.rows) {
    if (!subcategoriesByCategory.has(row.category_id)) subcategoriesByCategory.set(row.category_id, []);
    subcategoriesByCategory.get(row.category_id).push({
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sort_order,
    });
  }
  cache = {
    settings: state.settings || {},
    products,
    categories: categoryResult.rows.map((row) => ({
      ...row,
      sortOrder: row.sort_order,
      subcategories: subcategoriesByCategory.get(row.id) || [],
    })),
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

async function saveProductImages(productId, images) {
  if (!enabled) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const product = await client.query('SELECT id FROM admin_products WHERE id = $1 FOR UPDATE', [productId]);
    if (!product.rowCount) throw new Error('Save the product draft before uploading images.');
    const count = await client.query('SELECT COUNT(*)::int AS count, COALESCE(MAX(position), -1)::int AS max_position FROM admin_product_images WHERE product_id = $1', [productId]);
    if (count.rows[0].count + images.length > 10) throw new Error('A product can have up to 10 uploaded images.');
    let position = count.rows[0].max_position + 1;
    for (const image of images) {
      await client.query(`
        INSERT INTO admin_product_images (id, product_id, position, image_bytes, image_mime, image_name, alt_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [crypto.randomUUID(), productId, position, image.buffer, image.mime, image.name, image.altText || '']);
      position += 1;
    }
    await client.query('UPDATE admin_products SET updated_at = NOW() WHERE id = $1', [productId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return readStoreFromDatabase();
}

async function saveProductImage(productId, buffer, mime, name) {
  return saveProductImages(productId, [{ buffer, mime, name, altText: '' }]);
}

async function getImage(productId, imageId = '') {
  if (!enabled) return null;
  const values = [productId];
  const imageFilter = imageId ? 'AND i.id = $2' : '';
  if (imageId) values.push(imageId);
  const result = await query(`
    SELECT i.image_bytes, i.image_mime, i.image_name, p.status
    FROM admin_product_images i
    JOIN admin_products p ON p.id = i.product_id
    WHERE i.product_id = $1 ${imageFilter}
    ORDER BY i.position, i.created_at
    LIMIT 1
  `, values);
  return result.rows[0] || null;
}

async function deleteProductImage(productId, imageId) {
  if (!enabled) return null;
  const result = await query('DELETE FROM admin_product_images WHERE id = $1 AND product_id = $2', [imageId, productId]);
  if (!result.rowCount) throw new Error('Product image not found.');
  return readStoreFromDatabase();
}

async function reorderProductImages(productId, imageIds) {
  if (!enabled) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id FROM admin_product_images WHERE product_id = $1 ORDER BY position, created_at', [productId]);
    const currentIds = current.rows.map((row) => row.id);
    if (currentIds.length !== imageIds.length || currentIds.some((id) => !imageIds.includes(id))) {
      throw new Error('Image order must include every uploaded product image exactly once.');
    }
    for (const [position, imageId] of imageIds.entries()) {
      await client.query('UPDATE admin_product_images SET position = $1, updated_at = NOW() WHERE id = $2 AND product_id = $3', [position, imageId, productId]);
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

async function addSubcategory(categoryIdValue, name) {
  if (!enabled) return null;
  const cleanName = String(name || '').trim().slice(0, 80);
  if (!cleanName) throw new Error('Subcategory name is required.');
  const category = await query('SELECT id FROM admin_categories WHERE id = $1', [categoryIdValue]);
  if (!category.rowCount) throw new Error('Choose a valid category first.');
  const slug = slugify(cleanName);
  await query(`
    INSERT INTO admin_subcategories (id, category_id, name, slug)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  `, [`sub-${categoryIdValue}-${slug}`, categoryIdValue, cleanName, slug]);
  return readStoreFromDatabase();
}

async function removeSubcategory(id) {
  if (!enabled) return null;
  await query('DELETE FROM admin_subcategories WHERE id = $1', [id]);
  return readStoreFromDatabase();
}

function getCache() {
  return cache;
}

module.exports = {
  addCategory,
  addSubcategory,
  deleteProductImage,
  getCache,
  getImage,
  init,
  isEnabled,
  removeCategory,
  removeSubcategory,
  reorderProductImages,
  saveProductImage,
  saveProductImages,
  saveStore,
};
