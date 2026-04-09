package com.techlance.recrute.DTO;

import com.techlance.recrute.Enum.Level;
import com.techlance.recrute.Enum.Type;

public class categories {
    private String name;
    private Type type;
    private Level level;
    private float confidence;
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Type getType() {
        return type;
    }
    public void setType(Type type) {
        this.type = type;
    }
    public Level getLevel() {
        return level;
    }
    public void setLevel(Level level) {
        this.level = level;
    }
    public float getConfidence() {
        return confidence;
    }
    public void setConfidence(float confidence) {
        this.confidence = confidence;
    }
    
}
