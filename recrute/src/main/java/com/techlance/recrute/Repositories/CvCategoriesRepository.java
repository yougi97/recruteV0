package com.techlance.recrute.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.CvCategories;

@Repository
public interface CvCategoriesRepository extends JpaRepository<CvCategories, Long>{
    List<CvCategories> findByCvId(Long id);
    CvCategories findByCvIdAndCategoryId(Long CvId, Long CategoryId);
}
