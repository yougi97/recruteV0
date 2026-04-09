package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.Cvs;

@Repository
public interface CvsRepository extends JpaRepository<Cvs, Long> {
    Cvs findByCandidateProfilesId(Long id);
}
