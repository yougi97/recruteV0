package com.techlance.recrute.Services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Repositories.CompanyProfilesRepository;
import com.techlance.recrute.Repositories.JobOfferRepository;

@Service
public class JobOfferService {
    private final JobOfferRepository jobOfferRepository;
    private final CompanyProfilesRepository companyProfilesRepository;

    public JobOfferService(JobOfferRepository jobOfferRepository, CompanyProfilesRepository companyProfilesRepository) {
        this.jobOfferRepository = jobOfferRepository;
        this.companyProfilesRepository = companyProfilesRepository;
    }

    public JobOffers creatJobOffers(JobOffers jobOffer, Long id) {
        CompanyProfiles companyProfiles = companyProfilesRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Candidate not found"));
        jobOffer.setCompanyProfiles(companyProfiles);
        return jobOfferRepository.save(jobOffer);
    }

    // public List<JobOffers> getJobOffers(JobOfferFilter filter){
    //     Specification<JobOffers> spec = Specification
    //         .where(JobOffersSpecification.hasLocations(filter.getLocations()))
    //         .and(JobOffersSpecification.hasContratType(filter.getContratTypes()))
    //         .and(JobOffersSpecification.hasNiveauEtude(filter.getNiveauEtudes()));

    //     return jobOfferRepository.findAll(spec);
    // }
    public List<JobOffers> getJobOffers(Long id) {
        return jobOfferRepository.findByCompanyProfilesId(id);
    }
}
