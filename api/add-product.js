const crypto = require("crypto");
const { query } = require("../lib/db");
const { readJsonBody, setCorsHeaders } = require("../lib/http");
const {
  addProductToCache,
  ensureProductCacheInitialized,
  hasProductInCache,
  removeProductFromCache,
  setProductCacheDebugHeaders,
} = require("../lib/product-cache");

const MAX_SHORT_CODE_ATTEMPTS = 5;

function generateShortCode() {
  return crypto.randomBytes(4).toString("hex");
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const { webLink1, webLink2 } = body;

  if (!webLink1 || !webLink2) {
    return res.status(400).json({
      error: "Both webLink1 and webLink2 are required.",
    });
  }

  try {
    await ensureProductCacheInitialized();

    for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt += 1) {
      const shortCode = generateShortCode();
      let cached = false;
      const product = {
        id: shortCode,
        web_link: webLink1,
        deep_link: webLink2,
        short_code: shortCode,
      };

      try {
        if (hasProductInCache(shortCode)) {
          continue;
        }

        addProductToCache(product);
        cached = true;

        await query(
          `
            INSERT INTO products (id, web_link, deep_link, short_code)
            VALUES ($1, $2, $3, $4)
          `,
          [shortCode, webLink1, webLink2, shortCode]
        );

        res.setHeader("Cache-Control", "no-store");
        setProductCacheDebugHeaders(res);
        return res.status(201).json({
          message: "Product added successfully.",
          product: {
            id: product.id,
            web_link: product.web_link,
            deep_link: product.deep_link,
            short_code: product.short_code,
          },
        });
      } catch (error) {
        if (cached) {
          removeProductFromCache(shortCode);
        }

        if (error.code !== "23505") {
          throw error;
        }
      }
    }

    return res.status(500).json({
      error: "Failed to generate unique short code. Please try again.",
    });
  } catch (error) {
    console.error("Error adding product to database:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
};
