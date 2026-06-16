package com.techlance.recrute.Repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.Categories;
import com.techlance.recrute.Enum.Type;

@Repository
public interface CategoriesRepository extends JpaRepository<Categories, Long>{
    Optional<Categories> findByNameAndType(String name, Type type);
}
