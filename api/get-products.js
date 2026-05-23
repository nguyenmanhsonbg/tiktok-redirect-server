const { query } = require("../lib/db");
const { setCorsHeaders } = require("../lib/http");

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const result = await query(
      `
        SELECT id, web_link, deep_link, short_code
        FROM products
        ORDER BY created_at DESC
      `
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching products from database:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
