package com.techlance.recrute.Controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Services.CvsService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/users/candidate/{candidateId}")
public class CvsController {
    private final CvsService cvsService;

    public CvsController(CvsService cvsService) {
        this.cvsService = cvsService;
    }

    @PostMapping
    public Cvs creatOffers(@RequestBody Cvs cv, @PathVariable Long candidateId) {
        return cvsService.createCv(cv, candidateId);
    }

    @GetMapping("/cv")
    public Cvs getcv(@PathVariable Long candidateId) {
        return cvsService.getCvByUserId(candidateId);
    }
}
