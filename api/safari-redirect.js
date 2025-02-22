export default function handler(req, res) {
    const { url } = req.query;
  
    // Kiểm tra tham số bắt buộc
    if (!url) {
      return res.status(400).json({ error: "URL is required." });
    }
  
    // Giải mã URL để sử dụng an toàn
    const decodedUrl = decodeURIComponent(url);
  
    // Domain trung gian của bạn (giả sử bạn đã cấu hình Universal Links)
    const intermediateRedirect = `https://tiktok-redirect-server.vercel.app/api/safari-redirect?url=${encodeURIComponent(
      decodedUrl
    )}`; // Thay bằng domain thực tế của bạn
  
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
              const isAndroid = /android/i.test(userAgent);
  
              if (isInApp && isIOS) {
                // Sử dụng Universal Links qua domain trung gian để mở Safari mà không cần popup
                window.location.href = "${intermediateRedirect}";
              } else if (isInApp && isAndroid) {
                // Đối với Android, thử redirect qua intent hoặc deep link (nếu có)
                window.location.href = "intent://open#Intent;scheme=https;package=com.android.browser;end;" + 
                                      encodeURIComponent("${decodedUrl}");
                setTimeout(() => {
                  window.location.replace("${decodedUrl}");
                }, 1000);
              } else {
                // Nếu đã ở ngoài in-app (Safari, Chrome, v.v.), redirect ngay
                window.location.replace("${decodedUrl}");
              }
            }
  
            // Xử lý nếu JavaScript bị tắt
            window.onload = attemptRedirect;
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0;url=${encodedUrl}">
          </noscript>
        </head>
        <body>
          <p>Đang chuyển hướng... Nếu không tự động, <a href="${encodedUrl}">nhấn vào đây</a>.</p>
        </body>
      </html>
    `);
  }