const crypto = require("crypto");

let products = [];
const productsByCode = new Map();
const initialized = true;
const cacheInstanceId =
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
const lastLoadedAt = new Date().toISOString();
let lastMutatedAt;
let mutationCount = 0;

function cloneProduct(product) {
  return {
    id: product.id,
    web_link: product.web_link,
    deep_link: product.deep_link,
    short_code: product.short_code,
  };
}

async function ensureProductCacheInitialized() {
  return products.length;
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
  lastMutatedAt = new Date().toISOString();
  mutationCount += 1;
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

  lastMutatedAt = new Date().toISOString();
  mutationCount += 1;

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
  lastMutatedAt = new Date().toISOString();
  mutationCount += 1;
  return true;
}

function isProductCacheInitialized() {
  return initialized;
}

function getProductCacheStats() {
  return {
    instanceId: cacheInstanceId,
    initialized,
    productCount: products.length,
    lastLoadedAt,
    lastMutatedAt,
    mutationCount,
  };
}

function setProductCacheDebugHeaders(res) {
  const stats = getProductCacheStats();

  res.setHeader("X-Product-Cache-Instance", stats.instanceId);
  res.setHeader("X-Product-Cache-Initialized", String(stats.initialized));
  res.setHeader("X-Product-Cache-Count", String(stats.productCount));
  res.setHeader("X-Product-Cache-Mutations", String(stats.mutationCount));

  if (stats.lastLoadedAt) {
    res.setHeader("X-Product-Cache-Loaded-At", stats.lastLoadedAt);
  }

  if (stats.lastMutatedAt) {
    res.setHeader("X-Product-Cache-Mutated-At", stats.lastMutatedAt);
  }
}

module.exports = {
  addProductToCache,
  getProductByCodeFromCache,
  getProductsFromCache,
  getProductCacheStats,
  hasProductInCache,
  isProductCacheInitialized,
  ensureProductCacheInitialized,
  removeProductFromCache,
  setProductCacheDebugHeaders,
  restoreProductToCache,
};
