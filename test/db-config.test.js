const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const dbModulePath = path.join(__dirname, "..", "lib", "db.js");

test.afterEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.PG_POOL_MAX;
  delete require.cache[dbModulePath];
});

test("database URL with channel_binding=require enables pg channel binding", () => {
  process.env.DATABASE_URL =
    "postgresql://user:password@example.com/db?sslmode=require&channel_binding=require";
  process.env.PG_POOL_MAX = "3";
  delete require.cache[dbModulePath];

  const { getPoolConfig } = require(dbModulePath);
  const config = getPoolConfig();

  assert.match(config.connectionString, /sslmode=verify-full/);
  assert.match(config.connectionString, /channel_binding=require/);
  assert.equal(config.enableChannelBinding, true);
  assert.equal(config.max, 3);
  assert.equal(Object.hasOwn(config, "ssl"), false);
});
