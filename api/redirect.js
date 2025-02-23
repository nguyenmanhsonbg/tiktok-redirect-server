const { MongoClient } = require("mongodb");

// MongoDB URI (nên ẩn mật khẩu trong biến môi trường khi deploy)
const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Singleton để quản lý kết nối MongoDB
let dbInstance;

async function connectDB() {
  if (!dbInstance) {
    try {
      await client.connect();
      dbInstance = client.db("productDatabase");
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
  return dbInstance;
}

// Đóng kết nối khi ứng dụng kết thúc
process.on("SIGTERM", async () => {
  await client.close();
  console.log("MongoDB connection closed");
});

module.exports = async (req, res) => {
  const { code } = req.query;

  // Kiểm tra tham số bắt buộc
  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    // Tìm sản phẩm trong MongoDB
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    console.log("Product found:", product);

    // Cấu hình Shopee URL
    const shopeeUniversalLink = "https://s.shopee.vn/5KwLskfPZH"; // URL đích
    const url = "https://google.com.vn/";
    const intermediateRedirect = `https://tiktok-redirect-server.vercel.app/api/safari-redirect?url=${encodeURIComponent(
      shopeeUniversalLink
    )}`; // URL trung gian qua domain của bạn

    const intermedaieUrl = `https://tiktok-redirect-server.vercel.app/api/safari-redirect?url=${encodeURIComponent(
      url
    )}`;

    // Lấy và phân tích user-agent
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    // Kiểm tra nếu là bot (Facebook scraper)
    if (/facebookexternalhit/i.test(userAgent)) {
      return res.send(`
        <html>
          <head>
            <meta property="og:title" content="Khám phá sản phẩm hot!">
            <meta property="og:description" content="Mở Shopee ngay để xem sản phẩm này!">
          </head>
          <body>
            <p>Bấm vào đường link để xem sản phẩm trên Shopee.</p>
          </body>
        </html>
      `);
    }

    // Kiểm tra nếu là iOS
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      const isInApp = /fban|fbav|instagram|tiktok|zalo|twitter/i.test(userAgent);

      return res.send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script>
              function redirect() {
                const isInApp = /fban|fbav|instagram|tiktok|zalo|twitter/i.test(navigator.userAgent.toLowerCase());
                if (isInApp) {
                  window.location.href = "${intermedaieUrl}";
                } else {
                  window.location.replace("${shopeeUniversalLink}");
                }
              }
              window.onload = redirect;
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0;url=${shopeeUniversalLink}">
            </noscript>
          </head>
          <body>
            <p>Đang chuyển hướng... Nếu không tự động, <a href="${shopeeUniversalLink}">nhấn vào đây</a>.</p>
          </body>
        </html>
      `);
    }

    // Kiểm tra nếu là Android
    if (/android/i.test(userAgent)) {
      const deepLink = "shopee://product/1024077830/17397941748";
      console.log("Redirecting to Android deep link:", deepLink);
      return res.redirect(302, deepLink);
    }

    // Nếu là Desktop hoặc các thiết bị khác
    console.log("Redirecting to fallback URL:", shopeeUniversalLink);
    return res.redirect(302, shopeeUniversalLink);

  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};