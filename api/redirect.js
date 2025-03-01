const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// MongoDB URI (nên ẩn mật khẩu trong biến môi trường khi deploy)
const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Singleton cho kết nối MongoDB
let dbInstance;

// Kết nối tới MongoDB một lần
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

// Kết nối tới MongoDB khi khởi động (không cần thiết, nhưng giúp giảm độ trễ)
connectDB().catch(console.error);

// Route redirect
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

    // Cấu hình Shopee URL (mở ứng dụng Shopee)
    const shopeeUniversalLink = "https://s.shopee.vn/5KwLskfPZH"; // URL đích để mở ứng dụng Shopee


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
      return res.send(`
        <html>
          <head>
            <meta charset="utf-8">
            <title>Đang mở Shopee...</title>
            <script>
              function openExternalBrowser() {
                var url = "https://s.shopee.vn/5KwLskfPZH";
                var newWindow = window.open(url, "_blank");
                
                if (!newWindow || newWindow.closed || typeof newWindow.closed == "undefined") {
                  window.location.href = url;
                }
              }
      
              setTimeout(openExternalBrowser, 100);
            </script>
          </head>
          <body>
            <p>Nếu không được tự động chuyển hướng, vui lòng <a href="https://s.shopee.vn/5KwLskfPZH">bấm vào đây</a>.</p>
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

// Đóng kết nối MongoDB khi ứng dụng kết thúc
process.on("SIGTERM", async () => {
  await client.close();
  console.log("MongoDB connection closed");
});