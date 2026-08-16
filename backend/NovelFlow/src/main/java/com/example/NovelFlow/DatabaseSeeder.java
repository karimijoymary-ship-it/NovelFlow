package com.example.NovelFlow;

import com.example.NovelFlow.entities.*;
import com.example.NovelFlow.repositories.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
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
 private final BookReviewRepository bookReviewRepository;

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
 BookSetCommentRepository bookSetCommentRepository,
 BookReviewRepository bookReviewRepository) {
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
 this.bookReviewRepository = bookReviewRepository;
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

 if (bookMasterRepository.count() == 0 || !bookMasterRepository.existsById("book_11")) {
 seedBooksAndTelemetry(admin);
 }

 if (bookSetRepository.count() == 0) {
 seedSampleCollections();
 }

 // Sanitize all pre-existing database records
 sanitizeExistingDatabaseRecords();

 System.out.println(">>> Seeded Database and Sanitized all DB records successfully!");
 }

 private String stripEmojiJava(String input) {
 if (input == null) return null;
 return input.replaceAll("[\\uFE00-\\uFE0F\\u200D]", "")
 .replaceAll("[\\uD83C-\\uDBFF][\\uDC00-\\uDFFF]", "")
 .replaceAll("[\\u2600-\\u27BF]", "")
 .replaceAll("[\\u2300-\\u25FF]", "")
 .replaceAll("[]", "")
 .trim();
 }

 private void sanitizeExistingDatabaseRecords() {
 List<BookMaster> allBooks = bookMasterRepository.findAll();
 for (BookMaster b : allBooks) {
 boolean changed = false;
 if (b.getCustomTags() != null) {
 String clean = stripEmojiJava(b.getCustomTags());
 if (!clean.equals(b.getCustomTags())) { b.setCustomTags(clean); changed = true; }
 }
 if (b.getThematicElements() != null) {
 String clean = stripEmojiJava(b.getThematicElements());
 if (!clean.equals(b.getThematicElements())) { b.setThematicElements(clean); changed = true; }
 }
 if (b.getCustomThemeScores() != null) {
 String clean = stripEmojiJava(b.getCustomThemeScores());
 if (!clean.equals(b.getCustomThemeScores())) { b.setCustomThemeScores(clean); changed = true; }
 }
 if (changed) bookMasterRepository.save(b);
 }

 List<ReadingTelemetry> allTel = readingTelemetryRepository.findAll();
 for (ReadingTelemetry t : allTel) {
 if (t.getReadingStatus() != null) {
 String clean = stripEmojiJava(t.getReadingStatus());
 if (!clean.equals(t.getReadingStatus())) {
 t.setReadingStatus(clean);
 readingTelemetryRepository.save(t);
 }
 }
 }

 List<BookSet> allSets = bookSetRepository.findAll();
 for (BookSet s : allSets) {
 boolean changed = false;
 if (s.getIcon() != null && !s.getIcon().isEmpty()) { s.setIcon(""); changed = true; }
 if (s.getName() != null) {
 String clean = stripEmojiJava(s.getName());
 if (!clean.equals(s.getName())) { s.setName(clean); changed = true; }
 }
 if (changed) bookSetRepository.save(s);
 }
 }

 private void seedBooksAndTelemetry(User admin) {
 // 1. Seed User
 User user = userRepository.findById("user_1").orElseGet(() -> {
 User u = new User();
 u.setUserId("user_1");
 u.setFullName("Alice Reader");
 u.setEmail("alice@example.com");
 u.setAcademicStream("Comparative Literature");
 u.setPasswordHash(passwordEncoder.encode("password123"));
 return userRepository.save(u);
 });

 // 2. Seed Book 1: The Great Gatsby
 BookMaster gatsby;
 if (!bookMasterRepository.existsById("book_1")) {
 gatsby = new BookMaster();
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
 gatsby = bookMasterRepository.save(gatsby);

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
 } else {
 gatsby = bookMasterRepository.findById("book_1").orElse(null);
 }

 // 3. Seed Book 2: Dune
 BookMaster dune;
 if (!bookMasterRepository.existsById("book_2")) {
 dune = new BookMaster();
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
 dune = bookMasterRepository.save(dune);

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
 } else {
 dune = bookMasterRepository.findById("book_2").orElse(null);
 }

 // 4. Seed Book 3: 1984
 BookMaster orwell1984;
 if (!bookMasterRepository.existsById("book_3")) {
 orwell1984 = new BookMaster();
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
 orwell1984 = bookMasterRepository.save(orwell1984);

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
 } else {
 orwell1984 = bookMasterRepository.findById("book_3").orElse(null);
 }

 // 5. Seed Book 11: Blossoms of the Savannah (Henry Ole Kulet)
 if (!bookMasterRepository.existsById("book_11")) {
 BookMaster blossoms = new BookMaster();
 blossoms.setBookMasterId("book_11");
 blossoms.setOriginalAuthor("Henry Ole Kulet");
 blossoms.setOriginalReleaseYear(2008);
 blossoms.setCalculatedAverageRating(4.6);
 blossoms.setSynopsis("After their father loses his job in the city, sisters Resian and Taiyo relocate with their family from Nakuru to the rural Maasai community of Nasila. There, the girls are caught between their own ambitions and the community's expectations, especially the demand that they undergo female circumcision before marriage. Resian resists fiercely, facing danger and betrayal as she fights to control her own future.");
 blossoms.setDnaComplexity(82);
 blossoms.setDnaDarkness(78);
 blossoms.setDnaPacing(85);
 blossoms.setDnaRomance(40);
 blossoms.setDnaWorldBuild(88);
 blossoms.setCustomTags("#KenyanLit, #ComingOfAge, #CulturalTraditions, #MaasaiHeritage");
 blossoms.setThematicElements("Gender Roles, Tradition vs Modernity, Female Autonomy, Resilience");
 blossoms = bookMasterRepository.save(blossoms);

 BookEdition blossomsEd = new BookEdition();
 blossomsEd.setEditionId("edition_11_en");
 blossomsEd.setBookMaster(blossoms);
 blossomsEd.setLanguageTag("en");
 blossomsEd.setTitle("Blossoms of the Savannah");
 blossomsEd.setIsbnBarcode("9789966734006");
 bookEditionRepository.save(blossomsEd);

 CharacterNode resian = createCharacter("char_11_1", blossoms, "Resian", "Protagonist");
 CharacterNode taiyo = createCharacter("char_11_2", blossoms, "Taiyo", "Supporting");
 CharacterNode parsimei = createCharacter("char_11_3", blossoms, "Parsimei Ole Kaelo", "Supporting");
 CharacterNode mama = createCharacter("char_11_4", blossoms, "Mama Milanoi", "Supporting");
 CharacterNode oloisudori = createCharacter("char_11_5", blossoms, "Oloisudori Loonkiya", "Antagonist");
 CharacterNode olarinkoi = createCharacter("char_11_6", blossoms, "Olarinkoi", "Antagonist");
 CharacterNode nabaru = createCharacter("char_11_7", blossoms, "Nabaru", "Ally");

 createRelationship("rel_11_1", resian, taiyo, "Family / Sister");
 createRelationship("rel_11_2", parsimei, resian, "Family / Parent");
 createRelationship("rel_11_3", mama, resian, "Family / Parent");
 createRelationship("rel_11_4", oloisudori, resian, "Adversary");
 createRelationship("rel_11_5", olarinkoi, resian, "Adversary");
 createRelationship("rel_11_6", nabaru, resian, "Ally / Mentor");
 }

 // 6. Seed Book 12: Kigogo (Pauline Kea)
 if (!bookMasterRepository.existsById("book_12")) {
 BookMaster kigogo = new BookMaster();
 kigogo.setBookMasterId("book_12");
 kigogo.setOriginalAuthor("Pauline Kea");
 kigogo.setOriginalReleaseYear(2018);
 kigogo.setCalculatedAverageRating(4.7);
 kigogo.setSynopsis("Set in the fictional state of Sagamoyo, this Swahili play exposes the corruption and abuse of power under its authoritarian ruler, Majoka. As Sagamoyo prepares for independence celebrations, young craftsmen and activists led by Sudi and Tunu begin to challenge the regime's exploitation of ordinary citizens, exposing cover-ups, staged deaths, and the government's neglect of the people it claims to serve.");
 kigogo.setDnaComplexity(85);
 kigogo.setDnaDarkness(88);
 kigogo.setDnaPacing(82);
 kigogo.setDnaRomance(30);
 kigogo.setDnaWorldBuild(85);
 kigogo.setCustomTags("#SwahiliPlay, #PoliticalSatire, #AfricanDrama, #AntiCorruption");
 kigogo.setThematicElements("Authoritarianism, Corruption, Civic Resistance, Social Justice");
 kigogo = bookMasterRepository.save(kigogo);

 BookEdition kigogoEd = new BookEdition();
 kigogoEd.setEditionId("edition_12_sw");
 kigogoEd.setBookMaster(kigogo);
 kigogoEd.setLanguageTag("sw");
 kigogoEd.setTitle("Kigogo");
 kigogoEd.setIsbnBarcode("9789966011121");
 bookEditionRepository.save(kigogoEd);

 CharacterNode majoka = createCharacter("char_12_1", kigogo, "Majoka", "Antagonist");
 CharacterNode tunu = createCharacter("char_12_2", kigogo, "Tunu", "Protagonist");
 CharacterNode sudi = createCharacter("char_12_3", kigogo, "Sudi", "Protagonist");
 CharacterNode ashua = createCharacter("char_12_4", kigogo, "Ashua", "Supporting");
 CharacterNode kenga = createCharacter("char_12_5", kigogo, "Kenga", "Antagonist");
 CharacterNode ngurumo = createCharacter("char_12_6", kigogo, "Ngurumo", "Supporting");
 CharacterNode boza = createCharacter("char_12_7", kigogo, "Boza", "Supporting");
 CharacterNode mamapima = createCharacter("char_12_8", kigogo, "Mamapima", "Supporting");

 createRelationship("rel_12_1", tunu, majoka, "Adversary");
 createRelationship("rel_12_2", sudi, tunu, "Ally / Activist Partner");
 createRelationship("rel_12_3", kenga, majoka, "Ally / Enforcer");
 createRelationship("rel_12_4", kenga, sudi, "Adversary");
 createRelationship("rel_12_5", sudi, ashua, "Spouse");
 }

 // 7. Seed Book 13: Chozi la Heri (Assumpta K. Matei)
 if (!bookMasterRepository.existsById("book_13")) {
 BookMaster chozi = new BookMaster();
 chozi.setBookMasterId("book_13");
 chozi.setOriginalAuthor("Assumpta K. Matei");
 chozi.setOriginalReleaseYear(2018);
 chozi.setCalculatedAverageRating(4.6);
 chozi.setSynopsis("Set against the backdrop of Kenya's post-election ethnic violence, the novel follows siblings Umulkheri, Dick, and Mwaliko after they are torn apart from their family amid the chaos, each enduring hardship and hoping to be reunited. Interwoven with their story is Ridhaa's own journey through personal loss and grief. The narrative moves between tragedy and hope, ultimately tracing how broken families and a fractured community find healing and reconciliation.");
 chozi.setDnaComplexity(90);
 chozi.setDnaDarkness(85);
 chozi.setDnaPacing(75);
 chozi.setDnaRomance(35);
 chozi.setDnaWorldBuild(86);
 chozi.setCustomTags("#KiswahiliNovel, #PostElectionConflict, #FamilyReconciliation, #HopeAndHealing");
 chozi.setThematicElements("Ethnic Harmony, Dislocation & Healing, Loss & Redemption, Family Bonds");
 chozi = bookMasterRepository.save(chozi);

 BookEdition choziEd = new BookEdition();
 choziEd.setEditionId("edition_13_sw");
 choziEd.setBookMaster(chozi);
 choziEd.setLanguageTag("sw");
 choziEd.setTitle("Chozi la Heri");
 choziEd.setIsbnBarcode("9789966349811");
 bookEditionRepository.save(choziEd);

 CharacterNode ridhaa = createCharacter("char_13_1", chozi, "Ridhaa", "Protagonist");
 CharacterNode umu = createCharacter("char_13_2", chozi, "Umulkheri (Umu)", "Protagonist");
 CharacterNode dick = createCharacter("char_13_3", chozi, "Dick", "Supporting");
 CharacterNode mwaliko = createCharacter("char_13_4", chozi, "Mwaliko", "Supporting");
 CharacterNode lunga = createCharacter("char_13_5", chozi, "Lunga", "Supporting");
 CharacterNode neema = createCharacter("char_13_6", chozi, "Neema", "Supporting");
 CharacterNode chanda = createCharacter("char_13_7", chozi, "Chandachema", "Supporting");
 CharacterNode zohali = createCharacter("char_13_8", chozi, "Zohali", "Supporting");

 createRelationship("rel_13_1", umu, dick, "Family / Sibling");
 createRelationship("rel_13_2", umu, mwaliko, "Family / Sibling");
 createRelationship("rel_13_3", lunga, umu, "Family / Parent");
 createRelationship("rel_13_4", neema, mwaliko, "Family / Adoptive Parent");
 }

 // 8. Seed Book 14: The Pearl (John Steinbeck)
 if (!bookMasterRepository.existsById("book_14")) {
 BookMaster pearl = new BookMaster();
 pearl.setBookMasterId("book_14");
 pearl.setOriginalAuthor("John Steinbeck");
 pearl.setOriginalReleaseYear(1947);
 pearl.setCalculatedAverageRating(4.4);
 pearl.setSynopsis("In a poor fishing village near La Paz, Mexico, the pearl diver Kino lives simply and contentedly with his wife Juana and infant son Coyotito. When Coyotito is stung by a scorpion, Kino dives in desperate hope of finding a pearl valuable enough to pay for medical care, and discovers an enormous, extraordinary pearl. What first seems like the answer to the family's prayers instead draws out greed, violence, and betrayal from those around them, dragging the family toward devastating loss.");
 pearl.setDnaComplexity(84);
 pearl.setDnaDarkness(92);
 pearl.setDnaPacing(88);
 pearl.setDnaRomance(60);
 pearl.setDnaWorldBuild(75);
 pearl.setCustomTags("#NovellaParable, #GreedAndTragedy, #SteinbeckClassic, #ColonialExploitation");
 pearl.setThematicElements("Corrupting Influence of Wealth, Family Devotion, Human Greed, Illusion of Hope");
 pearl = bookMasterRepository.save(pearl);

 BookEdition pearlEd = new BookEdition();
 pearlEd.setEditionId("edition_14_en");
 pearlEd.setBookMaster(pearl);
 pearlEd.setLanguageTag("en");
 pearlEd.setTitle("The Pearl");
 pearlEd.setIsbnBarcode("9780140177374");
 bookEditionRepository.save(pearlEd);

 CharacterNode kino = createCharacter("char_14_1", pearl, "Kino", "Protagonist");
 CharacterNode juana = createCharacter("char_14_2", pearl, "Juana", "Supporting");
 CharacterNode coyotito = createCharacter("char_14_3", pearl, "Coyotito", "Supporting");
 CharacterNode doctor = createCharacter("char_14_4", pearl, "The Doctor", "Antagonist");
 CharacterNode dealers = createCharacter("char_14_5", pearl, "The Pearl Dealers", "Antagonist");
 CharacterNode trackers = createCharacter("char_14_6", pearl, "The Trackers", "Antagonist");

 createRelationship("rel_14_1", kino, juana, "Spouse / Family");
 createRelationship("rel_14_2", kino, coyotito, "Family / Parent");
 createRelationship("rel_14_3", kino, doctor, "Adversary");
 createRelationship("rel_14_4", kino, trackers, "Adversary");
 }

 // 9. Seed Telemetry
 createTelemetry("tel_1", user, gatsby, 4.5, "Reading", null, 120);
 createTelemetry("tel_2", user, dune, 4.8, "Completed", null, 800);
 createTelemetry("tel_3", user, orwell1984, 4.2, "DNF", "Too bleak and depressing to finish.", 150);

 // 10. Seed Sample Community Reviews
 if (bookReviewRepository.count() == 0) {
 BookMaster blossoms = bookMasterRepository.findById("book_11").orElse(null);
 if (blossoms != null) {
 createReview("rev_11_1", blossoms, "Faith Wanjiku", "Comparative Literature", 5.0,
 "Masterpiece on resilience & female autonomy",
 "Ole Kulet masterfully weaves Maasai tradition with the internal struggles of Resian and Taiyo. Resian's courage against forced marriage is inspiring.", 14);
 createReview("rev_11_2", blossoms, "David Kiptoo", "African Studies", 4.5,
 "Crucial KCSE set text with rich cultural themes",
 "The contrast between urban Nakuru and rural Nasila highlights the tension between modernity and cultural expectations.", 8);
 }

 BookMaster kigogo = bookMasterRepository.findById("book_12").orElse(null);
 if (kigogo != null) {
 createReview("rev_12_1", kigogo, "Amani Juma", "Swahili & Drama", 5.0,
 "Tahakiki kabambe ya uongozi na haki za wananchi",
 "Tamthilia hii inafichua uwazi uozo wa uongozi wa Majoka katika jimbo la Sagamoyo. Mhusika Tunu anaonyesha ujasiri mkubwa wa kutafuta haki.", 19);
 createReview("rev_12_2", kigogo, "Mercy Nyambura", "Political Science", 4.8,
 "Powerful allegory for governance in modern Africa",
 "Pauline Kea uses satire effectively. Sudi and Tunu's resistance movements show the power of peaceful civic action.", 11);
 }

 BookMaster chozi = bookMasterRepository.findById("book_13").orElse(null);
 if (chozi != null) {
 createReview("rev_13_1", chozi, "Hassan Mwangi", "Kiswahili Literature", 5.0,
 "Riwaya yenye hisia kali za matumaini na utengano",
 "Safari ya Umulkheri, Dick, na Mwaliko inagusa moyo sana. Mwandishi Assumpta Matei anafundisha umuhimu wa msamaha na amani.", 16);
 }

 BookMaster pearl = bookMasterRepository.findById("book_14").orElse(null);
 if (pearl != null) {
 createReview("rev_14_1", pearl, "Daniel Vance", "Classic Fiction", 4.5,
 "A haunting parable about wealth and human desire",
 "Steinbeck's prose in The Pearl is concise yet profound. Kino's descent from hope to tragedy illustrates how greed distorts pure intentions.", 12);
 }

 if (gatsby != null) {
 createReview("rev_1_1", gatsby, "Alice Reader", "Comparative Literature", 5.0,
 "Unmatched critique of the Jazz Age American Dream",
 "The atmospheric symbolism of the green light and the eyes of Dr. T.J. Eckleburg makes Gatsby an timeless masterpiece.", 24);
 }
 }
 }

 private void seedSampleCollections() {
 Optional<BookMaster> gatsbyOpt = bookMasterRepository.findById("book_1");
 Optional<BookMaster> duneOpt = bookMasterRepository.findById("book_2");
 Optional<BookMaster> orwellOpt = bookMasterRepository.findById("book_3");

 // 1. Course & Curriculum Set
 BookSet courseSet = new BookSet();
 courseSet.setName("CLT 301: East African & World Fiction");
 courseSet.setDescription("Core syllabus module examining modernist narratives, dystopian sociopolitics, and colonial themes.");
 courseSet.setIcon("");
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
 langSet.setIcon("");
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
 psychoPreset.setIcon("");
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
 tagSet.setIcon("");
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
 sharedList.setIcon("");
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

 private BookReview createReview(String id, BookMaster book, String name, String stream, Double rating, String title, String text, Integer helpful) {
 BookReview rev = new BookReview();
 rev.setReviewId(id);
 rev.setBookMaster(book);
 rev.setReviewerName(name);
 rev.setReviewerStream(stream);
 rev.setRating(rating);
 rev.setReviewTitle(title);
 rev.setReviewText(text);
 rev.setHelpfulCount(helpful);
 rev.setCreatedAt(LocalDateTime.now().minusDays((long) (Math.random() * 5 + 1)));
 return bookReviewRepository.save(rev);
 }
}
