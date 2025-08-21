// Global variables
let currentUser = null
let currentCustomer = null
let cart = []
let selectedItem = null
let appliedDiscount = null
let allItems = [] // Added global variable to store all items for search

// API Configuration
const API_BASE = "http://localhost:8080/api"

const DISCOUNT_CODES = {
  STUDENT10: { percentage: 10, description: "Student Discount 10%" },
  WELCOME5: { percentage: 5, description: "Welcome Discount 5%" },
  BULK15: { percentage: 15, description: "Bulk Purchase 15%" },
  NEWUSER20: { percentage: 20, description: "New User Discount 20%" },
}

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }
    return await response.text()
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}

async function login(event) {
  event.preventDefault()

  const username = document.getElementById("loginUsername").value
  const password = document.getElementById("loginPassword").value

  try {
    const response = await apiCall("/public/customer/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    // Store user and customer information from login response
    currentUser = response.user
    currentCustomer = response.customer

    // Persist session data in localStorage
    localStorage.setItem("currentUser", JSON.stringify(currentUser))
    localStorage.setItem("currentCustomer", JSON.stringify(currentCustomer))

    console.log("Login successful for user:", currentUser.username, "Customer ID:", currentCustomer.id)
    showDashboard()
  } catch (error) {
    showError("Invalid username or password")
  }
}

async function logout() {
  try {
    await apiCall("/auth/logout", { method: "POST" })
  } catch (error) {
    console.error("Logout error:", error)
  }

  currentUser = null
  currentCustomer = null
  cart = []
  appliedDiscount = null

  // Clear session storage
  localStorage.removeItem("currentUser")
  localStorage.removeItem("currentCustomer")

  showLogin()
}

function restoreSession() {
  try {
    const storedUser = localStorage.getItem("currentUser")
    const storedCustomer = localStorage.getItem("currentCustomer")

    if (storedUser && storedCustomer) {
      currentUser = JSON.parse(storedUser)
      currentCustomer = JSON.parse(storedCustomer)
      console.log("Session restored for user:", currentUser.username, "Customer ID:", currentCustomer.id)
      showDashboard()
      return true
    }
  } catch (error) {
    console.error("Failed to restore session:", error)
    localStorage.removeItem("currentUser")
    localStorage.removeItem("currentCustomer")
  }
  return false
}

// UI functions
function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden")
  document.getElementById("registerForm").classList.add("hidden")
  document.getElementById("loginTab").className =
    "flex-1 py-2 px-4 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm"
  document.getElementById("registerTab").className =
    "flex-1 py-2 px-4 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700"
  document.getElementById("loginSection").classList.remove("hidden")
  document.getElementById("dashboardSection").classList.add("hidden")
}

function showDashboard() {
  document.getElementById("loginSection").classList.add("hidden")
  document.getElementById("dashboardSection").classList.remove("hidden")
  document.getElementById("customerName").textContent = currentCustomer?.name || currentUser?.username

  // Populate profile form immediately with login data
  populateProfileForm()
  showSection("profile")
}

function showError(message) {
  const errorDiv = document.getElementById("loginError")
  errorDiv.textContent = message
  errorDiv.classList.remove("hidden")
  setTimeout(() => errorDiv.classList.add("hidden"), 5000)
}

function showSuccess(message) {
  const successDiv = document.getElementById("successMessage")
  successDiv.textContent = message
  successDiv.classList.remove("hidden")
  setTimeout(() => successDiv.classList.add("hidden"), 5000)
}

function showSection(section) {
  // Hide all sections
  document.querySelectorAll('[id$="Section"]').forEach((el) => {
    if (el.id !== "loginSection" && el.id !== "dashboardSection") {
      el.classList.add("hidden")
    }
  })

  // Remove active class from all tabs
  document.querySelectorAll('[id$="Tab"]').forEach((tab) => {
    tab.classList.remove("border-blue-300", "bg-blue-700")
  })

  // Show selected section and activate tab
  document.getElementById(`${section}Section`).classList.remove("hidden")
  const tab = document.getElementById(`${section}Tab`)
  if (tab) {
    tab.classList.add("border-blue-300", "bg-blue-700")
  }

  // Load section data
  switch (section) {
    case "profile":
      // No need to load profile separately
      break
    case "items":
      loadItems()
      break
    case "cart":
      updateCartDisplay()
      break
    case "orders":
      loadOrders()
      break
    case "report":
      generateReport()
      break
  }
}

