const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Use environment variable for MongoDB connection
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shopId, productId } = req.body;

  if (!shopId || !productId) {
    return res.status(400).json({ error: "shopId and productId are required." });
  }

  // Generate deepLink, webLink, and shortCode
  const deepLink = `shopee://product/${shopId}/${productId}`;
  const webLink = `https://shopee.vn/product/${shopId}/${productId}`;
  const shortCode = `${shopId}_${productId}`;

  try {
    await client.connect();
    const db = client.db("productDatabase");
    const productsCollection = db.collection("products");

    // Check if the product already exists
    const existingProduct = await productsCollection.findOne({ shortCode });
    if (existingProduct) {
      return res
        .status(409)
        .json({ error: "Product already exists.", product: existingProduct });
    }

    // Create a new product entry
    const newProduct = { shopId, productId, deepLink, webLink, shortCode };

    // Insert the new product into MongoDB
    const result = await productsCollection.insertOne(newProduct);

    res.status(201).json({
      message: "Product link added successfully.",
      product: { ...newProduct, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product." });
  } finally {
    await client.close();
  }
};
