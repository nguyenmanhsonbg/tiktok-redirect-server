const caches = new Map();

function getNumberEnv(name, defaultValue) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : defaultValue;
}

function getCache(name) {
  if (!caches.has(name)) {
    caches.set(name, new Map());
  }

  return caches.get(name);
}

function getCacheValue(cacheName, key) {
  const cache = getCache(cacheName);
  const item = cache.get(key);

  if (!item) {
    return undefined;
  }

  if (Date.now() >= item.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return item.value;
}

function setCacheValue(cacheName, key, value, ttlMs) {
  if (ttlMs <= 0) {
    return;
  }

  getCache(cacheName).set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function deleteCacheValue(cacheName, key) {
  getCache(cacheName).delete(key);
}

function clearCache(cacheName) {
  getCache(cacheName).clear();
}

module.exports = {
  clearCache,
  deleteCacheValue,
  getCacheValue,
  getNumberEnv,
  setCacheValue,
};
