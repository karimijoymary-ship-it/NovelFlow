package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "character_node")
public class CharacterNode {

    @Id
    @Column(name = "character_id", length = 50)
    private String characterId;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "book_master_id", nullable = false)
    private BookMaster bookMaster;

    @Column(name = "character_name", length = 100, nullable = false)
    private String characterName;

    @Column(name = "thematic_archetype", length = 50)
    private String thematicArchetype;

    @Column(name = "source", length = 20, nullable = false)
    private String source = "USER";

    // Getters and Setters
    public String getCharacterId() {
        return characterId;
    }

    public void setCharacterId(String characterId) {
        this.characterId = characterId;
    }

    public BookMaster getBookMaster() {
        return bookMaster;
    }

    public void setBookMaster(BookMaster bookMaster) {
        this.bookMaster = bookMaster;
    }

    public String getCharacterName() {
        return characterName;
    }

    public void setCharacterName(String characterName) {
        this.characterName = characterName;
    }

    public String getThematicArchetype() {
        return thematicArchetype;
    }

    public void setThematicArchetype(String thematicArchetype) {
        this.thematicArchetype = thematicArchetype;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
