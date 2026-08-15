package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookSetRepository extends JpaRepository<BookSet, Long> {
    List<BookSet> findBySetType(String setType);
    Optional<BookSet> findByShareCode(String shareCode);
    List<BookSet> findByTargetTagIgnoreCase(String targetTag);
}
