const { query } = require("../lib/db");
const { setCorsHeaders } = require("../lib/http");

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
    const result = await query(
      `
        DELETE FROM products
        WHERE short_code = $1 OR id = $1
        RETURNING id
      `,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product from database:", error);
    return res.status(500).json({ error: "Failed to delete product." });
  }
};
