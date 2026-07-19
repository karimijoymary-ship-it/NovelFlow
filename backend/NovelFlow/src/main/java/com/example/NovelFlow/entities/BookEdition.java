package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "book_edition")
public class BookEdition {

    @Id
    @Column(name = "edition_id", length = 50)
    private String editionId;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "book_master_id", nullable = false)
    private BookMaster bookMaster;

    @Column(name = "language_tag", length = 10, nullable = false)
    private String languageTag; // 'en' or 'sw'

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "isbn_barcode", length = 13, unique = true, nullable = false)
    private String isbnBarcode;

    // Getters and Setters
    public String getEditionId() {
        return editionId;
    }

    public void setEditionId(String editionId) {
        this.editionId = editionId;
    }

    public BookMaster getBookMaster() {
        return bookMaster;
    }

    public void setBookMaster(BookMaster bookMaster) {
        this.bookMaster = bookMaster;
    }

    public String getLanguageTag() {
        return languageTag;
    }

    public void setLanguageTag(String languageTag) {
        this.languageTag = languageTag;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIsbnBarcode() {
        return isbnBarcode;
    }

    public void setIsbnBarcode(String isbnBarcode) {
        this.isbnBarcode = isbnBarcode;
    }
}
