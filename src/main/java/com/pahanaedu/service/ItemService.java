package com.pahanaedu.service;

import com.pahanaedu.entity.Item;
import com.pahanaedu.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    public Optional<Item> getItemByCode(String itemCode) {
        return itemRepository.findByItemCode(itemCode);
    }

    public Item createItem(Item item) {
        if (itemRepository.existsByItemCode(item.getItemCode())) {
            throw new RuntimeException("Item code already exists");
        }
        return itemRepository.save(item);
    }

    public Item updateItem(Long id, Item itemDetails) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        item.setItemCode(itemDetails.getItemCode());
        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        item.setPrice(itemDetails.getPrice());
        item.setStockQuantity(itemDetails.getStockQuantity());
        item.setCategory(itemDetails.getCategory());

        return itemRepository.save(item);
    }

    public void deleteItem(Long id) {
        itemRepository.deleteById(id);
    }

    public List<Item> getItemsByCategory(String category) {
        return itemRepository.findByCategory(category);
    }

    public List<Item> searchItemsByName(String name) {
        return itemRepository.findByNameContainingIgnoreCase(name);
    }

    public Item updateStock(Long id, Integer quantity) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        item.setStockQuantity(item.getStockQuantity() + quantity);
        return itemRepository.save(item);
    }
}
