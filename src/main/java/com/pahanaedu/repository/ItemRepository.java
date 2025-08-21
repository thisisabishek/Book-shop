package com.pahanaedu.repository;

import com.pahanaedu.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findByItemCode(String itemCode);
    List<Item> findByCategory(String category);
    List<Item> findByNameContainingIgnoreCase(String name);
    boolean existsByItemCode(String itemCode);
}
