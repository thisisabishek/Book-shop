package com.pahanaedu.service;

import com.pahanaedu.entity.Bill;
import com.pahanaedu.entity.BillItem;
import com.pahanaedu.entity.Customer;
import com.pahanaedu.entity.Item;
import com.pahanaedu.entity.User;
import com.pahanaedu.repository.BillRepository;
import com.pahanaedu.repository.BillItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillItemRepository billItemRepository;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private ItemService itemService;

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    public Optional<Bill> getBillById(Long id) {
        return billRepository.findById(id);
    }

    public Optional<Bill> getBillByNumber(String billNumber) {
        return billRepository.findByBillNumber(billNumber);
    }

    public List<Bill> getBillsByCustomerId(Long customerId) {
        return billRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Bill createBill(Long customerId, List<BillItemRequest> items, User createdBy) {
        Customer customer = customerService.getCustomerById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Bill bill = new Bill();
        bill.setCustomer(customer);
        bill.setCreatedBy(createdBy);
        bill.setTotalAmount(BigDecimal.ZERO);

        Bill savedBill = billRepository.save(bill);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (BillItemRequest itemRequest : items) {
            Item item = itemService.getItemById(itemRequest.getItemId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));

            if (item.getStockQuantity() < itemRequest.getQuantity()) {
                throw new RuntimeException("Insufficient stock for item: " + item.getName());
            }

            BillItem billItem = new BillItem();
            billItem.setBill(savedBill);
            billItem.setItem(item);
            billItem.setQuantity(itemRequest.getQuantity());
            billItem.setUnitPrice(item.getPrice());
            billItem.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            billItemRepository.save(billItem);

            // Update stock
            item.setStockQuantity(item.getStockQuantity() - itemRequest.getQuantity());
            itemService.updateItem(item.getId(), item);

            totalAmount = totalAmount.add(billItem.getTotalPrice());
        }

        savedBill.setTotalAmount(totalAmount);
        return billRepository.save(savedBill);
    }

    public Bill updateBillStatus(Long id, Bill.Status status) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        bill.setStatus(status);
        return billRepository.save(bill);
    }

    public void deleteBill(Long id) {
        billRepository.deleteById(id);
    }

    public List<Bill> getBillsByStatus(Bill.Status status) {
        return billRepository.findByStatus(status);
    }

    public static class BillItemRequest {
        private Long itemId;
        private Integer quantity;

        // Constructors
        public BillItemRequest() {}

        public BillItemRequest(Long itemId, Integer quantity) {
            this.itemId = itemId;
            this.quantity = quantity;
        }

        // Getters and Setters
        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
