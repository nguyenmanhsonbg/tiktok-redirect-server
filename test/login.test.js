const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function createElement() {
  return {
    style: {},
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    appendChild() {},
    addEventListener() {},
    reset() {},
  };
}

function loadDashboardScript() {
  const elements = new Map();
  const container = createElement();
  const source = fs.readFileSync(
    path.join(__dirname, "..", "public", "app.js"),
    "utf8"
  );
  const context = {
    alert() {},
    confirm: () => true,
    console,
    document: {
      createElement,
      getElementById(id) {
        if (!elements.has(id)) {
          elements.set(id, createElement());
        }

        return elements.get(id);
      },
      querySelector(selector) {
        return selector === ".container" ? container : createElement();
      },
    },
    fetch: async () => ({
      ok: true,
      json: async () => [],
    }),
    localStorage: {
      getItem: () => null,
      removeItem() {},
      setItem() {},
    },
    navigator: {
      clipboard: {
        writeText: async () => {},
      },
    },
  };

  context.window = context;
  vm.runInNewContext(source, context, { filename: "public/app.js" });
  return context;
}

test("login validation allows only the hardcoded admin account", () => {
  const context = loadDashboardScript();

  assert.equal(typeof context.isAdminLogin, "function");
  assert.equal(context.isAdminLogin("admin", "admin"), true);
  assert.equal(context.isAdminLogin("admin", "wrong"), false);
  assert.equal(context.isAdminLogin("wrong", "admin"), false);
  assert.equal(context.isAdminLogin(" admin", "admin"), false);
  assert.equal(context.isAdminLogin("admin", " admin"), false);
});
