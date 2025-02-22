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
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "Short code is required." });
    }

    try {
        const db = await connectDB();
        const productsCollection = db.collection("products");

        const product = await productsCollection.findOne({ shortCode: code });

        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        console.log("Product found:", product);

        const sid = "1024077830";
        const pid = "17397941748";
        const universalLink = `https://shopee.vn/universal-link?deep_link=shopee%3A%2F%2Fproduct%3Fid%3D${encodeURIComponent(pid)}`;
        const deepLink = `shopee://product/${sid}/${pid}`;
        const fallbackUrl = "https://s.shopee.vn/5KwLskfPZH";
        const fallbackUrl1 = `https://tiktok-redirect-server.vercel.app/api/safari-redirect?url="${encodeURIComponent(universalLink)}`;

        const userAgent = req.headers["user-agent"] || "";

        // ✅ Nếu là Facebook/In-App Browser → Trả về HTML tĩnh để tránh cache sai link
        if (/facebookexternalhit/i.test(userAgent)) {
            return res.send(`
                <html>
                    <head>
                        <meta property="og:title" content="Khám phá sản phẩm hot!">
                        <meta property="og:description" content="Mở Shopee ngay để xem sản phẩm này!">   
                    </head>
                    <body>
                        <h1>Thông tin sản phẩm</h1>
                        <p>Bấm vào đường link để xem sản phẩm trên Shopee.</p>
                    </body>
                </html>
            `);
        }

        // ✅ Nếu là iPhone
        if (/iPhone/i.test(userAgent)) {
            return res.send(`
                <html>
                    <head>
                        <script>
                            function openInSafari() {
                                var isFacebookApp = navigator.userAgent.includes("FBAN") || navigator.userAgent.includes("FBAV");
        
                                if (isFacebookApp) {
                                    // ✅ Open Safari using a workaround: Redirect to an intermediate page
                                    window.location.href = "https://tiktok-redirect-server.vercel.app/api/safari-redirect?url=" + encodeURIComponent("https://www.google.com.vn/");
                                } else {
                                    // ✅ Open Google directly if not inside Facebook/In-App Browser
                                    window.location.replace("https://www.google.com.vn/");
                                }
                            }
                            window.onload = openInSafari;
                        </script>
                    </head>
                    <body>
                        <p>Đang mở Google...</p>
                    </body>
                </html>
            `);
        }
        
        

        // ✅ Nếu là Android → Chuyển hướng trực tiếp đến Deep Link Shopee
        // if (/Android/i.test(userAgent)) {
        //     console.log("Redirecting to:", deepLink);
        //     return res.redirect(302, deepLink);
        // }

        // ✅ Nếu là Desktop → Mở Shopee Web
        console.log("Redirecting to:", fallbackUrl);
        return res.redirect(302, fallbackUrl);
    } catch (error) {
        console.error("Error handling request:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}

