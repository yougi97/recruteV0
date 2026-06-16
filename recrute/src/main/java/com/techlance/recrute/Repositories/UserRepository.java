package com.techlance.recrute.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.techlance.recrute.Entities.Users;

@Repository
public interface  UserRepository extends JpaRepository<Users, Long>  {
    Users findByEmail(String email);
}
