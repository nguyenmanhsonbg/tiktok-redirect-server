const { MongoClient } = require("mongodb");
const express = require("express");
const app = express();

const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;
async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("productDatabase");
    }
    return db;
}

// Import API mở Universal Link trong Safari
const safariRedirect = require("./safariRedirect");
app.use("/safari-redirect", safariRedirect);

// ✅ Route chính để xử lý redirect
app.get("/redirect", async (req, res) => {
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


        const sid = "1024077830"
        const pid = "17397941748"
        let universalLink = `https://shopee.vn/universal-link?deep_link=shopee%3A%2F%2Fproduct%3Fid%3D${encodeURIComponent(pid)}`;
        let deepLink = `shopee://product/${sid}/${pid}`;
        let fallbackUrl = "https://s.shopee.vn/5KwLskfPZH";

        const userAgent = req.headers["user-agent"] || "";

        // 👉 Nếu Facebook Crawler truy cập, trả về HTML tĩnh để tránh cache sai link
        if (/facebookexternalhit/i.test(userAgent)) {
            return res.send(`
                <html>
                    <head>
                        <meta property="og:title" content="Khám phá sản phẩm hot!">
                        <meta property="og:description" content="Mở Shopee ngay để xem sản phẩm này!">
                        <meta property="og:image" content="https://yourdomain.com/static/shopee-product.jpg">
                        <meta property="og:url" content="${fallbackUrl}">
                    </head>
                    <body>
                        <h1>Thông tin sản phẩm</h1>
                        <p>Bấm vào đường link để xem sản phẩm trên Shopee.</p>
                    </body>
                </html>
            `);
        }

        // 👉 Nếu người dùng vào từ iPhone
        if (/iPhone/i.test(userAgent)) {
            return res.send(`
                <html>
                    <head>
                        <script>
                            function openInSafari() {
                                var isFacebookApp = navigator.userAgent.includes("FBAN") || navigator.userAgent.includes("FBAV");

                                if (isFacebookApp) {
                                    // Nếu trong Facebook/In-App, mở Safari trước
                                    window.open("https://tiktok-redirect-server.vercel.app/api/safari-redirect?url=" + encodeURIComponent(universalLink), "_blank");
                                } else {
                                    // Nếu không, mở Universal Link Shopee trực tiếp
                                    window.location.replace("${universalLink}");
                                    setTimeout(() => {
                                        window.location.replace("${fallbackUrl}");
                                    }, 2000);
                                }
                            }
                            window.onload = openInSafari;
                        </script>
                    </head>
                    <body>
                        <p>Đang mở Shopee...</p>
                    </body>
                </html>
            `);
        }

        // // 👉 Nếu là Android, mở Deep Link trực tiếp
        // if (/Android/i.test(userAgent)) {
        //     console.log("Redirecting to:", deepLink);
        //     return res.redirect(302, deepLink);
        // }

        // 👉 Nếu là Desktop, mở Shopee Web
        console.log("Redirecting to:", fallbackUrl);
        return res.redirect(302, fallbackUrl);
    } catch (error) {
        console.error("Error handling request:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Khởi động server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
