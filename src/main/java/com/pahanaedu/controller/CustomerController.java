package com.pahanaedu.controller;

import com.pahanaedu.entity.Bill;
import com.pahanaedu.entity.Customer;
import com.pahanaedu.entity.User;
import com.pahanaedu.service.BillService;
import com.pahanaedu.service.CustomerService;
import com.pahanaedu.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/customer")
@Tag(name = "Customer", description = "Customer management APIs")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private BillService billService;

    @Autowired
    private UserService userService;

    @GetMapping("/all")
    @Operation(summary = "Get all customers", description = "Retrieve all customers")
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID", description = "Retrieve customer by ID")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        Optional<Customer> customer = customerService.getCustomerById(id);
        return customer.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create customer", description = "Create new customer")
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody Customer customer) {
        try {
            Customer createdCustomer = customerService.createCustomer(customer);
            return ResponseEntity.ok(createdCustomer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer", description = "Update existing customer")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @Valid @RequestBody Customer customer) {
        try {
            Customer updatedCustomer = customerService.updateCustomer(id, customer);
            return ResponseEntity.ok(updatedCustomer);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer", description = "Delete customer")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        try {
            customerService.deleteCustomer(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/account/{accountNumber}")
    @Operation(summary = "Get customer by account number", description = "Retrieve customer by account number")
    public ResponseEntity<Customer> getCustomerByAccountNumber(@PathVariable String accountNumber) {
        Optional<Customer> customer = customerService.getCustomerByAccountNumber(accountNumber);
        return customer.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/bills")
    @Operation(summary = "Get customer bills", description = "Get all bills for a customer")
    public ResponseEntity<List<Bill>> getCustomerBills(@PathVariable Long id) {
        List<Bill> bills = billService.getBillsByCustomerId(id);
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/my-profile")
    @Operation(summary = "Get my profile", description = "Get current customer's profile")
    public ResponseEntity<Customer> getMyProfile() {
        List<Customer> customers = customerService.getAllCustomers();
        if (!customers.isEmpty()) {
            return ResponseEntity.ok(customers.get(0));
        }
        return ResponseEntity.notFound().build();
    }
}
