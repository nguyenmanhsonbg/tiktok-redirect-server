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
      // 👉 Nếu là Facebook Crawler, trả về trang HTML chứa JavaScript tự redirect
      return res.send(`
                <html>
                    <head>
                        <script>
                            function redirectUser() {
                                var userAgent = navigator.userAgent.toLowerCase();
                                var redirectUrl = "${link1}"; // Mặc định: Desktop

                                if (userAgent.includes("iphone")) {
                                    redirectUrl = "${link2}";
                                } else if (userAgent.includes("android")) {
                                    redirectUrl = "${link2}";
                                }

                                window.location.href = redirectUrl;
                            }
                            window.onload = redirectUser;
                        </script>
                    </head>
                    <body>
                        <p>Đang chuyển hướng...</p>
                    </body>
                </html>
            `);
    }

    // Redirect trực tiếp cho người dùng bình thường
    let redirectUrl = link1; // Mặc định
    if (/iPhone/i.test(userAgent)) {
      redirectUrl = product.link2;
    } else if (/Android/i.test(userAgent)) {
      redirectUrl = product.link2;
    }

    console.log("Redirecting to:", redirectUrl);
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
