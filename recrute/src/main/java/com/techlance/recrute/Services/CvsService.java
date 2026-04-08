package com.techlance.recrute.Services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    public Cvs getCvByUserId(Long id) {
        return cvsRepository.findByCandidateProfilesId(id);
    }

    public Cvs getCvById(Long id) {
        return cvsRepository.findById(id).orElseThrow(()-> 
        new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Ce Cv n'existe pas")));
    }

    public Cvs updateCV(Long id, Cvs cv) {
        Cvs oldcv=getCvById(id);

        if (cv.getRawText()!=null) {
            oldcv.setRawText(cv.getRawText());
        }

        if (cv.getParsedJson()!=null) {
            oldcv.setParsedJson(cv.getParsedJson());
        }

        if (cv.getEmbedding()!=null) {
            oldcv.setEmbedding(cv.getEmbedding());
        }

        return cvsRepository.save(oldcv);


    }
}
