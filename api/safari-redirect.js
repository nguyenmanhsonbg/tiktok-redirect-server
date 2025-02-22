
module.exports = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Valid URL is required." });
    }

    console.log("Safari redirect");

    return res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redirecting...</title>
            <script>
                function openSafari() {
                    window.location.replace("${encodeURIComponent(url)}");
                }
                window.onload = openSafari;
            </script>
        </head>
        <body>
            <p>Đang mở Shopee123...</p>
        </body>
        </html>
    `);
}