// delete-product.js

const axios = require("axios");

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbykx1Ou6aZgFFIngX1EO14liFHE9wJ_y8ScRKDRiCAzznQEzgZPLp3vb5q2Jre0k4qs/exec";


module.exports = async (req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  if (!GOOGLE_SHEET_API_URL) {
    console.error("GOOGLE_SHEET_API_URL is not set");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing Google Sheet API URL." });
  }

  try {
    // Our Apps Script "delete" expects: { action: "delete", id: "<short_code>" }
    const payload = {
      action: "delete",
      id: code, // we treat short code as the id in the sheet
    };

    const gsResp = await axios.post(GOOGLE_SHEET_API_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const body = gsResp.data || {};

    if (body.success === true) {
      return res
        .status(200)
        .json({ message: "Product deleted successfully." });
    }

    if (body.code === 404) {
      return res.status(404).json({ error: "Product not found." });
    }

    console.error("Unexpected delete response from Google Sheet API:", body);
    return res.status(502).json({
      error: "Failed to delete product via Google Sheet API.",
      details: body,
    });
  } catch (error) {
    console.error("Error deleting product:", error.message || error);
    return res.status(500).json({ error: "Failed to delete product." });
  }
};
