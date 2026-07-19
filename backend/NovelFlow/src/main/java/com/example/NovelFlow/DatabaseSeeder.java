package com.example.NovelFlow;

import com.example.NovelFlow.entities.*;
import com.example.NovelFlow.repositories.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookMasterRepository bookMasterRepository;
    private final BookEditionRepository bookEditionRepository;
    private final CharacterNodeRepository characterNodeRepository;
    private final CharacterRelationshipRepository characterRelationshipRepository;
    private final ReadingTelemetryRepository readingTelemetryRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final CharacterExtractorService characterExtractorService;

    public DatabaseSeeder(UserRepository userRepository,
            BookMasterRepository bookMasterRepository,
            BookEditionRepository bookEditionRepository,
            CharacterNodeRepository characterNodeRepository,
            CharacterRelationshipRepository characterRelationshipRepository,
            ReadingTelemetryRepository readingTelemetryRepository,
            BCryptPasswordEncoder passwordEncoder,
            CharacterExtractorService characterExtractorService) {
        this.userRepository = userRepository;
        this.bookMasterRepository = bookMasterRepository;
        this.bookEditionRepository = bookEditionRepository;
        this.characterNodeRepository = characterNodeRepository;
        this.characterRelationshipRepository = characterRelationshipRepository;
        this.readingTelemetryRepository = readingTelemetryRepository;
        this.passwordEncoder = passwordEncoder;
        this.characterExtractorService = characterExtractorService;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (bookMasterRepository.count() > 0) {
            return; // DB already seeded
        }

        // 1. Seed User
        User user = new User();
        user.setUserId("user_1");
        user.setFullName("Alice Reader");
        user.setEmail("alice@example.com");
        user.setAcademicStream("Comparative Literature");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        userRepository.save(user);

        // 2. Seed Book 1: The Great Gatsby
        BookMaster gatsby = new BookMaster();
        gatsby.setBookMasterId("book_1");
        gatsby.setOriginalAuthor("F. Scott Fitzgerald");
        gatsby.setOriginalReleaseYear(1925);
        gatsby.setCalculatedAverageRating(4.5);
        bookMasterRepository.save(gatsby);

        BookEdition gatsbyEn = new BookEdition();
        gatsbyEn.setEditionId("edition_1_en");
        gatsbyEn.setBookMaster(gatsby);
        gatsbyEn.setLanguageTag("en");
        gatsbyEn.setTitle("The Great Gatsby");
        gatsbyEn.setIsbnBarcode("9780743273565");

        BookEdition gatsbySw = new BookEdition();
        gatsbySw.setEditionId("edition_1_sw");
        gatsbySw.setBookMaster(gatsby);
        gatsbySw.setLanguageTag("sw");
        gatsbySw.setTitle("Gatsby Mkuu");
        gatsbySw.setIsbnBarcode("9789966115201");

        bookEditionRepository.saveAll(Arrays.asList(gatsbyEn, gatsbySw));

        CharacterNode gatsbyChar = createCharacter("char_1_1", gatsby, "Jay Gatsby", "Tragic Hero");
        CharacterNode nickChar = createCharacter("char_1_2", gatsby, "Nick Carraway", "Narrator");
        CharacterNode daisyChar = createCharacter("char_1_3", gatsby, "Daisy Buchanan", "Love Interest");
        CharacterNode tomChar = createCharacter("char_1_4", gatsby, "Tom Buchanan", "Antagonist");

        createRelationship("rel_1_1", gatsbyChar, daisyChar, "Love Interest");
        createRelationship("rel_1_2", nickChar, gatsbyChar, "Ally");
        createRelationship("rel_1_3", tomChar, gatsbyChar, "Adversary");
        createRelationship("rel_1_4", tomChar, daisyChar, "Spouse");

        // 3. Seed Book 2: Dune
        BookMaster dune = new BookMaster();
        dune.setBookMasterId("book_2");
        dune.setOriginalAuthor("Frank Herbert");
        dune.setOriginalReleaseYear(1965);
        dune.setCalculatedAverageRating(4.8);
        bookMasterRepository.save(dune);

        BookEdition duneEn = new BookEdition();
        duneEn.setEditionId("edition_2_en");
        duneEn.setBookMaster(dune);
        duneEn.setLanguageTag("en");
        duneEn.setTitle("Dune");
        duneEn.setIsbnBarcode("9780441172719");
        bookEditionRepository.save(duneEn);

        CharacterNode paulChar = createCharacter("char_2_1", dune, "Paul Atreides", "Messiah");
        CharacterNode jessicaChar = createCharacter("char_2_2", dune, "Lady Jessica", "Mother / Mentor");
        CharacterNode baronChar = createCharacter("char_2_3", dune, "Baron Harkonnen", "Antagonist");
        CharacterNode chaniChar = createCharacter("char_2_4", dune, "Chani", "Love Interest / Ally");

        createRelationship("rel_2_1", paulChar, baronChar, "Adversary");
        createRelationship("rel_2_2", jessicaChar, paulChar, "Family");
        createRelationship("rel_2_3", chaniChar, paulChar, "Love Interest");

        // 4. Seed Book 3: 1984
        BookMaster orwell1984 = new BookMaster();
        orwell1984.setBookMasterId("book_3");
        orwell1984.setOriginalAuthor("George Orwell");
        orwell1984.setOriginalReleaseYear(1949);
        orwell1984.setCalculatedAverageRating(4.2);
        bookMasterRepository.save(orwell1984);

        BookEdition orwell1984En = new BookEdition();
        orwell1984En.setEditionId("edition_3_en");
        orwell1984En.setBookMaster(orwell1984);
        orwell1984En.setLanguageTag("en");
        orwell1984En.setTitle("Nineteen Eighty-Four");
        orwell1984En.setIsbnBarcode("9780451524935");
        bookEditionRepository.save(orwell1984En);

        CharacterNode winstonChar = createCharacter("char_3_1", orwell1984, "Winston Smith", "Rebel");
        CharacterNode juliaChar = createCharacter("char_3_2", orwell1984, "Julia", "Lover");
        CharacterNode obrienChar = createCharacter("char_3_3", orwell1984, "O'Brien", "Inquisitor / Deceiver");
        CharacterNode bbChar = createCharacter("char_3_4", orwell1984, "Big Brother", "Symbolic Tyrant");

        createRelationship("rel_3_1", winstonChar, juliaChar, "Love Interest");
        createRelationship("rel_3_2", winstonChar, obrienChar, "Adversary");
        createRelationship("rel_3_3", obrienChar, winstonChar, "Mentor");

        // 5. Seed Telemetry
        createTelemetry("tel_1", user, gatsby, 4.5, "Reading", null, 120);
        createTelemetry("tel_2", user, dune, 4.8, "Completed", null, 800);
        createTelemetry("tel_3", user, orwell1984, 4.2, "DNF", "Too bleak and depressing to finish.", 150);

        // 6. Seed NLP Test Book
        BookMaster testBook = new BookMaster();
        testBook.setBookMasterId("book_test");
        testBook.setOriginalAuthor("Test Author");
        testBook.setOriginalReleaseYear(2026);
        testBook.setCalculatedAverageRating(0.0);
        String testSynopsis = "Harry Potter is a young wizard who discovers his magical heritage on his eleventh birthday. He attends Hogwarts School of Witchcraft and Wizardry. Along with his friends Ron Weasley and Hermione Granger, he faces the evil Lord Voldemort, who seeks to conquer the wizarding world.";
        testBook.setSynopsis(testSynopsis);
        bookMasterRepository.save(testBook);

        BookEdition testEd = new BookEdition();
        testEd.setEditionId("edition_test_en");
        testEd.setBookMaster(testBook);
        testEd.setLanguageTag("en");
        testEd.setTitle("Test NLP Extraction Book");
        testEd.setIsbnBarcode("9999999999999");
        bookEditionRepository.save(testEd);

        characterExtractorService.extractAndSaveCharacters(testBook, testSynopsis);

        System.out.println(">>> Seeded Database with Mock Book & Character Data successfully!");
    }

    private CharacterNode createCharacter(String id, BookMaster book, String name, String archetype) {
        CharacterNode node = new CharacterNode();
        node.setCharacterId(id);
        node.setBookMaster(book);
        node.setCharacterName(name);
        node.setThematicArchetype(archetype);
        return characterNodeRepository.save(node);
    }

    private CharacterRelationship createRelationship(String id, CharacterNode src, CharacterNode target, String type) {
        CharacterRelationship rel = new CharacterRelationship();
        rel.setRelationshipId(id);
        rel.setSourceCharacter(src);
        rel.setTargetCharacter(target);
        rel.setRelationshipType(type);
        return characterRelationshipRepository.save(rel);
    }

    private void createTelemetry(String id, User user, BookMaster book, Double rating, String status, String reason,
            Integer pages) {
        ReadingTelemetry tel = new ReadingTelemetry();
        tel.setTelemetryId(id);
        tel.setUser(user);
        tel.setBookMaster(book);
        tel.setFractionalRating(rating);
        tel.setReadingStatus(status);
        tel.setDnfReason(reason);
        tel.setPagesCompleted(pages);
        tel.setSyncedAt(LocalDateTime.now());
        readingTelemetryRepository.save(tel);
    }
}
