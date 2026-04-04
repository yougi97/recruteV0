package com.techlance.recrute.Services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.Users;
import com.techlance.recrute.Repositories.CandidateProfilesRepository;
import com.techlance.recrute.Repositories.CompanyProfilesRepository;
import com.techlance.recrute.Repositories.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CandidateProfilesRepository candidateProfilesRepository;
    private final CompanyProfilesRepository companyProfilesRepository;

    public UserService(UserRepository userRepository, CandidateProfilesRepository candidateProfilesRepository,
            CompanyProfilesRepository companyProfilesRepository) {
        this.userRepository = userRepository;
        this.candidateProfilesRepository = candidateProfilesRepository;
        this.companyProfilesRepository = companyProfilesRepository;
    }

    public Users createUser(Users user) {
        if(user.getEmail().contains("@") ==false) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("adresse email invalide")
                );
        }
        return userRepository.save(user);
    }

    public CandidateProfiles createCandidat(CandidateProfiles candidat){
        Users user = candidat.getUser();
        createUser(user);
        return candidateProfilesRepository.save(candidat);
    }

    public CompanyProfiles createCompany(CompanyProfiles company){
        Users user = company.getUser();
        createUser(user);
        return companyProfilesRepository.save(company);
    }

    public List<Users> getAllUsers() {
        return userRepository.findAll();
    }

    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Users getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public CandidateProfiles updateCandidate(CandidateProfiles user, Long id) {
        if(user.getUser().getEmail().contains("@") ==false) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("adresse email invalide")
                );
        }
        CandidateProfiles oldCandidateProfiles = candidateProfilesRepository.getReferenceById(id);
        Users oldUsers = userRepository.getReferenceById(oldCandidateProfiles.getUser().getId());
        oldUsers.setEmail(user.getUser().getEmail());
        oldUsers.setPassword(user.getUser().getPassword());
        oldUsers.setUserType(user.getUser().getUserType());
        oldUsers.setFirstName(user.getUser().getFirstName());
        oldUsers.setLastName(user.getUser().getLastName());
        userRepository.save(oldUsers);
        oldCandidateProfiles.setTitle(user.getTitle());
        oldCandidateProfiles.setLocation(user.getLocation());
        oldCandidateProfiles.setTargetLocation(user.getTargetLocation());
        oldCandidateProfiles.setBio(user.getBio());
        return candidateProfilesRepository.save(oldCandidateProfiles);
    }

    public CompanyProfiles updateCompany(CompanyProfiles user, Long id) {
        if(user.getUser().getEmail().contains("@") ==false) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("adresse email invalide")
                );
        }
        CompanyProfiles oldCompanyProfiles = companyProfilesRepository.getReferenceById(id);
        Users oldUsers = userRepository.getReferenceById(oldCompanyProfiles.getUser().getId());
        oldUsers.setEmail(user.getUser().getEmail());
        oldUsers.setPassword(user.getUser().getPassword());
        oldUsers.setUserType(user.getUser().getUserType());
        oldUsers.setFirstName(user.getUser().getFirstName());
        oldUsers.setLastName(user.getUser().getLastName());
        userRepository.save(oldUsers);
        oldCompanyProfiles.setCompanyName(user.getCompanyName());
        oldCompanyProfiles.setLocation(user.getLocation());
        oldCompanyProfiles.setIndustry(user.getIndustry());
        oldCompanyProfiles.setDescription(user.getDescription());
        return companyProfilesRepository.save(oldCompanyProfiles);
    }
}
