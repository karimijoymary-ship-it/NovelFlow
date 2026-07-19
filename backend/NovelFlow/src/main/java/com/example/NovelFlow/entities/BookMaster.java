package com.example.NovelFlow.entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "book_master")

public class BookMaster {
    @Id
    @Column(name = "book_master_id", length = 50)
    private String bookMasterId;

    @Column(name = "original_author", length = 100, nullable = false)
    private String originalAuthor;

    @Column(name = "original_release_year")
    private Integer originalReleaseYear;

    @Column(name = "calculated_average_rating")
    private Double calculatedAverageRating = 0.00;

    @Column(name = "synopsis", columnDefinition = "TEXT")
    private String synopsis;

    @OneToMany(mappedBy = "bookMaster", cascade = CascadeType.ALL)
    private List<BookEdition> editions;

    @OneToMany(mappedBy = "bookMaster", cascade = CascadeType.ALL)
    private List<CharacterNode> characters;

    // Getters and Setters
    public String getBookMasterId() {
        return bookMasterId;
    }

    public void setBookMasterId(String bookMasterId) {
        this.bookMasterId = bookMasterId;
    }

    public String getOriginalAuthor() {
        return originalAuthor;
    }

    public void setOriginalAuthor(String originalAuthor) {
        this.originalAuthor = originalAuthor;
    }

    public Integer getOriginalReleaseYear() {
        return originalReleaseYear;
    }

    public void setOriginalReleaseYear(Integer originalReleaseYear) {
        this.originalReleaseYear = originalReleaseYear;
    }

    public Double getCalculatedAverageRating() {
        return calculatedAverageRating;
    }

    public void setCalculatedAverageRating(Double calculatedAverageRating) {
        this.calculatedAverageRating = calculatedAverageRating;
    }

    public List<BookEdition> getEditions() {
        return editions;
    }

    public void setEditions(List<BookEdition> editions) {
        this.editions = editions;
    }

    public String getSynopsis() {
        return synopsis;
    }

    public void setSynopsis(String synopsis) {
        this.synopsis = synopsis;
    }
}
