const assert = require("node:assert/strict");
const test = require("node:test");

function createRequest(url, method = "GET") {
  return {
    url,
    method,
    headers: {},
    query: {},
    [Symbol.asyncIterator]: async function* iterator() {},
  };
}

function createResponse() {
  return {
    headers: {},
    headersSent: false,
    statusCode: 200,
    body: undefined,
    destroyed: false,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    hasHeader(name) {
      return Object.prototype.hasOwnProperty.call(this.headers, name.toLowerCase());
    },
    end(body) {
      this.body = body;
      this.headersSent = true;
    },
    destroy(error) {
      this.destroyed = true;
      this.destroyError = error;
    },
  };
}

function clearAppModules() {
  for (const modulePath of [
    "../api/index",
    "../lib/api-router",
    "../lib/api-routes/add-product",
    "../lib/api-routes/delete-product",
    "../lib/api-routes/get-products",
    "../lib/api-routes/redirect",
    "../lib/product-cache",
    "../lib/db",
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
}

test("api handler adds response helpers for serverless requests", async () => {
  clearAppModules();
  const handler = require("../api/index");
  const res = createResponse();

  await handler(createRequest("/api/index?route=missing"), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.getHeader("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(res.body), { error: "API route not found." });
});

test("api handler returns JSON 500 when routing throws unexpectedly", async () => {
  clearAppModules();
  const routerPath = require.resolve("../lib/api-router");

  require.cache[routerPath] = {
    id: routerPath,
    filename: routerPath,
    loaded: true,
    exports: {
      handleApiRequest: async () => {
        throw new Error("boom");
      },
    },
  };

  const handler = require("../api/index");
  const res = createResponse();
  const originalConsoleError = console.error;

  console.error = () => {};

  try {
    await handler(createRequest("/api/index?route=get-products"), res);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(res.statusCode, 500);
  assert.equal(res.getHeader("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(res.body), { error: "Internal server error." });
  assert.equal(res.destroyed, false);
});
