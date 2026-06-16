package com.techlance.recrute.Entities;

import java.util.List;

import com.techlance.recrute.Converter.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class CandidateProfiles {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name= "user_id")
    private Users user;
    private String title;
    private String location;
    @Column(columnDefinition="json")
    @Convert(converter = StringListConverter.class)
    private List<String> targetLocation;
    private String bio;
    private float anneesExperience;
    private String niveauEtudes;

    public float getAnneesExperience() {
        return anneesExperience;
    }

    public void setAnneesExperience(float anneesExperience) {
        this.anneesExperience = anneesExperience;
    }

    public String getNiveauEtudes() {
        return niveauEtudes;
    }

    public void setNiveauEtudes(String niveauEtudes) {
        this.niveauEtudes = niveauEtudes;
    }

    public CandidateProfiles() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public List<String> getTargetLocation() {
        return targetLocation;
    }

    public void setTargetLocation(List<String> targetLocation) {
        this.targetLocation = targetLocation;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }


    
}
