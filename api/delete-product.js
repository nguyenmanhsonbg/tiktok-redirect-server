const { query } = require("../lib/db");
const { setCorsHeaders } = require("../lib/http");
const {
  ensureProductCacheInitialized,
  removeProductFromCache,
  restoreProductToCache,
  setProductCacheDebugHeaders,
} = require("../lib/product-cache");

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  let removedProduct;

  try {
    await ensureProductCacheInitialized();
    removedProduct = removeProductFromCache(code);

    if (!removedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    const result = await query(
      `
        DELETE FROM products
        WHERE short_code = $1
        RETURNING id
      `,
      [code]
    );

    if (result.rowCount === 0) {
      console.warn(`Product ${code} was deleted from cache but was not found in database.`);
    }

    res.setHeader("Cache-Control", "no-store");
    setProductCacheDebugHeaders(res);
    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    if (removedProduct) {
      restoreProductToCache(removedProduct.product, removedProduct.index);
    }

    console.error("Error deleting product from database:", error);
    return res.status(500).json({ error: "Failed to delete product." });
  }
};
