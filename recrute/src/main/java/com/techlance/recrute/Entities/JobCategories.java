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
public class JobCategories {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @ManyToOne
    @JoinColumn(name= "job_offer_id")
    private JobOffers jobOffer;
    @ManyToOne
    @JoinColumn(name= "category_id")
    private Categories category;
    @Enumerated(EnumType.STRING)
    private Level requiredLevel;
    private boolean isMandatory;
    public long getId() {
        return id;
    }
    public void setId(long id) {
        this.id = id;
    }
    public JobOffers getJobOffer() {
        return jobOffer;
    }
    public void setJobOffer(JobOffers jobOffer) {
        this.jobOffer = jobOffer;
    }
    public Categories getCategory() {
        return category;
    }
    public void setCategory(Categories category) {
        this.category = category;
    }
    public Level getRequiredLevel() {
        return requiredLevel;
    }
    public void setRequiredLevel(Level requiredLevel) {
        this.requiredLevel = requiredLevel;
    }
    public boolean isMandatory() {
        return isMandatory;
    }
    public void setMandatory(boolean isMandatory) {
        this.isMandatory = isMandatory;
    }
}
