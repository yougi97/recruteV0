package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.JobSearches;

@Repository
public interface JobSearchesRepository extends JpaRepository<JobSearches, Long> {

}
