package com.techlance.recrute.Repositories;

import com.techlance.recrute.Entities.CompanyReviews;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyReviewsRepository extends JpaRepository<CompanyReviews, Long> {
    List<CompanyReviews> findByCompanyProfileIdOrderByCreatedAtDesc(Long companyProfileId);
    Optional<CompanyReviews> findByCompanyProfileIdAndReviewerId(Long companyProfileId, Long reviewerUserId);

    boolean existsByCompanyProfileIdAndReviewerId(Long companyProfileId, Long reviewerUserId);

    @Query("SELECT AVG(r.rating) FROM CompanyReviews r WHERE r.companyProfile.id = :cid")
    Double avgRatingByCompanyProfileId(@Param("cid") Long companyProfileId);

    @Query("SELECT COUNT(r) FROM CompanyReviews r WHERE r.companyProfile.id = :cid")
    Long countByCompanyProfileId(@Param("cid") Long companyProfileId);
}
