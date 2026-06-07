package com.techlance.recrute.Services;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.Entities.CandidateJobRatings;
import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Repositories.CandidateJobRatingsRepository;
import com.techlance.recrute.Repositories.CvsRepository;
import com.techlance.recrute.Repositories.JobOfferRepository;

@Service
public class MatchService {
    private final CandidateJobRatingsRepository candidateJobRatingsRepository;
    private final CvsRepository cvsRepository;
    private final JobOfferRepository jobOfferRepository;

    public MatchService(CandidateJobRatingsRepository candidateJobRatingsRepository,
            CvsRepository cvsRepository, JobOfferRepository jobOfferRepository) {
        this.candidateJobRatingsRepository = candidateJobRatingsRepository;
        this.cvsRepository = cvsRepository;
        this.jobOfferRepository = jobOfferRepository;
    }

    public void createMaching(Map<String, Object> infoMatch) {
        long cvId  = toLong(infoMatch.get("cv_id"));
        long jobId = toLong(infoMatch.get("job_offer_id"));

        Cvs cv = cvsRepository.findById(cvId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cv non trouvé"));
        JobOffers job = jobOfferRepository.findById(jobId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "Offre non trouvée"));

        CandidateProfiles candidate = cv.getCandidateProfiles();

        // Upsert: update the existing row if one exists, otherwise create a new one
        CandidateJobRatings r = candidateJobRatingsRepository
                .findLatestByCandidateAndJob(candidate.getId(), job.getId())
                .orElseGet(CandidateJobRatings::new);

        r.setCandidate(candidate);
        r.setJobOffer(job);
        r.setCv(cv);

        if (r.getRating() == null) r.setRating(com.techlance.recrute.Enum.Rating.up);
        if (r.getRated_at() == null) r.setRated_at(new java.sql.Date(System.currentTimeMillis()));

        setFloatIfPresent(infoMatch, "ai_score",         v -> r.setAi_score(v));
        setFloatIfPresent(infoMatch, "score_semantique", v -> r.setScoreSemantique(v));
        setFloatIfPresent(infoMatch, "score_structure",  v -> r.setScoreStructure(v));
        setFloatIfPresent(infoMatch, "score_llm",        v -> r.setScoreLlm(v));

        if (infoMatch.containsKey("rating") && infoMatch.get("rating") != null) {
            String rating = String.valueOf(infoMatch.get("rating"));
            if ("up".equalsIgnoreCase(rating))   r.setRating(com.techlance.recrute.Enum.Rating.up);
            if ("down".equalsIgnoreCase(rating)) r.setRating(com.techlance.recrute.Enum.Rating.down);
        }

        candidateJobRatingsRepository.save(r);
    }

    private long toLong(Object value) {
        return value instanceof Number ? ((Number) value).longValue() : Long.parseLong(String.valueOf(value));
    }

    private void setFloatIfPresent(Map<String, Object> map, String key, java.util.function.Consumer<Float> setter) {
        if (map.containsKey(key) && map.get(key) != null) {
            try { setter.accept(Float.parseFloat(String.valueOf(map.get(key)))); }
            catch (Exception ignored) {}
        }
    }
}
