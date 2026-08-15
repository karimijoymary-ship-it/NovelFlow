package com.example.NovelFlow;

import com.example.NovelFlow.entities.BookMaster;
import com.example.NovelFlow.entities.BookSet;
import com.example.NovelFlow.entities.BookSetComment;
import com.example.NovelFlow.entities.BookSetItem;
import com.example.NovelFlow.repositories.BookMasterRepository;
import com.example.NovelFlow.repositories.BookSetCommentRepository;
import com.example.NovelFlow.repositories.BookSetItemRepository;
import com.example.NovelFlow.repositories.BookSetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/sets")
@CrossOrigin(origins = "*")
public class BookSetController {

    @Autowired
    private BookSetRepository bookSetRepository;

    @Autowired
    private BookSetItemRepository bookSetItemRepository;

    @Autowired
    private BookSetCommentRepository bookSetCommentRepository;

    @Autowired
    private BookMasterRepository bookMasterRepository;

    @GetMapping
    public List<BookSet> getAllSets(@RequestParam(required = false) String type) {
        if (type != null && !type.trim().isEmpty()) {
            return bookSetRepository.findBySetType(type.toUpperCase());
        }
        return bookSetRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookSet> getSetById(@PathVariable Long id) {
        return bookSetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/share/{shareCode}")
    public ResponseEntity<BookSet> getSetByShareCode(@PathVariable String shareCode) {
        return bookSetRepository.findByShareCode(shareCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookSet> createSet(@RequestBody BookSet bookSet) {
        if (bookSet.getShareCode() == null || bookSet.getShareCode().trim().isEmpty()) {
            String prefix = bookSet.getCourseCode() != null && !bookSet.getCourseCode().isEmpty() 
                    ? bookSet.getCourseCode().replaceAll("[^a-zA-Z0-9]", "") 
                    : "SET";
            bookSet.setShareCode("SHARE-" + prefix.toUpperCase() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        }
        BookSet savedSet = bookSetRepository.save(bookSet);
        return ResponseEntity.ok(savedSet);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookSet> updateSet(@PathVariable Long id, @RequestBody BookSet updateReq) {
        Optional<BookSet> opt = bookSetRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        BookSet existing = opt.get();
        if (updateReq.getName() != null) existing.setName(updateReq.getName());
        if (updateReq.getDescription() != null) existing.setDescription(updateReq.getDescription());
        if (updateReq.getIcon() != null) existing.setIcon(updateReq.getIcon());
        if (updateReq.getCourseCode() != null) existing.setCourseCode(updateReq.getCourseCode());
        if (updateReq.getSemester() != null) existing.setSemester(updateReq.getSemester());
        if (updateReq.getIsPublic() != null) existing.setIsPublic(updateReq.getIsPublic());
        if (updateReq.getTargetTag() != null) existing.setTargetTag(updateReq.getTargetTag());
        if (updateReq.getDnaComplexityMin() != null) existing.setDnaComplexityMin(updateReq.getDnaComplexityMin());
        if (updateReq.getDnaDarknessMin() != null) existing.setDnaDarknessMin(updateReq.getDnaDarknessMin());
        if (updateReq.getDnaPacingMin() != null) existing.setDnaPacingMin(updateReq.getDnaPacingMin());
        if (updateReq.getDnaWorldBuildMin() != null) existing.setDnaWorldBuildMin(updateReq.getDnaWorldBuildMin());
        if (updateReq.getDnaRomanceMin() != null) existing.setDnaRomanceMin(updateReq.getDnaRomanceMin());
        if (updateReq.getDnaHumorMin() != null) existing.setDnaHumorMin(updateReq.getDnaHumorMin());

        return ResponseEntity.ok(bookSetRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSet(@PathVariable Long id) {
        if (!bookSetRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        bookSetRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<BookSet> addItemToSet(@PathVariable Long id, @RequestBody AddItemRequest req) {
        Optional<BookSet> setOpt = bookSetRepository.findById(id);
        if (setOpt.isEmpty()) return ResponseEntity.notFound().build();

        Optional<BookMaster> bookOpt = bookMasterRepository.findById(req.getBookMasterId());
        if (bookOpt.isEmpty()) return ResponseEntity.badRequest().build();

        BookSet set = setOpt.get();
        BookMaster book = bookOpt.get();

        // Check if item already exists in this set
        boolean exists = set.getItems().stream()
                .anyMatch(item -> item.getBookMaster().getBookMasterId().equals(book.getBookMasterId()));

        if (!exists) {
            BookSetItem item = new BookSetItem();
            item.setBookSet(set);
            item.setBookMaster(book);
            item.setItemType(req.getItemType() != null ? req.getItemType() : "REQUIRED");
            item.setSyllabusNotes(req.getSyllabusNotes());
            item.setTranslationNotes(req.getTranslationNotes());
            item.setOrderIndex(set.getItems().size() + 1);

            bookSetItemRepository.save(item);
            set.getItems().add(item);
        }

        return ResponseEntity.ok(bookSetRepository.save(set));
    }

    @DeleteMapping("/{id}/items/{bookId}")
    @Transactional
    public ResponseEntity<BookSet> removeItemFromSet(@PathVariable Long id, @PathVariable String bookId) {
        Optional<BookSet> setOpt = bookSetRepository.findById(id);
        if (setOpt.isEmpty()) return ResponseEntity.notFound().build();

        bookSetItemRepository.deleteByBookSetIdAndBookMasterBookMasterId(id, bookId);
        BookSet updated = bookSetRepository.findById(id).get();
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<BookSet> cloneSet(@PathVariable Long id, @RequestParam(defaultValue = "user_1") String userId) {
        Optional<BookSet> setOpt = bookSetRepository.findById(id);
        if (setOpt.isEmpty()) return ResponseEntity.notFound().build();

        BookSet original = setOpt.get();
        BookSet clone = new BookSet();
        clone.setName(original.getName() + " (My Copy)");
        clone.setDescription(original.getDescription());
        clone.setIcon(original.getIcon());
        clone.setSetType(original.getSetType());
        clone.setCourseCode(original.getCourseCode());
        clone.setSemester(original.getSemester());
        clone.setIsPublic(false);
        clone.setOwnerUserId(userId);
        clone.setShareCode("SHARE-CLONE-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());

        BookSet savedClone = bookSetRepository.save(clone);

        List<BookSetItem> clonedItems = new ArrayList<>();
        for (BookSetItem item : original.getItems()) {
            BookSetItem newItem = new BookSetItem();
            newItem.setBookSet(savedClone);
            newItem.setBookMaster(item.getBookMaster());
            newItem.setItemType(item.getItemType());
            newItem.setSyllabusNotes(item.getSyllabusNotes());
            newItem.setTranslationNotes(item.getTranslationNotes());
            newItem.setOrderIndex(item.getOrderIndex());
            clonedItems.add(newItem);
        }
        bookSetItemRepository.saveAll(clonedItems);
        if (savedClone.getItems() == null) {
            savedClone.setItems(new ArrayList<>());
        }
        savedClone.getItems().addAll(clonedItems);

        return ResponseEntity.ok(bookSetRepository.save(savedClone));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<BookSetComment> addComment(@PathVariable Long id, @RequestBody AddCommentRequest req) {
        Optional<BookSet> setOpt = bookSetRepository.findById(id);
        if (setOpt.isEmpty()) return ResponseEntity.notFound().build();

        BookSetComment comment = new BookSetComment();
        comment.setBookSet(setOpt.get());
        comment.setAuthorName(req.getAuthorName() != null ? req.getAuthorName() : "Student Lead");
        comment.setAuthorRole(req.getAuthorRole() != null ? req.getAuthorRole() : "Member");
        comment.setCommentText(req.getCommentText());
        comment.setCreatedAt(LocalDateTime.now());

        return ResponseEntity.ok(bookSetCommentRepository.save(comment));
    }

    public static class AddItemRequest {
        private String bookMasterId;
        private String itemType; // REQUIRED, SUPPLEMENTARY, PAIRED_ORIGINAL, PAIRED_TRANSLATION
        private String syllabusNotes;
        private String translationNotes;

        public String getBookMasterId() { return bookMasterId; }
        public void setBookMasterId(String bookMasterId) { this.bookMasterId = bookMasterId; }

        public String getItemType() { return itemType; }
        public void setItemType(String itemType) { this.itemType = itemType; }

        public String getSyllabusNotes() { return syllabusNotes; }
        public void setSyllabusNotes(String syllabusNotes) { this.syllabusNotes = syllabusNotes; }

        public String getTranslationNotes() { return translationNotes; }
        public void setTranslationNotes(String translationNotes) { this.translationNotes = translationNotes; }
    }

    public static class AddCommentRequest {
        private String authorName;
        private String authorRole;
        private String commentText;

        public String getAuthorName() { return authorName; }
        public void setAuthorName(String authorName) { this.authorName = authorName; }

        public String getAuthorRole() { return authorRole; }
        public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

        public String getCommentText() { return commentText; }
        public void setCommentText(String commentText) { this.commentText = commentText; }
    }
}
