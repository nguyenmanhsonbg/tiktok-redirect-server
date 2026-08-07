const { updateProductByCode } = require("../product-repository");
const { readJsonBody, setCorsHeaders } = require("../http");
const {
  ensureProductCacheInitialized,
  setProductCacheDebugHeaders,
  upsertProductInCache,
} = require("../product-cache");

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const code = body.code || req.query.code;
  const { webLink1, webLink2 } = body;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  if (!webLink1 || !webLink2) {
    return res.status(400).json({
      error: "Both webLink1 and webLink2 are required.",
    });
  }

  try {
    await ensureProductCacheInitialized();

    const updatedProduct = await updateProductByCode(code, {
      web_link: webLink1,
      deep_link: webLink2,
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    upsertProductInCache(updatedProduct);

    res.setHeader("Cache-Control", "no-store");
    setProductCacheDebugHeaders(res);
    return res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product in database:", error);
    return res.status(500).json({ error: "Failed to update product." });
  }
};
