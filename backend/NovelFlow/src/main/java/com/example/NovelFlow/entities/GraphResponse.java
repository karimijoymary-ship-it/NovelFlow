package com.example.NovelFlow.entities;

import java.util.List;

public class GraphResponse {
    private List<CharacterNode> nodes;
    private List<CharacterRelationship> links;

    public GraphResponse() {
    }

    public GraphResponse(List<CharacterNode> nodes, List<CharacterRelationship> links) {
        this.nodes = nodes;
        this.links = links;
    }

    // Getters and Setters
    public List<CharacterNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<CharacterNode> nodes) {
        this.nodes = nodes;
    }

    public List<CharacterRelationship> getLinks() {
        return links;
    }

    public void setLinks(List<CharacterRelationship> links) {
        this.links = links;
    }
}
