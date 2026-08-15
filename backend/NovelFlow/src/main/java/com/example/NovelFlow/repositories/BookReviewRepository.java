package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookReviewRepository extends JpaRepository<BookReview, String> {

    List<BookReview> findByBookMasterBookMasterIdOrderByCreatedAtDesc(String bookMasterId);

    List<BookReview> findByBookMasterBookMasterId(String bookMasterId);
}
