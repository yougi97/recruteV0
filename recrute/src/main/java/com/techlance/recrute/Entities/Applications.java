package com.techlance.recrute.Entities;

import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Applications {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "candidate_id")
    private CandidateProfiles candidate;

    @ManyToOne
    @JoinColumn(name = "job_offer_id")
    private JobOffers jobOffer;

    @ManyToOne
    @JoinColumn(name = "cv_id")
    private Cvs cv;

    private String status;

    private String message;

    @Column(name = "applied_at")
    private Timestamp appliedAt;

    @Column(name = "updated_at")
    private Timestamp updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CandidateProfiles getCandidate() {
        return candidate;
    }

    public void setCandidate(CandidateProfiles candidate) {
        this.candidate = candidate;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Timestamp getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Timestamp appliedAt) {
        this.appliedAt = appliedAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
}
