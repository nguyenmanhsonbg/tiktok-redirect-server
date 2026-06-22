const GET_PRODUCTS_API = "/api/get-products";
const ADD_PRODUCT_API = "/api/add-product";
const DELETE_PRODUCT_API = "/api/delete-product";

// Default credentials
const defaultUsername = "admin";
const defaultPassword = "admin";

// Get references to modal, container, and form elements
const loginModal = document.getElementById("loginModal");
const mainContainer = document.querySelector(".container");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const productList = document.getElementById("product-list");
const productCount = document.getElementById("product-count");
const addProductForm = document.getElementById("add-product-form");
const logoutButton = document.getElementById("logoutButton");
let cachedProducts = [];

// Check login state on page load
window.onload = async () => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    loginModal.style.display = "none";
    mainContainer.style.display = "block";
    logoutButton.style.display = "inline-block";
    await loadProductList();
  } else {
    loginModal.style.display = "flex";
    mainContainer.style.display = "none";
    logoutButton.style.display = "none";
  }
};

// Handle login form submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === defaultUsername && password === defaultPassword) {
    localStorage.setItem("isLoggedIn", "true");

    loginModal.style.display = "none";
    mainContainer.style.display = "block";
    logoutButton.style.display = "inline-block";
    loadProductList();
  } else {
    loginError.style.display = "block";
  }
});

// Handle product addition
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const webLink1 = document.getElementById("webLink1").value;
  const webLink2 = document.getElementById("webLink2").value;

  try {
    const response = await fetch(ADD_PRODUCT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webLink1, webLink2 }),
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      const product = normalizeProduct(result.product);

      if (product) {
        upsertCachedProduct(product);
        renderProductList(cachedProducts);
      } else {
        await loadProductList();
      }

      alert("Product added successfully!");
      addProductForm.reset();
    } else {
      alert(`Error: ${result.error || "Failed to add product."}`);
    }
  } catch (error) {
    console.error("Failed to add product:", error);
    alert("Error adding product. Please try again.");
  }
});

// Attach logout functionality to the button
logoutButton.addEventListener("click", logout);

// Logout function
function logout() {
  localStorage.removeItem("isLoggedIn");

  mainContainer.style.display = "none";
  logoutButton.style.display = "none";
  loginModal.style.display = "flex";
}

// Load product list from the backend cache
async function loadProductList() {
  try {
    const response = await fetch(GET_PRODUCTS_API, { cache: "no-store" });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error("Error from get-products API:", errBody);
      alert(`Error loading product list: ${errBody.error || "Unknown error"}`);
      return;
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
      console.error("Unexpected products response:", products);
      alert("Invalid product data received from server.");
      return;
    }

    cachedProducts = products.map(normalizeProduct).filter(Boolean);
    renderProductList(cachedProducts);
  } catch (error) {
    console.error("Failed to load product list:", error);
    alert("Error loading product list. Please try again.");
  }
}

function normalizeProduct(product) {
  if (!product) {
    return undefined;
  }

  const shortCode = product.short_code || product.shortCode || product.id;

  if (!shortCode) {
    return undefined;
  }

  return {
    id: product.id || shortCode,
    web_link: product.web_link || product.webLink1 || "",
    deep_link: product.deep_link || product.deepLink || "",
    short_code: shortCode,
  };
}

function upsertCachedProduct(product) {
  cachedProducts = cachedProducts.filter(
    (item) => item.short_code !== product.short_code
  );
  cachedProducts.unshift(product);
}

function removeCachedProduct(shortCode) {
  cachedProducts = cachedProducts.filter(
    (product) => product.short_code !== shortCode && product.id !== shortCode
  );
}

function appendTextCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.appendChild(cell);
}

function appendLinkCell(row, href) {
  const cell = document.createElement("td");

  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = href;
    cell.appendChild(link);
  }

  row.appendChild(cell);
}

function appendActionsCell(row, shortCode) {
  const cell = document.createElement("td");
  cell.className = "actions";

  const copyCodeButton = document.createElement("button");
  copyCodeButton.type = "button";
  copyCodeButton.textContent = "Copy code";
  copyCodeButton.addEventListener("click", () => copyToClipboard(shortCode));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button-danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteProduct(shortCode));

  const copyLinkButton = document.createElement("button");
  copyLinkButton.type = "button";
  copyLinkButton.textContent = "Copy Link";
  copyLinkButton.addEventListener("click", () => {
    copyToClipboard(
      `${window.location.origin}/api/redirect?code=${encodeURIComponent(shortCode)}`
    );
  });

  cell.appendChild(copyCodeButton);
  cell.appendChild(deleteButton);
  cell.appendChild(copyLinkButton);
  row.appendChild(cell);
}

function renderProductList(products) {
  productList.innerHTML = "";

  if (productCount) {
    productCount.textContent = `${products.length} sản phẩm`;
  }

  products.forEach((product) => {
    const id = product.id || "";
    const deepLink = product.deep_link || "";
    const webLink = product.web_link || "";
    const shortCode = product.short_code || "";

    const row = document.createElement("tr");
    appendTextCell(row, id);
    appendLinkCell(row, deepLink);
    appendLinkCell(row, webLink);
    appendTextCell(row, shortCode);
    appendActionsCell(row, shortCode);
    productList.appendChild(row);
  });
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => alert("Copied to clipboard!"),
    () => alert("Failed to copy.")
  );
}

// Delete a product from the backend
async function deleteProduct(shortCode) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const response = await fetch(`${DELETE_PRODUCT_API}?code=${encodeURIComponent(shortCode)}`, {
      method: "DELETE",
    });

    if (response.ok) {
      removeCachedProduct(shortCode);
      renderProductList(cachedProducts);
      alert("Product deleted successfully!");
    } else {
      const error = await response.json().catch(() => ({}));
      alert(`Error: ${error.error || "Failed to delete product."}`);
    }
  } catch (error) {
    console.error("Failed to delete product:", error);
    alert("Error deleting product. Please try again.");
  }
}
