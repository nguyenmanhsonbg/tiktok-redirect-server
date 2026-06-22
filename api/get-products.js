const {
  ensureProductCacheInitialized,
  getProductsFromCache,
} = require("../lib/product-cache");
const { setCorsHeaders } = require("../lib/http");

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed1." });
  }

  try {
    await ensureProductCacheInitialized();
    return res.status(200).json(getProductsFromCache());
  } catch (error) {
    console.error("Error reading products cache:", error);
    return res.status(503).json({ error: "Product cache is not ready." });
  }
};
