package com.techlance.recrute.Controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.DTO.categories;
import com.techlance.recrute.Entities.CvCategories;
import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Services.CategoriesService;
import com.techlance.recrute.Services.CvsService;

@RestController
@RequestMapping("/api/internal/cvs/{cv_id}")
public class CvsIAController {
    private final CvsService cvsService;
    private final CategoriesService categoriesService;

    public CvsIAController(CvsService cvsService, CategoriesService categoriesService) {
        this.cvsService = cvsService;
        this.categoriesService = categoriesService;
    }

    @GetMapping
    public Cvs getCv(@PathVariable Long cv_id) {
        return cvsService.getCvById(cv_id);
    }

    @GetMapping(value = "/file", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> getCvFile(@PathVariable Long cv_id) {
        Resource resource = cvsService.getCvFileResourceByCvId(cv_id);
        String fileName = cvsService.getCvDownloadFileNameByCvId(cv_id);
        String contentType = cvsService.getCvContentTypeByCvId(cv_id);

        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileName).build().toString())
                .body(resource);
    }

    @GetMapping("/categories")
    public List<categories> getcategoriesByCv(@PathVariable Long cv_id) {
        return categoriesService.getcategories(cv_id);
    }

    @PatchMapping("/parsed")
    public Cvs updateCv(@RequestBody Cvs cv, @PathVariable Long cv_id) {
        return cvsService.updateCV(cv_id, cv);
    }

    @PostMapping("/categories")
    public List<CvCategories> createCvCategories(@PathVariable Long cv_id, @RequestBody List<categories> categorys) {
        List<CvCategories> cvCategorieses = new ArrayList<>();
        for (categories category:categorys) {
            cvCategorieses.add(categoriesService.createCvCategories(cv_id, category));
        }
        return cvCategorieses;
    }
}
