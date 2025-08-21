// Global variables
let currentUser = null
let currentBillItems = []

// API Base URL
const API_BASE = "http://localhost:8080/api"

// Utility functions
function showError(message) {
  console.error("Error:", message)
  alert("Error: " + message)
}

function showSuccess(message) {
  console.log("Success:", message)
  alert("Success: " + message)
}

function formatDate(dateString) {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString()
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "$0.00"
  return "$" + Number.parseFloat(amount).toFixed(2)
}

// API functions
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
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
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

// Authentication
async function login(username, password) {
  try {
    const response = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    currentUser = response
    localStorage.setItem("currentUser", JSON.stringify(response))
    return response
  } catch (error) {
    throw new Error("Login failed: " + error.message)
  }
}

function logout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  showLoginPage()
}

function checkAuth() {
  const stored = localStorage.getItem("currentUser")
  if (stored) {
    currentUser = JSON.parse(stored)
    showDashboard()
  } else {
    showLoginPage()
  }
}

// Page navigation
function showLoginPage() {
  document.getElementById("loginPage").classList.remove("hidden")
  document.getElementById("dashboardPage").classList.add("hidden")
}

function showDashboard() {
  document.getElementById("loginPage").classList.add("hidden")
  document.getElementById("dashboardPage").classList.remove("hidden")

  // Update user info
  document.getElementById("userInfo").textContent = `${currentUser.username} (${currentUser.role})`

  // Show/hide navigation based on role
  if (currentUser.role === "ADMIN") {
    document.getElementById("usersNav").classList.remove("hidden")
  }

  // Show dashboard by default
  showSection("dashboard")
  loadDashboardStats()
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden")
  })

  // Show selected section
  document.getElementById(sectionName + "Section").classList.remove("hidden")

  // Update navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-blue-100", "text-blue-700")
  })
  document.querySelector(`[data-section="${sectionName}"]`).classList.add("bg-blue-100", "text-blue-700")

  // Load section data
  switch (sectionName) {
    case "users":
      loadUsers()
      break
    case "customers":
      loadCustomers()
      break
    case "items":
      loadItems()
      break
    case "billing":
      loadBills()
      loadBillCustomers()
      loadBillItems()
      break
  }
}

// Dashboard stats
async function loadDashboardStats() {
  try {
    const [customers, items, bills] = await Promise.all([
      apiCall("/customer/all"),
      apiCall("/items"),
      apiCall("/bills"),
    ])

    document.getElementById("totalCustomers").textContent = customers.length || 0
    document.getElementById("totalItems").textContent = items.length || 0
    document.getElementById("totalBills").textContent = bills.length || 0

    // Calculate low stock items
    const lowStock = items.filter((item) => (item.stockQuantity || 0) < 10).length
    document.getElementById("lowStockItems").textContent = lowStock
  } catch (error) {
    console.error("Failed to load dashboard stats:", error)
  }
}

