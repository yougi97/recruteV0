package com.techlance.recrute.Controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.Users;
import com.techlance.recrute.Services.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/candidate")
    public CandidateProfiles createCandidat(@RequestBody CandidateProfiles candidateProfiles) {
        return userService.createCandidat(candidateProfiles);
    }
    
    @PostMapping("/company")
    public CompanyProfiles createCompany(@RequestBody CompanyProfiles companyProfiles){
        return userService.createCompany(companyProfiles);
    }

    @GetMapping
    public java.util.List<Users> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/email")
    public Users getUserByEmail(@RequestBody String email) {
        return userService.getUserByEmail(email);
    }

    @GetMapping("/candidate/{userId}")
    public CandidateProfiles getCandidateProfilesByUserId(@PathVariable Long userId){
        return userService.getCandidateProfilesByUserId(userId);
    }

    @GetMapping("/company/{userId}")
    public CompanyProfiles getCompanyProfilesByUserId(@PathVariable Long userId){
        return userService.getCompanyProfilesByUserId(userId);
    }

    @PutMapping("candidate/{id}")
    public CandidateProfiles updateCandidateProfiles(@RequestBody CandidateProfiles user, @PathVariable Long id) {
        return userService.updateCandidate(user, id);
    }

    @PutMapping("/company/{id}")
    public CompanyProfiles updateCompanyProfiles(@RequestBody CompanyProfiles user, @PathVariable Long id) {
        return userService.updateCompany(user, id);
    }
}
