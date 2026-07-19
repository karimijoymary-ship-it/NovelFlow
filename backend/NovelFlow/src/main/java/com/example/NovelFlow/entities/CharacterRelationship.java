package com.example.NovelFlow.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "character_relationship")
public class CharacterRelationship {

    @Id
    @Column(name = "relationship_id", length = 50)
    private String relationshipId;

    @ManyToOne
    @JoinColumn(name = "source_character_id", nullable = false)
    private CharacterNode sourceCharacter;

    @ManyToOne
    @JoinColumn(name = "target_character_id", nullable = false)
    private CharacterNode targetCharacter;

    @Column(name = "relationship_type", length = 50, nullable = false)
    private String relationshipType; // e.g., 'Adversary', 'Ally'

    // Getters and Setters
    public String getRelationshipId() {
        return relationshipId;
    }

    public void setRelationshipId(String relationshipId) {
        this.relationshipId = relationshipId;
    }

    public CharacterNode getSourceCharacter() {
        return sourceCharacter;
    }

    public void setSourceCharacter(CharacterNode sourceCharacter) {
        this.sourceCharacter = sourceCharacter;
    }

    public CharacterNode getTargetCharacter() {
        return targetCharacter;
    }

    public void setTargetCharacter(CharacterNode targetCharacter) {
        this.targetCharacter = targetCharacter;
    }

    public String getRelationshipType() {
        return relationshipType;
    }

    public void setRelationshipType(String relationshipType) {
        this.relationshipType = relationshipType;
    }
}
