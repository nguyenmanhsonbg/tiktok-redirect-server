const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
    // Connect to MongoDB
    await client.connect();
    const db = client.db("productDatabase");
    const productsCollection = db.collection("products");

    // Find the product by shortCode
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    let respLink;
   

    if (/facebookexternalhit/i.test(userAgent)) {
      respLink = product.webLink;
    
    } else if (/iPhone/i.test(userAgent)) {
      // iPhone users
      respLink = product.deepLink;
    
    } else if (/Android/i.test(userAgent)) {
      // Android users
      respLink = product.deepLink;
    
    } else {
      // Desktop/Other users
      respLink = product.deepLink;
    }

    return res.redirect(respLink);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    await client.close();
  }
};
