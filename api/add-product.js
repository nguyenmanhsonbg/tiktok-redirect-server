const crypto = require("crypto");
const { query } = require("../lib/db");
const { readJsonBody, setCorsHeaders } = require("../lib/http");

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
    for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt += 1) {
      const shortCode = generateShortCode();

      try {
        const result = await query(
          `
            INSERT INTO products (id, web_link, deep_link, short_code)
            VALUES ($1, $2, $3, $4)
            RETURNING id, web_link, deep_link, short_code
          `,
          [shortCode, webLink1, webLink2, shortCode]
        );

        const product = result.rows[0];

        return res.status(201).json({
          message: "Product added successfully.",
          product: {
            id: product.id,
            shortCode: product.short_code,
            deepLink: product.deep_link,
            webLink1: product.web_link,
          },
        });
      } catch (error) {
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
