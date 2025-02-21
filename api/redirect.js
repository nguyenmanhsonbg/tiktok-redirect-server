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

    if (/facebookexternalhit/i.test(userAgent)) {
      // 👉 Nếu là Facebook Crawler, trả về một trang HTML tùy chỉnh (Không chứa link thực)
      return res.send(`
                <html>
                    <head>
                        <title>Thông tin sản phẩm</title>
                        <meta property="og:title" content="Sản phẩm mới nhất của chúng tôi">
                        <meta property="og:description" content="Khám phá sản phẩm đặc biệt này!">
                    </head>
                    <body>
                        <h1>Thông tin sản phẩm</h1>
                        <p>Đây là sản phẩm hot nhất của chúng tôi. Nhấn vào đường link để tìm hiểu thêm!</p>
                    </body>
                </html>
            `);
    }

    // 👉 Người dùng thực sự (không phải Facebook Crawler)
    let redirectUrl = link2; // Mặc định: Desktop
    if (/iPhone/i.test(userAgent)) {
      // 🔹 **Mở trực tiếp Shopee App bằng Intent**
      return res.send(`
          <html>
              <head>
                  <script>
                      function openShopee() {
                          var shopeeLink = "${link1}";
                          var fallbackUrl = "${link1}";
                          var isFacebookApp = navigator.userAgent.includes("FBAN") || navigator.userAgent.includes("FBAV");

                          if (isFacebookApp) {
                              // Nếu đang trong Facebook/In-App Browser, mở trong Safari để tránh confirm
                              window.open(shopeeLink, "_blank");
                          } else {
                              // Nếu không, thử mở Shopee App trước
                              window.location.replace(shopeeLink);

                              // Nếu Shopee không mở sau 2 giây, fallback sang web
                              setTimeout(() => {
                                  window.location.replace(fallbackUrl);
                              }, 2000);
                          }
                      }
                      window.onload = openShopee;
                  </script>
              </head>
              <body>
                  <p>Đang mở Shopee...</p>
              </body>
          </html>
      `);
    }

    console.log("Redirecting to:", redirectUrl);
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
