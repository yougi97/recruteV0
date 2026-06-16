package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.CompanyProfiles;

@Repository
public interface CompanyProfilesRepository extends JpaRepository<CompanyProfiles, Long> {
    CompanyProfiles findByUserId(Long id);
}

