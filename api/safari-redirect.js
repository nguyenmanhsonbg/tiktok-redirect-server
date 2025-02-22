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
                        var isFacebookApp = navigator.userAgent.includes("FBAN") || navigator.userAgent.includes("FBAV") || 
                                            navigator.userAgent.includes("Instagram") || navigator.userAgent.includes("TikTok") ||
                                            navigator.userAgent.includes("Zalo") || navigator.userAgent.includes("Twitter");

                        if (isFacebookApp) {
                            // ✅ Tạo một thẻ `<a>` và tự động click để mở Safari
                            var a = document.createElement("a");
                            a.href = "${decodeURIComponent(url)}";
                            a.target = "_blank"; // Ép mở ngoài trình duyệt
                            document.body.appendChild(a);
                            a.click();
                        } else {
                            // ✅ Nếu đã ở Safari, mở Shopee App ngay
                            window.location.replace("${decodeURIComponent(url)}");
                        }
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
