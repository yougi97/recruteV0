package com.techlance.recrute.Controllers;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Enum.Rating;
import com.techlance.recrute.Services.JobOfferService;

@CrossOrigin(origins = {"http://localhost:4200", "https://localhost"})
@RestController
@RequestMapping("/users/candidate/{candidateId}")
public class CandidateOffersController {
    private final JobOfferService jobOfferService;

    public CandidateOffersController(JobOfferService jobOfferService) {
        this.jobOfferService = jobOfferService;
    }

    @GetMapping("/suggestions")
    public List<Map<String, Object>> getSuggestions(@PathVariable Long candidateId) {
        return jobOfferService.getCandidateSuggestions(candidateId);
    }

    @PostMapping("/offers/{offerId}/interest")
    public void markInterest(@PathVariable Long candidateId, @PathVariable Long offerId) {
        jobOfferService.recordCandidateInterest(candidateId, offerId, Rating.up);
    }

    @PostMapping("/offers/{offerId}/dismiss")
    public void dismissOffer(@PathVariable Long candidateId, @PathVariable Long offerId) {
        jobOfferService.recordCandidateInterest(candidateId, offerId, Rating.down);
    }

    @GetMapping("/applications")
    public List<Map<String, Object>> getApplications(@PathVariable Long candidateId) {
        return jobOfferService.getCandidateApplications(candidateId);
    }

    @DeleteMapping("/offers/{offerId}/application")
    public void retractApplication(@PathVariable Long candidateId, @PathVariable Long offerId) {
        jobOfferService.retractApplication(candidateId, offerId);
    }

    @GetMapping("/interested-offers")
    public List<Map<String, Object>> getInterestedOffers(@PathVariable Long candidateId) {
        return jobOfferService.getCandidateInterestedApplications(candidateId);
    }

    @PostMapping("/offers/{offerId}/accept-interest")
    public void acceptCompanyInterest(@PathVariable Long candidateId, @PathVariable Long offerId) {
        jobOfferService.respondToCompanyInterest(candidateId, offerId, true);
    }

    @PostMapping("/offers/{offerId}/decline-interest")
    public void declineCompanyInterest(@PathVariable Long candidateId, @PathVariable Long offerId) {
        jobOfferService.respondToCompanyInterest(candidateId, offerId, false);
    }
}