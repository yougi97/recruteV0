package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techlance.recrute.Entities.JobOffers;

public interface JobOfferRepository extends JpaRepository<JobOffers, Long> {

}
