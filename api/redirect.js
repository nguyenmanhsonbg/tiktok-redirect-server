const { MongoClient } = require("mongodb");

// MongoDB URI (nên ẩn mật khẩu trong biến môi trường khi deploy)
const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Singleton cho kết nối MongoDB
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

    // Universal Link của Shopee từ bạn cung cấp
    const shopeeUniversalLink = "https://s.shopee.vn/AKM70LP3Zu";

    // Lấy và phân tích user-agent
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    // Xử lý khi Facebook bot truy cập (trả về HTML cho Open Graph)
    if (/facebookexternalhit/i.test(userAgent)) {
      return res.send(`
        <html>
          <head>
            <meta property="og:title" content="Khám phá sản phẩm hot trên Shopee!">
            <meta property="og:description" content="Mở Shopee ngay để xem sản phẩm này!">
          </head>
          <body>
            <p>Đang chuyển hướng đến Shopee...</p>
          </body>
        </html>
      `);
    }

    // Xử lý cho iOS (bao gồm Facebook WebView)
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      // Trả về HTML với redirect tự động để vượt qua WebView
      return res.send(`
         <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${shopeeUniversalLink}">
          </head>
          <body>
            <p>Đang chuyển hướng đến Shopee...</p>
            <script>
              window.location.href = "${shopeeUniversalLink}";
            </script>
          </body>
        </html>
      `);
    }

    // Xử lý cho Android (dùng deep link nếu cần)
    if (/android/i.test(userAgent)) {
      const deepLink = "shopee://product/1024077830/17397941748"; // Thay bằng deep link thực tế nếu có
      console.log("Redirecting to Android deep link:", deepLink);
      return res.redirect(302, deepLink);
    }

    // Fallback cho các thiết bị khác (Desktop, v.v.)
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