package com.techlance.recrute.Controllers;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Services.JobOfferService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/public/offers")
public class PublicOffersController {
    private final JobOfferService jobOfferService;

    public PublicOffersController(JobOfferService jobOfferService) {
        this.jobOfferService = jobOfferService;
    }

    @GetMapping
    public List<Map<String, Object>> getAllOffers(@org.springframework.web.bind.annotation.RequestParam(required = false) Long candidateId) {
        return jobOfferService.getAllPublicOffers(candidateId);
    }
}
