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

    @Column(name = "dna_complexity")
    private Integer dnaComplexity = 50;

    @Column(name = "dna_romance")
    private Integer dnaRomance = 50;

    @Column(name = "dna_darkness")
    private Integer dnaDarkness = 50;

    @Column(name = "dna_humor")
    private Integer dnaHumor = 50;

    @Column(name = "dna_pacing")
    private Integer dnaPacing = 50;

    @Column(name = "dna_world_build")
    private Integer dnaWorldBuild = 50;

    @Column(name = "custom_tags")
    private String customTags = "";

    @Column(name = "thematic_elements", length = 500)
    private String thematicElements = "";

    @Column(name = "custom_theme_scores", columnDefinition = "TEXT")
    private String customThemeScores = "";

    @Column(name = "is_verified")
    private Boolean isVerified = true;

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

    public Integer getDnaComplexity() { return dnaComplexity; }
    public void setDnaComplexity(Integer dnaComplexity) { this.dnaComplexity = dnaComplexity; }

    public Integer getDnaRomance() { return dnaRomance; }
    public void setDnaRomance(Integer dnaRomance) { this.dnaRomance = dnaRomance; }

    public Integer getDnaDarkness() { return dnaDarkness; }
    public void setDnaDarkness(Integer dnaDarkness) { this.dnaDarkness = dnaDarkness; }

    public Integer getDnaHumor() { return dnaHumor; }
    public void setDnaHumor(Integer dnaHumor) { this.dnaHumor = dnaHumor; }

    public Integer getDnaPacing() { return dnaPacing; }
    public void setDnaPacing(Integer dnaPacing) { this.dnaPacing = dnaPacing; }

    public Integer getDnaWorldBuild() { return dnaWorldBuild; }
    public void setDnaWorldBuild(Integer dnaWorldBuild) { this.dnaWorldBuild = dnaWorldBuild; }

    public String getCustomTags() { return customTags; }
    public void setCustomTags(String customTags) { this.customTags = customTags; }

    public String getThematicElements() { return thematicElements; }
    public void setThematicElements(String thematicElements) { this.thematicElements = thematicElements; }

    public String getCustomThemeScores() { return customThemeScores; }
    public void setCustomThemeScores(String customThemeScores) { this.customThemeScores = customThemeScores; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
}
