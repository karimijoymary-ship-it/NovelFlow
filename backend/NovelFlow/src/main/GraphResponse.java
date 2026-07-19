package com.novelflow.dto;

import java.util.List;
import java.util.Map;

public class GraphResponse {
    public List<Map<String, String>> nodes;
    public List<Map<String, String>> links;

    public GraphResponse(List<Map<String, String>> nodes, List<Map<String, String>> links) {
        this.nodes = nodes;
        this.links = links;
    }
}