package com.techlance.recrute.Services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.DTO.LoginResponse;
import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.Users;
import com.techlance.recrute.Repositories.CandidateProfilesRepository;
import com.techlance.recrute.Repositories.CompanyProfilesRepository;
import com.techlance.recrute.Repositories.UserRepository;
import com.techlance.recrute.Security.JwtService;
import com.techlance.recrute.Util.InputValidator;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CandidateProfilesRepository candidateProfilesRepository;
    private final CompanyProfilesRepository companyProfilesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, CandidateProfilesRepository candidateProfilesRepository,
            CompanyProfilesRepository companyProfilesRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.candidateProfilesRepository = candidateProfilesRepository;
        this.companyProfilesRepository = companyProfilesRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtService = jwtService;
    }

    public Users createUser(Users user) {
        if(user.getEmail() ==null || user.getPassword() == null|| user.getUserType() == null) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Les champs obligatoires ne sont pas tous remplient")
                );
        }
        InputValidator.requireEmail(user.getEmail());
        if (user.getPassword().length() < 8) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Le mot de passe doit contenir au moins 8 caractères"
                );
        }
        InputValidator.requireMaxLength(user.getFirstName(), 100, "Le prénom");
        InputValidator.requireMaxLength(user.getLastName(), 100, "Le nom");
        if(userRepository.findByEmail(user.getEmail()) != null) {
            throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Cette adresse est déja associé à un compte")
                );
        }
                user.setPassword(passwordEncoder.encode(user.getPassword()));
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

    public CandidateProfiles updateCandidate(CandidateProfiles user, Long id, Long authUserId) {
        CandidateProfiles oldCandidateProfiles = candidateProfilesRepository.getReferenceById(id);
        if (!oldCandidateProfiles.getUser().getId().equals(authUserId)) {
            throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Vous n'êtes pas autorisé à modifier ce profil"
                );
        }
        return applyCandidateUpdate(user, oldCandidateProfiles);
    }

    // Used by the Python AI service after parsing a CV: no end-user JWT is involved,
    // so there's no authUserId to check ownership against (the internal endpoint
    // calling this is reserved for server-to-server use, not exposed to end users).
    public CandidateProfiles updateCandidateInternal(CandidateProfiles user, Long id) {
        CandidateProfiles oldCandidateProfiles = candidateProfilesRepository.getReferenceById(id);
        return applyCandidateUpdate(user, oldCandidateProfiles);
    }

    private CandidateProfiles applyCandidateUpdate(CandidateProfiles user, CandidateProfiles oldCandidateProfiles) {
        InputValidator.requireEmail(user.getUser().getEmail());
        InputValidator.requireMaxLength(user.getUser().getFirstName(), 100, "Le prénom");
        InputValidator.requireMaxLength(user.getUser().getLastName(), 100, "Le nom");
        InputValidator.requireMaxLength(user.getTitle(), 255, "Le titre");
        InputValidator.requireMaxLength(user.getLocation(), 255, "La localisation");
        InputValidator.requireMaxLength(user.getBio(), 5000, "La bio");
        Users oldUsers = userRepository.getReferenceById(oldCandidateProfiles.getUser().getId());
        oldUsers.setEmail(user.getUser().getEmail());
        oldUsers.setUserType(user.getUser().getUserType());
        oldUsers.setFirstName(user.getUser().getFirstName());
        oldUsers.setLastName(user.getUser().getLastName());
        userRepository.save(oldUsers);
        oldCandidateProfiles.setTitle(user.getTitle());
        oldCandidateProfiles.setLocation(user.getLocation());
        oldCandidateProfiles.setTargetLocation(user.getTargetLocation());
        oldCandidateProfiles.setBio(user.getBio());
        oldCandidateProfiles.setAnneesExperience(user.getAnneesExperience());
        oldCandidateProfiles.setNiveauEtudes(user.getNiveauEtudes());
        return candidateProfilesRepository.save(oldCandidateProfiles);
    }

    public CompanyProfiles updateCompany(CompanyProfiles user, Long id, Long authUserId) {
        InputValidator.requireEmail(user.getUser().getEmail());
        InputValidator.requireMaxLength(user.getUser().getFirstName(), 100, "Le prénom");
        InputValidator.requireMaxLength(user.getUser().getLastName(), 100, "Le nom");
        InputValidator.requireMaxLength(user.getCompanyName(), 255, "Le nom de l'entreprise");
        InputValidator.requireMaxLength(user.getLocation(), 255, "La localisation");
        InputValidator.requireMaxLength(user.getIndustry(), 255, "Le secteur");
        InputValidator.requireMaxLength(user.getDescription(), 5000, "La description");
        CompanyProfiles oldCompanyProfiles = companyProfilesRepository.getReferenceById(id);
        if (!oldCompanyProfiles.getUser().getId().equals(authUserId)) {
            throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Vous n'êtes pas autorisé à modifier ce profil"
                );
        }
        Users oldUsers = userRepository.getReferenceById(oldCompanyProfiles.getUser().getId());
        oldUsers.setEmail(user.getUser().getEmail());
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

    public CompanyProfiles getCompanyProfilesByUserId(Long id) {
        return companyProfilesRepository.findByUserId(id);
    }

    public CandidateProfiles getCandidateProfilesByUserId(Long id) {
        return candidateProfilesRepository.findByUserId(id);
    }

    public CompanyProfiles getCompanyProfiles(Long id) {
        return companyProfilesRepository.findById(id).orElseThrow();
    }

    public CandidateProfiles gCandidateProfiles(Long id) {
        return candidateProfilesRepository.findById(id).orElseThrow();
    }

    public LoginResponse login(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email et mot de passe sont obligatoires"
            );
        }
        Users user = userRepository.findByEmail(email);
        
        if (user == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Email ou mot de passe incorrect"
            );
        }
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Email ou mot de passe incorrect"
            );
        }
        
        String token = jwtService.generateToken(user.getId(), user.getUserType(), user.getEmail());
        return new LoginResponse(user.getId(), user.getEmail(), user.getUserType(),
                                user.getFirstName(), user.getLastName(), token);
    }

    private void validateCurrentPassword(String providedPassword, String storedPasswordHash) {
        if (!passwordEncoder.matches(providedPassword, storedPasswordHash)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Mot de passe de confirmation invalide"
            );
        }
    }
}
