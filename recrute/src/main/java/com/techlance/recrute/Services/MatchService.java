package com.techlance.recrute.Services;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.Entities.CandidateJobRatings;
import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.CompanyCandidateRatings;
import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Repositories.CandidateJobRatingsRepository;
import com.techlance.recrute.Repositories.CompanyCandidateRatingsRepository;
import com.techlance.recrute.Repositories.CvsRepository;
import com.techlance.recrute.Repositories.JobOfferRepository;

@Service
public class MatchService {
    private final CandidateJobRatingsRepository candidateJobRatingsRepository;
    private final CompanyCandidateRatingsRepository companyCandidateRatingsRepository;
    private final CvsRepository cvsRepository;
    private final JobOfferRepository jobOfferRepository;
    
    public MatchService(CandidateJobRatingsRepository candidateJobRatingsRepository,
            CompanyCandidateRatingsRepository companyCandidateRatingsRepository, CvsRepository cvsRepository, JobOfferRepository jobOfferRepository) {
        this.candidateJobRatingsRepository = candidateJobRatingsRepository;
        this.companyCandidateRatingsRepository = companyCandidateRatingsRepository;
        this.cvsRepository = cvsRepository;
        this.jobOfferRepository = jobOfferRepository;
    }
    
    public void createMaching(Map<String,Object> infoMatch) {
        Cvs cv = cvsRepository.findById((long)infoMatch.get("cv_id")).orElseThrow(()->
            new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Cv non trouvé"))
        );
        JobOffers job = jobOfferRepository.findById((long)infoMatch.get("job_offer_id")).orElseThrow(()->
        new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Offre non trouvé"))
        );
        CandidateJobRatings candidateJobRatings = new CandidateJobRatings();
        CompanyCandidateRatings companyCandidateRatings = new CompanyCandidateRatings();
        CompanyProfiles company = job.getCompanyProfiles();
        CandidateProfiles candidate = cv.getCandidateProfiles();
        
        candidateJobRatings.setCandidate(candidate);
        candidateJobRatings.setJobOffer(job);
        candidateJobRatings.setCv(cv);
        
        
    }
}
