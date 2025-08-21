package com.pahanaedu.service;

import com.pahanaedu.entity.Customer;
import com.pahanaedu.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Optional<Customer> getCustomerByAccountNumber(String accountNumber) {
        return customerRepository.findByAccountNumber(accountNumber);
    }

    public Customer createCustomer(Customer customer) {
        if (customerRepository.existsByAccountNumber(customer.getAccountNumber())) {
            throw new RuntimeException("Account number already exists");
        }
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setAccountNumber(customerDetails.getAccountNumber());
        customer.setName(customerDetails.getName());
        customer.setAddress(customerDetails.getAddress());
        customer.setTelephone(customerDetails.getTelephone());
        customer.setEmail(customerDetails.getEmail());

        return customerRepository.save(customer);
    }

    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }

    public Optional<Customer> getCustomerByUserId(Long userId) {
        return customerRepository.findByUserId(userId);
    }
}
