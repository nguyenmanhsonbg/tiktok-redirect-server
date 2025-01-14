const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection setup
const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let db;

// Connect to MongoDB
async function connectToDB() {
  try {
    await client.connect();
    db = client.db("productDatabase"); // Database name
    console.log("Connected to MongoDB Atlas.");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

connectToDB();

// API route to add a new product link
app.post("/add-product", async (req, res) => {
  const { shopId, productId } = req.body;

  if (!shopId || !productId) {
    return res
      .status(400)
      .json({ error: "shopId and productId are required." });
  }

  // Generate deepLink, webLink, and shortCode
  const deepLink = `shopee://product/${shopId}/${productId}`;
  const webLink = `https://shopee.vn/product/${shopId}/${productId}`;
  const shortCode = `${shopId}_${productId}`;

  try {
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
  }
});

// API route to get all products
app.get("/get-products", async (req, res) => {
  try {
    const productsCollection = db.collection("products");
    const products = await productsCollection.find().toArray();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// API route to delete a product
app.delete("/delete-product", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send({ error: "Short code is required." });
  }

  try {
    const productsCollection = db.collection("products");
    const result = await productsCollection.deleteOne({ shortCode: code });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Product not found." });
    }

    res.status(200).send({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ error: "Failed to delete product." });
  }
});

// API route to handle redirection
app.get("/redirect", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    const productsCollection = db.collection("products");

    // Find the product by shortCode
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    let redirectUrl;

    // Redirect based on User-Agent
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      redirectUrl = product.deepLink; // iOS
    } else if (/Android/i.test(userAgent)) {
      redirectUrl = product.deepLink; // Android
    } else {
      redirectUrl = product.webLink; // Desktop
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling redirect:", error);
    res.status(500).json({ error: "Failed to handle redirect." });
  }
});

//Export serverless function
module.exports = (req, res) => {
  app(req, res);
};

// Start the server
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
