package com.techlance.recrute.Controllers;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Services.UserService;

// Server-to-server endpoint for the Python AI service: it has no end-user JWT to
// authenticate with after parsing a CV, so it can't use the public, JWT-protected
// PUT /users/candidate/{id}. This sits under /api/internal (permitAll, reserved
// for service-to-service calls) like the other Python-AI-facing controllers.
@RestController
@RequestMapping("/api/internal/candidates")
public class InternalCandidateController {
    private final UserService userService;

    public InternalCandidateController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/{id}")
    public CandidateProfiles updateCandidateProfile(@RequestBody CandidateProfiles user, @PathVariable Long id) {
        return userService.updateCandidateInternal(user, id);
    }
}
