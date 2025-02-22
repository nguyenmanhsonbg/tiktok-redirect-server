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
                            // ✅ Dùng setTimeout() để tránh bị chặn
                            setTimeout(function() {
                                var a = document.createElement("a");
                                a.href = "${decodeURIComponent(url)}";
                                a.target = "_blank";
                                document.body.appendChild(a);
                                a.click();
                            }, 1000);
                        } else {
                            // ✅ Nếu đã ở Safari, mở Shopee ngay
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
