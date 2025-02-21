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
    // Get MongoDB database
    const db = await connectDB();
    const productsCollection = db.collection("products");

    // Find the product by shortCode
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    console.log("Product found:", product);

    // Detect User-Agent
    const userAgent = req.headers["user-agent"] || "";
    let redirectUrl = product.webLink; // Default: Desktop version

    const link1 = "https://s.shopee.vn/7zx4gJh1C3";
    const link2 = "https://s.shopee.vn/5KwLskfPZH";

    if (/facebookexternalhit/i.test(userAgent)) {
      // Facebook Crawler → Return an HTML page with Meta Refresh
      return res.send(`
                <html>
                    <head>
                        <meta http-equiv="refresh" content="0;url=${link1}">
                    </head>
                    <body>
                        <p>Redirecting...</p>
                    </body>
                </html>
            `);
    } else if (/iPhone/i.test(userAgent)) {
      redirectUrl = product.link2; // iPhone Redirect
    } else if (/Android/i.test(userAgent)) {
      redirectUrl = product.link2; // Android Redirect
    } else {
      redirectUrl = product.link1; // Default for other devices
    }

    console.log("Redirecting to:", redirectUrl);
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
