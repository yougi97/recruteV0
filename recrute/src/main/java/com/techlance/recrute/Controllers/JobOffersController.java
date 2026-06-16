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
@CrossOrigin(origins = {"http://localhost:4200", "https://localhost"})
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
    public List<Map<String, Object>> getOffers(@PathVariable Long companyId) {
        return jobOfferService.getJobOffersWithApplicationCounts(companyId);
    }

    @GetMapping("/{jobId}/candidates")
    public List<Map<String, Object>> getOfferCandidates(
            @PathVariable Long companyId,
            @PathVariable Long jobId
    ) {
        return jobOfferService.getCompanyOfferCandidates(companyId, jobId);
    }

    @GetMapping("/{jobId}/top-candidates")
    public List<Map<String, Object>> getTopCandidates(
            @PathVariable Long companyId,
            @PathVariable Long jobId
    ) {
        return jobOfferService.getTopScoredCandidates(companyId, jobId);
    }

    @PostMapping("/{jobId}/compute-missing-scores")
    public Map<String, Object> computeMissingScores(
            @PathVariable Long companyId,
            @PathVariable Long jobId
    ) {
        return jobOfferService.computeMissingCompanyOfferScores(companyId, jobId);
    }

    @PostMapping("/{jobId}/compute-all-scores")
    public Map<String, Object> computeAllScores(
            @PathVariable Long companyId,
            @PathVariable Long jobId
    ) {
        return jobOfferService.computeAllCandidateScoresForOffer(companyId, jobId);
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
    @PatchMapping("/{jobId}/applications/{applicationId}/review")
    public void reviewApplication(
            @PathVariable Long companyId,
            @PathVariable Long jobId,
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> payload
    ) {
        jobOfferService.reviewApplication(companyId, jobId, applicationId, payload.get("status"));
    }

    @PostMapping("/{jobId}/candidates/{candidateId}/interest")
    public void markInterestInCandidate(
            @PathVariable Long companyId,
            @PathVariable Long jobId,
            @PathVariable Long candidateId
    ) {
        jobOfferService.markCompanyInterestInCandidate(companyId, jobId, candidateId);
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
