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
  
    return res.send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="robots" content="noindex, nofollow">
          <title>Chuyển hướng...</title>
          <script>
            function redirect() {
              const userAgent = navigator.userAgent.toLowerCase();
              const isInApp = /fban|fbav|instagram|tiktok|zalo|twitter/i.test(userAgent);
              const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  
              if (isInApp && isIOS) {
                // Tận dụng Universal Links để mở Safari mà không cần popup
                window.location.replace("${decodedUrl}");
              } else {
                window.location.replace("${decodedUrl}");
              }
            }
            window.onload = redirect;
          </script>
        </head>
        <body>
          <p>Đang chuyển hướng... Nếu không tự động, <a href="${decodedUrl}">nhấn vào đây</a>.</p>
        </body>
      </html>
    `);
  }