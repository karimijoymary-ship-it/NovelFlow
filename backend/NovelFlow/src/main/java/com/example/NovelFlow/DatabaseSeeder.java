package com.example.NovelFlow;

import com.example.NovelFlow.entities.*;
import com.example.NovelFlow.repositories.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

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
    private final BookSetRepository bookSetRepository;
    private final BookSetItemRepository bookSetItemRepository;
    private final BookSetCommentRepository bookSetCommentRepository;

    public DatabaseSeeder(UserRepository userRepository,
            BookMasterRepository bookMasterRepository,
            BookEditionRepository bookEditionRepository,
            CharacterNodeRepository characterNodeRepository,
            CharacterRelationshipRepository characterRelationshipRepository,
            ReadingTelemetryRepository readingTelemetryRepository,
            BCryptPasswordEncoder passwordEncoder,
            CharacterExtractorService characterExtractorService,
            BookSetRepository bookSetRepository,
            BookSetItemRepository bookSetItemRepository,
            BookSetCommentRepository bookSetCommentRepository) {
        this.userRepository = userRepository;
        this.bookMasterRepository = bookMasterRepository;
        this.bookEditionRepository = bookEditionRepository;
        this.characterNodeRepository = characterNodeRepository;
        this.characterRelationshipRepository = characterRelationshipRepository;
        this.readingTelemetryRepository = readingTelemetryRepository;
        this.passwordEncoder = passwordEncoder;
        this.characterExtractorService = characterExtractorService;
        this.bookSetRepository = bookSetRepository;
        this.bookSetItemRepository = bookSetItemRepository;
        this.bookSetCommentRepository = bookSetCommentRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        Optional<User> existingAdmin = userRepository.findByEmail("admin@example.com");
        User admin;
        if (existingAdmin.isEmpty()) {
            admin = new User();
            admin.setUserId("user_admin");
        } else {
            admin = existingAdmin.get();
        }
        admin.setFullName("System Administrator");
        admin.setEmail("admin@example.com");
        admin.setAcademicStream("Systems Operation");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setRole("admin");
        userRepository.save(admin);

        if (bookMasterRepository.count() == 0) {
            seedBooksAndTelemetry(admin);
        }

        if (bookSetRepository.count() == 0) {
            seedSampleCollections();
        }

        System.out.println(">>> Seeded Database with Mock Book, Character, and Collection Data successfully!");
    }

    private void seedBooksAndTelemetry(User admin) {
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
        gatsby.setSynopsis("A novel set in the Jazz Age that tells the story of Jay Gatsby's unrequited love for Daisy Buchanan.");
        gatsby.setDnaComplexity(80);
        gatsby.setDnaDarkness(75);
        gatsby.setDnaPacing(60);
        gatsby.setDnaRomance(85);
        gatsby.setDnaWorldBuild(65);
        gatsby.setCustomTags("#JazzAge, #AmericanDream, #ModernistLit");
        gatsby.setThematicElements("Social Stratification, Illusion vs Reality, Nostalgia & Time");
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
        dune.setSynopsis("Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family in a feudal intergalactic empire.");
        dune.setDnaComplexity(95);
        dune.setDnaDarkness(70);
        dune.setDnaPacing(80);
        dune.setDnaWorldBuild(98);
        dune.setCustomTags("#SciFiMasterpiece, #WorldBuilding, #EcologicalFiction");
        dune.setThematicElements("Ecological Crisis, Messianic Hero Traps, Power & Imperialism");
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
        orwell1984.setSynopsis("A dystopian novel set in Airstrip One, a province of the superstate Oceania in a world of perpetual war, omnipresent government surveillance, and totalitarianism.");
        orwell1984.setDnaComplexity(88);
        orwell1984.setDnaDarkness(95);
        orwell1984.setDnaPacing(70);
        orwell1984.setDnaWorldBuild(90);
        orwell1984.setCustomTags("#DystopianClassic, #PoliticalSatire, #Totalitarianism");
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
    }

    private void seedSampleCollections() {
        Optional<BookMaster> gatsbyOpt = bookMasterRepository.findById("book_1");
        Optional<BookMaster> duneOpt = bookMasterRepository.findById("book_2");
        Optional<BookMaster> orwellOpt = bookMasterRepository.findById("book_3");

        // 1. Course & Curriculum Set
        BookSet courseSet = new BookSet();
        courseSet.setName("CLT 301: East African & World Fiction");
        courseSet.setDescription("Core syllabus module examining modernist narratives, dystopian sociopolitics, and colonial themes.");
        courseSet.setIcon("🎓");
        courseSet.setSetType("COURSE");
        courseSet.setCourseCode("CLT 301");
        courseSet.setSemester("Fall 2026");
        courseSet.setOwnerUserId("user_1");
        courseSet.setShareCode("SHARE-CLT301-A79");
        courseSet = bookSetRepository.save(courseSet);

        if (gatsbyOpt.isPresent()) {
            BookSetItem item1 = new BookSetItem();
            item1.setBookSet(courseSet);
            item1.setBookMaster(gatsbyOpt.get());
            item1.setItemType("REQUIRED");
            item1.setSyllabusNotes("Focus on Chapter 3 & 7 for the mid-term paper on social class stratification.");
            bookSetItemRepository.save(item1);
        }

        if (orwellOpt.isPresent()) {
            BookSetItem item2 = new BookSetItem();
            item2.setBookSet(courseSet);
            item2.setBookMaster(orwellOpt.get());
            item2.setItemType("REQUIRED");
            item2.setSyllabusNotes("Analyze Newspeak linguistic control mechanisms for Seminar 4.");
            bookSetItemRepository.save(item2);
        }

        if (duneOpt.isPresent()) {
            BookSetItem item3 = new BookSetItem();
            item3.setBookSet(courseSet);
            item3.setBookMaster(duneOpt.get());
            item3.setItemType("SUPPLEMENTARY");
            item3.setSyllabusNotes("Optional background reading for ecological imperialism comparisons.");
            bookSetItemRepository.save(item3);
        }

        // 2. Language Alignment Set
        BookSet langSet = new BookSet();
        langSet.setName("Kiswahili-English Parallel Edition Tracks");
        langSet.setDescription("Structured pairings comparing original English master editions directly against Swahili regional translations.");
        langSet.setIcon("🌐");
        langSet.setSetType("LANGUAGE_ALIGNMENT");
        langSet.setOwnerUserId("user_1");
        langSet.setShareCode("SHARE-LANG-SW-EN");
        langSet = bookSetRepository.save(langSet);

        if (gatsbyOpt.isPresent()) {
            BookSetItem itemLang1 = new BookSetItem();
            itemLang1.setBookSet(langSet);
            itemLang1.setBookMaster(gatsbyOpt.get());
            itemLang1.setItemType("PAIRED_ORIGINAL");
            itemLang1.setTranslationNotes("Master Text: F. Scott Fitzgerald (1925) - English Edition");
            bookSetItemRepository.save(itemLang1);

            BookSetItem itemLang2 = new BookSetItem();
            itemLang2.setBookSet(langSet);
            itemLang2.setBookMaster(gatsbyOpt.get());
            itemLang2.setItemType("PAIRED_TRANSLATION");
            itemLang2.setTranslationNotes("Regional Companion: 'Gatsby Mkuu' - Swahili Translation (ISBN: 9789966115201)");
            bookSetItemRepository.save(itemLang2);
        }

        // 3. Psychographic Preset
        BookSet psychoPreset = new BookSet();
        psychoPreset.setName("High Complexity / Dark Narrative Vector");
        psychoPreset.setDescription("Dynamic DNA cluster isolating books with Narrative Complexity ≥ 75% and Narrative Darkness ≥ 70%.");
        psychoPreset.setIcon("🧠");
        psychoPreset.setSetType("PSYCHOGRAPHIC_PRESET");
        psychoPreset.setDnaComplexityMin(75);
        psychoPreset.setDnaDarknessMin(70);
        psychoPreset.setDnaPacingMin(50);
        psychoPreset.setOwnerUserId("user_1");
        psychoPreset.setShareCode("SHARE-PSYCHO-DARK");
        psychoPreset = bookSetRepository.save(psychoPreset);

        if (orwellOpt.isPresent()) {
            BookSetItem itemP = new BookSetItem();
            itemP.setBookSet(psychoPreset);
            itemP.setBookMaster(orwellOpt.get());
            itemP.setItemType("REQUIRED");
            itemP.setSyllabusNotes("DNA Match: 95% Darkness, 88% Complexity");
            bookSetItemRepository.save(itemP);
        }

        // 4. Custom Tags Set
        BookSet tagSet = new BookSet();
        tagSet.setName("#DystopianClassic Literature Cluster");
        tagSet.setDescription("Student multi-label taxonomy aggregating dystopian socio-political fiction.");
        tagSet.setIcon("🏷️");
        tagSet.setSetType("CUSTOM_TAG");
        tagSet.setTargetTag("#DystopianClassic");
        tagSet.setOwnerUserId("user_1");
        tagSet.setShareCode("SHARE-TAG-DYSTOPIAN");
        tagSet = bookSetRepository.save(tagSet);

        if (orwellOpt.isPresent()) {
            BookSetItem itemT = new BookSetItem();
            itemT.setBookSet(tagSet);
            itemT.setBookMaster(orwellOpt.get());
            itemT.setItemType("REQUIRED");
            bookSetItemRepository.save(itemT);
        }

        // 5. Collaborative & Shared Reading List
        BookSet sharedList = new BookSet();
        sharedList.setName("Comparative Lit Seminar Study Group Hub");
        sharedList.setDescription("Public peer reading list for the Comparative Literature end-of-term study group. Feel free to clone or join!");
        sharedList.setIcon("👥");
        sharedList.setSetType("SHARED_LIST");
        sharedList.setIsPublic(true);
        sharedList.setShareCode("SHARE-COMPLIT-GROUP1");
        sharedList.setOwnerUserId("user_1");
        sharedList = bookSetRepository.save(sharedList);

        if (gatsbyOpt.isPresent()) {
            BookSetItem itemS1 = new BookSetItem();
            itemS1.setBookSet(sharedList);
            itemS1.setBookMaster(gatsbyOpt.get());
            itemS1.setItemType("REQUIRED");
            bookSetItemRepository.save(itemS1);
        }
        if (duneOpt.isPresent()) {
            BookSetItem itemS2 = new BookSetItem();
            itemS2.setBookSet(sharedList);
            itemS2.setBookMaster(duneOpt.get());
            itemS2.setItemType("REQUIRED");
            bookSetItemRepository.save(itemS2);
        }

        // Seed sample comments
        BookSetComment c1 = new BookSetComment();
        c1.setBookSet(sharedList);
        c1.setAuthorName("Alice Reader");
        c1.setAuthorRole("Study Group Lead");
        c1.setCommentText("Hey team! Please complete Chapters 1-4 of Gatsby before our Friday review session.");
        c1.setCreatedAt(LocalDateTime.now().minusHours(5));
        bookSetCommentRepository.save(c1);

        BookSetComment c2 = new BookSetComment();
        c2.setBookSet(sharedList);
        c2.setAuthorName("Marcus Vance");
        c2.setAuthorRole("Peer Member");
        c2.setCommentText("Added my notes on Dune's ecological symbolism. Check out the supplementary section!");
        c2.setCreatedAt(LocalDateTime.now().minusHours(2));
        bookSetCommentRepository.save(c2);
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
