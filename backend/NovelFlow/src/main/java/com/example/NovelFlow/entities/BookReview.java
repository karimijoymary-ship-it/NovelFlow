package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_reviews")
public class BookReview {

    @Id
    private String reviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_master_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "editions", "characterNodes", "telemetryList"})
    private BookMaster bookMaster;

    @Column(nullable = false)
    private String reviewerName;

    @Column
    private String reviewerStream;

    @Column(nullable = false)
    private Double rating; // 1.0 to 5.0

    @Column(length = 200)
    private String reviewTitle;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reviewText;

    @Column(nullable = false)
    private Integer helpfulCount = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_flagged")
    private Boolean isFlagged = false;

    public BookReview() {}

    public Boolean getIsFlagged() {
        return isFlagged;
    }

    public void setIsFlagged(Boolean isFlagged) {
        this.isFlagged = isFlagged;
    }

    public String getReviewId() {
        return reviewId;
    }

    public void setReviewId(String reviewId) {
        this.reviewId = reviewId;
    }

    public BookMaster getBookMaster() {
        return bookMaster;
    }

    public void setBookMaster(BookMaster bookMaster) {
        this.bookMaster = bookMaster;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public String getReviewerStream() {
        return reviewerStream;
    }

    public void setReviewerStream(String reviewerStream) {
        this.reviewerStream = reviewerStream;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getReviewTitle() {
        return reviewTitle;
    }

    public void setReviewTitle(String reviewTitle) {
        this.reviewTitle = reviewTitle;
    }

    public String getReviewText() {
        return reviewText;
    }

    public void setReviewText(String reviewText) {
        this.reviewText = reviewText;
    }

    public Integer getHelpfulCount() {
        return helpfulCount;
    }

    public void setHelpfulCount(Integer helpfulCount) {
        this.helpfulCount = helpfulCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
