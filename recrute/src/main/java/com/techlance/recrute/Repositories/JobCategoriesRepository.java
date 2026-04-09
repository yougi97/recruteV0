package com.techlance.recrute.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.JobCategories;

@Repository
public interface JobCategoriesRepository extends JpaRepository<JobCategories, Long>{
    List<JobCategories> findByjobOfferId(Long id);
}
