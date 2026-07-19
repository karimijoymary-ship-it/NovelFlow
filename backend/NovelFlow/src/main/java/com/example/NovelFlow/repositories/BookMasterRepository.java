package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.BookMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookMasterRepository extends JpaRepository<BookMaster, String> {

    @Query("SELECT DISTINCT bm FROM BookMaster bm LEFT JOIN bm.editions e WHERE LOWER(bm.originalAuthor) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<BookMaster> searchLocal(@Param("query") String query);
}
