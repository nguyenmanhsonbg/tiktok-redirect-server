const { setCorsHeaders } = require("../http");
const {
  ensureProductCacheInitialized,
  removeProductFromCache,
  setProductCacheDebugHeaders,
} = require("../product-cache");

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

  try {
    await ensureProductCacheInitialized();
    const removedProduct = removeProductFromCache(code);

    if (!removedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.setHeader("Cache-Control", "no-store");
    setProductCacheDebugHeaders(res);
    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Failed to delete product." });
  }
};
