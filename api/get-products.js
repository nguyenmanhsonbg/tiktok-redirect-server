// get-products.js

// If you're on Node 18+, fetch is global.
// If not, uncomment this line after installing node-fetch:
// const fetch = require("node-fetch");
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbykx1Ou6aZgFFIngX1EO14liFHE9wJ_y8ScRKDRiCAzznQEzgZPLp3vb5q2Jre0k4qs/exec";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // or specific origin
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  try {
    if (!GOOGLE_SHEET_API_URL) {
      console.error("GOOGLE_SHEET_API_URL is not set");
      return res
        .status(500)
        .json({ error: "Server misconfiguration: missing Google Sheet API URL." });
    }

    // Call Google Apps Script Web App (Sheets backend)
    const response = await fetch(GOOGLE_SHEET_API_URL);

    if (!response.ok) {
      console.error("Google Sheet API HTTP error:", response.status, response.statusText);
      return res.status(502).json({
        error: "Failed to fetch products from Google Sheet API.",
        upsteamStatus: response.status,
      });
    }

    const body = await response.json();

    if (!body || body.success !== true || !Array.isArray(body.data)) {
      console.error("Unexpected Google Sheet API response shape:", body);
      return res.status(502).json({
        error: "Invalid response from Google Sheet API.",
      });
    }

    // body.data is the products array from the sheet
    return res.status(200).json(body.data);
  } catch (error) {
    console.error("Error fetching products from Google Sheet API:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
