// add-product.js

const crypto = require("crypto");
const axios = require("axios");

// You can also move this to env if you want
const GOOGLE_SHEET_API_URL =
  "https://script.google.com/macros/s/AKfycbykx1Ou6aZgFFIngX1EO14liFHE9wJ_y8ScRKDRiCAzznQEzgZPLp3vb5q2Jre0k4qs/exec";

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // if (req.method !== "POST") {
  //   return res.status(405).json({ error: "Method not allowed" });
  // }

  const { webLink1, webLink2 } = req.body;

  // Validate input fields
  if (!webLink1 || !webLink2) {
    return res.status(400).json({
      error: "Both webLink1 and webLink2 are required.",
    });
  }

  if (!GOOGLE_SHEET_API_URL) {
    console.error("GOOGLE_SHEET_API_URL is not set");
    return res.status(500).json({
      error: "Server misconfiguration: missing Google Sheet API URL.",
    });
  }

  try {
    // 1. For free pattern: just use webLink2 as deepLink directly
    //    (No Shopee regex, no requirement on URL structure)
    const deepLink = webLink2;

    // 2. Generate a random short code
    const generateShortCode = () => crypto.randomBytes(4).toString("hex");

    // 3. Ensure shortCode is unique in Google Sheet
    const listResp = await axios.get(GOOGLE_SHEET_API_URL);
    const listBody = listResp.data || {};
    const existingProducts = Array.isArray(listBody.data) ? listBody.data : [];

    const isShortCodeUsed = (code) =>
      existingProducts.some(
        (p) => String(p.short_code || p.shortCode) === String(code)
      );

    let shortCode;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      attempts += 1;
      shortCode = generateShortCode();
    } while (isShortCodeUsed(shortCode) && attempts < maxAttempts);

    if (isShortCodeUsed(shortCode)) {
      console.error("Failed to generate unique shortCode after attempts");
      return res.status(500).json({
        error: "Failed to generate unique short code. Please try again.",
      });
    }

    // 4. Build product object for Google Sheets API
    // id        -> use shortCode as primary key
    // web_link  -> webLink1 (original page)
    // deep_link -> webLink2 (any URL, free pattern)
    // short_code -> shortCode
    const productForSheet = {
      id: shortCode,
      web_link: webLink1,
      deep_link: deepLink,
      short_code: shortCode,
    };

    const createPayload = {
      action: "create",
      product: productForSheet,
    };

    // 5. Call Google Apps Script Web App to create the row
    const createResp = await axios.post(GOOGLE_SHEET_API_URL, createPayload, {
      headers: { "Content-Type": "application/json" },
    });

    const createBody = createResp.data || {};

    if (createBody.success !== true) {
      console.error("Google Sheet API create failed:", createBody);
      return res.status(502).json({
        error: "Failed to create product in Google Sheet.",
        details: createBody,
      });
    }

    // 6. Respond to client
    return res.status(201).json({
      message: "Product added successfully.",
      product: {
        shortCode,
        deepLink,
        webLink1,
      },
    });
  } catch (error) {
    console.error("Error adding product:", error.message || error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
};
