const connectDB = require("../connectDB");
const crypto = require("crypto");
const axios = require("axios");

module.exports = async (req, res) => {
  const db = await connectDB();
  const { webLink1, webLink2 } = req.body;

  // Validate input fields
  if (!webLink1 || !webLink2) {
    return res.status(400).json({
      error: "Both webLink1 and webLink2 are required.",
    });
  }

  try {
    // Resolve the shortened link (webLink2) to its final redirect URL
    const response = await axios.get(webLink2, { maxRedirects: 5 });
    const resolvedLink = response.request.res.responseUrl;

    // Extract shopId and productId from the resolved link
    const match = resolvedLink.match(/\/product\/(\d+)\/(\d+)/);
    if (!match) {
      return res.status(400).json({
        error:
          "Invalid resolved link format. Ensure it follows the format 'https://shopee.vn/product/<shopId>/<productId>'.",
      });
    }

    const shopId = match[1];
    const productId = match[2];

    // Generate the deep link
    //const deepLink = `shopee://product/${shopId}/${productId}`;

    const deepLink = webLink2;

    // // Function to generate a random short code
    const generateShortCode = () => {
      return crypto.randomBytes(4).toString("hex");
    };

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
    const newProduct = { shortCode, deepLink, webLink1 };

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