// User management
async function loadUsers() {
  try {
    const users = await apiCall("/admin/users")
    const tbody = document.getElementById("usersTableBody")
    tbody.innerHTML = ""

    users.forEach((user) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.username || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${user.role || "N/A"}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${user.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                        ${user.enabled ? "Active" : "Inactive"}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    showError("Failed to load users: " + error.message)
  }
}

async function saveUser(userData) {
  try {
    const endpoint = userData.id ? `/admin/users/${userData.id}` : "/admin/users"
    const method = userData.id ? "PUT" : "POST"

    // Remove empty id
    if (!userData.id) {
      delete userData.id
    }

    await apiCall(endpoint, {
      method: method,
      body: JSON.stringify(userData),
    })

    showSuccess("User saved successfully")
    closeModal("userModal")
    loadUsers()
  } catch (error) {
    showError("Failed to save user: " + error.message)
  }
}

async function deleteUser(id) {
  if (confirm("Are you sure you want to delete this user?")) {
    try {
      await apiCall(`/admin/users/${id}`, { method: "DELETE" })
      showSuccess("User deleted successfully")
      loadUsers()
    } catch (error) {
      showError("Failed to delete user: " + error.message)
    }
  }
}

async function editUser(id) {
  try {
    // Get form data
    const userData = {
      username: document.getElementById("userUsername").value,
      password: document.getElementById("userPassword").value,
      role: document.getElementById("userRole").value,
      enabled: document.getElementById("userEnabled").checked
    };

    // Remove empty password field if not provided
    if (!userData.password) {
      delete userData.password;
    }

    // PUT request to update user
    await apiCall(`/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    showSuccess("User updated successfully");
    hideModal("userModal");
    loadUsers(); // Refresh the user list
  } catch (error) {
    showError("Failed to update user: " + error.message);
  }
}

// Customer management
async function loadCustomers() {
  try {
    const customers = await apiCall("/customer/all")
    const tbody = document.getElementById("customersTableBody")
    tbody.innerHTML = ""

    customers.forEach((customer) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${customer.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${customer.accountNumber || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${customer.name || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${customer.email || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${customer.telephone || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.address || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteCustomer(${customer.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    showError("Failed to load customers: " + error.message)
  }
}

async function saveCustomer(customerData) {
  try {
    const endpoint = customerData.id ? `/customer/${customerData.id}` : "/customer"
    const method = customerData.id ? "PUT" : "POST"

    // Remove empty id
    if (!customerData.id) {
      delete customerData.id
    }

    await apiCall(endpoint, {
      method: method,
      body: JSON.stringify(customerData),
    })

    showSuccess("Customer saved successfully")
    closeModal("customerModal")
    loadCustomers()
  } catch (error) {
    showError("Failed to save customer: " + error.message)
  }
}

async function deleteCustomer(id) {
  if (confirm("Are you sure you want to delete this customer?")) {
    try {
      await apiCall(`/customer/${id}`, { method: "DELETE" })
      showSuccess("Customer deleted successfully")
      loadCustomers()
    } catch (error) {
      showError("Failed to delete customer: " + error.message)
    }
  }
}

async function editCustomer(id) {
  try {
    const customer = await apiCall(`/customer/${id}`)
    document.getElementById("customerModalTitle").textContent = "Edit Customer"
    document.getElementById("customerId").value = customer.id
    document.getElementById("customerAccountNumber").value = customer.accountNumber || ""
    document.getElementById("customerName").value = customer.name || ""
    document.getElementById("customerEmail").value = customer.email || ""
    document.getElementById("customerTelephone").value = customer.telephone || ""
    document.getElementById("customerAddress").value = customer.address || ""
    showModal("customerModal")
  } catch (error) {
    showError("Failed to load customer: " + error.message)
  }
}

// Item management
async function loadItems() {
  try {
    const items = await apiCall("/items")
    const tbody = document.getElementById("itemsTableBody")
    tbody.innerHTML = ""

    items.forEach((item) => {
      const stockQuantity = item.stockQuantity || 0
      const stockStatus = stockQuantity < 10 ? "Low Stock" : "In Stock"
      const statusClass = stockQuantity < 10 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"

      const row = document.createElement("tr")
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.itemCode || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.name || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.category || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(item.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stockQuantity}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${stockStatus}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editItem(${item.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button onclick="deleteItem(${item.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    showError("Failed to load items: " + error.message)
  }
}

async function saveItem(itemData) {
  try {
    const endpoint = itemData.id ? `/items/${itemData.id}` : "/items"
    const method = itemData.id ? "PUT" : "POST"

    // Remove empty id
    if (!itemData.id) {
      delete itemData.id
    }

    await apiCall(endpoint, {
      method: method,
      body: JSON.stringify(itemData),
    })

    showSuccess("Item saved successfully")
    closeModal("itemModal")
    loadItems()
  } catch (error) {
    showError("Failed to save item: " + error.message)
  }
}

async function deleteItem(id) {
  if (confirm("Are you sure you want to delete this item?")) {
    try {
      await apiCall(`/items/${id}`, { method: "DELETE" })
      showSuccess("Item deleted successfully")
      loadItems()
    } catch (error) {
      showError("Failed to delete item: " + error.message)
    }
  }
}

async function editItem(id) {
  try {
    const item = await apiCall(`/items/${id}`)
    document.getElementById("itemModalTitle").textContent = "Edit Item"
    document.getElementById("itemId").value = item.id
    document.getElementById("itemCode").value = item.itemCode || ""
    document.getElementById("itemName").value = item.name || ""
    document.getElementById("itemDescription").value = item.description || ""
    document.getElementById("itemCategory").value = item.category || ""
    document.getElementById("itemPrice").value = item.price || ""
    document.getElementById("itemStockQuantity").value = item.stockQuantity || ""
    showModal("itemModal")
  } catch (error) {
    showError("Failed to load item: " + error.message)
  }
}

// Billing management
async function loadBills() {
  try {
    const bills = await apiCall("/bills")
    const tbody = document.getElementById("billsTableBody")
    tbody.innerHTML = ""

    bills.forEach((bill) => {
      const statusClass =
        bill.status === "PAID"
          ? "bg-green-100 text-green-800"
          : bill.status === "CANCELLED"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"

      const row = document.createElement("tr")
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${bill.billNumber || bill.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${bill.customer?.name || "N/A"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(bill.totalAmount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${bill.status || "PENDING"}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(bill.billDate)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewBill(${bill.id})" class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button onclick="printBill(${bill.id})" class="text-green-600 hover:text-green-900">Print</button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    showError("Failed to load bills: " + error.message)
  }
}

async function loadBillCustomers() {
  try {
    const customers = await apiCall("/customer/all")
    const select = document.getElementById("billCustomer")
    select.innerHTML = '<option value="">Select Customer</option>'

    customers.forEach((customer) => {
      const option = document.createElement("option")
      option.value = customer.id
      option.textContent = `${customer.name || "Customer"} (${customer.accountNumber || customer.id})`
      select.appendChild(option)
    })
  } catch (error) {
    console.error("Failed to load customers for billing:", error)
  }
}

async function loadBillItems() {
  try {
    const items = await apiCall("/items")
    const select = document.getElementById("billItem")
    select.innerHTML = '<option value="">Select Item</option>'

    items.forEach((item) => {
      const option = document.createElement("option")
      option.value = item.id
      option.textContent = `${item.name || "Item"} - ${formatCurrency(item.price)} (Stock: ${item.stockQuantity || 0})`
      option.dataset.price = item.price || 0
      option.dataset.stock = item.stockQuantity || 0
      select.appendChild(option)
    })
  } catch (error) {
    console.error("Failed to load items for billing:", error)
  }
}

function addItemToBill() {
  const itemSelect = document.getElementById("billItem")
  const quantityInput = document.getElementById("billQuantity")

  if (!itemSelect.value || !quantityInput.value) {
    showError("Please select an item and enter quantity")
    return
  }

  const selectedOption = itemSelect.options[itemSelect.selectedIndex]
  const itemId = itemSelect.value
  const itemName = selectedOption.textContent.split(" - ")[0]
  const price = Number.parseFloat(selectedOption.dataset.price)
  const quantity = Number.parseInt(quantityInput.value)
  const stock = Number.parseInt(selectedOption.dataset.stock)

  if (quantity > stock) {
    showError("Quantity exceeds available stock")
    return
  }

  // Check if item already exists in bill
  const existingItem = currentBillItems.find((item) => item.itemId === itemId)
  if (existingItem) {
    existingItem.quantity += quantity
    existingItem.total = existingItem.quantity * existingItem.price
  } else {
    currentBillItems.push({
      itemId: itemId,
      itemName: itemName,
      price: price,
      quantity: quantity,
      total: price * quantity,
    })
  }

  updateBillDisplay()

  // Reset form
  itemSelect.value = ""
  quantityInput.value = ""
}

function updateBillDisplay() {
  const billItemsDiv = document.getElementById("billItems")
  const billTotalSpan = document.getElementById("billTotal")

  if (currentBillItems.length === 0) {
    billItemsDiv.innerHTML = '<p class="text-gray-500 text-sm">No items added</p>'
    billTotalSpan.textContent = "$0.00"
    return
  }

  billItemsDiv.innerHTML = ""
  let total = 0

  currentBillItems.forEach((item, index) => {
    const itemDiv = document.createElement("div")
    itemDiv.className = "flex justify-between items-center text-sm"
    itemDiv.innerHTML = `
            <span>${item.itemName} x ${item.quantity}</span>
            <span class="flex items-center gap-2">
                ${formatCurrency(item.total)}
                <button onclick="removeBillItem(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `
    billItemsDiv.appendChild(itemDiv)
    total += item.total
  })

  billTotalSpan.textContent = formatCurrency(total)
}

function removeBillItem(index) {
  currentBillItems.splice(index, 1)
  updateBillDisplay()
}

async function createBill(billData) {
  try {
    await apiCall("/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    })

    showSuccess("Bill created successfully")
    currentBillItems = []
    document.getElementById("billForm").reset()
    document.getElementById("createBillPanel").classList.add("hidden")
    updateBillDisplay()
    loadBills()
  } catch (error) {
    showError("Failed to create bill: " + error.message)
  }
}

async function viewBill(id) {
  try {
    const bill = await apiCall(`/bills/${id}`)

    const statusClass =
      bill.status === "PAID"
        ? "bg-green-100 text-green-800"
        : bill.status === "CANCELLED"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800"

    const billContent = `
      <div class="print-content">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800">Pahana Edu Bookshop</h1>
          <p class="text-gray-600">Invoice</p>
        </div>

        <!-- Bill Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 class="text-lg font-semibold mb-3">Bill Information</h3>
            <div class="space-y-2">
              <p><span class="font-medium">Bill Number:</span> ${bill.billNumber || bill.id}</p>
              <p><span class="font-medium">Date:</span> ${formatDate(bill.billDate)}</p>
              <p><span class="font-medium">Status:</span> 
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                  ${bill.status || "PENDING"}
                </span>
              </p>
              <p><span class="font-medium">Created By:</span> ${bill.createdBy?.username || "N/A"}</p>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-3">Customer Information</h3>
            <div class="space-y-2">
              <p><span class="font-medium">Name:</span> ${bill.customer?.name || "N/A"}</p>
              <p><span class="font-medium">Account Number:</span> ${bill.customer?.accountNumber || "N/A"}</p>
              <p><span class="font-medium">Email:</span> ${bill.customer?.email || "N/A"}</p>
              <p><span class="font-medium">Phone:</span> ${bill.customer?.telephone || "N/A"}</p>
              <p><span class="font-medium">Address:</span> ${bill.customer?.address || "N/A"}</p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Items</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border border-gray-300 px-4 py-2 text-left">Item</th>
                  <th class="border border-gray-300 px-4 py-2 text-left">Code</th>
                  <th class="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                  <th class="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                  <th class="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  bill.billItems
                    ?.map(
                      (item) => `
                  <tr>
                    <td class="border border-gray-300 px-4 py-2">${item.item?.name || "N/A"}</td>
                    <td class="border border-gray-300 px-4 py-2">${item.item?.itemCode || "N/A"}</td>
                    <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="border border-gray-300 px-4 py-2 text-right">${item.quantity}</td>
                    <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `,
                    )
                    .join("") ||
                  '<tr><td colspan="5" class="border border-gray-300 px-4 py-2 text-center">No items found</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Total -->
        <div class="flex justify-end mb-8">
          <div class="w-64">
            <div class="border-t-2 border-gray-300 pt-4">
              <div class="flex justify-between items-center text-xl font-bold">
                <span>Total Amount:</span>
                <span>${formatCurrency(bill.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center text-sm text-gray-600 mt-8">
          <p>Thank you for your business!</p>
          <p>Pahana Edu Bookshop - Your Educational Partner</p>
        </div>
      </div>
    `

    document.getElementById("billViewContent").innerHTML = billContent
    showModal("billViewModal")
  } catch (error) {
    showError("Failed to load bill details: " + error.message)
  }
}

async function printBill(id) {
  try {
    // First load the bill details
    await viewBill(id)

    // Small delay to ensure modal is rendered
    setTimeout(() => {
      window.print()
    }, 100)
  } catch (error) {
    showError("Failed to print bill: " + error.message)
  }
}

function printCurrentBill() {
  window.print()
}

// Modal functions
function showModal(modalId) {
  document.getElementById(modalId).classList.remove("hidden")
  document.getElementById(modalId).classList.add("flex")
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden")
  document.getElementById(modalId).classList.remove("flex")

  // Reset forms
  const form = document.querySelector(`#${modalId} form`)
  if (form) form.reset()
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication on page load
  checkAuth()

  // Login form
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value
    const errorDiv = document.getElementById("loginError")

    try {
      await login(username, password)
      showDashboard()
      errorDiv.classList.add("hidden")
    } catch (error) {
      errorDiv.textContent = error.message
      errorDiv.classList.remove("hidden")
    }
  })

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", logout)

  // Navigation buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const section = this.dataset.section
      showSection(section)
    })
  })

  // Add buttons
  document.getElementById("addUserBtn").addEventListener("click", () => {
    document.getElementById("userModalTitle").textContent = "Add User"
    document.getElementById("userForm").reset()
    document.getElementById("userEnabled").checked = true
    showModal("userModal")
  })

  document.getElementById("addCustomerBtn").addEventListener("click", () => {
    document.getElementById("customerModalTitle").textContent = "Add Customer"
    document.getElementById("customerForm").reset()
    document.getElementById("customerAccountNumber").value = "Auto-generated"
    showModal("customerModal")
  })

  document.getElementById("addItemBtn").addEventListener("click", () => {
    document.getElementById("itemModalTitle").textContent = "Add Item"
    document.getElementById("itemForm").reset()
    document.getElementById("itemCode").value = "Auto-generated"
    showModal("itemModal")
  })

  document.getElementById("createBillBtn").addEventListener("click", () => {
    document.getElementById("createBillPanel").classList.toggle("hidden")
  })

  document.getElementById("cancelBill").addEventListener("click", () => {
    document.getElementById("createBillPanel").classList.add("hidden")
    currentBillItems = []
    updateBillDisplay()
  })

  document.getElementById("addItemToBill").addEventListener("click", addItemToBill)

  // Form submissions
  document.getElementById("userForm").addEventListener("submit", (e) => {
    e.preventDefault()
    const userData = {
      id: document.getElementById("userId").value || null,
      username: document.getElementById("userUsername").value,
      password: document.getElementById("userPassword").value,
      role: document.getElementById("userRole").value,
      enabled: document.getElementById("userEnabled").checked,
    }
    saveUser(userData)
  })

  document.getElementById("customerForm").addEventListener("submit", (e) => {
    e.preventDefault()
    const customerData = {
      id: document.getElementById("customerId").value || null,
      name: document.getElementById("customerName").value,
      email: document.getElementById("customerEmail").value,
      telephone: document.getElementById("customerTelephone").value,
      address: document.getElementById("customerAddress").value,
    }
    // Don't send accountNumber for new customers (auto-generated)
    if (customerData.id) {
      customerData.accountNumber = document.getElementById("customerAccountNumber").value
    }
    saveCustomer(customerData)
  })

  document.getElementById("itemForm").addEventListener("submit", (e) => {
    e.preventDefault()
    const itemData = {
      id: document.getElementById("itemId").value || null,
      name: document.getElementById("itemName").value,
      description: document.getElementById("itemDescription").value,
      category: document.getElementById("itemCategory").value,
      price: Number.parseFloat(document.getElementById("itemPrice").value) || 0,
      stockQuantity: Number.parseInt(document.getElementById("itemStockQuantity").value) || 0,
    }
    // Don't send itemCode for new items (auto-generated)
    if (itemData.id) {
      itemData.itemCode = document.getElementById("itemCode").value
    }
    saveItem(itemData)
  })

  document.getElementById("billForm").addEventListener("submit", (e) => {
    e.preventDefault()
    const customerId = document.getElementById("billCustomer").value

    if (!customerId || currentBillItems.length === 0) {
      showError("Please select a customer and add items to the bill")
      return
    }

    const billData = {
      customerId: Number.parseInt(customerId),
      items: currentBillItems.map((item) => ({
        itemId: Number.parseInt(item.itemId),
        quantity: item.quantity,
      })),
    }

    createBill(billData)
  })

  // Close modal buttons
  document.querySelectorAll(".closeModal").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".fixed")
      closeModal(modal.id)
    })
  })

  // Print button in modal
  document.getElementById("printBillBtn").addEventListener("click", printCurrentBill)
})
