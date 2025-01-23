const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  // Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  // Validate short code
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

    // Handle product not found
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    console.log("User-Agent:", userAgent); // Log User-Agent for debugging

    // Handle other User-Agents (redirect logic)
    let redirectUrl;

    //Check if the request is from Facebook crawler
    if (/facebookexternalhit/i.test(userAgent)) {
      // // Serve Open Graph metadata for Shopee's homepage
      // return res.send(`
      //   <!DOCTYPE html>
      //   <html lang="en">
      //     <head>
      //       <meta charset="UTF-8" />
      //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      //       <meta property="og:title" content="Shopee" />
      //       <meta property="og:description" content="Shop for the best deals, discounts, and promotions on your favorite products. Discover millions of items across various categories on Shopee!" />
      //       <meta property="og:type" content="website" />
      //       <meta property="og:image" content="/images/logo.png" />
      //       <meta property="og:url" content="https://shopee.vn/" />
      //       <meta property="og:site_name" content="Shopee" />
      //       <meta property="og:locale" content="vi_VN" />
      //       <title>Shopee/title>
      //     </head>
      //     <body>
      //       <h1>Welcome to Shopee</h1>
      //       <p>Discover millions of items and shop for the best deals on Shopee!</p>
      //       <img src="public/images/logo.pn" alt="Shopee Logo" />
      //     </body>
      //   </html>
      // `);
      redirectUrl = product.deepLink;
    } else if (/FBAN|FBAV/i.test(userAgent)) {
      // Facebook app
      redirectUrl = product.deepLink;
    } 

   else if (/iPhone/i.test(userAgent)) {
      // iPhone users
      redirectUrl = product.deepLink;
    } else if (/Android/i.test(userAgent)) {
      // Android users
      redirectUrl = product.deepLink;
    } else {
      // Desktop/Other users
      redirectUrl = product.deepLink;
    }

    console.log("Constructed Redirect URL:", redirectUrl); // Log the constructed URL
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    // Ensure the MongoDB client is closed
    await client.close();
  }
};
