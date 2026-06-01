package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.CandidateJobRatings;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CandidateJobRatingsRepository extends JpaRepository<CandidateJobRatings, Long> {

	@Query("SELECT c FROM CandidateJobRatings c WHERE c.candidate.id = :candidateId AND c.jobOffer.id = :jobId ORDER BY c.rated_at DESC")
	Optional<CandidateJobRatings> findLatestByCandidateAndJob(@Param("candidateId") Long candidateId, @Param("jobId") Long jobId);

}
