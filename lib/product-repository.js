const { query } = require("./db");

async function listProducts() {
  const result = await query(
    `
      SELECT id, web_link, deep_link, short_code
      FROM products
      ORDER BY created_at DESC
    `
  );

  return result.rows;
}

async function insertProduct(product) {
  await query(
    `
      INSERT INTO products (id, web_link, deep_link, short_code)
      VALUES ($1, $2, $3, $4)
    `,
    [product.id, product.web_link, product.deep_link, product.short_code]
  );

  return product;
}

async function deleteProductByCode(code) {
  const result = await query(
    `
      DELETE FROM products
      WHERE short_code = $1
      RETURNING id, web_link, deep_link, short_code
    `,
    [code]
  );

  return result.rows[0];
}

async function updateProductByCode(code, product) {
  const result = await query(
    `
      UPDATE products
      SET web_link = $2,
          deep_link = $3
      WHERE short_code = $1
      RETURNING id, web_link, deep_link, short_code
    `,
    [code, product.web_link, product.deep_link]
  );

  return result.rows[0];
}

module.exports = {
  deleteProductByCode,
  insertProduct,
  listProducts,
  updateProductByCode,
};
