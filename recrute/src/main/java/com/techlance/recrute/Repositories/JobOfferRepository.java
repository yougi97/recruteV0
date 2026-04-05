package com.techlance.recrute.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.techlance.recrute.Entities.JobOffers;

public interface JobOfferRepository extends JpaRepository<JobOffers, Long>, JpaSpecificationExecutor<JobOffers> {
    List<JobOffers> findByCompanyProfilesId(Long id);
}
