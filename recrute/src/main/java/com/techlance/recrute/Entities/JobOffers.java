package com.techlance.recrute.Entities;

import java.sql.Timestamp;

import com.techlance.recrute.Enum.ContratType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;

@Entity
public class JobOffers {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name= "company_id")
    private CompanyProfiles companyProfiles;
    private String title;
    private String description;
    private String enrichedDescription;
    @Column(columnDefinition = "json")
    private String parsedJson;
    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] embedding;
    private String location;
    @Enumerated(EnumType.STRING)
    private ContratType contractType;
    private float anneesExperienceMin;
    private String niveauEtudesMin;
    private boolean isActive;
    private Timestamp createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CompanyProfiles getCompanyProfiles() {
        return companyProfiles;
    }

    public void setCompanyProfiles(CompanyProfiles companyProfiles) {
        this.companyProfiles = companyProfiles;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEnrichedDescription() {
        return enrichedDescription;
    }

    public void setEnrichedDescription(String enrichedDescription) {
        this.enrichedDescription = enrichedDescription;
    }

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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public ContratType getContractType() {
        return contractType;
    }

    public void setContractType(ContratType contractType) {
        this.contractType = contractType;
    }

    public float getAnneesExperienceMin() {
        return anneesExperienceMin;
    }

    public void setAnneesExperienceMin(float anneesExperienceMin) {
        this.anneesExperienceMin = anneesExperienceMin;
    }

    public String getNiveauEtudesMin() {
        return niveauEtudesMin;
    }

    public void setNiveauEtudesMin(String niveauEtudesMin) {
        this.niveauEtudesMin = niveauEtudesMin;
    }

    public boolean isIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
