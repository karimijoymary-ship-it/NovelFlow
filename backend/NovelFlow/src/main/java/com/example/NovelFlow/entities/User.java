package com.example.NovelFlow.entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    @Column(name = "email", length = 100, unique = true, nullable = false)
    private String email;

    @Column(name = "academic_stream", length = 50)
    private String academicStream;

    @JsonIgnore
    @Column(name = "password_hash", length = 100, nullable = false)
    private String passwordHash;

    @Column(name = "role", length = 20)
    private String role = "reader";

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<ReadingTelemetry> telemetryRecords;

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAcademicStream() {
        return academicStream;
    }

    public void setAcademicStream(String academicStream) {
        this.academicStream = academicStream;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}