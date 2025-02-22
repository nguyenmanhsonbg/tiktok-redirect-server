export default function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required." });
    }

    return res.send(`
        <html>
            <head>
                <script>
                    function redirectToGoogle() {
                        window.location.replace("${decodeURIComponent(url)}");
                    }
                    window.onload = redirectToGoogle;
                </script>
            </head>
            <body>
                <p>Đang mở Safari, vui lòng đợi...</p>
            </body>
        </html>
    `);
}