function showRegisterForm() {
  document.getElementById("loginForm").classList.add("hidden")
  document.getElementById("registerForm").classList.remove("hidden")
  document.getElementById("loginTab").className =
    "flex-1 py-2 px-4 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700"
  document.getElementById("registerTab").className =
    "flex-1 py-2 px-4 text-sm font-medium rounded-md bg-white text-green-600 shadow-sm"
  clearMessages()
}

function clearMessages() {
  document.getElementById("loginError").classList.add("hidden")
  document.getElementById("successMessage").classList.add("hidden")
}

function showLoginForm() {
  document.getElementById("registerForm").classList.add("hidden")
  document.getElementById("loginForm").classList.remove("hidden")
  document.getElementById("registerTab").className =
    "flex-1 py-2 px-4 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700"
  document.getElementById("loginTab").className =
    "flex-1 py-2 px-4 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm"
}

function populateProfileForm() {
  if (currentCustomer) {
    document.getElementById("accountNumber").value = currentCustomer.accountNumber || ""
    document.getElementById("customerFullName").value = currentCustomer.name || ""
    document.getElementById("customerEmail").value = currentCustomer.email || ""
    document.getElementById("customerPhone").value = currentCustomer.telephone || ""
    document.getElementById("customerAddress").value = currentCustomer.address || ""
  }
}

// Items functions
async function loadItems() {
  try {
    const items = await apiCall("/public/customer/books")

    // Add random ISBN to each book
    const itemsWithISBN = items.map((item) => ({
      ...item,
      isbn: generateISBN(),
      author: item.author || "Unknown Author", // Add default author if not present
      publisher: item.publisher || "Unknown Publisher", // Add default publisher
      publicationYear: item.publicationYear || new Date().getFullYear() - Math.floor(Math.random() * 50), // Random year within last 50 years
    }))

    allItems = itemsWithISBN // Store all items for search functionality
    displayItems(itemsWithISBN)
    loadCategories(itemsWithISBN)
  } catch (error) {
    console.error("Failed to load items:", error)
  }
}

function displayItems(items) {
  const grid = document.getElementById("itemsGrid")
  grid.innerHTML = ""

  items.forEach((item) => {
    const itemCard = document.createElement("div")
    itemCard.className = "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-200"

    let stockStatus = "In Stock"
    let stockClass = "bg-green-100 text-green-800"

    if (item.stockQuantity <= 0) {
      stockStatus = "Out of Stock"
      stockClass = "bg-red-100 text-red-800"
    } else if (item.stockQuantity <= 5) {
      stockStatus = `Low Stock (${item.stockQuantity})`
      stockClass = "bg-yellow-100 text-yellow-800"
    }

    itemCard.innerHTML = `
      <div class="p-4">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-semibold text-gray-800 line-clamp-2 cursor-pointer hover:text-blue-600" 
              onclick="showItemDetails(${item.id})">${item.name || "Untitled"}</h3>
          <span class="text-sm px-2 py-1 rounded-full ${stockClass}">
            ${stockStatus}
          </span>
        </div>
        
        <p class="text-gray-600 text-sm mb-2"><strong>Author:</strong> ${item.author}</p>
        <p class="text-gray-600 text-sm mb-2"><strong>ISBN:</strong> ${item.isbn}</p>
        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${item.description || "No description available"}</p>
        
        <div class="flex justify-between items-center mb-3">
          <span class="text-2xl font-bold text-blue-600">$${(item.price || 0).toFixed(2)}</span>
          <span class="text-sm text-gray-500">${item.category || "Uncategorized"}</span>
        </div>
        
        <div class="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>Code: ${item.itemCode || "N/A"}</span>
          <span>Stock: ${item.stockQuantity || 0}</span>
        </div>
        
        ${
          item.stockQuantity <= 5 && item.stockQuantity > 0
            ? `<div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            Only ${item.stockQuantity} left in stock!
          </div>`
            : ""
        }
        
        <div class="flex space-x-2">
          <button onclick="showItemDetails(${item.id})" 
                  class="flex-1 py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition duration-200">
            <i class="fas fa-info-circle mr-2"></i>Details
          </button>
          <button onclick="addToCart(${item.id})" 
                  ${item.stockQuantity <= 0 ? "disabled" : ""}
                  class="flex-1 py-2 px-4 rounded-lg font-medium transition duration-200 ${
                    item.stockQuantity > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }">
            <i class="fas fa-cart-plus mr-2"></i>
            ${item.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    `

    grid.appendChild(itemCard)
  })
}

