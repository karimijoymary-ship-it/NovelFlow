package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.CharacterNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterNodeRepository extends JpaRepository<CharacterNode, String> {
    List<CharacterNode> findByBookMasterBookMasterId(String bookMasterId);
}
