package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.CharacterRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CharacterRelationshipRepository extends JpaRepository<CharacterRelationship, String> {
    List<CharacterRelationship> findBySourceCharacterBookMasterBookMasterId(String bookMasterId);

    Optional<CharacterRelationship> findBySourceCharacterCharacterIdAndTargetCharacterCharacterId(
            String sourceCharacterId, String targetCharacterId);
}