function loadCategories(items) {
  const categoryFilter = document.getElementById("categoryFilter")
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))]

  categoryFilter.innerHTML = '<option value="">All Categories</option>'
  categories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category
    option.textContent = category
    categoryFilter.appendChild(option)
  })
}

// Orders functions
async function loadOrders() {
  if (!currentCustomer) {
    showError("No customer information available")
    return
  }

  try {
    console.log("Loading orders for customer ID:", currentCustomer.id)
    const orders = await apiCall(`/public/customer/orders/${currentCustomer.id}`)
    displayOrders(orders)
  } catch (error) {
    console.error("Failed to load orders:", error)
    showError("Failed to load orders: " + error.message)
  }
}

function displayOrders(orders) {
  const tbody = document.getElementById("ordersTableBody")
  tbody.innerHTML = ""

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-4 text-center text-gray-500">
          No orders found
        </td>
      </tr>
    `
    return
  }

  orders.forEach((order) => {
    const row = document.createElement("tr")
    row.className = "hover:bg-gray-50"

    const statusClass =
      {
        PENDING: "bg-yellow-100 text-yellow-800",
        COMPLETED: "bg-green-100 text-green-800",
        CANCELLED: "bg-red-100 text-red-800",
      }[order.status] || "bg-gray-100 text-gray-800"

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${order.billNumber || "N/A"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${order.billDate ? new Date(order.billDate).toLocaleDateString() : "N/A"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        $${(order.totalAmount || 0).toFixed(2)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
          ${order.status || "Unknown"}
        </span>
        ${order.status === "PENDING" ? `<div class="text-xs text-gray-500 mt-1">Processing your order...</div>` : ""}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="viewOrder(${order.id})" 
                class="text-blue-600 hover:text-blue-900 mr-3">
          <i class="fas fa-eye mr-1"></i>View
        </button>
      </td>
    `

    tbody.appendChild(row)
  })
}

async function viewOrder(orderId) {
  try {
    const order = await apiCall(`/bills/${orderId}`)
    displayOrderDetails(order)
    document.getElementById("orderModal").classList.remove("hidden")
    document.getElementById("orderModal").classList.add("flex")
  } catch (error) {
    console.error("Failed to load order details:", error)
    alert("Failed to load order details")
  }
}

