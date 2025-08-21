package com.pahanaedu.controller;

import com.pahanaedu.entity.Bill;
import com.pahanaedu.entity.User;
import com.pahanaedu.service.BillService;
import com.pahanaedu.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/bills")
public class BillController {

    @Autowired
    private BillService billService;

    @Autowired
    private UserService userService;

    @GetMapping
    @Operation(summary = "Get all bills", description = "Retrieve all bills")
    public ResponseEntity<List<Bill>> getAllBills() {
        return ResponseEntity.ok(billService.getAllBills());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bill by ID", description = "Retrieve bill by ID")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        Optional<Bill> bill = billService.getBillById(id);
        return bill.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create bill", description = "Create new bill")
    public ResponseEntity<Bill> createBill(@Valid @RequestBody CreateBillRequest request) {
        try {
            User defaultUser = userService.getUsersByRole(User.Role.ADMIN).stream().findFirst().orElse(null);
            if (defaultUser == null) {
                return ResponseEntity.badRequest().build();
            }

            Bill createdBill = billService.createBill(request.getCustomerId(), request.getItems(), defaultUser);
            return ResponseEntity.ok(createdBill);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update bill status", description = "Update bill status")
    public ResponseEntity<Bill> updateBillStatus(@PathVariable Long id, @RequestParam Bill.Status status) {
        try {
            Bill updatedBill = billService.updateBillStatus(id, status);
            return ResponseEntity.ok(updatedBill);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete bill", description = "Delete bill")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id) {
        try {
            billService.deleteBill(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/number/{billNumber}")
    @Operation(summary = "Get bill by number", description = "Retrieve bill by bill number")
    public ResponseEntity<Bill> getBillByNumber(@PathVariable String billNumber) {
        Optional<Bill> bill = billService.getBillByNumber(billNumber);
        return bill.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get bills by status", description = "Retrieve bills by status")
    public ResponseEntity<List<Bill>> getBillsByStatus(@PathVariable Bill.Status status) {
        return ResponseEntity.ok(billService.getBillsByStatus(status));
    }

    public static class CreateBillRequest {
        private Long customerId;
        private List<BillService.BillItemRequest> items;

        // Constructors
        public CreateBillRequest() {}

        public CreateBillRequest(Long customerId, List<BillService.BillItemRequest> items) {
            this.customerId = customerId;
            this.items = items;
        }

        // Getters and Setters
        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }

        public List<BillService.BillItemRequest> getItems() { return items; }
        public void setItems(List<BillService.BillItemRequest> items) { this.items = items; }
    }
}
