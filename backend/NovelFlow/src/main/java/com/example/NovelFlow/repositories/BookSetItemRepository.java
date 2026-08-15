package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookSetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookSetItemRepository extends JpaRepository<BookSetItem, Long> {
    List<BookSetItem> findByBookSetId(Long bookSetId);
    void deleteByBookSetIdAndBookMasterBookMasterId(Long bookSetId, String bookMasterId);
}
