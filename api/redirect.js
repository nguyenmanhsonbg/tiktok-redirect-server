const connectDB = require("../connectDB"); // Import kết nối MongoDB
// let redirectCache = {}; // Cache URL

module.exports = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Short code is required." });

  // Kiểm tra cache trước
  if (redirectCache[code]) {
    console.log("✅ Cache hit:", code);
    return res.redirect(302, redirectCache[code]);
  }

  try {
    const db = await connectDB(); // Gọi hàm kết nối
    const productsCollection = db.collection("products");

    const product = await productsCollection.findOne({ shortCode: code });
    if (!product) return res.status(404).json({ error: "Product not found." });
    // Lưu vào cache để dùng lại
    // redirectCache[code] = linkWeb;

    const shopeeUniversalLink = product.deepLink;
    const linkWeb = product.webLink1;

    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    if (/facebookexternalhit/i.test(userAgent)) {
      return res.send(`
        <html>
          <head>
            <meta property="og:title" content="Khám phá sản phẩm hot trên Shopee!">
            <meta property="og:description" content="Mở Shopee ngay để xem sản phẩm này!">
            <meta property="og:url" content="${shopeeUniversalLink}">
            <meta http-equiv="refresh" content="0;url=${shopeeUniversalLink}">
          </head>
          <body>
            <p>Đang chuyển hướng đến Shopee...</p>
          </body>
        </html>
      `);
    }

    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return res.send(`
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${shopeeUniversalLink}">
          </head>
          <body>
            <p>Đang chuyển hướng đến Shopee...</p>
            <script>window.location.href = "${shopeeUniversalLink}";</script>
          </body>
        </html>
      `);
    }

    return res.redirect(302, linkWeb);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
