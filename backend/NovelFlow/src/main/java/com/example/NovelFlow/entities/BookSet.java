package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "book_sets")
public class BookSet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private String icon = "📚";

    @Column(nullable = false, length = 50)
    private String setType = "COURSE"; // COURSE, LANGUAGE_ALIGNMENT, PSYCHOGRAPHIC_PRESET, CUSTOM_TAG, SHARED_LIST

    @Column(length = 100)
    private String courseCode;

    @Column(length = 100)
    private String semester;

    private Boolean isPublic = true;

    @Column(length = 50, unique = true)
    private String shareCode;

    @Column(length = 100)
    private String targetTag;

    @Column(length = 100)
    private String ownerUserId = "user_1";

    // DNA Threshold vectors for Psychographic Presets
    private Integer dnaComplexityMin = 0;
    private Integer dnaDarknessMin = 0;
    private Integer dnaPacingMin = 0;
    private Integer dnaWorldBuildMin = 0;
    private Integer dnaRomanceMin = 0;
    private Integer dnaHumorMin = 0;

    @OneToMany(mappedBy = "bookSet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("bookSet")
    private List<BookSetItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "bookSet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("bookSet")
    private List<BookSetComment> comments = new ArrayList<>();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getSetType() { return setType; }
    public void setSetType(String setType) { this.setType = setType; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public String getShareCode() { return shareCode; }
    public void setShareCode(String shareCode) { this.shareCode = shareCode; }

    public String getTargetTag() { return targetTag; }
    public void setTargetTag(String targetTag) { this.targetTag = targetTag; }

    public String getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(String ownerUserId) { this.ownerUserId = ownerUserId; }

    public Integer getDnaComplexityMin() { return dnaComplexityMin; }
    public void setDnaComplexityMin(Integer dnaComplexityMin) { this.dnaComplexityMin = dnaComplexityMin; }

    public Integer getDnaDarknessMin() { return dnaDarknessMin; }
    public void setDnaDarknessMin(Integer dnaDarknessMin) { this.dnaDarknessMin = dnaDarknessMin; }

    public Integer getDnaPacingMin() { return dnaPacingMin; }
    public void setDnaPacingMin(Integer dnaPacingMin) { this.dnaPacingMin = dnaPacingMin; }

    public Integer getDnaWorldBuildMin() { return dnaWorldBuildMin; }
    public void setDnaWorldBuildMin(Integer dnaWorldBuildMin) { this.dnaWorldBuildMin = dnaWorldBuildMin; }

    public Integer getDnaRomanceMin() { return dnaRomanceMin; }
    public void setDnaRomanceMin(Integer dnaRomanceMin) { this.dnaRomanceMin = dnaRomanceMin; }

    public Integer getDnaHumorMin() { return dnaHumorMin; }
    public void setDnaHumorMin(Integer dnaHumorMin) { this.dnaHumorMin = dnaHumorMin; }

    public List<BookSetItem> getItems() { return items; }
    public void setItems(List<BookSetItem> items) { this.items = items; }

    public List<BookSetComment> getComments() { return comments; }
    public void setComments(List<BookSetComment> comments) { this.comments = comments; }
}
