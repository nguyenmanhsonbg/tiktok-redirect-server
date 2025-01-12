vconst express = require("express");
const app = express();

// API route để xử lý redirect
app.get("/", (req, res) => {
    const shopId = "1305636544"; // Shop ID
    const productId = "29106353770"; // Product ID
    const userAgent = req.headers["user-agent"]; // Detect thiết bị

    // Link Shopee cho app và web
    const deepLink = `shopee://product/${shopId}/${productId}`;
    const webLink = `https://shopee.vn/product/${shopId}/${productId}`;

    // Phân tích thiết bị và chọn link redirect
    let redirectUrl;
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        redirectUrl = deepLink; // iOS
    } else if (/Android/i.test(userAgent)) {
        redirectUrl = deepLink; // Android
    } else {
        redirectUrl = webLink; // Desktop
    }

    // Thêm các query params nếu có
    const trackingParams = req.query;
    const queryString = new URLSearchParams(trackingParams).toString();
    if (queryString) {
        redirectUrl += `?${queryString}`;
    }

    // Redirect người dùng
    res.redirect(redirectUrl);
});

// Export serverless function cho Vercel
module.exports = (req, res) => {
    app(req, res);
};
