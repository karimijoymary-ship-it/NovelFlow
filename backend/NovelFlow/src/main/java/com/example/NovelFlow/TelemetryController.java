package com.example.NovelFlow;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final RestTemplate restTemplate;

    public TelemetryController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/latency")
    public ResponseEntity<Map<String, Object>> getLatency() {
        long googleStart = System.currentTimeMillis();
        try {
            restTemplate.getForEntity("https://www.googleapis.com/books/v1/volumes?q=test", String.class);
        } catch (Exception e) {}
        long googleLatency = System.currentTimeMillis() - googleStart;

        long olStart = System.currentTimeMillis();
        try {
            restTemplate.getForEntity("https://openlibrary.org/search.json?q=test", String.class);
        } catch (Exception e) {}
        long olLatency = System.currentTimeMillis() - olStart;

        long hmLatency = (long) (Math.random() * 20) + 110; // Mock internal gateway latency

        Map<String, Object> data = new HashMap<>();
        data.put("time", LocalTime.now().toString().substring(0, 8)); // HH:mm:ss
        data.put("Google", googleLatency);
        data.put("OpenLibrary", olLatency);
        data.put("HandmadeAPI", hmLatency);

        return ResponseEntity.ok(data);
    }
}
