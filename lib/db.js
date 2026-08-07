const { Pool } = require("pg");
const { loadEnvFile } = require("./env");

loadEnvFile();

let pool;

function normalizeDatabaseUrlForPg(databaseUrl) {
  const url = new URL(databaseUrl);

  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

function getSslConfig() {
  if (process.env.DB_SSL === "false" || process.env.PGSSLMODE === "disable") {
    return false;
  }

  return { rejectUnauthorized: false };
}

function getPoolConfig() {
  const baseConfig = {
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);

    return {
      ...baseConfig,
      connectionString: normalizeDatabaseUrlForPg(process.env.DATABASE_URL),
      enableChannelBinding:
        databaseUrl.searchParams.get("channel_binding") === "require",
    };
  }

  const requiredEnv = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USERNAME",
    "DB_PASSWORD",
  ];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing database environment variables: ${missingEnv.join(", ")}`
    );
  }

  return {
    ...baseConfig,
    ssl: getSslConfig(),
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  };
}

function getPool() {
  if (!pool) {
    pool = new Pool(getPoolConfig());
  }

  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function endPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = {
  endPool,
  getPoolConfig,
  normalizeDatabaseUrlForPg,
  query,
};
