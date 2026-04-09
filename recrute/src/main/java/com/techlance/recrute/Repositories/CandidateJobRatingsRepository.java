package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.CandidateJobRatings;

@Repository
public interface CandidateJobRatingsRepository extends JpaRepository<CandidateJobRatings, Long> {

}
