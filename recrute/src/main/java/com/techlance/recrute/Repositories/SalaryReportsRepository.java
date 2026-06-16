package com.techlance.recrute.Repositories;

import com.techlance.recrute.Entities.SalaryReports;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryReportsRepository extends JpaRepository<SalaryReports, Long> {
    List<SalaryReports> findByCompanyProfileIdOrderByCreatedAtDesc(Long companyProfileId);
}
