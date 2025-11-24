const GET_PRODUCTS_API = "https://tiktok-redirect-server.vercel.app/api/get-products";
const ADD_PRODUCT_API = "https://tiktok-redirect-server.vercel.app/api/add-product";
const DELETE_PRODUCT_API = "https://tiktok-redirect-server.vercel.app/api/delete-product";

// Default credentials
const defaultUsername = "admin";
const defaultPassword = "admin";

// Get references to modal, container, and form elements
const loginModal = document.getElementById("loginModal");
const mainContainer = document.querySelector(".container");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const productList = document.getElementById("product-list");
const addProductForm = document.getElementById("add-product-form");
const logoutButton = document.getElementById("logoutButton");

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

    if (response.ok) {
      alert("Product added successfully!");
      await loadProductList();
      addProductForm.reset();
    } else {
      const error = await response.json().catch(() => ({}));
      alert(`Error: ${error.error || "Failed to add product."}`);
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

// Load product list from the backend
async function loadProductList() {
  try {
    const response = await fetch(GET_PRODUCTS_API);

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

    // Clear existing rows
    productList.innerHTML = "";

    // Populate the table with products from Google Sheet
    products.forEach((product) => {
      // Expecting fields: id, web_link, deep_link, short_code
      const id = product.id || "";
      const deepLink = product.deep_link || "";
      const webLink = product.web_link || "";
      const shortCode = product.short_code || "";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${id}</td>
        <td><a href="${deepLink}" target="_blank" rel="noopener noreferrer">${deepLink}</a></td>
        <td><a href="${webLink}" target="_blank" rel="noopener noreferrer">${webLink}</a></td>
        <td>${shortCode}</td>
        <td class="actions">
          <button onclick="copyToClipboard('${shortCode}')">Copy code</button>
          <button onclick="deleteProduct('${id}')">Delete</button>
          <button onclick="copyToClipboard('https://tiktok-redirect-server.vercel.app/api/redirect?code=${encodeURIComponent(
            shortCode
          )}')">Copy Link</button>
        </td>
      `;

      productList.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load product list:", error);
    alert("Error loading product list. Please try again.");
  }
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
      alert("Product deleted successfully!");
      await loadProductList();
    } else {
      const error = await response.json().catch(() => ({}));
      alert(`Error: ${error.error || "Failed to delete product."}`);
    }
  } catch (error) {
    console.error("Failed to delete product:", error);
    alert("Error deleting product. Please try again.");
  }
}
