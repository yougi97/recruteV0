package com.techlance.recrute.Controllers;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Security.AuthenticatedUser;
import com.techlance.recrute.Services.CvsService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/users/candidate/{candidateId}")
public class CvsController {
    private final CvsService cvsService;

    public CvsController(CvsService cvsService) {
        this.cvsService = cvsService;
    }

    private void requireOwner(AuthenticatedUser authUser, Long candidateId) {
        if (!authUser.userId().equals(candidateId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à effectuer cette action");
        }
    }

    private void requireOwnerOrCompany(AuthenticatedUser authUser, Long candidateId) {
        if (!authUser.userId().equals(candidateId) && !"company".equalsIgnoreCase(authUser.userType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à accéder à ce CV");
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Cvs createCv(@RequestParam("file") MultipartFile file, @PathVariable Long candidateId,
            @AuthenticationPrincipal AuthenticatedUser authUser) {
        requireOwner(authUser, candidateId);
        return cvsService.createCv(file, candidateId);
    }

    @GetMapping("/cv")
    public Cvs getcv(@PathVariable Long candidateId, @AuthenticationPrincipal AuthenticatedUser authUser) {
        requireOwnerOrCompany(authUser, candidateId);
        return cvsService.getCvByUserId(candidateId);
    }

    @GetMapping("/cv/view")
    public ResponseEntity<Resource> viewCv(@PathVariable Long candidateId,
            @AuthenticationPrincipal AuthenticatedUser authUser) {
        requireOwnerOrCompany(authUser, candidateId);
        Resource resource = cvsService.getCvFileResource(candidateId);
        String fileName = cvsService.getCvDownloadFileName(candidateId);
        String contentType = cvsService.getCvContentType(candidateId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(fileName).build().toString())
                .body(resource);
    }

    @GetMapping("/cv/download")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long candidateId,
            @AuthenticationPrincipal AuthenticatedUser authUser) {
        requireOwnerOrCompany(authUser, candidateId);
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
