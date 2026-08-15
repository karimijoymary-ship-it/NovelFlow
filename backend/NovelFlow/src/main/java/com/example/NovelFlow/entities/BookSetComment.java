package com.example.NovelFlow.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_set_comments")
public class BookSetComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_set_id")
    @JsonIgnoreProperties({"comments", "items"})
    private BookSet bookSet;

    @Column(nullable = false, length = 100)
    private String authorName;

    @Column(length = 100)
    private String authorRole;

    @Column(nullable = false, length = 1000)
    private String commentText;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BookSet getBookSet() { return bookSet; }
    public void setBookSet(BookSet bookSet) { this.bookSet = bookSet; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
