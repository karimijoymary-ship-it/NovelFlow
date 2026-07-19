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

    public BookController(BookMasterRepository bookMasterRepository,
            BookEditionRepository bookEditionRepository,
            ReadingTelemetryRepository readingTelemetryRepository,
            UserRepository userRepository,
            RestTemplate restTemplate,
            CharacterExtractorService characterExtractorService) {
        this.bookMasterRepository = bookMasterRepository;
        this.bookEditionRepository = bookEditionRepository;
        this.readingTelemetryRepository = readingTelemetryRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.characterExtractorService = characterExtractorService;
    }

    @GetMapping
    public List<BookMaster> getAllBooks() {
        return bookMasterRepository.findAll();
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
        } catch (Exception ex) {
            System.err.println("Error calling OpenLibrary API fallback: " + ex.getMessage());
            ex.printStackTrace();
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

    @PostMapping("/{id}/telemetry")
    public ResponseEntity<BookMaster> saveTelemetry(@PathVariable String id, @RequestBody TelemetryRequest request) {
        String userId = request.getUserId();
        if (userId == null || userId.isEmpty()) {
            userId = "user_1";
        }

        Optional<BookMaster> bookOpt = bookMasterRepository.findById(id);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BookMaster book = bookOpt.get();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
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
}