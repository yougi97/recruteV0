package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.CandidateProfiles;

@Repository
public interface CandidateProfilesRepository extends JpaRepository<CandidateProfiles, Long> {
    CandidateProfiles findByUserId(Long id);
}
