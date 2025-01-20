const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;
  console.log("Code is", code);

  if (!code) {
    return res.status(400).json({ error: "Short code is required." });
  }

  try {
    await client.connect();
    const db = client.db("productDatabase");
    const productsCollection = db.collection("products");

    // Find the product by shortCode
    const product = await productsCollection.findOne({ shortCode: code });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    let redirectUrl;
    console.log("Useragent", userAgent);

    // Refined User-Agent detection
    if (/FBAN|FBAV/i.test(userAgent)) {
      // User is on Facebook app
      if (/iPhone/i.test(userAgent)) {
        redirectUrl = `${product.deepLink}?source=facebook-iphone`; // Facebook on iPhone
      } else if (/Android/i.test(userAgent)) {
        redirectUrl = `${product.deepLink}?source=facebook-android`; // Facebook on Android
      } else {
        redirectUrl = `${product.webLink}?source=facebook-other`; // Facebook on other devices
      }
    } else if (/iPhone/i.test(userAgent)) {
      redirectUrl = `${product.deepLink}?source=iphone`; // iPhone
    } else if (/Android/i.test(userAgent)) {
      redirectUrl = `${product.deepLink}?source=android`; // Android
    } else {
      redirectUrl = `${product.webLink}?source=desktop`; // Desktop or other devices
    }

    // Log the detected platform for debugging
    console.log(`Redirecting user with User-Agent: ${userAgent} to ${redirectUrl}`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling redirect:", error);
    res.status(500).json({ error: "Failed to handle redirect." });
  } finally {
    await client.close();
  }
};
