const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/add-product", require("./api/add-product"));
app.use("/api/delete-product", require("./api/delete-product"));
app.use("/api/get-products", require("./api/get-products"));
app.use("/api/redirect", require("./api/redirect"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
