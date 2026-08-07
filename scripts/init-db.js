const fs = require("node:fs");
const path = require("node:path");
const { endPool, query } = require("../lib/db");

async function main() {
  const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await query(schemaSql);
  console.log("Database schema initialized.");
}

main()
  .catch((error) => {
    console.error("Failed to initialize database schema:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await endPool();
  });
