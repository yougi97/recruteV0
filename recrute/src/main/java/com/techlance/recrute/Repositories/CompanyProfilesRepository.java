package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techlance.recrute.Entities.CompanyProfiles;

public interface CompanyProfilesRepository extends JpaRepository<CompanyProfiles, Long> {
    CompanyProfiles findByUserId(Long id);
}

