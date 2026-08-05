package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_telemetry")
public class ReadingTelemetry {

    @Id
    @Column(name = "telemetry_id", length = 50)
    private String telemetryId;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "book_master_id", nullable = false)
    private BookMaster bookMaster;

    @Column(name = "fractional_rating")
    private Double fractionalRating;

    @Column(name = "reading_status", length = 20)
    private String readingStatus = "Reading"; // Reading, Completed, DNF

    @Column(name = "dnf_reason", columnDefinition = "TEXT")
    private String dnfReason;

    @Column(name = "pages_completed")
    private Integer pagesCompleted = 0;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt = LocalDateTime.now();

    // Getters and Setters
    public String getTelemetryId() {
        return telemetryId;
    }

    public void setTelemetryId(String telemetryId) {
        this.telemetryId = telemetryId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BookMaster getBookMaster() {
        return bookMaster;
    }

    public void setBookMaster(BookMaster bookMaster) {
        this.bookMaster = bookMaster;
    }

    public Double getFractionalRating() {
        return fractionalRating;
    }

    public void setFractionalRating(Double fractionalRating) {
        this.fractionalRating = fractionalRating;
    }

    public String getReadingStatus() {
        return readingStatus;
    }

    public void setReadingStatus(String readingStatus) {
        this.readingStatus = readingStatus;
    }

    public String getDnfReason() {
        return dnfReason;
    }

    public void setDnfReason(String dnfReason) {
        this.dnfReason = dnfReason;
    }

    public Integer getPagesCompleted() {
        return pagesCompleted;
    }

    public void setPagesCompleted(Integer pagesCompleted) {
        this.pagesCompleted = pagesCompleted;
    }

    public LocalDateTime getSyncedAt() {
        return syncedAt;
    }

    public void setSyncedAt(LocalDateTime syncedAt) {
        this.syncedAt = syncedAt;
    }
}
