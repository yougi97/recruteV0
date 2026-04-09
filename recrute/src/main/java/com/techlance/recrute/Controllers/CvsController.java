package com.techlance.recrute.Controllers;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Cvs createCv(@RequestParam("file") MultipartFile file, @PathVariable Long candidateId) {
        return cvsService.createCv(file, candidateId);
    }

    @GetMapping("/cv")
    public Cvs getcv(@PathVariable Long candidateId) {
        return cvsService.getCvByUserId(candidateId);
    }

    @GetMapping("/cv/download")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long candidateId) {
        Resource resource = cvsService.getCvFileResource(candidateId);
        String fileName = cvsService.getCvDownloadFileName(candidateId);
        String contentType = cvsService.getCvContentType(candidateId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileName).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .header("Pragma", "no-cache")
                .body(resource);
    }
}
