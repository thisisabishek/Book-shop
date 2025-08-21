package com.pahanaedu.repository;

import com.pahanaedu.entity.Bill;
import com.pahanaedu.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    List<Bill> findByCustomer(Customer customer);
    List<Bill> findByCustomerId(Long customerId);
    List<Bill> findByStatus(Bill.Status status);
}
