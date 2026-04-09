package com.techlance.recrute.Services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    public JobOffers getJobOffer(Long id) {
        return jobOfferRepository.findById(id).orElseThrow(()->
        new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Offre non trouver"))
    );}

    public JobOffers getCompanyJobOffer(Long companyId, Long jobId) {
        JobOffers jobOffer = getJobOffer(jobId);
        if (jobOffer.getCompanyProfiles() == null || !jobOffer.getCompanyProfiles().getId().equals(companyId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("Offre non trouver pour cette entreprise")
            );
        }
        return jobOffer;
    }

    public JobOffers updateJobOffers(Long id, JobOffers job) {
        JobOffers oldjob=getJobOffer(id);

        if (job.getTitle()!=null) {
            oldjob.setTitle(job.getTitle());
        }

        if(job.getDescription()!=null) {
            oldjob.setDescription(job.getDescription());
        }

        if(job.getEnrichedDescription()!=null) {
            oldjob.setEnrichedDescription(job.getEnrichedDescription());
        }

        if (job.getParsedJson()!=null) {
            oldjob.setParsedJson(job.getParsedJson());
        }

        if (job.getEmbedding()!=null) {
            oldjob.setEmbedding(job.getEmbedding());
        }

        if (job.getContractType()!=null) {
            oldjob.setContractType(job.getContractType());
        }

        if (job.getAnneesExperienceMin()!=0.0) {
            oldjob.setAnneesExperienceMin(job.getAnneesExperienceMin());
        }

        if (job.getLocation() != null) {
            oldjob.setLocation(job.getLocation());
        }

        oldjob.setIsActive(job.isIsActive());

        if(job.getNiveauEtudesMin()!=null) {
            oldjob.setNiveauEtudesMin(job.getNiveauEtudesMin());
        }

        return jobOfferRepository.save(oldjob);


    }

    public JobOffers updateCompanyJobOffer(Long companyId, Long jobId, JobOffers job) {
        JobOffers oldJob = getCompanyJobOffer(companyId, jobId);

        if (job.getTitle() != null) {
            oldJob.setTitle(job.getTitle());
        }
        if (job.getDescription() != null) {
            oldJob.setDescription(job.getDescription());
        }
        if (job.getLocation() != null) {
            oldJob.setLocation(job.getLocation());
        }
        if (job.getContractType() != null) {
            oldJob.setContractType(job.getContractType());
        }

        return jobOfferRepository.save(oldJob);
    }

    public JobOffers updateCompanyJobOfferStatus(Long companyId, Long jobId, boolean active) {
        JobOffers oldJob = getCompanyJobOffer(companyId, jobId);
        oldJob.setIsActive(active);
        return jobOfferRepository.save(oldJob);
    }
}
