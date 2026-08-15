package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookSetComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookSetCommentRepository extends JpaRepository<BookSetComment, Long> {
    List<BookSetComment> findByBookSetIdOrderByCreatedAtAsc(Long bookSetId);
}
