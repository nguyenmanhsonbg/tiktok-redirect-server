const { Pool } = require("pg");

let pool;

function getSslConfig() {
  if (process.env.DB_SSL === "true") {
    return { rejectUnauthorized: false };
  }

  if (process.env.DB_SSL === "false" || process.env.PGSSLMODE === "disable") {
    return false;
  }

  return { rejectUnauthorized: false };
}

function getPoolConfig() {
  const baseConfig = {
    ssl: getSslConfig(),
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...baseConfig,
      connectionString: process.env.DATABASE_URL,
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

module.exports = {
  query,
};
