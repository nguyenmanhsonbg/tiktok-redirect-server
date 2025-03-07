const connectDB = require("../connectDB");

module.exports = async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const result = await productsCollection.deleteOne({ shortCode: code });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product." });
  } finally {
    await client.close();
  }
};
