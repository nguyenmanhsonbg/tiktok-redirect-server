const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Use environment variable for MongoDB connection
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  // if (req.method !== "POST") {
  //   return res.status(405).json({ error: "Method not allowed. Use POST123." });
  // }

  const { webLink1, webLink2 } = req.body;

  // Validate input fields
  if (!webLink1 || !webLink2) {
    return res.status(400).json({
      error: "Both webLink1 and webLink2 are required.",
    });
  }

  try {
    // Extract shopId and productId from webLink2
    const match = webLink2.match(/\/product\/(\d+)\/(\d+)/);
    if (!match) {
      return res.status(400).json({
        error: "Invalid webLink2 format. Ensure it follows the format 'https://shopee.vn/product/<shopId>/<productId>'.",
      });
    }

    const shopId = match[1];
    const productId = match[2];

    // Generate the deep link
    const deepLink = `shopee://product/${shopId}/${productId}`;

    // Function to generate a random short code
    const generateShortCode = () => {
      return crypto.randomBytes(4).toString("hex"); // Generates an 8-character random string
    };

    await client.connect();
    const db = client.db("productDatabase");
    const productsCollection = db.collection("products");

    let shortCode;
    let isUnique = false;

    // Ensure short code is unique in the database
    while (!isUnique) {
      shortCode = generateShortCode();
      const existingProduct = await productsCollection.findOne({ shortCode });
      if (!existingProduct) {
        isUnique = true;
      }
    }

    // Create a new product entry
    const newProduct = { shortCode, webLink:webLink1, deepLink };

    // Insert the new product into MongoDB
    const result = await productsCollection.insertOne(newProduct);

    return res.status(201).json({
      message: "Product added successfully.",
      product: { ...newProduct, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding product:", error.message);
    return res.status(500).json({ error: "Internal Server Error." });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing MongoDB connection:", closeError.message);
      }
    }
  }
};