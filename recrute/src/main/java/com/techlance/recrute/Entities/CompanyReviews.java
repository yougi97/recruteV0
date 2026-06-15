package com.techlance.recrute.Entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "company_reviews",
        uniqueConstraints = @UniqueConstraint(columnNames = {"company_profile_id", "reviewer_user_id"}))
public class CompanyReviews {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_profile_id", nullable = false)
    private CompanyProfiles companyProfile;

    @ManyToOne
    @JoinColumn(name = "reviewer_user_id", nullable = false)
    private Users reviewer;

    @Column(name = "is_anonymous", nullable = false)
    private boolean anonymous = false;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CompanyProfiles getCompanyProfile() { return companyProfile; }
    public void setCompanyProfile(CompanyProfiles companyProfile) { this.companyProfile = companyProfile; }
    public Users getReviewer() { return reviewer; }
    public void setReviewer(Users reviewer) { this.reviewer = reviewer; }
    public boolean isAnonymous() { return anonymous; }
    public void setAnonymous(boolean anonymous) { this.anonymous = anonymous; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
