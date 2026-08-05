const assert = require("node:assert/strict");
const test = require("node:test");

function clearProductCacheModules() {
  for (const modulePath of ["../lib/product-cache", "../lib/db"]) {
    delete require.cache[require.resolve(modulePath)];
  }
}

test("product cache does not query the database during module load", () => {
  clearProductCacheModules();
  const dbPath = require.resolve("../lib/db");
  let queryCount = 0;

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: async () => {
        queryCount += 1;
        return { rows: [] };
      },
    },
  };

  require("../lib/product-cache");

  assert.equal(queryCount, 0);
});

test("product cache initializes from the database on demand", async () => {
  clearProductCacheModules();
  const dbPath = require.resolve("../lib/db");

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: async () => ({
        rows: [
          {
            id: "abc",
            web_link: "https://example.com",
            deep_link: "app://product",
            short_code: "abc",
          },
        ],
      }),
    },
  };

  const cache = require("../lib/product-cache");

  assert.equal(cache.isProductCacheInitialized(), false);
  assert.equal(await cache.ensureProductCacheInitialized(), 1);
  assert.deepEqual(cache.getProductByCodeFromCache("abc"), {
    id: "abc",
    web_link: "https://example.com",
    deep_link: "app://product",
    short_code: "abc",
  });
});
