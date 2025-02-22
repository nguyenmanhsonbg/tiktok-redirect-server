export default function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required." });
    }

    return res.send(`
        <html>
            <head>
                <script>
                    function openInSafari() {
                            var a = document.createElement("a");
                            a.href = "${decodeURIComponent(url)}";
                            a.target = "_blank"; // Ép mở ngoài trình duyệt
                            document.body.appendChild(a);
                            a.click();
                    }

                    window.onload = openInSafari;
                </script>
            </head>
            <body>
                <p>Đang mở Safari...</p>
            </body>
        </html>
    `);
}
