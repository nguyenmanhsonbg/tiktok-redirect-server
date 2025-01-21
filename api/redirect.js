const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  // Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  // Validate short code
  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("productDatabase");
    const productsCollection = db.collection("products");

    // Find the product by shortCode
    const product = await productsCollection.findOne({ shortCode: code });

    // Handle product not found
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    console.log("User-Agent:", userAgent); // Log User-Agent for debugging

    let redirectUrl;

    // Redirect logic for Facebook crawler
    if (/facebookexternalhit/i.test(userAgent)) {
      redirectUrl = product.deepLink;
    }
    // Redirect logic for Facebook app
    else if (/FBAN|FBAV/i.test(userAgent)) {
      redirectUrl = product.deepLink;
    }
    // Redirect logic for iPhone users
    else if (/iPhone/i.test(userAgent)) {
      redirectUrl = product.deepLink;
    }
    // Redirect logic for Android users
    else if (/Android/i.test(userAgent)) {
      redirectUrl = product.deepLink;
    }
    // Redirect logic for desktop and other users
    else {
      redirectUrl = `${product.webLink}?source=desktop`;
    }

    console.log("Constructed Redirect URL:", redirectUrl); // Log the constructed URL
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling redirect:", error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    // Ensure the MongoDB client is closed
    await client.close();
  }
};
