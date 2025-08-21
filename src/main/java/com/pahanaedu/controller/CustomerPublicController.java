package com.pahanaedu.controller;

import com.pahanaedu.entity.User;
import com.pahanaedu.entity.Customer;
import com.pahanaedu.entity.Item;
import com.pahanaedu.entity.Bill;
import com.pahanaedu.entity.BillItem;
import com.pahanaedu.repository.UserRepository;
import com.pahanaedu.repository.CustomerRepository;
import com.pahanaedu.repository.ItemRepository;
import com.pahanaedu.repository.BillRepository;
import com.pahanaedu.repository.BillItemRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/public/customer")
@Tag(name = "Customer Public API", description = "Public customer operations")
public class CustomerPublicController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private BillRepository billRepository;
    
    @Autowired
    private BillItemRepository billItemRepository;
    
    private String hashPassword(String password) {
        return Integer.toString(password.hashCode());
    }
    
    private boolean verifyPassword(String password, String hashedPassword) {
        return Integer.toString(password.hashCode()).equals(hashedPassword);
    }

    @PostMapping("/register")
    @Operation(summary = "Register new customer")
    public ResponseEntity<?> registerCustomer(@RequestBody Map<String, Object> request) {
        try {
            String username = (String) request.get("username");
            String password = (String) request.get("password");
            String name = (String) request.get("name");
            String email = (String) request.get("email");
            String telephone = (String) request.get("telephone");
            String address = (String) request.get("address");
            
            // Check if username already exists
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            
            // Create user account with hashed password
            User user = new User();
            user.setUsername(username);
            user.setPassword(hashPassword(password)); // Use simple hash instead of BCrypt
            user.setRole(User.Role.CUSTOMER); // Use proper enum conversion
            user.setEnabled(true);
            User savedUser = userRepository.save(user);
            
            // Generate account number
            String accountNumber = "ACC" + System.currentTimeMillis() + String.format("%03d", (int)(Math.random() * 1000));
            
            // Create customer record
            Customer customer = new Customer();
            customer.setAccountNumber(accountNumber);
            customer.setName(name);
            customer.setEmail(email);
            customer.setTelephone(telephone);
            customer.setAddress(address);
            customer.setUser(savedUser); // Use User object instead of setUserId
            Customer savedCustomer = customerRepository.save(customer);
            
            return ResponseEntity.ok(Map.of(
                "message", "Customer registered successfully",
                "customerId", savedCustomer.getId(),
                "accountNumber", accountNumber
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Customer login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials"));
            }
            
            User user = userOpt.get();
            if (!verifyPassword(password, user.getPassword())) { // Use simple password verification
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials"));
            }
            
            // Find customer record by user relationship
            List<Customer> customers = customerRepository.findAll();
            Optional<Customer> customerOpt = customers.stream()
                .filter(c -> c.getUser() != null && c.getUser().getId().equals(user.getId()))
                .findFirst();
                
            if (customerOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Customer profile not found"));
            }
            
            Customer customer = customerOpt.get();
            return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "role", user.getRole().toString()
                ),
                "customer", Map.of(
                    "id", customer.getId(),
                    "accountNumber", customer.getAccountNumber(),
                    "name", customer.getName(),
                    "email", customer.getEmail() != null ? customer.getEmail() : "",
                    "telephone", customer.getTelephone(),
                    "address", customer.getAddress() != null ? customer.getAddress() : ""
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/books")
    @Operation(summary = "Browse available books/items")
    public ResponseEntity<?> browseBooks() {
        try {
            List<Item> items = itemRepository.findAll();
            
            List<Map<String, Object>> itemsWithStock = items.stream().map(item -> {
                String stockStatus = "In Stock";
                if (item.getStockQuantity() == null || item.getStockQuantity() <= 0) {
                    stockStatus = "Out of Stock";
                } else if (item.getStockQuantity() <= 5) {
                    stockStatus = "Low Stock";
                }
                
                Map<String, Object> itemMap = new java.util.HashMap<>();
                itemMap.put("id", item.getId());
                itemMap.put("itemCode", item.getItemCode() != null ? item.getItemCode() : "");
                itemMap.put("name", item.getName() != null ? item.getName() : "");
                itemMap.put("description", item.getDescription() != null ? item.getDescription() : "");
                itemMap.put("price", item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO);
                itemMap.put("stockQuantity", item.getStockQuantity() != null ? item.getStockQuantity() : 0);
                itemMap.put("category", item.getCategory() != null ? item.getCategory() : "");
                itemMap.put("stockStatus", stockStatus);
                return itemMap;
            }).toList();
            
            return ResponseEntity.ok(itemsWithStock);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to load books: " + e.getMessage()));
        }
    }

    @PostMapping("/order")
    @Operation(summary = "Create order for selected books")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> orderRequest) {
        try {
            Long customerId = Long.valueOf(orderRequest.get("customerId").toString());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) orderRequest.get("items");
            
            // Verify customer exists
            Optional<Customer> customerOpt = customerRepository.findById(customerId);
            if (customerOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Customer not found"));
            }
            
            Customer customer = customerOpt.get();
            
            // Generate bill number
            String billNumber = "BILL" + System.currentTimeMillis();
            
            // Create bill
            Bill bill = new Bill();
            bill.setBillNumber(billNumber);
            bill.setCustomer(customer); // Use Customer object instead of setCustomerId
            bill.setBillDate(LocalDateTime.now()); // Use LocalDateTime instead of LocalDate
            bill.setStatus(Bill.Status.PENDING); // Use proper enum
            bill.setCreatedBy(customer.getUser()); // Use User object instead of getUserId
            
            BigDecimal totalAmount = BigDecimal.ZERO; // Use BigDecimal for monetary calculations
            
            // Calculate total and check stock
            for (Map<String, Object> itemData : items) {
                Long itemId = Long.valueOf(itemData.get("itemId").toString());
                Integer quantity = Integer.valueOf(itemData.get("quantity").toString());
                
                Optional<Item> itemOpt = itemRepository.findById(itemId);
                if (itemOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Item not found: " + itemId));
                }
                
                Item item = itemOpt.get();
                if (item.getStockQuantity() == null || item.getStockQuantity() < quantity) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock for: " + item.getName()));
                }
                
                BigDecimal itemPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                totalAmount = totalAmount.add(itemPrice.multiply(BigDecimal.valueOf(quantity))); // Proper BigDecimal arithmetic
            }
            
            bill.setTotalAmount(totalAmount);
            Bill savedBill = billRepository.save(bill);
            
            // Create bill items and update stock
            for (Map<String, Object> itemData : items) {
                Long itemId = Long.valueOf(itemData.get("itemId").toString());
                Integer quantity = Integer.valueOf(itemData.get("quantity").toString());
                
                Item item = itemRepository.findById(itemId).get();
                
                BillItem billItem = new BillItem();
                billItem.setBill(savedBill); // Use Bill object instead of setBillId
                billItem.setItem(item); // Use Item object instead of setItemId
                billItem.setQuantity(quantity);
                BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                billItem.setUnitPrice(unitPrice); // Use BigDecimal
                billItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(quantity))); // Proper BigDecimal arithmetic
                billItemRepository.save(billItem);
                
                // Update stock
                item.setStockQuantity(item.getStockQuantity() - quantity);
                itemRepository.save(item);
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Order created successfully",
                "billNumber", billNumber,
                "totalAmount", totalAmount,
                "status", "PENDING"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Order creation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/orders/{customerId}")
    @Operation(summary = "Get customer orders")
    public ResponseEntity<?> getCustomerOrders(@PathVariable Long customerId) {
        try {
            Optional<Customer> customerOpt = customerRepository.findById(customerId);
            if (customerOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Customer not found"));
            }
            
            List<Bill> bills = billRepository.findAll().stream()
                .filter(bill -> bill.getCustomer() != null && bill.getCustomer().getId().equals(customerId))
                .toList();
                
            return ResponseEntity.ok(bills);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to load orders: " + e.getMessage()));
        }
    }
}
