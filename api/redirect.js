const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

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

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const userAgent = req.headers["user-agent"];
    console.log("User-Agent:", userAgent);

    if (/facebookexternalhit/i.test(userAgent)) {
      // Serve Open Graph metadata for Facebook crawler
      // return res.send(`
      //   <!DOCTYPE html>
      //   <html lang="en">
      //     <head>
      //       <meta charset="UTF-8" />
      //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      //       <meta property="og:title" content="Check out this product on Shopee!" />
      //       <meta property="og:description" content="Find great deals on this amazing product on Shopee." />
      //       <meta property="og:type" content="website" />
      //       <meta property="og:image" content="https://shopee.vn/image-path/${product.shortCode}.jpg" />
      //       <meta property="og:url" content="${product.webLink1}" />
      //       <meta property="og:site_name" content="Shopee" />
      //       <meta property="og:locale" content="vi_VN" />
      //       <title>Product on Shopee</title>
      //     </head>
      //     <body>
      //       <h1>Redirecting...</h1>
      //       <p>If you are not redirected automatically, <a href="${product.webLink1}">click here</a>.</p>
      //     </body>
      //   </html>
      // `);
      return res.redirect(product.webLink1);
    
    } else if (/iPhone/i.test(userAgent)) {
      // iPhone users
      return res.redirect(product.webLink1);
    } else if (/Android/i.test(userAgent)) {
      // Android users
      return res.redirect(product.webLink1);
    } else {
      // Desktop/Other users
      return res.redirect(product.webLink1);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    await client.close();
  }
};
