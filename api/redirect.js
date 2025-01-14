const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// File to store product links
const dataFile = "product_links.txt";

// Utility function to read data from the file
const readDataFromFile = () => {
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(data || "[]");
  }
  return [];
};

// Utility function to write data to the file
const writeDataToFile = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// API route to add a new product link
app.post("/add-product", (req, res) => {
  const { shopId, productId } = req.body;

  if (!shopId || !productId) {
    return res
      .status(400)
      .json({ error: "shopId and productId are required." });
  }

  // Generate deepLink, webLink, and shortCode
  const deepLink = `shopee://product/${shopId}/${productId}`;
  const webLink = `https://shopee.vn/product/${shopId}/${productId}`;
  const shortCode = `${shopId}_${productId}`; // Simple short code (can be replaced with a hash if needed)

  // Read existing products from the file
  const products = readDataFromFile();

  // Check if the product already exists
  const existingProduct = products.find((p) => p.shortCode === shortCode);
  if (existingProduct) {
    return res
      .status(409)
      .json({ error: "Product already exists.", product: existingProduct });
  }

  // Create a new product entry
  const newProduct = { shopId, productId, deepLink, webLink, shortCode };

  // Add the new product to the array and save it
  products.push(newProduct);
  writeDataToFile(products);

  res.status(201).json({
    message: "Product link added successfully.",
    product: newProduct,
  });
});

// Example API: Get all products
app.get("/get-products", (req, res) => {
//   const productFile = "product_links.txt";
//   if (!fs.existsSync(productFile)) {
//     return res.status(200).send([]);
//   }

//   const products = JSON.parse(fs.readFileSync(productFile, "utf8"));
  res.status(200).send("Product A");
});

// Example API: Delete a product
app.delete("/delete-product", (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send({ error: "Short code is required." });
  }

  const productFile = "product_links.txt";
  const products = fs.existsSync(productFile)
    ? JSON.parse(fs.readFileSync(productFile, "utf8"))
    : [];

  const updatedProducts = products.filter((p) => p.shortCode !== code);

  if (products.length === updatedProducts.length) {
    return res.status(404).send({ error: "Product not found." });
  }

  fs.writeFileSync(productFile, JSON.stringify(updatedProducts, null, 2));

  res.status(200).send({ message: "Product deleted successfully." });
});

// API route to handle redirection
app.get("/redirect", (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  // Read products from the file
  const products = readDataFromFile();

  // Find the product by short code
  const product = products.find((p) => p.shortCode === code);

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
});
// Export serverless function
module.exports = (req, res) => {
    app(req, res);
};

// // Start the server
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
