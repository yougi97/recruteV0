package com.techlance.recrute.Entities;

import java.sql.Date;

import com.techlance.recrute.Enum.Rating;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class CompanyCandidateRatings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name = "company_id")
    private CompanyProfiles company;
    @OneToOne
    @JoinColumn(name = "job_offer_id")
    private JobOffers jobOffer;
    @OneToOne
    @JoinColumn(name = "cv_id")
    private Cvs cv;
    @Enumerated(EnumType.STRING)
    private Rating rating;
    private float aiScore;
    private float scoreSemantique;
    private float scoreStructure;
    private float scoreLlm;
    private Date rated_at;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public CompanyProfiles getCompany() {
        return company;
    }
    public void setCompany(CompanyProfiles company) {
        this.company = company;
    }
    public JobOffers getJobOffer() {
        return jobOffer;
    }
    public void setJobOffer(JobOffers jobOffer) {
        this.jobOffer = jobOffer;
    }
    public Cvs getCv() {
        return cv;
    }
    public void setCv(Cvs cv) {
        this.cv = cv;
    }
    public Rating getRating() {
        return rating;
    }
    public void setRating(Rating rating) {
        this.rating = rating;
    }
    public float getAiScore() {
        return aiScore;
    }
    public void setAiScore(float aiScore) {
        this.aiScore = aiScore;
    }
    public float getScoreSemantique() {
        return scoreSemantique;
    }
    public void setScoreSemantique(float scoreSemantique) {
        this.scoreSemantique = scoreSemantique;
    }
    public float getScoreStructure() {
        return scoreStructure;
    }
    public void setScoreStructure(float scoreStructure) {
        this.scoreStructure = scoreStructure;
    }
    public float getScoreLlm() {
        return scoreLlm;
    }
    public void setScoreLlm(float scoreLlm) {
        this.scoreLlm = scoreLlm;
    }
    public Date getRated_at() {
        return rated_at;
    }
    public void setRated_at(Date rated_at) {
        this.rated_at = rated_at;
    }
}
