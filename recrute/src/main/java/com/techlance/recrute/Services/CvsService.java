package com.techlance.recrute.Services;

import org.springframework.stereotype.Service;

import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Repositories.CandidateProfilesRepository;
import com.techlance.recrute.Repositories.CvsRepository;

@Service
public class CvsService {
    private final CvsRepository cvsRepository;
    private final CandidateProfilesRepository candidateProfilesRepository;

    public CvsService(CvsRepository cvsRepository, CandidateProfilesRepository candidateProfilesRepository) {
        this.cvsRepository = cvsRepository;
        this.candidateProfilesRepository = candidateProfilesRepository;
    }

    public Cvs createCv(Cvs cv, Long id) {
        CandidateProfiles candidate = candidateProfilesRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Candidate not found"));

        cv.setCandidateProfiles(candidate);
        return cvsRepository.save(cv);
    }
}
