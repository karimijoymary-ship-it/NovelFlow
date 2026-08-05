package com.example.NovelFlow;

import com.example.NovelFlow.entities.BookSet;
import com.example.NovelFlow.repositories.BookSetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sets")
@CrossOrigin(origins = "http://localhost:5173")
public class BookSetController {

    @Autowired
    private BookSetRepository bookSetRepository;

    @GetMapping
    public List<BookSet> getAllSets() {
        return bookSetRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<BookSet> createSet(@RequestBody BookSet bookSet) {
        BookSet savedSet = bookSetRepository.save(bookSet);
        return ResponseEntity.ok(savedSet);
    }
}
