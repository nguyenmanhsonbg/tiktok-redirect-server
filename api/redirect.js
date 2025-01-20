const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    await client.connect();
    const db = client.db("productDatabase");
    const productsCollection = db.collection("products");

    // Find the product by shortCode
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    let redirectUrl;

    // Redirect based on User-Agent
    if (/iPhone/i.test(userAgent)) {
      //redirectUrl = product.deepLink; // iOS
      redirectUrl = "https://shopee.vn/product/1024077830/17397941748"; // iOS
    } else if (/Android/i.test(userAgent)) {
      redirectUrl = product.deepLink; // Android
    } else {
      redirectUrl = product.webLink; // Desktop
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling redirect:", error);
    res.status(500).json({ error: "Failed to handle redirect." });
  } finally {
    await client.close();
  }
};
