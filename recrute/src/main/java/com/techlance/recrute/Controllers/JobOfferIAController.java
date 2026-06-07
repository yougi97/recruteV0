package com.techlance.recrute.Controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Entities.JobCategories;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Services.CategoriesService;
import com.techlance.recrute.Services.JobOfferService;

@RestController
@RequestMapping("/api/internal/jobs/{offre_id}")
public class JobOfferIAController {
    private final JobOfferService jobOfferService;
    private final CategoriesService categoriesService;

    public JobOfferIAController(JobOfferService jobOfferService, CategoriesService categoriesService) {
        this.jobOfferService = jobOfferService;
        this.categoriesService = categoriesService;
    }

    @GetMapping
    public JobOffers getOffer(@PathVariable Long offre_id) {
        return jobOfferService.getJobOffer(offre_id);
    }

    @PatchMapping("/parsed")
    public JobOffers updateJobOffers(@PathVariable Long offre_id, @RequestBody java.util.Map<String, Object> body) {
        return jobOfferService.updateJobOfferFromPython(offre_id, body);
    }

    @PostMapping("/categories")
    public List<JobCategories> createCvCategories(@PathVariable Long offre_id, @RequestBody List<Map<String, Object>> jobCategories) {
        List<JobCategories> jobCategorieses = new ArrayList<>();
        for (Map<String, Object> category : jobCategories) {
            jobCategorieses.add(categoriesService.createJobCategoriesFromMap(offre_id, category));
        }
        return jobCategorieses;
    }

    @GetMapping("/categories")
    public List<Map<String,Object>> getcategoriesjob(@PathVariable Long offre_id) {
        return categoriesService.getcategoriesjob(offre_id);
    }



}
