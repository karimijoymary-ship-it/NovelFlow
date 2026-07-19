package com.example.NovelFlow.repositories;

import com.example.NovelFlow.entities.ReadingTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingTelemetryRepository extends JpaRepository<ReadingTelemetry, String> {
    List<ReadingTelemetry> findByBookMasterBookMasterId(String bookMasterId);

    Optional<ReadingTelemetry> findByBookMasterBookMasterIdAndUserUserId(String bookMasterId, String userId);
}
