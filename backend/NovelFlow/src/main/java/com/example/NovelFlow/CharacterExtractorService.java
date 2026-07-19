package com.example.NovelFlow;

import com.example.NovelFlow.entities.BookMaster;
import com.example.NovelFlow.entities.CharacterNode;
import com.example.NovelFlow.repositories.CharacterNodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CharacterExtractorService {

    private final CharacterNodeRepository characterNodeRepository;

    public CharacterExtractorService(CharacterNodeRepository characterNodeRepository) {
        this.characterNodeRepository = characterNodeRepository;
    }

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
            "The", "In", "On", "A", "He", "She", "It", "They", "But", "This", "When", "Although", "While", "At",
            "For", "To", "As", "Under", "Over", "By", "An", "Their", "His", "Her", "Its", "From", "With", "After",
            "Before", "About", "Against", "Through", "During", "Into", "Of", "And", "Or", "If", "Then", "Else",
            "So", "Thus", "Therefore", "However", "Indeed", "Furthermore", "Also", "Not", "Only", "We", "You",
            "I", "Me", "Him", "Them", "Us", "My", "Your", "Our", "Their", "Who", "Whom", "Whose", "Which", "That",
            "These", "Those", "One", "Two", "Three", "First", "Second", "Third", "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday", "Sunday", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December", "Book", "Novel", "Story", "Author",
            "Volume", "Edition", "Series", "Chapter", "See", "Source", "Drive", "Privet"));

    private static final Set<String> ENTITY_STOP_WORDS = new HashSet<>(Arrays.asList(
            "London", "Paris", "New York", "America", "England", "Hogwarts", "Ministry", "Earth", "Mars",
            "World", "Europe", "Asia", "Africa", "France", "Germany", "Italy", "Spain", "Russia", "China",
            "Japan", "India", "Chicago", "Boston", "Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw",
            "J.K. Rowling", "J. K. Rowling", "Rowling", "F. Scott Fitzgerald", "Fitzgerald", "Frank Herbert",
            "Herbert", "George Orwell", "Orwell", "Warner Bros", "Warner", "Privet Drive"));

    private static final Set<String> ANTAGONIST_KEYWORDS = new HashSet<>(Arrays.asList(
            "enemy", "rival", "villain", "threat", "adversary", "nemesis", "antagonist", "evil", "dark",
            "kills", "murderer", "hunter", "plots", "opposes", "destroy", "vow", "corrupt", "oppressor"));

    @Transactional
    public void extractAndSaveCharacters(BookMaster bookMaster, String synopsis) {
        if (synopsis == null || synopsis.trim().isEmpty()) {
            return;
        }

        // Clean synopsis of basic HTML tags if any (e.g. from Google Books)
        String cleanSynopsis = synopsis.replaceAll("<[^>]*>", " ");

        // 1. Sentence splitting
        String[] sentences = cleanSynopsis.split("[.!?]\\s+");

        // Track candidate mentions: Map of Name -> list of sentence indices where it
        // appeared
        Map<String, List<Integer>> nameMentions = new HashMap<>();
        // Keep track of sentence-starting words to apply filters
        Set<String> sentenceStarters = new HashSet<>();

        // Regex for capitalized words/chains (e.g. "Harry Potter" or "Gatsby" or "Lady
        // Jessica")
        Pattern pattern = Pattern.compile("\\b[A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*\\b");

        for (int i = 0; i < sentences.length; i++) {
            String sentence = sentences[i].trim();
            if (sentence.isEmpty())
                continue;

            // Find first word in sentence to add to sentenceStarters
            Matcher firstWordMatcher = Pattern.compile("^([A-Z][a-zA-Z]+)\\b").matcher(sentence);
            if (firstWordMatcher.find()) {
                sentenceStarters.add(firstWordMatcher.group(1));
            }

            Matcher matcher = pattern.matcher(sentence);
            while (matcher.find()) {
                String match = matcher.group().trim();
                // Filter out names that are in basic stop words
                if (STOP_WORDS.contains(match) || ENTITY_STOP_WORDS.contains(match)) {
                    continue;
                }

                // Filter out matches containing entity-like keywords
                if (match.contains("School") || match.contains("Witchcraft") || match.contains("Wizardry") ||
                        match.contains("University") || match.contains("Academy") || match.contains("College") ||
                        match.contains("Society") || match.contains("House") || match.contains("Foundation") ||
                        match.contains("Ministry") || match.contains("Gryffindor") || match.contains("Slytherin") ||
                        match.contains("Hufflepuff") || match.contains("Ravenclaw") || match.contains("Hogwarts") ||
                        match.contains("Edition") || match.contains("Book") || match.contains("Series")) {
                    continue;
                }

                // If it is a single word and matches a sentence starter,
                // we'll only allow it if it also appears elsewhere (we check this in the next
                // pass)
                nameMentions.putIfAbsent(match, new ArrayList<>());
                nameMentions.get(match).add(i);
            }
        }

        // Filter and merge candidates
        Map<String, Integer> finalCharacters = new HashMap<>();
        List<String> sortedCandidates = new ArrayList<>(nameMentions.keySet());
        // Sort by length descending, so we process longer names ("Harry Potter") before
        // shorter names ("Harry")
        sortedCandidates.sort((a, b) -> Integer.compare(b.length(), a.length()));

        for (String candidate : sortedCandidates) {
            List<Integer> mentions = nameMentions.get(candidate);
            if (mentions == null || mentions.isEmpty()) {
                continue;
            }

            // Apply sentence starter check for single-word candidates
            if (!candidate.contains(" ")) {
                boolean alwaysStartOfSentence = true;
                for (int sentenceIdx : mentions) {
                    String sentence = sentences[sentenceIdx].trim();
                    if (!sentence.startsWith(candidate)) {
                        alwaysStartOfSentence = false;
                        break;
                    }
                }
                // If it only ever appeared at the start of sentences and is a single word,
                // ignore it
                if (alwaysStartOfSentence && sentenceStarters.contains(candidate)) {
                    continue;
                }
            }

            // Check if this candidate is a substring of a longer name already added to
            // finalCharacters
            String matchedLongerName = null;
            for (String savedName : finalCharacters.keySet()) {
                // If candidate is "Gatsby" and savedName is "Jay Gatsby"
                // Or candidate is "Paul" and savedName is "Paul Atreides"
                if (savedName.contains(candidate) || isSimilarName(candidate, savedName)) {
                    matchedLongerName = savedName;
                    break;
                }
            }

            if (matchedLongerName != null) {
                // Merge counts into the longer name
                finalCharacters.put(matchedLongerName, finalCharacters.get(matchedLongerName) + mentions.size());
            } else {
                // Add as a new character
                finalCharacters.put(candidate, mentions.size());
            }
        }

        // Determine Protagonist (most frequent name)
        String protagonist = null;
        int maxMentions = -1;
        for (Map.Entry<String, Integer> entry : finalCharacters.entrySet()) {
            if (entry.getValue() > maxMentions) {
                maxMentions = entry.getValue();
                protagonist = entry.getKey();
            }
        }

        // Limit to top 8 characters to avoid cluttering the graph
        List<Map.Entry<String, Integer>> entryList = new ArrayList<>(finalCharacters.entrySet());
        entryList.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        if (entryList.size() > 8) {
            entryList = entryList.subList(0, 8);
        }

        // Create and save entities
        for (Map.Entry<String, Integer> entry : entryList) {
            String charName = entry.getKey();
            String archetype = "Supporting";

            if (charName.equals(protagonist)) {
                archetype = "Protagonist";
            } else {
                // Determine if antagonist based on proximity to keywords
                boolean isAntagonist = false;
                String lowerSynopsis = cleanSynopsis.toLowerCase();
                String lowerName = charName.toLowerCase();
                int idx = lowerSynopsis.indexOf(lowerName);
                while (idx != -1) {
                    // Check text segment around the name (+/- 80 characters)
                    int start = Math.max(0, idx - 80);
                    int end = Math.min(lowerSynopsis.length(), idx + lowerName.length() + 80);
                    String context = lowerSynopsis.substring(start, end);
                    for (String keyword : ANTAGONIST_KEYWORDS) {
                        if (context.contains(keyword)) {
                            isAntagonist = true;
                            break;
                        }
                    }
                    if (isAntagonist)
                        break;
                    idx = lowerSynopsis.indexOf(lowerName, idx + 1);
                }
                if (isAntagonist) {
                    archetype = "Antagonist";
                }
            }

            CharacterNode node = new CharacterNode();
            node.setCharacterId("char_nlp_" + UUID.randomUUID().toString().substring(0, 8) + "_"
                    + charName.toLowerCase().replaceAll("[^a-z]", ""));
            node.setBookMaster(bookMaster);
            node.setCharacterName(charName);
            node.setThematicArchetype(archetype);
            node.setSource("NLP");

            characterNodeRepository.save(node);
        }
    }

    private boolean isSimilarName(String name1, String name2) {
        // Simple heuristic: if names share a rare capitalized word (e.g. "Dumbledore"
        // in "Albus Dumbledore" / "Professor Dumbledore")
        String[] parts1 = name1.split("\\s+");
        String[] parts2 = name2.split("\\s+");
        for (String p1 : parts1) {
            if (p1.length() < 4 || STOP_WORDS.contains(p1))
                continue;
            for (String p2 : parts2) {
                if (p1.equals(p2)) {
                    return true;
                }
            }
        }
        return false;
    }
}
