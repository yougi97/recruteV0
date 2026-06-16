package com.techlance.recrute.Entities;

import com.techlance.recrute.Enum.Level;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class CvCategories {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name= "cv_id")
    private Cvs cv;
    @ManyToOne
    @JoinColumn(name= "category_id")
    private Categories category;
    private float confidence;
    @Enumerated(EnumType.STRING)
    private Level level;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Cvs getCv() {
        return cv;
    }
    public void setCv(Cvs cv) {
        this.cv = cv;
    }
    public Categories getCategory() {
        return category;
    }
    public void setCategory(Categories category) {
        this.category = category;
    }
    public float getConfidence() {
        return confidence;
    }
    public void setConfidence(float confidence) {
        this.confidence = confidence;
    }
    public Level getLevel() {
        return level;
    }
    public void setLevel(Level level) {
        this.level = level;
    }
}
