const connectDB = require("../connectDB");

module.exports = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const products = await productsCollection.find().toArray();

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
