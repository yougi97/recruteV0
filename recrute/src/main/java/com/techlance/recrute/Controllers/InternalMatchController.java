package com.techlance.recrute.Controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.Services.MatchService;

@CrossOrigin(origins = {"http://localhost:4200", "https://localhost"})
@RestController
@RequestMapping("/api/internal/match")
public class InternalMatchController {
    private final MatchService matchService;

    public InternalMatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping
    public void createMatch(@RequestBody Map<String, Object> payload) {
        try {
            matchService.createMaching(payload);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid match payload");
        }
    }
}
