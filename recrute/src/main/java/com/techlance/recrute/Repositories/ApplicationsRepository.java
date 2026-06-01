package com.techlance.recrute.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.Applications;

@Repository
public interface ApplicationsRepository extends JpaRepository<Applications, Long> {

    @Query("SELECT a FROM Applications a WHERE a.candidate.id = :candidateId AND a.jobOffer.id = :jobId")
    Optional<Applications> findByCandidateAndJob(@Param("candidateId") Long candidateId, @Param("jobId") Long jobId);

    @Query("SELECT a FROM Applications a JOIN FETCH a.candidate candidate JOIN FETCH candidate.user user LEFT JOIN FETCH a.cv cv WHERE a.jobOffer.id = :jobId ORDER BY a.appliedAt DESC")
    List<Applications> findAllByJobOfferId(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(a) FROM Applications a WHERE a.jobOffer.id = :jobId")
    long countByJobOfferId(@Param("jobId") Long jobId);

    @Query("SELECT a FROM Applications a JOIN FETCH a.jobOffer job JOIN FETCH job.companyProfiles company WHERE a.candidate.id = :candidateId ORDER BY a.appliedAt DESC")
    List<Applications> findAllByCandidateId(@Param("candidateId") Long candidateId);
}