function displayOrderDetails(order) {
  const detailsDiv = document.getElementById("orderDetails")

  const statusClass =
    {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    }[order.status] || "bg-gray-100 text-gray-800"

  detailsDiv.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Bill Number</label>
                    <p class="text-sm text-gray-900">${order.billNumber || "N/A"}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Date</label>
                    <p class="text-sm text-gray-900">${order.billDate ? new Date(order.billDate).toLocaleDateString() : "N/A"}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                        ${order.status || "Unknown"}
                    </span>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p class="text-sm text-gray-900 font-semibold">$${(order.totalAmount || 0).toFixed(2)}</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Items</label>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${(order.billItems || [])
                              .map(
                                (item) => `
                                <tr>
                                    <td class="px-4 py-2 text-sm text-gray-900">${item.item?.name || "Unknown Item"}</td>
                                    <td class="px-4 py-2 text-sm text-gray-900">${item.quantity || 0}</td>
                                    <td class="px-4 py-2 text-sm text-gray-900">$${(item.unitPrice || 0).toFixed(2)}</td>
                                    <td class="px-4 py-2 text-sm text-gray-900">$${(item.totalPrice || 0).toFixed(2)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
}

function closeOrderModal() {
  document.getElementById("orderModal").classList.add("hidden")
  document.getElementById("orderModal").classList.remove("flex")
}

// Cart management functions
function addToCart(itemId) {
  apiCall("/public/customer/books")
    .then((items) => {
      selectedItem = items.find((item) => item.id === itemId)
      if (selectedItem) {
        // Set max quantity based on stock
        const maxQuantity = Math.min(selectedItem.stockQuantity, 10)
        document.getElementById("cartQuantity").max = maxQuantity
        document.getElementById("cartQuantity").value = 1

        // Update stock warning
        const stockWarning = document.getElementById("stockWarning")
        if (selectedItem.stockQuantity <= 5) {
          stockWarning.textContent = `Only ${selectedItem.stockQuantity} available in stock`
          stockWarning.className = "text-sm text-yellow-600 mt-1"
        } else {
          stockWarning.textContent = `${selectedItem.stockQuantity} available`
          stockWarning.className = "text-sm text-gray-500 mt-1"
        }

        updateCartModalPricing()
        document.getElementById("cartModal").classList.remove("hidden")
        document.getElementById("cartModal").classList.add("flex")
      }
    })
    .catch((error) => {
      console.error("Failed to load item:", error)
    })
}

function confirmAddToCart() {
  const quantity = Number.parseInt(document.getElementById("cartQuantity").value)

  if (selectedItem && quantity > 0) {
    // Validate stock availability
    if (quantity > selectedItem.stockQuantity) {
      showError(`Requested quantity not available. Only ${selectedItem.stockQuantity} in stock.`)
      return
    }

    const existingItem = cart.find((item) => item.id === selectedItem.id)
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity

    if (totalQuantity > selectedItem.stockQuantity) {
      showError(
        `Cannot add ${quantity} items. You already have ${existingItem.quantity} in cart. Only ${selectedItem.stockQuantity} available.`,
      )
      return
    }

    if (existingItem) {
      existingItem.quantity += quantity
      if (appliedDiscount) {
        existingItem.discount = appliedDiscount
      }
    } else {
      const cartItem = {
        ...selectedItem,
        quantity: quantity,
      }
      if (appliedDiscount) {
        cartItem.discount = appliedDiscount
      }
      cart.push(cartItem)
    }

    updateCartDisplay()
    closeCartModal()
    showSuccess(`${selectedItem.name} added to cart!`)

    // Reset discount for next item
    appliedDiscount = null
    document.getElementById("discountCode").value = ""
  }
}

function removeFromCart(itemId) {
  cart = cart.filter((item) => item.id !== itemId)
  updateCartDisplay()
}

function updateCartQuantity(itemId, quantity) {
  const item = cart.find((item) => item.id === itemId)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      item.quantity = quantity
      updateCartDisplay()
    }
  }
}

function clearCart() {
  if (confirm("Are you sure you want to clear your cart?")) {
    cart = []
    updateCartDisplay()
  }
}

function updateCartDisplay() {
  const cartCount = document.getElementById("cartCount")
  const cartItems = document.getElementById("cartItems")
  const cartEmpty = document.getElementById("cartEmpty")
  const cartSummary = document.getElementById("cartSummary")
  const cartTotal = document.getElementById("cartTotal")

  // Update cart count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  if (totalItems > 0) {
    cartCount.textContent = totalItems
    cartCount.classList.remove("hidden")
  } else {
    cartCount.classList.add("hidden")
  }

  // Update cart items display
  if (cart.length === 0) {
    cartItems.innerHTML = ""
    cartEmpty.classList.remove("hidden")
    cartSummary.classList.add("hidden")
  } else {
    cartEmpty.classList.add("hidden")
    cartSummary.classList.remove("hidden")

    cartItems.innerHTML = cart
      .map(
        (item) => `
      <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">${item.name}</h4>
          <p class="text-sm text-gray-600">$${item.price.toFixed(2)} each</p>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" 
                  class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
            <i class="fas fa-minus text-sm"></i>
          </button>
          <span class="w-8 text-center font-medium">${item.quantity}</span>
          <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" 
                  class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
            <i class="fas fa-plus text-sm"></i>
          </button>
          <button onclick="removeFromCart(${item.id})" 
                  class="text-red-600 hover:text-red-800 ml-3">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="ml-4 font-semibold text-gray-800">
          $${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    `,
      )
      .join("")

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    cartTotal.textContent = `$${total.toFixed(2)}`
  }
}

function showCart() {
  showSection("cart")
}

function closeCartModal() {
  document.getElementById("cartModal").classList.add("hidden")
  document.getElementById("cartModal").classList.remove("flex")
  document.getElementById("cartQuantity").value = 1
  appliedDiscount = null
  document.getElementById("discountCode").value = ""
  document.getElementById("priceBreakdown").classList.add("hidden")
}

function applyDiscount() {
  const discountCode = document.getElementById("discountCode").value.trim().toUpperCase()

  if (!discountCode) {
    showError("Please enter a discount code")
    return
  }

  if (DISCOUNT_CODES[discountCode]) {
    appliedDiscount = DISCOUNT_CODES[discountCode]
    updateCartModalPricing()
    showSuccess(`${appliedDiscount.description} applied!`)
  } else {
    showError("Invalid discount code")
  }
}

function updateCartModalPricing() {
  if (!selectedItem) return

  const quantity = Number.parseInt(document.getElementById("cartQuantity").value) || 1
  const subtotal = selectedItem.price * quantity

  let discountAmount = 0
  if (appliedDiscount) {
    discountAmount = (subtotal * appliedDiscount.percentage) / 100
  }

  const finalTotal = subtotal - discountAmount

  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`
  document.getElementById("discountAmount").textContent = `-$${discountAmount.toFixed(2)}`
  document.getElementById("finalTotal").textContent = `$${finalTotal.toFixed(2)}`

  const priceBreakdown = document.getElementById("priceBreakdown")
  if (appliedDiscount) {
    priceBreakdown.classList.remove("hidden")
  } else {
    priceBreakdown.classList.add("hidden")
  }
}

// Enhanced checkout to use current customer ID
async function checkout() {
  if (cart.length === 0) {
    showError("Your cart is empty")
    return
  }

  if (!currentCustomer) {
    showError("Please log in to place an order")
    return
  }

  try {
    console.log("Creating order for customer ID:", currentCustomer.id)
    const orderData = {
      customerId: currentCustomer.id,
      items: cart.map((item) => ({
        itemId: item.id,
        quantity: item.quantity,
      })),
    }

    const result = await apiCall("/public/customer/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    showSuccess(`Order placed successfully! Bill Number: ${result.billNumber}`)
    cart = []
    updateCartDisplay()
    hideModal("cartModal")
    loadOrders() // Refresh orders list
  } catch (error) {
    console.error("Checkout failed:", error)
    showError("Checkout failed: " + error.message)
  }
}

// Item details modal functionality
async function showItemDetails(itemId) {
  const item = allItems.find((i) => i.id === itemId)
  if (!item) return

  const modal = document.getElementById("itemModal")
  const details = document.getElementById("itemDetails")

  let stockStatus = "In Stock"
  let stockClass = "text-green-600"

  if (item.stockQuantity <= 0) {
    stockStatus = "Out of Stock"
    stockClass = "text-red-600"
  } else if (item.stockQuantity <= 5) {
    stockStatus = `Low Stock (${item.stockQuantity} remaining)`
    stockClass = "text-yellow-600"
  }

  details.innerHTML = `
    <div class="space-y-4">
      <div>
        <h4 class="text-xl font-bold text-gray-800 mb-2">${item.name || "Untitled"}</h4>
        <p class="text-gray-600">${item.description || "No description available"}</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700">Author:</span>
          <span class="text-gray-600 ml-2">${item.author}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">ISBN:</span>
          <span class="text-gray-600 ml-2">${item.isbn}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Publisher:</span>
          <span class="text-gray-600 ml-2">${item.publisher}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Publication Year:</span>
          <span class="text-gray-600 ml-2">${item.publicationYear}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Category:</span>
          <span class="text-gray-600 ml-2">${item.category || "Uncategorized"}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Item Code:</span>
          <span class="text-gray-600 ml-2">${item.itemCode || "N/A"}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Price:</span>
          <span class="text-blue-600 font-bold ml-2">$${(item.price || 0).toFixed(2)}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Stock Status:</span>
          <span class="${stockClass} font-medium ml-2">${stockStatus}</span>
        </div>
      </div>
      
      ${
        item.stockQuantity > 0
          ? `
        <div class="mt-6">
          <button onclick="addToCart(${item.id}); closeItemModal()" 
                  class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium">
            <i class="fas fa-cart-plus mr-2"></i>Add to Cart
          </button>
        </div>
      `
          : `
        <div class="mt-6">
          <button disabled 
                  class="w-full bg-gray-300 text-gray-500 py-3 rounded-lg cursor-not-allowed font-medium">
            <i class="fas fa-times mr-2"></i>Out of Stock
          </button>
        </div>
      `
      }
    </div>
  `

  modal.classList.remove("hidden")
  modal.classList.add("flex")
}

function closeItemModal() {
  document.getElementById("itemModal").classList.add("hidden")
  document.getElementById("itemModal").classList.remove("flex")
}

function addToCartFromDetails(itemId) {
  closeItemModal()
  addToCart(itemId)
}

function generateISBN() {
  // Generate a 13-digit ISBN (978 prefix + 9 random digits + check digit)
  const prefix = "978"
  const randomDigits = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0")
  const isbn = prefix + randomDigits

  // Calculate check digit using ISBN-13 algorithm
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10

  return isbn + checkDigit
}

// Enhanced filterItems function to search by name, author, ISBN, and item code
function filterItems() {
  const searchTerm = document.getElementById("itemSearch")?.value.toLowerCase() || ""
  const categoryFilter = document.getElementById("categoryFilter")?.value || ""
  const stockFilter = document.getElementById("stockFilter")?.value || ""

  const filteredItems = allItems.filter((item) => {
    // Search by name, author, ISBN, or item code
    const matchesSearch =
      !searchTerm ||
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.author && item.author.toLowerCase().includes(searchTerm)) ||
      (item.isbn && item.isbn.toLowerCase().includes(searchTerm)) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm))

    // Filter by category
    const matchesCategory = !categoryFilter || item.category === categoryFilter

    // Filter by stock status
    let matchesStock = true
    if (stockFilter === "in-stock") {
      matchesStock = item.stockQuantity > 5
    } else if (stockFilter === "low-stock") {
      matchesStock = item.stockQuantity > 0 && item.stockQuantity <= 5
    } else if (stockFilter === "out-of-stock") {
      matchesStock = item.stockQuantity <= 0
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  displayItems(filteredItems)
}

// Added setupSearchFunctionality function to initialize search functionality
function setupSearchFunctionality() {
  const searchInput = document.getElementById("itemSearch")
  const categoryFilter = document.getElementById("categoryFilter")
  const stockFilter = document.getElementById("stockFilter")

  if (searchInput) {
    searchInput.addEventListener("input", filterItems)
  }
  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterItems)
  }
  if (stockFilter) {
    stockFilter.addEventListener("change", filterItems)
  }
}

function printReport() {
  const reportContent = document.getElementById("reportContent").innerHTML
  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
    <html>
      <head>
        <title>Purchase History Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .grid { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { flex: 1; padding: 15px; border: 1px solid #ddd; text-align: center; }
        </style>
      </head>
      <body>
        ${reportContent}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginForm").addEventListener("submit", login)
  document.getElementById("registerForm").addEventListener("submit", register)
  document.getElementById("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault()
    await updateCustomerProfile()
  })
  document.getElementById("cartConfirmButton").addEventListener("click", confirmAddToCart)
  document.getElementById("cartClearButton").addEventListener("click", clearCart)
  document.getElementById("checkoutButton").addEventListener("click", checkout)
  document.getElementById("applyDiscountButton").addEventListener("click", applyDiscount)
  setupSearchFunctionality()

  // Try to restore session first
  if (!restoreSession()) {
    showLogin()
  }

  // Initialize other components
  loadItems()
})

// Close modal when clicking outside
document.getElementById("orderModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeOrderModal()
  }
})

