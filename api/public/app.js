// Backend API endpoints
const GET_PRODUCTS_API = "http://tiktok-redirect-server.vercel.app/get-products";
const ADD_PRODUCT_API = "http://tiktok-redirect-server.vercel.app/add-product";
const DELETE_PRODUCT_API = "http://tiktok-redirect-server.vercel.app/delete-product";

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
    // If user is logged in, show the dashboard
    loginModal.style.display = "none";
    mainContainer.style.display = "block";
    logoutButton.style.display = "inline-block";
    await loadProductList();
  } else {
    // Show login modal if not logged in
    loginModal.style.display = "flex";
    mainContainer.style.display = "none";
    logoutButton.style.display = "none";
  }
};

// Handle login form submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get user input
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Validate credentials
  if (username === defaultUsername && password === defaultPassword) {
    // Store login state in localStorage
    localStorage.setItem("isLoggedIn", "true");

    // Hide the modal and show the main container
    loginModal.style.display = "none";
    mainContainer.style.display = "block";
    logoutButton.style.display = "inline-block";
    loadProductList();
  } else {
    // Show error message for invalid credentials
    loginError.style.display = "block";
  }
});

// Handle product addition
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get product details from form
  const shopId = document.getElementById("shopId").value;
  const productId = document.getElementById("productId").value;

  try {
    // Send POST request to add product
    const response = await fetch(ADD_PRODUCT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, productId }),
    });

    if (response.ok) {
      alert("Product added successfully!");
      loadProductList(); // Reload the product list
      addProductForm.reset(); // Clear the form
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
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
  // Clear login state
  localStorage.removeItem("isLoggedIn");

  // Hide the main container and show the login modal
  mainContainer.style.display = "none";
  logoutButton.style.display = "none";
  loginModal.style.display = "flex";
}

// Load product list from the backend
async function loadProductList() {
  try {
    const response = await fetch(GET_PRODUCTS_API);
    const products = await response.json();

    // Clear existing rows in the table
    productList.innerHTML = "";

    // Populate the table with products
    products.forEach((product) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${product.shopId}</td>
        <td>${product.productId}</td>
        <td><a href="${product.deepLink}" target="_blank">${product.deepLink}</a></td>
        <td><a href="${product.webLink}" target="_blank">${product.webLink}</a></td>
        <td>${product.shortCode}</td>
        <td class="actions">
          <button onclick="copyToClipboard('${product.shortCode}')">Copy</button>
          <button onclick="deleteProduct('${product.shortCode}')">Delete</button>
        </td>
      `;

      productList.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load product list:", error);
    alert("Error loading product list. Please try again.");
  }
}

// Copy short code to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => alert("Short code copied to clipboard!"),
    () => alert("Failed to copy short code.")
  );
}

// Delete a product from the backend
async function deleteProduct(shortCode) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const response = await fetch(`${DELETE_PRODUCT_API}?code=${shortCode}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Product deleted successfully!");
      loadProductList(); // Reload the product list
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    console.error("Failed to delete product:", error);
    alert("Error deleting product. Please try again.");
  }
}
