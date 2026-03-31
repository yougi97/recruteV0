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

    public Users updatUsers(Users user, Long id) {
        if(user.getEmail().contains("@") ==false) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("adresse email invalide")
                );
        }
        Users oldUsers = userRepository.getReferenceById(id);
        oldUsers.setEmail(user.getEmail());
        oldUsers.setPassword(user.getPassword());
        oldUsers.setUserType(user.getUserType());
        oldUsers.setFirstName(user.getFirstName());
        oldUsers.setLastName(user.getLastName());
        return userRepository.save(oldUsers);
    }
}
