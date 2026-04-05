package com.techlance.recrute.Controllers;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Services.JobOfferService;

@RestController
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

}
