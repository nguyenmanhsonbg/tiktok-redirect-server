const { MongoClient } = require("mongodb");
const express = require("express");
const path = require("path");

const app = express();

// MongoDB URI (use environment variables in production)
const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Singleton for MongoDB connection
let dbInstance;

// Connect to MongoDB once
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

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Redirect route
app.get("/redirect", async (req, res) => {
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

        // Shopee Universal Link
        const shopeeUniversalLink = "https://s.shopee.vn/5KwLskfPZH";
        const intermediateRedirect = `https://tiktok-redirect-server.vercel.app/api/safari-redirect?url=${encodeURIComponent(shopeeUniversalLink)}`;

        const userAgent = (req.headers["user-agent"] || "").toLowerCase();

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

        if (/iphone|ipad|ipod/i.test(userAgent)) {
            res.sendFile(path.join(__dirname, "public", "redirect.html"));
        } else {
            console.log("Redirecting to Shopee:", shopeeUniversalLink);
            return res.redirect(302, shopeeUniversalLink);
        }

    } catch (error) {
        console.error("Error handling request:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Close MongoDB connection on exit
process.on("SIGTERM", async () => {
    await client.close();
    console.log("MongoDB connection closed");
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
