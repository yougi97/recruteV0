package com.techlance.recrute.Entities;

import com.techlance.recrute.Enum.ContratType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_reports")
public class SalaryReports {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_profile_id", nullable = false)
    private CompanyProfiles companyProfile;

    @ManyToOne
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private Users reporter;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "min_salary", nullable = false)
    private int minSalary;

    @Column(name = "max_salary", nullable = false)
    private int maxSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type")
    private ContratType contractType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CompanyProfiles getCompanyProfile() { return companyProfile; }
    public void setCompanyProfile(CompanyProfiles companyProfile) { this.companyProfile = companyProfile; }
    public Users getReporter() { return reporter; }
    public void setReporter(Users reporter) { this.reporter = reporter; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public int getMinSalary() { return minSalary; }
    public void setMinSalary(int minSalary) { this.minSalary = minSalary; }
    public int getMaxSalary() { return maxSalary; }
    public void setMaxSalary(int maxSalary) { this.maxSalary = maxSalary; }
    public ContratType getContratType() { return contractType; }
    public void setContratType(ContratType contractType) { this.contractType = contractType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
