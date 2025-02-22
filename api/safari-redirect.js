export default function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required." });
    }

    return res.send(`
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script>
                    function attemptRedirect() {
                        var userAgent = navigator.userAgent.toLowerCase();
                        var isInApp = /fban|fbav|instagram|tiktok|zalo|twitter/.test(userAgent);

                        if (isInApp) {
                            // Đối với iOS, thử dùng Universal Links hoặc khuyến khích mở Safari
                            window.location.href = "${decodeURIComponent(url)}";
                            setTimeout(() => {
                                // Hiển thị thông báo nếu không tự động thoát
                                document.body.innerHTML = "<p>Vui lòng nhấn vào nút '...' ở góc trên bên phải và chọn 'Mở trong Safari' để tiếp tục.</p>";
                            }, 1000);
                        } else {
                            // Nếu đã ở ngoài in-app, redirect ngay
                            window.location.replace("${decodeURIComponent(url)}");
                        }
                    }

                    window.onload = attemptRedirect;
                </script>
            </head>
            <body>
                <p>Đang chuyển hướng...</p>
            </body>
        </html>
    `);
}