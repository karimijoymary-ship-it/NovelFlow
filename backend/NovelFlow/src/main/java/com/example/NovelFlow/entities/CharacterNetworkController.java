package com.example.NovelFlow.entities;

import com.example.NovelFlow.repositories.BookMasterRepository;
import com.example.NovelFlow.repositories.CharacterNodeRepository;
import com.example.NovelFlow.repositories.CharacterRelationshipRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/books/{bookId}")
@CrossOrigin(origins = "*")
public class CharacterNetworkController {

    private final BookMasterRepository bookMasterRepository;
    private final CharacterNodeRepository characterNodeRepository;
    private final CharacterRelationshipRepository characterRelationshipRepository;

    public CharacterNetworkController(BookMasterRepository bookMasterRepository,
            CharacterNodeRepository characterNodeRepository,
            CharacterRelationshipRepository characterRelationshipRepository) {
        this.bookMasterRepository = bookMasterRepository;
        this.characterNodeRepository = characterNodeRepository;
        this.characterRelationshipRepository = characterRelationshipRepository;
    }

    @GetMapping("/network")
    public ResponseEntity<GraphResponse> getNetwork(@PathVariable String bookId) {
        if (!bookMasterRepository.existsById(bookId)) {
            return ResponseEntity.notFound().build();
        }

        List<CharacterNode> nodes = characterNodeRepository.findByBookMasterBookMasterId(bookId);
        List<CharacterRelationship> links = characterRelationshipRepository
                .findBySourceCharacterBookMasterBookMasterId(bookId);

        return ResponseEntity.ok(new GraphResponse(nodes, links));
    }

    @PostMapping("/relationships")
    public ResponseEntity<?> updateRelationship(@PathVariable String bookId, @RequestBody RelationshipRequest request) {
        if (request.getSourceCharacterId() == null || request.getTargetCharacterId() == null) {
            return ResponseEntity.badRequest().body("Source and target character IDs must be specified.");
        }

        Optional<CharacterNode> srcOpt = characterNodeRepository.findById(request.getSourceCharacterId());
        Optional<CharacterNode> targetOpt = characterNodeRepository.findById(request.getTargetCharacterId());

        if (srcOpt.isEmpty() || targetOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Source or target character does not exist.");
        }

        CharacterNode src = srcOpt.get();
        CharacterNode target = targetOpt.get();

        Optional<CharacterRelationship> relOpt = characterRelationshipRepository
                .findBySourceCharacterCharacterIdAndTargetCharacterCharacterId(src.getCharacterId(),
                        target.getCharacterId());

        if (request.getRelationshipType() == null || request.getRelationshipType().trim().isEmpty()
                || request.getRelationshipType().equalsIgnoreCase("None")) {
            if (relOpt.isPresent()) {
                characterRelationshipRepository.delete(relOpt.get());
                return ResponseEntity.ok().body("{\"message\":\"Relationship deleted successfully.\"}");
            }
            Optional<CharacterRelationship> reverseRelOpt = characterRelationshipRepository
                    .findBySourceCharacterCharacterIdAndTargetCharacterCharacterId(target.getCharacterId(),
                            src.getCharacterId());
            if (reverseRelOpt.isPresent()) {
                characterRelationshipRepository.delete(reverseRelOpt.get());
                return ResponseEntity.ok().body("{\"message\":\"Relationship deleted successfully.\"}");
            }
            return ResponseEntity.ok().body("{\"message\":\"No relationship existed to delete.\"}");
        }

        CharacterRelationship relationship;
        if (relOpt.isPresent()) {
            relationship = relOpt.get();
        } else {
            Optional<CharacterRelationship> reverseRelOpt = characterRelationshipRepository
                    .findBySourceCharacterCharacterIdAndTargetCharacterCharacterId(target.getCharacterId(),
                            src.getCharacterId());
            if (reverseRelOpt.isPresent()) {
                relationship = reverseRelOpt.get();
            } else {
                relationship = new CharacterRelationship();
                relationship.setRelationshipId(UUID.randomUUID().toString());
                relationship.setSourceCharacter(src);
                relationship.setTargetCharacter(target);
            }
        }

        relationship.setRelationshipType(request.getRelationshipType());
        characterRelationshipRepository.save(relationship);

        return ResponseEntity.ok(relationship);
    }

    @PostMapping("/characters")
    public ResponseEntity<?> addCharacter(@PathVariable String bookId, @RequestBody CharacterNode requestNode) {
        Optional<BookMaster> bookOpt = bookMasterRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (requestNode.getCharacterName() == null || requestNode.getCharacterName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Character name must be specified.");
        }

        CharacterNode node = new CharacterNode();
        node.setCharacterId("char_user_" + UUID.randomUUID().toString().substring(0, 8) + "_"
                + requestNode.getCharacterName().trim().toLowerCase().replaceAll("[^a-z]", ""));
        node.setBookMaster(bookOpt.get());
        node.setCharacterName(requestNode.getCharacterName().trim());
        node.setThematicArchetype(
                requestNode.getThematicArchetype() != null ? requestNode.getThematicArchetype().trim() : "Supporting");
        node.setSource("USER");

        characterNodeRepository.save(node);
        return ResponseEntity.ok(node);
    }

    @DeleteMapping("/characters/{characterId}")
    public ResponseEntity<?> deleteCharacter(@PathVariable String bookId, @PathVariable String characterId) {
        Optional<CharacterNode> nodeOpt = characterNodeRepository.findById(characterId);
        if (nodeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CharacterNode node = nodeOpt.get();
        // Delete all relationships referencing this character
        List<CharacterRelationship> rels = characterRelationshipRepository
                .findBySourceCharacterBookMasterBookMasterId(bookId);
        for (CharacterRelationship rel : rels) {
            if (rel.getSourceCharacter().getCharacterId().equals(characterId) ||
                    rel.getTargetCharacter().getCharacterId().equals(characterId)) {
                characterRelationshipRepository.delete(rel);
            }
        }

        characterNodeRepository.delete(node);
        return ResponseEntity.ok().body("{\"message\":\"Character and its relationships deleted successfully.\"}");
    }

    public static class RelationshipRequest {
        private String sourceCharacterId;
        private String targetCharacterId;
        private String relationshipType;

        public String getSourceCharacterId() {
            return sourceCharacterId;
        }

        public void setSourceCharacterId(String sourceCharacterId) {
            this.sourceCharacterId = sourceCharacterId;
        }

        public String getTargetCharacterId() {
            return targetCharacterId;
        }

        public void setTargetCharacterId(String targetCharacterId) {
            this.targetCharacterId = targetCharacterId;
        }

        public String getRelationshipType() {
            return relationshipType;
        }

        public void setRelationshipType(String relationshipType) {
            this.relationshipType = relationshipType;
        }
    }
}