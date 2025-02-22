export default function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required." });
    }

    return res.send(`
        <html>
            <head>
                <script>
                    function redirectToShopee() {
                        window.location.replace("${decodeURIComponent(url)}");
                    }
                    window.onload = redirectToShopee;
                </script>
            </head>
            <body>
                <p>Đang mở Shopee...</p>
            </body>
        </html>
    `);
}
