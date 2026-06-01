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
        long cvId = infoMatch.get("cv_id") instanceof Number ? ((Number)infoMatch.get("cv_id")).longValue() : Long.parseLong(String.valueOf(infoMatch.get("cv_id")));
        long jobId = infoMatch.get("job_offer_id") instanceof Number ? ((Number)infoMatch.get("job_offer_id")).longValue() : Long.parseLong(String.valueOf(infoMatch.get("job_offer_id")));
        Cvs cv = cvsRepository.findById(cvId).orElseThrow(()->
            new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Cv non trouvé"))
        );
        JobOffers job = jobOfferRepository.findById(jobId).orElseThrow(()->
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
        // Optional: set rating if provided
        if (infoMatch.containsKey("rating") && infoMatch.get("rating") != null) {
            try {
                String r = String.valueOf(infoMatch.get("rating"));
                if ("up".equalsIgnoreCase(r)) candidateJobRatings.setRating(com.techlance.recrute.Enum.Rating.up);
                else if ("down".equalsIgnoreCase(r)) candidateJobRatings.setRating(com.techlance.recrute.Enum.Rating.down);
            } catch (Exception ignored) {}
        }

        // Set AI scores if provided
        if (infoMatch.containsKey("ai_score") && infoMatch.get("ai_score") != null) {
            try {
                candidateJobRatings.setAi_score(Float.parseFloat(String.valueOf(infoMatch.get("ai_score"))));
            } catch (Exception ignored) {}
        }
        if (infoMatch.containsKey("score_semantique") && infoMatch.get("score_semantique") != null) {
            try {
                candidateJobRatings.setScoreSemantique(Float.parseFloat(String.valueOf(infoMatch.get("score_semantique"))));
            } catch (Exception ignored) {}
        }
        if (infoMatch.containsKey("score_structure") && infoMatch.get("score_structure") != null) {
            try {
                candidateJobRatings.setScoreStructure(Float.parseFloat(String.valueOf(infoMatch.get("score_structure"))));
            } catch (Exception ignored) {}
        }
        if (infoMatch.containsKey("score_llm") && infoMatch.get("score_llm") != null) {
            try {
                candidateJobRatings.setScoreLlm(Float.parseFloat(String.valueOf(infoMatch.get("score_llm"))));
            } catch (Exception ignored) {}
        }

        // Set rated_at to now
        candidateJobRatings.setRated_at(new java.sql.Date(System.currentTimeMillis()));

        // Ensure DB non-null constraint for rating: set a neutral default if missing
        if (candidateJobRatings.getRating() == null) {
            candidateJobRatings.setRating(com.techlance.recrute.Enum.Rating.up);
        }

        // Persist
        candidateJobRatingsRepository.save(candidateJobRatings);
        
    }
}
