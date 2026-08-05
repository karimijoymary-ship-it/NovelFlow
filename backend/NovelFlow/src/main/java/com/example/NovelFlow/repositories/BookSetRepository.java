package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookSetRepository extends JpaRepository<BookSet, Long> {
}
