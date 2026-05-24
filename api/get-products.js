const { query } = require("../lib/db");
const {
  clearCache,
  getCacheValue,
  getNumberEnv,
  setCacheValue,
} = require("../lib/cache");
const { setCorsHeaders } = require("../lib/http");

const PRODUCTS_CACHE_KEY = "all";

function getProductsCacheTtlMs() {
  return getNumberEnv("PRODUCTS_CACHE_TTL_MS", 30000);
}

async function getProducts() {
  const cachedProducts = getCacheValue("products", PRODUCTS_CACHE_KEY);

  if (cachedProducts) {
    return cachedProducts;
  }

  const result = await query(
    `
      SELECT id, web_link, deep_link, short_code
      FROM products
      ORDER BY created_at DESC
    `
  );

  setCacheValue(
    "products",
    PRODUCTS_CACHE_KEY,
    result.rows,
    getProductsCacheTtlMs()
  );

  return result.rows;
}

function clearProductsCache() {
  clearCache("products");
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const products = await getProducts();
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products from database:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.clearProductsCache = clearProductsCache;
