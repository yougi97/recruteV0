package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.CompanyCandidateRatings;

@Repository
public interface CompanyCandidateRatingsRepository extends JpaRepository<CompanyCandidateRatings, Long>{

}
