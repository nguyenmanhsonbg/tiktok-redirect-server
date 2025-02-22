export default function handler(req, res) {
    const { url } = req.query;
  
    // Kiểm tra tham số bắt buộc
    if (!url) {
      return res.status(400).json({ error: "URL is required." });
    }
  
    // Giải mã URL để sử dụng an toàn
    const decodedUrl = decodeURIComponent(url);
  
    // Lấy và phân tích user-agent để tối ưu hóa redirect
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isInApp = /fban|fbav|instagram|tiktok|zalo|twitter/i.test(userAgent);
  
    // Tạo HTML động để redirect, tận dụng Universal Links trên iOS
    return res.send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="robots" content="noindex, nofollow"> <!-- Tránh index bởi bot -->
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Chuyển hướng...</title>
          <script>
            function attemptRedirect() {
              const userAgent = navigator.userAgent.toLowerCase();
              const isInApp = /fban|fbav|instagram|tiktok|zalo|twitter/i.test(userAgent);
              const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  
              if (isInApp && isIOS) {
                // Nếu ở trong in-app trên iOS, redirect trực tiếp để tận dụng Universal Links
                window.location.replace("${decodedUrl}");
              } else {
                // Nếu ở ngoài in-app hoặc không phải iOS, redirect ngay
                window.location.replace("${decodedUrl}");
              }
            }
  
            // Xử lý nếu JavaScript bị tắt
            window.onload = attemptRedirect;
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0;url=${encodedURIComponent(decodedUrl)}">
          </noscript>
        </head>
        <body>
          <p>Đang chuyển hướng... Nếu không tự động, <a href="${decodedUrl}">nhấn vào đây</a>.</p>
        </body>
      </html>
    `);
  }