const express = require("express");
const path = require("path");

const app = express();

// // Middleware để xử lý JSON
// app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));

// // Serve các file tĩnh trong thư mục "public"
// app.use(express.static(path.join(__dirname, "public")));

// // API routes
// app.use("/api/add-product", require("./api/add-product.js"));
// app.use("/api/delete-product", require("./api/delete-product.js"));
// app.use("/api/get-products", require("./api/get-products.js"));
// app.use("/api/redirect", require("./api/redirect.js"));
// app.use("/api/safari-redirect", require("./api/safari-redirect.js"));

// // Lắng nghe trên cổng 3000
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
