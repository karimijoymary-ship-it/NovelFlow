package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "book_set_items")
public class BookSetItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_set_id")
    @JsonIgnoreProperties({"items", "comments"})
    private BookSet bookSet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_master_id")
    private BookMaster bookMaster;

    @Column(length = 50)
    private String itemType = "REQUIRED"; // REQUIRED, SUPPLEMENTARY, PAIRED_ORIGINAL, PAIRED_TRANSLATION

    @Column(length = 2000)
    private String syllabusNotes;

    @Column(length = 1000)
    private String translationNotes;

    private Integer orderIndex = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BookSet getBookSet() { return bookSet; }
    public void setBookSet(BookSet bookSet) { this.bookSet = bookSet; }

    public BookMaster getBookMaster() { return bookMaster; }
    public void setBookMaster(BookMaster bookMaster) { this.bookMaster = bookMaster; }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public String getSyllabusNotes() { return syllabusNotes; }
    public void setSyllabusNotes(String syllabusNotes) { this.syllabusNotes = syllabusNotes; }

    public String getTranslationNotes() { return translationNotes; }
    public void setTranslationNotes(String translationNotes) { this.translationNotes = translationNotes; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}
