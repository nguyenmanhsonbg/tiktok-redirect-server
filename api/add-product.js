const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Use environment variable for MongoDB connection
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { webLink, deepLink } = req.body;

  // Validate input fields
  if (!webLink || !deepLink) {
    return res.status(400).json({
      error: "Both webLink and deepLink are required.",
    });
  }

  // Function to generate a random short code
  const generateShortCode = () => {
    return crypto.randomBytes(4).toString("hex"); // Generates an 8-character random string
  };

  try {
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
    const newProduct = { webLink, deepLink, shortCode };

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