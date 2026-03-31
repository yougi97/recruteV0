package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techlance.recrute.Entities.CandidateProfiles;

public interface CandidateProfilesRepository extends JpaRepository<CandidateProfiles, Long> {

}
