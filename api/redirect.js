const {
  getProductByCodeFromCache,
  isProductCacheInitialized,
} = require("../lib/product-cache");

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function htmlRedirect(targetUrl, bodyText) {
  const safeTargetUrl = escapeHtmlAttribute(targetUrl);

  return `
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${safeTargetUrl}">
      </head>
      <body>
        <p>${bodyText}</p>
        <script>window.location.href = ${JSON.stringify(targetUrl)};</script>
      </body>
    </html>
  `;
}

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    if (!isProductCacheInitialized()) {
      return res.status(404).json({ error: "Product not found." });
    }

    const product = getProductByCodeFromCache(code);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const universalLink = product.web_link || "";
    const targetLink = product.deep_link || "";

    if (!universalLink && !targetLink) {
      return res.status(500).json({
        error: "Product record is missing links.",
      });
    }

    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    if (/facebookexternalhit/i.test(userAgent)) {
      const fbLink = universalLink || targetLink;
      const safeFbLink = escapeHtmlAttribute(fbLink);

      return res.send(`
        <html>
          <head>
            <meta property="og:title" content="Kham pha san pham hot!">
            <meta property="og:description" content="Mo link ngay de xem chi tiet san pham!">
            <meta property="og:url" content="${safeFbLink}">
            <meta http-equiv="refresh" content="0;url=${safeFbLink}">
          </head>
          <body>
            <p>Dang chuyen huong...</p>
          </body>
        </html>
      `);
    }

    if (/iphone|ipad|ipod/i.test(userAgent)) {
      const iosLink = universalLink || targetLink;
      return res.send(htmlRedirect(iosLink, "Dang chuyen huong..."));
    }

    const redirectUrl = targetLink || universalLink;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error handling redirect request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
