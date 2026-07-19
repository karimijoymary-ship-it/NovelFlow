package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookEdition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookEditionRepository extends JpaRepository<BookEdition, String> {
    List<BookEdition> findByBookMasterBookMasterId(String bookMasterId);
    Optional<BookEdition> findByIsbnBarcode(String isbnBarcode);
}
