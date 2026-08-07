const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

test("loadEnvFile loads env values without overriding existing process env", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "redirect-env-"));
  const envPath = path.join(tempDir, ".env");
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousPoolMax = process.env.PG_POOL_MAX;

  fs.writeFileSync(
    envPath,
    [
      "DATABASE_URL=postgresql://user:password@example.com/db?sslmode=require&channel_binding=require",
      "PG_POOL_MAX=7",
      "EMPTY_VALUE=",
      "# COMMENT=value",
    ].join("\n")
  );

  try {
    process.env.DATABASE_URL = "postgresql://already-set/example";
    delete process.env.PG_POOL_MAX;
    delete process.env.EMPTY_VALUE;

    const { loadEnvFile } = require("../lib/env");
    loadEnvFile(envPath);

    assert.equal(process.env.DATABASE_URL, "postgresql://already-set/example");
    assert.equal(process.env.PG_POOL_MAX, "7");
    assert.equal(process.env.EMPTY_VALUE, "");
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }

    if (previousPoolMax === undefined) {
      delete process.env.PG_POOL_MAX;
    } else {
      process.env.PG_POOL_MAX = previousPoolMax;
    }

    delete process.env.EMPTY_VALUE;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
