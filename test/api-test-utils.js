const path = require("node:path");
const { attachResponseHelpers } = require("../lib/http");

const rootDir = path.join(__dirname, "..");
const appModulePaths = [
  path.join(rootDir, "lib", "api-routes", "add-product.js"),
  path.join(rootDir, "lib", "api-routes", "delete-product.js"),
  path.join(rootDir, "lib", "api-routes", "get-products.js"),
  path.join(rootDir, "lib", "api-routes", "redirect.js"),
  path.join(rootDir, "lib", "api-routes", "update-product.js"),
  path.join(rootDir, "lib", "product-cache.js"),
  path.join(rootDir, "lib", "product-repository.js"),
  path.join(rootDir, "lib", "db.js"),
];

function clearAppModules() {
  for (const modulePath of appModulePaths) {
    delete require.cache[modulePath];
  }
}

function loadModuleWithFakeDb(relativePath, query) {
  clearAppModules();

  const dbModulePath = path.join(rootDir, "lib", "db.js");
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: { query },
  };

  return require(path.join(rootDir, relativePath));
}

function createResponse() {
  const headers = new Map();
  const res = {
    body: "",
    headersSent: false,
    statusCode: 200,
    destroyedWith: undefined,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    hasHeader(name) {
      return headers.has(String(name).toLowerCase());
    },
    end(body = "") {
      this.body = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
      this.headersSent = true;
      return this;
    },
    destroy(error) {
      this.destroyedWith = error;
    },
  };

  return attachResponseHelpers(res);
}

module.exports = {
  clearAppModules,
  createResponse,
  loadModuleWithFakeDb,
};
