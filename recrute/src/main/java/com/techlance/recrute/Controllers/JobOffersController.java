package com.techlance.recrute.Controllers;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Services.JobOfferService;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/users/company/{companyId}/jobs")
public class JobOffersController {
    private final JobOfferService jobOfferService;

    public JobOffersController(JobOfferService jobOfferService) {
        this.jobOfferService = jobOfferService;
    }

    @PostMapping
    public JobOffers creatOffers(@RequestBody JobOffers job, @PathVariable Long companyId) {
        return jobOfferService.creatJobOffers(job, companyId);
    }

    @GetMapping
    public List<JobOffers> getOffers(@PathVariable Long companyId) {
        return jobOfferService.getJobOffers(companyId);
    }

    @PutMapping("/{jobId}")
    public JobOffers updateOffer(
            @PathVariable Long companyId,
            @PathVariable Long jobId,
            @RequestBody JobOffers job
    ) {
        return jobOfferService.updateCompanyJobOffer(companyId, jobId, job);
    }

    @PatchMapping("/{jobId}/status")
    public JobOffers updateOfferStatus(
            @PathVariable Long companyId,
            @PathVariable Long jobId,
            @RequestBody Map<String, Boolean> payload
    ) {
        boolean active = payload.getOrDefault("isActive", true);
        return jobOfferService.updateCompanyJobOfferStatus(companyId, jobId, active);
    }
    // public List<JobOffers> getOffers(@RequestParam(required = false) List<String> location,
    //                                 @RequestParam(required = false) List<ContratType> contratType,
    //                             @RequestParam(required = false) List<NiveauEtude> niveau) {
    //     JobOfferFilter filtre = new JobOfferFilter();
    //     filtre.setContratTypes(contratType);
    //     filtre.setLocations(location);
    //     filtre.setNiveauEtudes(niveau);
    //     return jobOfferService.getJobOffers(filtre);
    // }

}
