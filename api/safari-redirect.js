export default function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send(`
            <html>
                <body>
                    <p style="text-align:center;">⚠️ URL không hợp lệ. Vui lòng thử lại.</p>
                </body>
            </html>
        `);
    }

    const decodedUrl = decodeURIComponent(url);

    res.setHeader("Content-Type", "text/html");
    res.send(`
        <html>
            <head>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        window.location.href = "${decodedUrl}";
                    });
                </script>
            </head>
            <body>
                <p style="text-align:center;">Đang chuyển hướng đến Shopee...</p>
            </body>
        </html>
    `);
}
