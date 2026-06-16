package com.techlance.recrute.DTO;

public class payload {
    private String parsedJson;
    private byte[] embedding;
    private String enrichedDescription;
    
    public String getParsedJson() {
        return parsedJson;
    }
    public void setParsedJson(String parsedJson) {
        this.parsedJson = parsedJson;
    }
    public byte[] getEmbedding() {
        return embedding;
    }
    public void setEmbedding(byte[] embedding) {
        this.embedding = embedding;
    }

    public String getEnrichedDescription() {
        return enrichedDescription;
    }

    public void setEnrichedDescription(String enrichedDescription) {
        this.enrichedDescription = enrichedDescription;
    }
    
}
