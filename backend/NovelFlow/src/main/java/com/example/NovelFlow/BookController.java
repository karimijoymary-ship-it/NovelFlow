package com.example.NovelFlow;

import com.example.NovelFlow.entities.*;
import com.example.NovelFlow.repositories.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    private final BookMasterRepository bookMasterRepository;
    private final BookEditionRepository bookEditionRepository;
    private final ReadingTelemetryRepository readingTelemetryRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final CharacterExtractorService characterExtractorService;
    private final CharacterNodeRepository characterNodeRepository;
    private final BookReviewRepository bookReviewRepository;

    public BookController(BookMasterRepository bookMasterRepository,
            BookEditionRepository bookEditionRepository,
            ReadingTelemetryRepository readingTelemetryRepository,
            UserRepository userRepository,
            RestTemplate restTemplate,
            CharacterExtractorService characterExtractorService,
            CharacterNodeRepository characterNodeRepository,
            BookReviewRepository bookReviewRepository) {
        this.bookMasterRepository = bookMasterRepository;
        this.bookEditionRepository = bookEditionRepository;
        this.readingTelemetryRepository = readingTelemetryRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.characterExtractorService = characterExtractorService;
        this.characterNodeRepository = characterNodeRepository;
        this.bookReviewRepository = bookReviewRepository;
    }

    @GetMapping
    public List<BookMaster> getAllBooks() {
        return bookMasterRepository.findAll();
    }

    @GetMapping("/user-library")
    public List<ReadingTelemetry> getUserLibrary(@RequestParam String userId) {
        return readingTelemetryRepository.findByUserUserId(userId);
    }

    @GetMapping("/search")
    @Transactional
    public List<BookMaster> searchBooks(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return bookMasterRepository.findAll();
        }

        String trimmedQuery = query.trim();
        List<BookMaster> localResults = bookMasterRepository.searchLocal(trimmedQuery);
        if (!localResults.isEmpty()) {
            return localResults;
        }

        Set<String> processedEditions = new HashSet<>();
        Set<String> processedIsbns = new HashSet<>();

        // Cache miss: call Google Books API with OpenLibrary fallback
        boolean googleSuccess = false;
        try {
            String encodedQuery = URLEncoder.encode(trimmedQuery, StandardCharsets.UTF_8);
            String url = "https://www.googleapis.com/books/v1/volumes?q=" + encodedQuery + "&maxResults=10";

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("items")) {
                List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
                if (items != null && !items.isEmpty()) {
                    for (Map<String, Object> item : items) {
                        String volumeId = (String) item.get("id");
                        if (volumeId == null || volumeId.isEmpty()) {
                            continue;
                        }
                        volumeId = volumeId.trim().toLowerCase();

                        Map<String, Object> volumeInfo = (Map<String, Object>) item.get("volumeInfo");
                        if (volumeInfo == null) {
                            continue;
                        }

                        String title = (String) volumeInfo.getOrDefault("title", "Untitled");

                        // Authors list mapping
                        String author = "Unknown Author";
                        if (volumeInfo.containsKey("authors")) {
                            List<String> authorsNode = (List<String>) volumeInfo.get("authors");
                            if (authorsNode != null && !authorsNode.isEmpty()) {
                                author = String.join(", ", authorsNode);
                            }
                        }

                        // Release Year parsing
                        Integer releaseYear = 0;
                        Object pubDateObj = volumeInfo.get("publishedDate");
                        String pubDate = pubDateObj != null ? pubDateObj.toString() : "";
                        if (pubDate.length() >= 4) {
                            try {
                                releaseYear = Integer.parseInt(pubDate.substring(0, 4));
                            } catch (NumberFormatException ignored) {
                            }
                        }

                        // ISBN extraction
                        String isbn = null;
                        if (volumeInfo.containsKey("industryIdentifiers")) {
                            List<Map<String, Object>> identifiers = (List<Map<String, Object>>) volumeInfo
                                    .get("industryIdentifiers");
                            if (identifiers != null) {
                                for (Map<String, Object> ident : identifiers) {
                                    String type = (String) ident.get("type");
                                    if ("ISBN_13".equals(type)) {
                                        isbn = (String) ident.get("identifier");
                                    } else if ("ISBN_10".equals(type) && isbn == null) {
                                        isbn = (String) ident.get("identifier");
                                    }
                                }
                            }
                        }

                        // Fallback to avoid nullable/unique constraints on isbn_barcode
                        if (isbn == null || isbn.trim().isEmpty()) {
                            int hashCode = Math.abs(volumeId.hashCode());
                            isbn = String.format("999%010d", hashCode);
                        }
                        isbn = isbn.replaceAll("[^0-9]", "");
                        if (isbn.length() > 13) {
                            isbn = isbn.substring(0, 13);
                        } else if (isbn.length() < 13) {
                            isbn = String.format("%-13s", isbn).replace(' ', '0');
                        }

                        // Language Tag parsing
                        Object langObj = volumeInfo.get("language");
                        String lang = langObj != null ? langObj.toString() : "en";
                        if (lang.length() > 10) {
                            lang = lang.substring(0, 10);
                        }

                        String editionId = "edition_" + volumeId;
                        if (editionId.length() > 50) {
                            editionId = editionId.substring(0, 50);
                        }

                        // Deduplication: in-memory check
                        if (processedEditions.contains(editionId) || processedIsbns.contains(isbn)) {
                            continue;
                        }

                        // Deduplication: database check
                        if (bookEditionRepository.existsById(editionId)
                                || bookEditionRepository.findByIsbnBarcode(isbn).isPresent()) {
                            continue;
                        }

                        processedEditions.add(editionId);
                        processedIsbns.add(isbn);

                        // Check if BookMaster exists, otherwise create
                        String masterId = "google_" + volumeId;
                        if (masterId.length() > 50) {
                            masterId = masterId.substring(0, 50);
                        }
                        final String finalMasterId = masterId;
                        final String finalAuthor = author;
                        final Integer finalReleaseYear = releaseYear;

                        Object descObj = volumeInfo.get("description");
                        final String finalSynopsis = descObj != null ? descObj.toString() : "";

                        BookMaster master = bookMasterRepository.findById(finalMasterId).orElseGet(() -> {
                            BookMaster bm = new BookMaster();
                            bm.setBookMasterId(finalMasterId);
                            bm.setOriginalAuthor(
                                    finalAuthor.length() > 100 ? finalAuthor.substring(0, 100) : finalAuthor);
                            bm.setOriginalReleaseYear(finalReleaseYear);
                            bm.setCalculatedAverageRating(0.0);
                            bm.setSynopsis(finalSynopsis);
                            BookMaster savedBm = bookMasterRepository.save(bm);
                            if (!finalSynopsis.trim().isEmpty()) {
                                characterExtractorService.extractAndSaveCharacters(savedBm, finalSynopsis);
                            }
                            return savedBm;
                        });

                        // Save new BookEdition
                        BookEdition edition = new BookEdition();
                        edition.setEditionId(editionId);
                        edition.setBookMaster(master);
                        edition.setLanguageTag(lang);
                        edition.setTitle(title.length() > 255 ? title.substring(0, 255) : title);
                        edition.setIsbnBarcode(isbn);
                        edition = bookEditionRepository.save(edition);

                        // Synchronize bidirectional relationship
                        if (master.getEditions() == null) {
                            master.setEditions(new ArrayList<>());
                        }
                        if (!master.getEditions().contains(edition)) {
                            master.getEditions().add(edition);
                        }
                    }
                    googleSuccess = true;
                }
            }
        } catch (Exception e) {
            System.err.println("Google Books API call failed or rate-limited. Falling back to OpenLibrary API. Error: "
                    + e.getMessage());
        }

        if (!googleSuccess) {
            System.out.println("Executing OpenLibrary API fallback search for query: " + trimmedQuery);
            fetchFromOpenLibrary(trimmedQuery, processedEditions, processedIsbns);
        }

        List<BookMaster> currentResults = bookMasterRepository.searchLocal(trimmedQuery);
        if (currentResults.isEmpty()) {
            System.out.println("Executing Handmade API fallback search for query: " + trimmedQuery);
            fetchFromHandmadeApi(trimmedQuery, processedEditions, processedIsbns);
        }

        // Re-query local database after fetching and saving items from API(s)
        return bookMasterRepository.searchLocal(trimmedQuery);
    }

    private void fetchFromOpenLibrary(String query, Set<String> processedEditions, Set<String> processedIsbns) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://openlibrary.org/search.json?q=" + encodedQuery + "&limit=10";

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("docs")) {
                List<Map<String, Object>> docs = (List<Map<String, Object>>) body.get("docs");
                if (docs != null) {
                    for (Map<String, Object> doc : docs) {
                        String key = (String) doc.get("key"); // e.g. "/works/OL27479W"
                        if (key == null || key.isEmpty()) {
                            continue;
                        }
                        String workId = key.replace("/works/", "").replace("/", "_").trim().toLowerCase();

                        String title = (String) doc.getOrDefault("title", "Untitled");

                        // Authors list mapping
                        String author = "Unknown Author";
                        if (doc.containsKey("author_name")) {
                            List<String> authorsNode = (List<String>) doc.get("author_name");
                            if (authorsNode != null && !authorsNode.isEmpty()) {
                                author = String.join(", ", authorsNode);
                            }
                        }

                        // Release year parsing
                        Integer releaseYear = 0;
                        Object publishYearObj = doc.get("first_publish_year");
                        if (publishYearObj instanceof Number) {
                            releaseYear = ((Number) publishYearObj).intValue();
                        } else if (publishYearObj != null) {
                            try {
                                releaseYear = Integer.parseInt(publishYearObj.toString());
                            } catch (NumberFormatException ignored) {
                            }
                        }

                        // ISBN extraction
                        String isbn = null;
                        if (doc.containsKey("isbn")) {
                            List<String> isbnList = (List<String>) doc.get("isbn");
                            if (isbnList != null) {
                                for (String itemIsbn : isbnList) {
                                    if (itemIsbn != null && itemIsbn.replaceAll("[^0-9]", "").length() >= 10) {
                                        isbn = itemIsbn;
                                        break;
                                    }
                                }
                            }
                        }

                        // Fallback ISBN barcode
                        if (isbn == null || isbn.trim().isEmpty()) {
                            int hashCode = Math.abs(workId.hashCode());
                            isbn = String.format("999%010d", hashCode);
                        }
                        isbn = isbn.replaceAll("[^0-9]", "");
                        if (isbn.length() > 13) {
                            isbn = isbn.substring(0, 13);
                        } else if (isbn.length() < 13) {
                            isbn = String.format("%-13s", isbn).replace(' ', '0');
                        }

                        // Language parsing
                        String lang = "en";
                        if (doc.containsKey("language")) {
                            List<String> languages = (List<String>) doc.get("language");
                            if (languages != null && !languages.isEmpty()) {
                                String rawLang = languages.get(0);
                                if (rawLang.length() >= 2) {
                                    lang = rawLang.substring(0, 2);
                                }
                            }
                        }

                        String editionId = "edition_ol_" + workId;
                        if (editionId.length() > 50) {
                            editionId = editionId.substring(0, 50);
                        }

                        // Deduplication: in-memory check
                        if (processedEditions.contains(editionId) || processedIsbns.contains(isbn)) {
                            continue;
                        }

                        // Deduplication: database check
                        if (bookEditionRepository.existsById(editionId)
                                || bookEditionRepository.findByIsbnBarcode(isbn).isPresent()) {
                            continue;
                        }

                        processedEditions.add(editionId);
                        processedIsbns.add(isbn);

                        // Check if BookMaster exists, otherwise create
                        String masterId = "openlib_" + workId;
                        if (masterId.length() > 50) {
                            masterId = masterId.substring(0, 50);
                        }
                        final String finalMasterId = masterId;
                        final String finalAuthor = author;
                        final Integer finalReleaseYear = releaseYear;

                        String synopsis = "";
                        if (doc.containsKey("description")) {
                            Object desc = doc.get("description");
                            if (desc instanceof String) {
                                synopsis = (String) desc;
                            } else if (desc instanceof Map) {
                                synopsis = (String) ((Map<?, ?>) desc).get("value");
                            }
                        } else if (doc.containsKey("first_sentence")) {
                            List<String> firstSentences = (List<String>) doc.get("first_sentence");
                            if (firstSentences != null && !firstSentences.isEmpty()) {
                                synopsis = String.join(" ", firstSentences);
                            }
                        }

                        if (synopsis.trim().isEmpty()) {
                            try {
                                String workKey = (String) doc.get("key");
                                if (workKey != null && !workKey.isEmpty()) {
                                    String detailsUrl = "https://openlibrary.org" + workKey + ".json";
                                    Map<?, ?> details = restTemplate.getForObject(detailsUrl, Map.class);
                                    if (details != null && details.containsKey("description")) {
                                        Object desc = details.get("description");
                                        if (desc instanceof String) {
                                            synopsis = (String) desc;
                                        } else if (desc instanceof Map) {
                                            synopsis = (String) ((Map<?, ?>) desc).get("value");
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                System.err.println("Failed to fetch detailed work description: " + e.getMessage());
                            }
                        }
                        final String finalSynopsis = synopsis;

                        BookMaster master = bookMasterRepository.findById(finalMasterId).orElseGet(() -> {
                            BookMaster bm = new BookMaster();
                            bm.setBookMasterId(finalMasterId);
                            bm.setOriginalAuthor(
                                    finalAuthor.length() > 100 ? finalAuthor.substring(0, 100) : finalAuthor);
                            bm.setOriginalReleaseYear(finalReleaseYear);
                            bm.setCalculatedAverageRating(0.0);
                            bm.setSynopsis(finalSynopsis);
                            BookMaster savedBm = bookMasterRepository.save(bm);
                            if (!finalSynopsis.trim().isEmpty()) {
                                characterExtractorService.extractAndSaveCharacters(savedBm, finalSynopsis);
                            }
                            return savedBm;
                        });

                        // Save new BookEdition
                        BookEdition edition = new BookEdition();
                        edition.setEditionId(editionId);
                        edition.setBookMaster(master);
                        edition.setLanguageTag(lang);
                        edition.setTitle(title.length() > 255 ? title.substring(0, 255) : title);
                        edition.setIsbnBarcode(isbn);
                        edition = bookEditionRepository.save(edition);

                        // Synchronize bidirectional relationship
                        if (master.getEditions() == null) {
                            master.setEditions(new ArrayList<>());
                        }
                        if (!master.getEditions().contains(edition)) {
                            master.getEditions().add(edition);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("OpenLibrary Fallback Logic execution failed: " + e.getMessage());
        }
    }

    private void fetchFromHandmadeApi(String query, Set<String> processedEditions, Set<String> processedIsbns) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("handmade_fallback.json").getInputStream();
            List<HandmadeBookDto> handmadeBooks = mapper.readValue(is, new TypeReference<List<HandmadeBookDto>>() {});

            String lowercaseQuery = query.toLowerCase();

            for (HandmadeBookDto dto : handmadeBooks) {
                if (dto.getTitle().toLowerCase().contains(lowercaseQuery) || dto.getAuthor().toLowerCase().contains(lowercaseQuery)) {
                    String editionId = "handmade_ed_" + dto.getId();
                    String masterId = "handmade_" + dto.getId();
                    
                    if (processedEditions.contains(editionId) || bookEditionRepository.existsById(editionId)) {
                        continue;
                    }

                    processedEditions.add(editionId);

                    BookMaster master = bookMasterRepository.findById(masterId).orElseGet(() -> {
                        BookMaster bm = new BookMaster();
                        bm.setBookMasterId(masterId);
                        bm.setOriginalAuthor(dto.getAuthor());
                        bm.setOriginalReleaseYear(dto.getPublishedYear());
                        bm.setCalculatedAverageRating(0.0);
                        bm.setSynopsis(dto.getSynopsis());
                        
                        // Parse country and genre straight into the tags engine
                        String customTags = dto.getCountry() + ", " + dto.getGenre();
                        bm.setCustomTags(customTags);
                        
                        BookMaster savedBm = bookMasterRepository.save(bm);
                        
                        if (dto.getCharacters() != null && !dto.getCharacters().isEmpty()) {
                            List<CharacterNode> extractedChars = new ArrayList<>();
                            for (HandmadeBookDto.HandmadeCharacterDto cDto : dto.getCharacters()) {
                                CharacterNode cNode = new CharacterNode();
                                cNode.setCharacterId("hm_char_" + UUID.randomUUID().toString().substring(0, 8));
                                cNode.setBookMaster(savedBm);
                                cNode.setCharacterName(cDto.getName());
                                cNode.setThematicArchetype(cDto.getRole());
                                cNode.setSource("HNNDMADE_API");
                                extractedChars.add(cNode);
                            }
                            characterNodeRepository.saveAll(extractedChars);
                        }
                        
                        return savedBm;
                    });

                    BookEdition edition = new BookEdition();
                    edition.setEditionId(editionId);
                    edition.setBookMaster(master);
                    edition.setLanguageTag("en");
                    edition.setTitle(dto.getTitle());
                    edition.setIsbnBarcode("AUTO_HM_" + dto.getId());
                    edition = bookEditionRepository.save(edition);

                    if (master.getEditions() == null) {
                        master.setEditions(new ArrayList<>());
                    }
                    if (!master.getEditions().contains(edition)) {
                        master.getEditions().add(edition);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Handmade API Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookMaster> getBookById(@PathVariable String id) {
        return bookMasterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/editions")
    public List<BookEdition> getEditions(@PathVariable String id) {
        return bookEditionRepository.findByBookMasterBookMasterId(id);
    }

    @GetMapping("/{id}/telemetry")
    public ResponseEntity<ReadingTelemetry> getTelemetry(@PathVariable String id,
            @RequestParam(defaultValue = "user_1") String userId) {
        Optional<ReadingTelemetry> telemetry = readingTelemetryRepository.findByBookMasterBookMasterIdAndUserUserId(id,
                userId);
        return telemetry.map(ResponseEntity::ok)
                .orElseGet(() -> {
                    ReadingTelemetry defaultTelemetry = new ReadingTelemetry();
                    defaultTelemetry.setReadingStatus("Reading");
                    defaultTelemetry.setPagesCompleted(0);
                    defaultTelemetry.setFractionalRating(0.0);
                    return ResponseEntity.ok(defaultTelemetry);
                });
    }

    @GetMapping("/unverified")
    public ResponseEntity<List<BookMaster>> getUnverifiedBooks() {
        List<BookMaster> allBooks = bookMasterRepository.findAll();
        List<BookMaster> unverified = new ArrayList<>();
        for (BookMaster book : allBooks) {
            if (book.getIsVerified() != null && !book.getIsVerified()) {
                unverified.add(book);
            }
        }
        return ResponseEntity.ok(unverified);
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<BookMaster> verifyBook(@PathVariable String id) {
        Optional<BookMaster> opt = bookMasterRepository.findById(id);
        if (opt.isPresent()) {
            BookMaster bm = opt.get();
            bm.setIsVerified(true);
            return ResponseEntity.ok(bookMasterRepository.save(bm));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/manual")
    public ResponseEntity<BookMaster> saveManualBook(@RequestBody ManualBookRequest request) {
        String uuid = UUID.randomUUID().toString();
        String masterId = "manual_" + uuid;

        BookMaster bm = new BookMaster();
        bm.setBookMasterId(masterId);
        bm.setOriginalAuthor(request.getAuthor() != null && !request.getAuthor().trim().isEmpty() ? request.getAuthor()
                : "Unknown Author");
        bm.setOriginalReleaseYear(request.getReleaseYear());
        bm.setCalculatedAverageRating(0.0);
        bm.setSynopsis(request.getSynopsis() != null ? request.getSynopsis() : "");
        bm.setIsVerified(false);
        BookMaster savedBm = bookMasterRepository.save(bm);

        if (savedBm.getSynopsis() != null && !savedBm.getSynopsis().trim().isEmpty()) {
            characterExtractorService.extractAndSaveCharacters(savedBm, savedBm.getSynopsis());
        }

        BookEdition edition = new BookEdition();
        edition.setEditionId("edition_manual_" + uuid);
        edition.setBookMaster(savedBm);
        edition.setLanguageTag(request.getLanguageTag() != null && !request.getLanguageTag().trim().isEmpty()
                ? request.getLanguageTag()
                : "en");
        edition.setTitle(
                request.getTitle() != null && !request.getTitle().trim().isEmpty() ? request.getTitle() : "Untitled");

        String isbn = request.getIsbnBarcode();
        if (isbn == null || isbn.trim().isEmpty()) {
            int hashCode = Math.abs(uuid.hashCode());
            isbn = String.format("999%010d", hashCode);
            if (isbn.length() > 13)
                isbn = isbn.substring(0, 13);
        }
        edition.setIsbnBarcode(isbn);

        edition = bookEditionRepository.save(edition);

        List<BookEdition> editions = new ArrayList<>();
        editions.add(edition);
        savedBm.setEditions(editions);

        return ResponseEntity.ok(savedBm);
    }

    @PostMapping("/{id}/telemetry")
    public ResponseEntity<BookMaster> saveTelemetry(@PathVariable String id, @RequestBody TelemetryRequest request) {
        String userId = request.getUserId();
        if (userId == null || userId.isEmpty()) {
            userId = "user_1";
        }

        Optional<BookMaster> bookOpt = bookMasterRepository.findById(id);
        if (bookOpt.isEmpty()) {
            System.err.println("saveTelemetry FAILED: Book not found for id: " + id);
            return ResponseEntity.notFound().build();
        }
        BookMaster book = bookOpt.get();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            System.err.println("saveTelemetry: User not found for userId: " + userId + ". Auto-recovering session...");
            User recoveredUser = new User();
            recoveredUser.setUserId(userId);
            recoveredUser.setFullName("Recovered Session");
            recoveredUser.setEmail(userId + "@recovered.local");
            recoveredUser.setAcademicStream("Recovered");
            recoveredUser.setPasswordHash("recovered");
            userRepository.save(recoveredUser);
            userOpt = Optional.of(recoveredUser);
        }
        User user = userOpt.get();

        Optional<ReadingTelemetry> telemetryOpt = readingTelemetryRepository
                .findByBookMasterBookMasterIdAndUserUserId(id, userId);
        ReadingTelemetry telemetry = telemetryOpt.orElseGet(() -> {
            ReadingTelemetry t = new ReadingTelemetry();
            t.setTelemetryId(UUID.randomUUID().toString());
            t.setBookMaster(book);
            t.setUser(user);
            return t;
        });

        telemetry.setReadingStatus(request.getReadingStatus());
        telemetry.setPagesCompleted(request.getPagesCompleted());
        telemetry.setFractionalRating(request.getFractionalRating());
        telemetry.setDnfReason(request.getDnfReason());
        telemetry.setSyncedAt(LocalDateTime.now());

        readingTelemetryRepository.save(telemetry);

        List<ReadingTelemetry> allTelemetryForBook = readingTelemetryRepository.findByBookMasterBookMasterId(id);
        double sum = 0.0;
        int count = 0;
        for (ReadingTelemetry t : allTelemetryForBook) {
            if (t.getFractionalRating() != null && t.getFractionalRating() > 0) {
                sum += t.getFractionalRating();
                count++;
            }
        }

        if (count > 0) {
            double rawAvg = sum / count;
            double roundedAvg = Math.round(rawAvg * 100.0) / 100.0;
            book.setCalculatedAverageRating(roundedAvg);
        } else {
            book.setCalculatedAverageRating(0.0);
        }

        bookMasterRepository.save(book);
        return ResponseEntity.ok(book);
    }

    @PutMapping("/{bookId}/dna")
    @Transactional
    public ResponseEntity<BookMaster> updateBookDna(@PathVariable String bookId, @RequestBody DnaUpdateRequest request) {
        Optional<BookMaster> bookOpt = bookMasterRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BookMaster book = bookOpt.get();
        if (request.getDnaComplexity() != null) book.setDnaComplexity(request.getDnaComplexity());
        if (request.getDnaRomance() != null) book.setDnaRomance(request.getDnaRomance());
        if (request.getDnaDarkness() != null) book.setDnaDarkness(request.getDnaDarkness());
        if (request.getDnaHumor() != null) book.setDnaHumor(request.getDnaHumor());
        if (request.getDnaPacing() != null) book.setDnaPacing(request.getDnaPacing());
        if (request.getDnaWorldBuild() != null) book.setDnaWorldBuild(request.getDnaWorldBuild());
        if (request.getCustomTags() != null) book.setCustomTags(request.getCustomTags());
        if (request.getThematicElements() != null) book.setThematicElements(request.getThematicElements());
        if (request.getCustomThemeScores() != null) book.setCustomThemeScores(request.getCustomThemeScores());

        bookMasterRepository.save(book);
        return ResponseEntity.ok(book);
    }

    public static class TelemetryRequest {
        private String userId;
        private String readingStatus;
        private Integer pagesCompleted;
        private Double fractionalRating;
        private String dnfReason;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getReadingStatus() {
            return readingStatus;
        }

        public void setReadingStatus(String readingStatus) {
            this.readingStatus = readingStatus;
        }

        public Integer getPagesCompleted() {
            return pagesCompleted;
        }

        public void setPagesCompleted(Integer pagesCompleted) {
            this.pagesCompleted = pagesCompleted;
        }

        public Double getFractionalRating() {
            return fractionalRating;
        }

        public void setFractionalRating(Double fractionalRating) {
            this.fractionalRating = fractionalRating;
        }

        public String getDnfReason() {
            return dnfReason;
        }

        public void setDnfReason(String dnfReason) {
            this.dnfReason = dnfReason;
        }
    }

    public static class ManualBookRequest {
        private String title;
        private String author;
        private Integer releaseYear;
        private String languageTag;
        private String isbnBarcode;
        private String synopsis;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getAuthor() {
            return author;
        }

        public void setAuthor(String author) {
            this.author = author;
        }

        public Integer getReleaseYear() {
            return releaseYear;
        }

        public void setReleaseYear(Integer releaseYear) {
            this.releaseYear = releaseYear;
        }

        public String getLanguageTag() {
            return languageTag;
        }

        public void setLanguageTag(String languageTag) {
            this.languageTag = languageTag;
        }

        public String getIsbnBarcode() {
            return isbnBarcode;
        }

        public void setIsbnBarcode(String isbnBarcode) {
            this.isbnBarcode = isbnBarcode;
        }

        public String getSynopsis() {
            return synopsis;
        }

        public void setSynopsis(String synopsis) {
            this.synopsis = synopsis;
        }
    }

    public static class DnaUpdateRequest {
        private Integer dnaComplexity;
        private Integer dnaRomance;
        private Integer dnaDarkness;
        private Integer dnaHumor;
        private Integer dnaPacing;
        private Integer dnaWorldBuild;
        private String customTags;
        private String thematicElements;
        private String customThemeScores;

        public Integer getDnaComplexity() { return dnaComplexity; }
        public void setDnaComplexity(Integer dnaComplexity) { this.dnaComplexity = dnaComplexity; }

        public Integer getDnaRomance() { return dnaRomance; }
        public void setDnaRomance(Integer dnaRomance) { this.dnaRomance = dnaRomance; }

        public Integer getDnaDarkness() { return dnaDarkness; }
        public void setDnaDarkness(Integer dnaDarkness) { this.dnaDarkness = dnaDarkness; }

        public Integer getDnaHumor() { return dnaHumor; }
        public void setDnaHumor(Integer dnaHumor) { this.dnaHumor = dnaHumor; }

        public Integer getDnaPacing() { return dnaPacing; }
        public void setDnaPacing(Integer dnaPacing) { this.dnaPacing = dnaPacing; }

        public Integer getDnaWorldBuild() { return dnaWorldBuild; }
        public void setDnaWorldBuild(Integer dnaWorldBuild) { this.dnaWorldBuild = dnaWorldBuild; }

        public String getCustomTags() { return customTags; }
        public void setCustomTags(String customTags) { this.customTags = customTags; }

        public String getThematicElements() { return thematicElements; }
        public void setThematicElements(String thematicElements) { this.thematicElements = thematicElements; }

        public String getCustomThemeScores() { return customThemeScores; }
        public void setCustomThemeScores(String customThemeScores) { this.customThemeScores = customThemeScores; }
    }

    public static class HandmadeBookDto {
        private int id;
        private String title;
        private String author;
        private String country;
        private String genre;
        private int publishedYear;
        private String synopsis;
        private List<HandmadeCharacterDto> characters;

        // Getters and Setter
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public String getGenre() { return genre; }
        public void setGenre(String genre) { this.genre = genre; }
        public int getPublishedYear() { return publishedYear; }
        public void setPublishedYear(int publishedYear) { this.publishedYear = publishedYear; }
        public String getSynopsis() { return synopsis; }
        public void setSynopsis(String synopsis) { this.synopsis = synopsis; }
        public List<HandmadeCharacterDto> getCharacters() { return characters; }
        public void setCharacters(List<HandmadeCharacterDto> characters) { this.characters = characters; }

        public static class HandmadeCharacterDto {
            private String name;
            private String role;
            private String description;

            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public String getRole() { return role; }
            public void setRole(String role) { this.role = role; }
            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }
        }
    }

    // ----------------------------------------------------
    // COMMUNITY REVIEWS & RATINGS ENDPOINTS
    // ----------------------------------------------------

    @GetMapping("/{bookId}/reviews")
    public ResponseEntity<List<BookReview>> getBookReviews(@PathVariable String bookId) {
        List<BookReview> reviews = bookReviewRepository.findByBookMasterBookMasterIdOrderByCreatedAtDesc(bookId);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping("/{bookId}/reviews")
    @Transactional
    public ResponseEntity<?> addBookReview(@PathVariable String bookId, @RequestBody ReviewRequest request) {
        Optional<BookMaster> bookOpt = bookMasterRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BookMaster book = bookOpt.get();

        BookReview review = new BookReview();
        review.setReviewId(UUID.randomUUID().toString());
        review.setBookMaster(book);
        review.setReviewerName(request.getReviewerName() != null && !request.getReviewerName().isBlank() ? request.getReviewerName() : "Anonymous Reader");
        review.setReviewerStream(request.getReviewerStream() != null && !request.getReviewerStream().isBlank() ? request.getReviewerStream() : "General Literature");
        review.setRating(request.getRating() != null ? Math.min(5.0, Math.max(1.0, request.getRating())) : 5.0);
        review.setReviewTitle(request.getReviewTitle() != null ? request.getReviewTitle() : "Community Review");
        review.setReviewText(request.getReviewText() != null ? request.getReviewText() : "");
        review.setHelpfulCount(0);
        review.setCreatedAt(LocalDateTime.now());

        BookReview savedReview = bookReviewRepository.save(review);

        // Recalculate average rating for the book
        List<BookReview> allReviews = bookReviewRepository.findByBookMasterBookMasterId(bookId);
        if (!allReviews.isEmpty()) {
            double avg = allReviews.stream().mapToDouble(BookReview::getRating).average().orElse(book.getCalculatedAverageRating());
            book.setCalculatedAverageRating(Math.round(avg * 10.0) / 10.0);
            bookMasterRepository.save(book);
        }

        return ResponseEntity.ok(savedReview);
    }

    @PutMapping("/reviews/{reviewId}/helpful")
    public ResponseEntity<?> markReviewHelpful(@PathVariable String reviewId) {
        Optional<BookReview> reviewOpt = bookReviewRepository.findById(reviewId);
        if (reviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BookReview review = reviewOpt.get();
        review.setHelpfulCount(review.getHelpfulCount() + 1);
        bookReviewRepository.save(review);
        return ResponseEntity.ok(review);
    }

    public static class ReviewRequest {
        private String reviewerName;
        private String reviewerStream;
        private Double rating;
        private String reviewTitle;
        private String reviewText;

        public String getReviewerName() { return reviewerName; }
        public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

        public String getReviewerStream() { return reviewerStream; }
        public void setReviewerStream(String reviewerStream) { this.reviewerStream = reviewerStream; }

        public Double getRating() { return rating; }
        public void setRating(Double rating) { this.rating = rating; }

        public String getReviewTitle() { return reviewTitle; }
        public void setReviewTitle(String reviewTitle) { this.reviewTitle = reviewTitle; }

        public String getReviewText() { return reviewText; }
        public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    }
}