document.getElementById("cartModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeCartModal()
  }
})

document.getElementById("itemModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeItemModal()
  }
})

document.getElementById("reportModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeReportModal()
  }
})

// Helper function to hide modals
function hideModal(modalId) {
  document.getElementById(modalId).classList.add("hidden")
  document.getElementById(modalId).classList.remove("flex")
}

async function updateCustomerProfile() {
  try {
    if (!currentCustomer || !currentCustomer.id) {
      showError("No customer logged in")
      return
    }

    const profileData = {
      name: document.getElementById("customerFullName").value,
      email: document.getElementById("customerEmail").value,
      telephone: document.getElementById("customerPhone").value,
      address: document.getElementById("customerAddress").value,
    }

    const response = await apiCall(`/public/customer/profile/${currentCustomer.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })

    if (response.customer) {
      // Update current customer data
      currentCustomer = response.customer
      localStorage.setItem("currentCustomer", JSON.stringify(currentCustomer))

      // Update display
      document.getElementById("customerName").textContent = currentCustomer.name

      showSuccess("Profile updated successfully!")
    }
  } catch (error) {
    showError("Failed to update profile: " + error.message)
  }
}

function closeReportModal() {
  document.getElementById("reportModal").classList.add("hidden")
  document.getElementById("reportModal").classList.remove("flex")
}

async function generateReport() {
  if (!currentCustomer) {
    showError("Please log in to generate reports")
    return
  }

  try {
    const orders = await apiCall(`/public/customer/orders/${currentCustomer.id}`)

    const reportContent = document.getElementById("reportContent")

    // Calculate statistics
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const completedOrders = orders.filter((order) => order.status === "COMPLETED").length
    const pendingOrders = orders.filter((order) => order.status === "PENDING").length

    reportContent.innerHTML = `
      <div class="space-y-6">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-gray-800 mb-2">Purchase History Report</h3>
          <p class="text-gray-600">Customer: ${currentCustomer.name}</p>
          <p class="text-gray-600">Account: ${currentCustomer.accountNumber}</p>
          <p class="text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-600">${totalOrders}</div>
            <div class="text-sm text-gray-600">Total Orders</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-600">$${totalSpent.toFixed(2)}</div>
            <div class="text-sm text-gray-600">Total Spent</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-yellow-600">${pendingOrders}</div>
            <div class="text-sm text-gray-600">Pending Orders</div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-600">${completedOrders}</div>
            <div class="text-sm text-gray-600">Completed Orders</div>
          </div>
        </div>
        
        <div>
          <h4 class="text-lg font-semibold text-gray-800 mb-4">Order History</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bill Number</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${orders
                  .map(
                    (order) => `
                  <tr>
                    <td class="px-6 py-4 text-sm text-gray-900">${order.billNumber || "N/A"}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${order.billDate ? new Date(order.billDate).toLocaleDateString() : "N/A"}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">$${(order.totalAmount || 0).toFixed(2)}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${order.status || "Unknown"}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${(order.billItems || []).length} items</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `

    document.getElementById("reportModal").classList.remove("hidden")
    document.getElementById("reportModal").classList.add("flex")
  } catch (error) {
    console.error("Failed to generate report:", error)
    showError("Failed to generate report")
  }
}

// Register function implementation
async function register(event) {
  event.preventDefault()

  try {
    const name = document.getElementById("registerName").value.trim()
    const email = document.getElementById("registerEmail").value.trim()
    const telephone = document.getElementById("registerPhone").value.trim()
    const address = document.getElementById("registerAddress").value.trim()
    const username = document.getElementById("registerUsername").value.trim()
    const password = document.getElementById("registerPassword").value

    // Validation
    if (!name || name.length < 2) {
      showError("Name must be at least 2 characters long")
      return
    }

    if (!telephone || telephone.length !== 10) {
      showError("Please enter a valid 10-digit phone number")
      return
    }

    if (!username || username.length < 3) {
      showError("Username must be at least 3 characters long")
      return
    }

    if (!password || password.length < 6) {
      showError("Password must be at least 6 characters long")
      return
    }

    // Generate account number
    const accountNumber = generateAccountNumber()

    console.log("[v0] Registering customer with account number:", accountNumber)

    const registrationData = {
      name: name,
      email: email || null,
      telephone: telephone,
      address: address || null,
      username: username,
      password: password,
      accountNumber: accountNumber,
    }

    const response = await apiCall("/public/customer/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    })

    showSuccess("Registration successful! You can now login.")
    document.getElementById("registerForm").reset()
    showLoginForm()
  } catch (error) {
    console.error("[v0] Registration error:", error)
    showError("Registration failed: " + error.message)
  }
}

function generateAccountNumber() {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `ACC${timestamp.slice(-6)}${random}`
}
