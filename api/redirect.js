// redirect.js

const axios = require("axios");

// Your Google Apps Script Web App URL
const GOOGLE_SHEET_API_URL =
  "https://script.google.com/macros/s/AKfycbykx1Ou6aZgFFIngX1EO14liFHE9wJ_y8ScRKDRiCAzznQEzgZPLp3vb5q2Jre0k4qs/exec";

module.exports = async (req, res) => {
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
    // 1. Fetch product from Google Sheet by id (= short_code)
    const url = `${GOOGLE_SHEET_API_URL}?id=${encodeURIComponent(code)}`;
    const gsResp = await axios.get(url);
    const body = gsResp.data || {};

    if (!body.success || !body.data) {
      console.error("Product not found or invalid response:", body);
      return res.status(404).json({ error: "Product not found." });
    }

    const product = body.data;

    // From Apps Script:
    // id         -> short code (same as code)
    // web_link   -> webLink1 (safe/universal web page)
    // deep_link  -> deepLink (target URL – free pattern)
    // short_code -> same as id
    const universalLink = product.web_link || product.webLink1 || "";
    const targetLink = product.deep_link || product.deepLink || "";

    if (!universalLink && !targetLink) {
      return res.status(500).json({
        error: "Product record is missing links.",
      });
    }

    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    // 2. Handle Facebook crawler (for nice link preview)
    if (/facebookexternalhit/i.test(userAgent)) {
      const fbLink = universalLink || targetLink;
      return res.send(`
        <html>
          <head>
            <meta property="og:title" content="Khám phá sản phẩm hot!">
            <meta property="og:description" content="Mở link ngay để xem chi tiết sản phẩm!">
            <meta property="og:url" content="${fbLink}">
            <meta http-equiv="refresh" content="0;url=${fbLink}">
          </head>
          <body>
            <p>Đang chuyển hướng...</p>
          </body>
        </html>
      `);
    }

    // 3. Handle iOS devices (Safari / in-app browser)
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      const iosLink = universalLink || targetLink;
      return res.send(`
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${iosLink}">
          </head>
          <body>
            <p>Đang chuyển hướng...</p>
            <script>window.location.href = "${iosLink}";</script>
          </body>
        </html>
      `);
    }

    // 4. Default: redirect to deep_link if available, otherwise web_link
    const redirectUrl = targetLink || universalLink;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error handling redirect request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
