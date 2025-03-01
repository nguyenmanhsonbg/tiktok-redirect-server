const { MongoClient } = require("mongodb");

// MongoDB URI (nên dùng biến môi trường để ẩn thông tin nhạy cảm)
const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Hàm tạo mã định danh ngẫu nhiên
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Route redirect
module.exports = async (req, res) => {
  const { code } = req.query;

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

    // Lấy User-Agent
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    // Tạo mã định danh duy nhất cho mỗi yêu cầu
    const uniqueId = generateUniqueId();

    // Danh sách các Universal Link khác nhau (có thể lấy từ DB hoặc hardcode tạm thời)
    const shopeeLinks =   "https://s.shopee.vn/AKM70LP3Zu"
    const shopeeLinks1 = "https://s.shopee.vn/5KwLskfPZH"

    // Thêm tham số động để tránh cache
    const dynamicLink = `${shopeeLinks}?uid=${uniqueId}`;
    const dynamicLink1 = `${shopeeLinks1}?uid=${uniqueId}`;

    // Thiết lập header để ngăn cache
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Xử lý khi Facebook bot truy cập
    if (/facebookexternalhit/i.test(userAgent)) {
      return res.send(`
        <html>
          <head>
            <meta property="og:title" content="Khám phá sản phẩm hot trên Shopee!">
            <meta property="og:description" content="Mở Shopee ngay để xem sản phẩm này!">
            <meta property="og:url" content="${dynamicLink}">
            <meta http-equiv="refresh" content="0;url=${dynamicLink}">
          </head>
          <body>
            <p>Đang chuyển hướng đến Shopee...</p>
          </body>
        </html>
      `);
    }

    // Xử lý cho iOS (bao gồm Facebook WebView)
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return res.send(`
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${dynamicLink}">
          </head>
          <body>
            <p>Đang chuyển hướng đến Shopee...</p>
            <script>
              window.location.href = "${dynamicLink}";
            </script>
          </body>
        </html>
      `);
    }

    // Xử lý cho Android
    if (/android/i.test(userAgent)) {
      const deepLink = "shopee://product/1024077830/17397941748"; // Thay bằng deep link thực tế nếu có
      console.log("Redirecting to Android deep link:", deepLink);
      return res.redirect(302, deepLink);
    }

    // Fallback cho các thiết bị khác

    return res.redirect(302, dynamicLink1);

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