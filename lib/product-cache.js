const { query } = require("./db");

let products = [];
const productsByCode = new Map();
let initialized = false;
let initializationPromise;

function cloneProduct(product) {
  return {
    id: product.id,
    web_link: product.web_link,
    deep_link: product.deep_link,
    short_code: product.short_code,
  };
}

function setProducts(nextProducts) {
  products = [];
  productsByCode.clear();

  for (const product of nextProducts) {
    if (!product || !product.short_code || productsByCode.has(product.short_code)) {
      continue;
    }

    const cachedProduct = cloneProduct(product);
    products.push(cachedProduct);
    productsByCode.set(cachedProduct.short_code, cachedProduct);
  }

  initialized = true;
}

async function loadProductsCacheFromDatabase() {
  const result = await query(
    `
      SELECT id, web_link, deep_link, short_code
      FROM products
      ORDER BY created_at DESC
    `
  );

  setProducts(result.rows);
  return products.length;
}

async function ensureProductCacheInitialized() {
  if (initialized) {
    return products.length;
  }

  if (!initializationPromise) {
    initializationPromise = loadProductsCacheFromDatabase().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
}

function ensureInitialized() {
  if (!initialized) {
    throw new Error("Product cache has not been initialized.");
  }
}

function getProductsFromCache() {
  ensureInitialized();
  return products.map(cloneProduct);
}

function getProductByCodeFromCache(code) {
  ensureInitialized();

  const product = productsByCode.get(String(code));
  return product ? cloneProduct(product) : undefined;
}

function hasProductInCache(code) {
  ensureInitialized();
  return productsByCode.has(String(code));
}

function addProductToCache(product) {
  ensureInitialized();

  if (!product || !product.short_code) {
    throw new Error("Product short_code is required.");
  }

  if (productsByCode.has(product.short_code)) {
    return false;
  }

  const cachedProduct = cloneProduct(product);
  products.unshift(cachedProduct);
  productsByCode.set(cachedProduct.short_code, cachedProduct);
  return true;
}

function removeProductFromCache(code) {
  ensureInitialized();

  const shortCode = String(code);
  const product = productsByCode.get(shortCode);

  if (!product) {
    return undefined;
  }

  const index = products.findIndex((item) => item.short_code === shortCode);
  productsByCode.delete(shortCode);

  if (index >= 0) {
    products.splice(index, 1);
  }

  return {
    index,
    product: cloneProduct(product),
  };
}

function restoreProductToCache(product, index = 0) {
  ensureInitialized();

  if (!product || !product.short_code || productsByCode.has(product.short_code)) {
    return false;
  }

  const cachedProduct = cloneProduct(product);
  const restoreIndex = Math.max(0, Math.min(index, products.length));

  products.splice(restoreIndex, 0, cachedProduct);
  productsByCode.set(cachedProduct.short_code, cachedProduct);
  return true;
}

function isProductCacheInitialized() {
  return initialized;
}

module.exports = {
  addProductToCache,
  getProductByCodeFromCache,
  getProductsFromCache,
  hasProductInCache,
  isProductCacheInitialized,
  ensureProductCacheInitialized,
  loadProductsCacheFromDatabase,
  removeProductFromCache,
  restoreProductToCache,
};
