const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("productDatabase");
  }
  return db;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    // Kết nối MongoDB
    const db = await connectDB();
    const productsCollection = db.collection("products");

    // Lấy thông tin sản phẩm từ DB
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    console.log("Product found:", product);

    // Kiểm tra User-Agent
    const userAgent = req.headers["user-agent"] || "";
    //tinhchat
    const link1 = "https://s.shopee.vn/7zx4gJh1C3";
    //sua rm
    const link2 = "https://s.shopee.vn/5KwLskfPZH";

    // 🛑 **Cách chính: Tạo URL động để Facebook không cache**
    const randomParam = Math.random().toString(36).substring(7);

    if (/facebookexternalhit/i.test(userAgent)) {
      // 👉 Nếu là Facebook Crawler, thêm tham số ngẫu nhiên
      return res.redirect(302, `${link1}?fbclid=${randomParam}`);
    }

    // Redirect đúng theo thiết bị
    let redirectUrl = link1; // Mặc định
    if (/iPhone/i.test(userAgent)) {
      redirectUrl = link2;
    } else if (/Android/i.test(userAgent)) {
      redirectUrl = link2;
    }

    console.log("Redirecting to:", redirectUrl);
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
