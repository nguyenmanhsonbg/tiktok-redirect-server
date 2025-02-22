
const express = require("express");
const router = express.Router();

// ✅ Route trung gian mở Universal Link trong Safari
router.get("/", (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required." });
    }

    return res.send(`
        <html>
            <head>
                <script>
                    function openShopee() {
                        window.location.replace("${url}");
                    }
                    window.onload = openShopee;
                </script>
            </head>
            <body>
                <p>Đang mở Shopee...</p>
            </body>
        </html>
    `);
});

module.exports = router;
