const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const {
  clearAppModules,
  createResponse,
  loadModuleWithFakeDb,
} = require("./api-test-utils");

const sampleProduct = {
  id: "abc123",
  web_link: "https://example.com/web",
  deep_link: "https://example.com/app",
  short_code: "abc123",
};

test.afterEach(() => {
  clearAppModules();
});

test("cold product cache loads products from the database once", async () => {
  let queryCount = 0;
  const cache = loadModuleWithFakeDb("lib/product-cache.js", async (sql) => {
    queryCount += 1;
    assert.match(sql, /SELECT id, web_link, deep_link, short_code/i);
    return { rows: [sampleProduct] };
  });

  assert.equal(cache.isProductCacheInitialized(), false);

  const count = await cache.ensureProductCacheInitialized();

  assert.equal(count, 1);
  assert.equal(queryCount, 1);
  assert.deepEqual(cache.getProductByCodeFromCache("abc123"), sampleProduct);
});

test("get-products reads the database every time and refreshes the memory cache", async () => {
  const rowsByCall = [
    [sampleProduct],
    [
      {
        id: "def456",
        web_link: "https://example.com/next-web",
        deep_link: "https://example.com/next-app",
        short_code: "def456",
      },
    ],
  ];
  let queryCount = 0;
  const getProducts = loadModuleWithFakeDb(
    "lib/api-routes/get-products.js",
    async () => ({ rows: rowsByCall[queryCount++] })
  );

  const firstResponse = createResponse();
  await getProducts({ method: "GET", headers: {}, query: {} }, firstResponse);
  assert.equal(firstResponse.statusCode, 200);
  assert.equal(JSON.parse(firstResponse.body)[0].short_code, "abc123");

  const secondResponse = createResponse();
  await getProducts({ method: "GET", headers: {}, query: {} }, secondResponse);
  assert.equal(secondResponse.statusCode, 200);
  assert.equal(JSON.parse(secondResponse.body)[0].short_code, "def456");
  assert.equal(queryCount, 2);
});

test("redirect loads the database on cold start and uses memory on warm hits", async () => {
  let queryCount = 0;
  const redirect = loadModuleWithFakeDb("lib/api-routes/redirect.js", async () => {
    queryCount += 1;
    return { rows: [sampleProduct] };
  });

  const firstResponse = createResponse();
  await redirect(
    { method: "GET", headers: { "user-agent": "Mozilla/5.0" }, query: { code: "abc123" } },
    firstResponse
  );
  assert.equal(firstResponse.statusCode, 302);
  assert.equal(firstResponse.getHeader("Location"), "https://example.com/app");
  assert.equal(queryCount, 1);

  const secondResponse = createResponse();
  await redirect(
    { method: "GET", headers: { "user-agent": "Mozilla/5.0" }, query: { code: "abc123" } },
    secondResponse
  );
  assert.equal(secondResponse.statusCode, 302);
  assert.equal(secondResponse.getHeader("Location"), "https://example.com/app");
  assert.equal(queryCount, 1);
});

test("add-product writes the product to the database and then updates memory", async () => {
  const queries = [];
  const addProduct = loadModuleWithFakeDb("lib/api-routes/add-product.js", async (sql, params) => {
    queries.push({ sql, params });

    if (/^\s*SELECT/i.test(sql)) {
      return { rows: [] };
    }

    if (/^\s*INSERT/i.test(sql)) {
      return { rowCount: 1 };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const response = createResponse();
  await addProduct(
    {
      method: "POST",
      headers: {},
      query: {},
      body: {
        webLink1: "https://example.com/web",
        webLink2: "https://example.com/app",
      },
    },
    response
  );

  assert.equal(response.statusCode, 201);
  const createdProduct = JSON.parse(response.body).product;
  const insertQuery = queries.find(({ sql }) => /^\s*INSERT/i.test(sql));
  assert.ok(insertQuery);
  assert.deepEqual(insertQuery.params, [
    createdProduct.short_code,
    "https://example.com/web",
    "https://example.com/app",
    createdProduct.short_code,
  ]);

  const cache = require(path.join(__dirname, "..", "lib", "product-cache.js"));
  assert.equal(cache.getProductByCodeFromCache(createdProduct.short_code).short_code, createdProduct.short_code);
});

test("add-product retries when the database reports a duplicate short code", async () => {
  let insertAttempts = 0;
  const addProduct = loadModuleWithFakeDb("lib/api-routes/add-product.js", async (sql) => {
    if (/^\s*SELECT/i.test(sql)) {
      return { rows: [] };
    }

    if (/^\s*INSERT/i.test(sql)) {
      insertAttempts += 1;

      if (insertAttempts === 1) {
        const error = new Error("duplicate key value violates unique constraint");
        error.code = "23505";
        throw error;
      }

      return { rowCount: 1 };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const response = createResponse();
  await addProduct(
    {
      method: "POST",
      headers: {},
      query: {},
      body: {
        webLink1: "https://example.com/web",
        webLink2: "https://example.com/app",
      },
    },
    response
  );

  assert.equal(response.statusCode, 201);
  assert.equal(insertAttempts, 2);
});

test("delete-product removes the product from the database and memory cache", async () => {
  const queries = [];
  const deleteProduct = loadModuleWithFakeDb(
    "lib/api-routes/delete-product.js",
    async (sql, params) => {
      queries.push({ sql, params });

      if (/^\s*SELECT/i.test(sql)) {
        return { rows: [sampleProduct] };
      }

      if (/^\s*DELETE/i.test(sql)) {
        return { rowCount: 1, rows: [{ id: sampleProduct.id }] };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    }
  );

  const response = createResponse();
  await deleteProduct(
    { method: "DELETE", headers: {}, query: { code: "abc123" } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.ok(queries.some(({ sql }) => /^\s*DELETE/i.test(sql)));

  const cache = require(path.join(__dirname, "..", "lib", "product-cache.js"));
  assert.equal(cache.getProductByCodeFromCache("abc123"), undefined);
});

test("update-product writes product changes to the database and refreshes memory", async () => {
  const updatedProduct = {
    id: "abc123",
    web_link: "https://example.com/updated-web",
    deep_link: "https://example.com/updated-app",
    short_code: "abc123",
  };
  const queries = [];
  const updateProduct = loadModuleWithFakeDb(
    "lib/api-routes/update-product.js",
    async (sql, params) => {
      queries.push({ sql, params });

      if (/^\s*SELECT/i.test(sql)) {
        return { rows: [sampleProduct] };
      }

      if (/^\s*UPDATE/i.test(sql)) {
        return { rowCount: 1, rows: [updatedProduct] };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    }
  );

  const response = createResponse();
  await updateProduct(
    {
      method: "PUT",
      headers: {},
      query: {},
      body: {
        code: "abc123",
        webLink1: "https://example.com/updated-web",
        webLink2: "https://example.com/updated-app",
      },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.match(response.getHeader("Access-Control-Allow-Methods"), /PUT/);
  assert.match(response.getHeader("Access-Control-Allow-Methods"), /PATCH/);
  assert.ok(queries.some(({ sql }) => /^\s*UPDATE/i.test(sql)));

  const cache = require(path.join(__dirname, "..", "lib", "product-cache.js"));
  assert.deepEqual(cache.getProductByCodeFromCache("abc123"), updatedProduct);
});
