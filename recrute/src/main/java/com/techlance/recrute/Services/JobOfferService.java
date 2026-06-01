package com.techlance.recrute.Services;

import java.sql.Date;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techlance.recrute.Entities.CandidateJobRatings;
import com.techlance.recrute.Entities.CandidateProfiles;
import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Enum.Rating;
import com.techlance.recrute.Repositories.CandidateJobRatingsRepository;
import com.techlance.recrute.Repositories.CandidateProfilesRepository;
import com.techlance.recrute.Repositories.CompanyProfilesRepository;
import com.techlance.recrute.Repositories.CvsRepository;
import com.techlance.recrute.Repositories.JobOfferRepository;

@Service
public class JobOfferService {
    private final JobOfferRepository jobOfferRepository;
    private final CompanyProfilesRepository companyProfilesRepository;
    private final CandidateProfilesRepository candidateProfilesRepository;
    private final CvsRepository cvsRepository;
    private final CandidateJobRatingsRepository candidateJobRatingsRepository;
    private final ObjectMapper objectMapper;

    public JobOfferService(
            JobOfferRepository jobOfferRepository,
            CompanyProfilesRepository companyProfilesRepository,
            CandidateProfilesRepository candidateProfilesRepository,
            CvsRepository cvsRepository,
            CandidateJobRatingsRepository candidateJobRatingsRepository) {
        this.jobOfferRepository = jobOfferRepository;
        this.companyProfilesRepository = companyProfilesRepository;
        this.candidateProfilesRepository = candidateProfilesRepository;
        this.cvsRepository = cvsRepository;
        this.candidateJobRatingsRepository = candidateJobRatingsRepository;
        this.objectMapper = new ObjectMapper();
    }

    public JobOffers creatJobOffers(JobOffers jobOffer, Long id) {
        CompanyProfiles companyProfiles = companyProfilesRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Candidate not found"));
        jobOffer.setCompanyProfiles(companyProfiles);
        return jobOfferRepository.save(jobOffer);
    }

    // public List<JobOffers> getJobOffers(JobOfferFilter filter){
    //     Specification<JobOffers> spec = Specification
    //         .where(JobOffersSpecification.hasLocations(filter.getLocations()))
    //         .and(JobOffersSpecification.hasContratType(filter.getContratTypes()))
    //         .and(JobOffersSpecification.hasNiveauEtude(filter.getNiveauEtudes()));

    //     return jobOfferRepository.findAll(spec);
    // }
    public List<JobOffers> getJobOffers(Long id) {
        return jobOfferRepository.findByCompanyProfilesId(id);
    }

    public List<Map<String, Object>> getCandidateSuggestions(Long userId) {
        CandidateProfiles candidate = candidateProfilesRepository.findByUserId(userId);
        if (candidate == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil candidat introuvable");
        }

        Cvs latestCv = findLatestCv(candidate.getId());
        Set<String> candidateTerms = buildCandidateTerms(candidate, latestCv);

        return jobOfferRepository.findByIsActiveTrue().stream()
                .map(job -> buildSuggestion(job, candidate, latestCv, candidateTerms))
                .sorted((left, right) -> Integer.compare(
                        ((Number) right.get("matchScore")).intValue(),
                        ((Number) left.get("matchScore")).intValue()))
                .collect(Collectors.toList());
    }

    public void recordCandidateInterest(Long userId, Long offerId, Rating rating) {
        CandidateProfiles candidate = candidateProfilesRepository.findByUserId(userId);
        if (candidate == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil candidat introuvable");
        }

        JobOffers job = getJobOffer(offerId);
        Cvs latestCv = findLatestCv(candidate.getId());

        CandidateJobRatings savedRating = new CandidateJobRatings();
        savedRating.setCandidate(candidate);
        savedRating.setJobOffer(job);
        savedRating.setCv(latestCv);
        savedRating.setRating(rating);
        savedRating.setRated_at(new Date(System.currentTimeMillis()));
        candidateJobRatingsRepository.save(savedRating);
    }

    public JobOffers getJobOffer(Long id) {
        return jobOfferRepository.findById(id).orElseThrow(()->
        new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("Offre non trouver"))
    );}

    public JobOffers getCompanyJobOffer(Long companyId, Long jobId) {
        JobOffers jobOffer = getJobOffer(jobId);
        if (jobOffer.getCompanyProfiles() == null || !jobOffer.getCompanyProfiles().getId().equals(companyId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("Offre non trouver pour cette entreprise")
            );
        }
        return jobOffer;
    }

    public JobOffers updateJobOffers(Long id, JobOffers job) {
        JobOffers oldjob=getJobOffer(id);

        if (job.getTitle()!=null) {
            oldjob.setTitle(job.getTitle());
        }

        if(job.getDescription()!=null) {
            oldjob.setDescription(job.getDescription());
        }

        if(job.getEnrichedDescription()!=null) {
            oldjob.setEnrichedDescription(job.getEnrichedDescription());
        }

        if (job.getParsedJson()!=null) {
            oldjob.setParsedJson(job.getParsedJson());
        }

        if (job.getEmbedding()!=null) {
            oldjob.setEmbedding(job.getEmbedding());
        }

        if (job.getContractType()!=null) {
            oldjob.setContractType(job.getContractType());
        }

        if (job.getAnneesExperienceMin()!=0.0) {
            oldjob.setAnneesExperienceMin(job.getAnneesExperienceMin());
        }

        if (job.getLocation() != null) {
            oldjob.setLocation(job.getLocation());
        }

        oldjob.setIsActive(job.isIsActive());

        if(job.getNiveauEtudesMin()!=null) {
            oldjob.setNiveauEtudesMin(job.getNiveauEtudesMin());
        }

        return jobOfferRepository.save(oldjob);


    }

    public JobOffers updateCompanyJobOffer(Long companyId, Long jobId, JobOffers job) {
        JobOffers oldJob = getCompanyJobOffer(companyId, jobId);

        if (job.getTitle() != null) {
            oldJob.setTitle(job.getTitle());
        }
        if (job.getDescription() != null) {
            oldJob.setDescription(job.getDescription());
        }
        if (job.getLocation() != null) {
            oldJob.setLocation(job.getLocation());
        }
        if (job.getContractType() != null) {
            oldJob.setContractType(job.getContractType());
        }

        return jobOfferRepository.save(oldJob);
    }

    public JobOffers updateCompanyJobOfferStatus(Long companyId, Long jobId, boolean active) {
        JobOffers oldJob = getCompanyJobOffer(companyId, jobId);
        oldJob.setIsActive(active);
        return jobOfferRepository.save(oldJob);
    }

    private Cvs findLatestCv(Long candidateId) {
        List<Cvs> cvs = cvsRepository.findAllByCandidateProfilesIdOrderByCreatedAtDesc(candidateId);
        if (cvs == null || cvs.isEmpty()) {
            return null;
        }
        return cvs.get(0);
    }

    private Map<String, Object> buildSuggestion(JobOffers job, CandidateProfiles candidate, Cvs cv, Set<String> candidateTerms) {
        int matchScore = computeMatchScore(job, candidate, cv, candidateTerms);

        // Prefer persisted AI score when available
        try {
            java.util.Optional<CandidateJobRatings> opt = candidateJobRatingsRepository.findLatestByCandidateAndJob(candidate.getId(), job.getId());
            if (opt.isPresent() && opt.get().getAi_score() > 0) {
                matchScore = Math.max(0, Math.min(100, Math.round(opt.get().getAi_score())));
            }
        } catch (Exception ignored) {}

        Map<String, Object> suggestion = new LinkedHashMap<>();

        suggestion.put("id", job.getId());
        suggestion.put("title", job.getTitle());
        suggestion.put("company", job.getCompanyProfiles() != null ? job.getCompanyProfiles().getCompanyName() : "Entreprise inconnue");
        suggestion.put("companyInitial", buildCompanyInitial(job));
        suggestion.put("companyColor", pickCompanyColor(job));
        suggestion.put("location", fallback(job.getLocation(), candidate.getLocation(), "Télétravail possible"));
        suggestion.put("contractType", job.getContractType() != null ? job.getContractType().name() : "CDI");
        suggestion.put("workMode", deriveWorkMode(job));
        suggestion.put("salary", "Salaire non communiqué");
        suggestion.put("matchScore", matchScore);
        suggestion.put("matchLevel", toMatchLevel(matchScore));
        suggestion.put("tags", buildTags(job, candidate));
        suggestion.put("aiReason", buildReason(job, candidate, cv, matchScore));
        suggestion.put("status", "pending");

        return suggestion;
    }

    private int computeMatchScore(JobOffers job, CandidateProfiles candidate, Cvs cv, Set<String> candidateTerms) {
        int score = 22;

        String jobText = normalize(job.getTitle() + " " + job.getDescription() + " " + job.getEnrichedDescription());
        if (!candidateTerms.isEmpty()) {
            long overlap = candidateTerms.stream().filter(jobText::contains).count();
            score += Math.min(30, (int) overlap * 6);
        }

        if (candidate.getLocation() != null && job.getLocation() != null) {
            String candidateLocation = normalize(candidate.getLocation());
            String jobLocation = normalize(job.getLocation());
            if (candidateLocation.contains(jobLocation) || jobLocation.contains(candidateLocation)) {
                score += 14;
            }
        }

        if (candidate.getAnneesExperience() >= job.getAnneesExperienceMin()) {
            score += 15;
        } else if (job.getAnneesExperienceMin() > 0) {
            score += Math.max(0, (int) (10 - (job.getAnneesExperienceMin() - candidate.getAnneesExperience())));
        }

        if (job.getNiveauEtudesMin() != null && candidate.getNiveauEtudes() != null) {
            if (normalize(candidate.getNiveauEtudes()).contains(normalize(job.getNiveauEtudesMin()))) {
                score += 12;
            }
        }

        if (cv != null && cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
            score += 5;
        }

        return Math.max(0, Math.min(score, 100));
    }

    private Set<String> buildCandidateTerms(CandidateProfiles candidate, Cvs cv) {
        Set<String> terms = Arrays.stream(new String[] {
                candidate.getTitle(),
                candidate.getLocation(),
                candidate.getBio(),
                candidate.getNiveauEtudes(),
        }).filter(value -> value != null && !value.isBlank())
                .map(this::normalize)
                .collect(Collectors.toSet());

        if (candidate.getTargetLocation() != null) {
            candidate.getTargetLocation().stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(this::normalize)
                    .forEach(terms::add);
        }

        if (cv != null && cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
            try {
                Map<String, Object> parsed = objectMapper.readValue(cv.getParsedJson(), Map.class);
                collectStringValues(parsed, terms);
            } catch (Exception ignored) {
                // Keep the fallback terms if JSON parsing fails.
            }
        }

        return terms;
    }

    private void collectStringValues(Object value, Set<String> terms) {
        if (value instanceof Map<?, ?> map) {
            for (Object entryValue : map.values()) {
                collectStringValues(entryValue, terms);
            }
            return;
        }

        if (value instanceof Iterable<?> iterable) {
            for (Object item : iterable) {
                collectStringValues(item, terms);
            }
            return;
        }

        if (value != null) {
            String normalized = normalize(String.valueOf(value));
            if (!normalized.isBlank()) {
                terms.add(normalized);
            }
        }
    }

    private List<Map<String, Object>> buildTags(JobOffers job, CandidateProfiles candidate) {
        List<Map<String, Object>> tags = new ArrayList<>();
        tags.add(tag(job.getContractType() != null ? job.getContractType().name() : "CDI", false));
        tags.add(tag(job.getLocation() != null ? job.getLocation() : "Télétravail possible", true));
        tags.add(tag(candidate.getNiveauEtudes() != null ? candidate.getNiveauEtudes() : "Profil varié", false));
        return tags;
    }

    private Map<String, Object> tag(String label, boolean accent) {
        Map<String, Object> tag = new HashMap<>();
        tag.put("label", label);
        tag.put("accent", accent);
        return tag;
    }

    private String buildReason(JobOffers job, CandidateProfiles candidate, Cvs cv, int matchScore) {
        List<String> reasons = new ArrayList<>();
        if (candidate.getAnneesExperience() >= job.getAnneesExperienceMin()) {
            reasons.add(String.format(Locale.ROOT, "expérience compatible (%.1f ans)", candidate.getAnneesExperience()));
        }
        if (candidate.getLocation() != null && job.getLocation() != null) {
            String candidateLocation = normalize(candidate.getLocation());
            String jobLocation = normalize(job.getLocation());
            if (candidateLocation.contains(jobLocation) || jobLocation.contains(candidateLocation)) {
                reasons.add("localisation cohérente");
            }
        }
        if (cv != null && cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
            reasons.add("CV analysé par la base IA");
        }
        if (reasons.isEmpty()) {
            reasons.add("correspondance basée sur le titre et la description du poste");
        }

        return String.format(Locale.ROOT, "%d%%: %s", matchScore, String.join(", ", reasons));
    }

    private String buildCompanyInitial(JobOffers job) {
        if (job.getCompanyProfiles() == null || job.getCompanyProfiles().getCompanyName() == null || job.getCompanyProfiles().getCompanyName().isBlank()) {
            return "?";
        }

        String[] parts = job.getCompanyProfiles().getCompanyName().trim().split("\\s+");
        StringBuilder initials = new StringBuilder();
        for (String part : parts) {
            initials.append(part.charAt(0));
            if (initials.length() == 2) {
                break;
            }
        }
        return initials.toString().toUpperCase(Locale.ROOT);
    }

    private String pickCompanyColor(JobOffers job) {
        String[] colors = {"blue", "green", "amber", "purple", "red"};
        long basis = job.getCompanyProfiles() != null && job.getCompanyProfiles().getId() != null
                ? job.getCompanyProfiles().getId()
                : job.getId();
        return colors[(int) Math.floorMod(basis, colors.length)];
    }

    private String deriveWorkMode(JobOffers job) {
        String location = normalize(job.getLocation());
        String description = normalize(job.getDescription() + " " + job.getEnrichedDescription());
        if (location.contains("remote") || description.contains("remote")) {
            return "Remote";
        }
        if (location.contains("hybride") || description.contains("hybride")) {
            return "Hybride";
        }
        return "Présentiel";
    }

    private String toMatchLevel(int matchScore) {
        if (matchScore >= 85) {
            return "high";
        }
        if (matchScore >= 70) {
            return "mid";
        }
        return "low";
    }

    private String fallback(String primary, String secondary, String defaultValue) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (secondary != null && !secondary.isBlank()) {
            return secondary;
        }
        return defaultValue;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT)
                .replace("é", "e")
                .replace("è", "e")
                .replace("ê", "e")
                .replace("à", "a")
                .replace("ù", "u")
                .replace("ô", "o")
                .replace("ï", "i")
                .replace("ç", "c");
    }

    public List<Map<String, Object>> getAllPublicOffers(Long candidateId) {
        CandidateProfiles candidate = null;
        Cvs latestCv = null;
        Set<String> candidateTerms = null;

        if (candidateId != null) {
            candidate = candidateProfilesRepository.findByUserId(candidateId);
            if (candidate != null) {
                latestCv = findLatestCv(candidate.getId());
                candidateTerms = buildCandidateTerms(candidate, latestCv);
            }
        }

        final CandidateProfiles finalCandidate = candidate;
        final Cvs finalCv = latestCv;
        final Set<String> finalTerms = candidateTerms;

        return jobOfferRepository.findByIsActiveTrue().stream()
                .map(job -> {
                    if (finalCandidate != null) {
                        return buildPublicOffer(job, finalCandidate, finalCv, finalTerms);
                    }
                    return buildPublicOffer(job);
                })
                .sorted((left, right) -> {
                    Integer leftScore = left.get("matchScore") instanceof Number ? ((Number) left.get("matchScore")).intValue() : 0;
                    Integer rightScore = right.get("matchScore") instanceof Number ? ((Number) right.get("matchScore")).intValue() : 0;
                    int cmp = Integer.compare(rightScore, leftScore); // descending
                    if (cmp != 0) return cmp;
                    String leftTitle = left.get("title") != null ? (String) left.get("title") : "";
                    String rightTitle = right.get("title") != null ? (String) right.get("title") : "";
                    return leftTitle.compareTo(rightTitle);
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildPublicOffer(JobOffers job) {
        Map<String, Object> offer = new LinkedHashMap<>();

        offer.put("id", job.getId());
        offer.put("title", job.getTitle());
        offer.put("company", job.getCompanyProfiles() != null ? job.getCompanyProfiles().getCompanyName() : "Entreprise inconnue");
        offer.put("companyInitial", buildCompanyInitial(job));
        offer.put("companyColor", pickCompanyColor(job));
        offer.put("location", fallback(job.getLocation(), "", "Télétravail possible"));
        offer.put("contractType", job.getContractType() != null ? job.getContractType().name() : "CDI");
        offer.put("workMode", deriveWorkMode(job));
        offer.put("salary", "Salaire non communiqué");
        offer.put("description", job.getDescription() != null ? job.getDescription() : "");
        offer.put("tags", buildPublicTags(job));
        offer.put("status", "pending");
        return offer;
    }

    private Map<String, Object> buildPublicOffer(JobOffers job, CandidateProfiles candidate, Cvs cv, Set<String> candidateTerms) {
        Map<String, Object> offer = buildPublicOffer(job);

        // Prefer AI score persisted by Python service when available
        try {
            java.util.Optional<CandidateJobRatings> opt = candidateJobRatingsRepository.findLatestByCandidateAndJob(candidate.getId(), job.getId());
            if (opt.isPresent() && opt.get().getAi_score() > 0) {
                float ai = opt.get().getAi_score();
                int matchScore = Math.max(0, Math.min(100, Math.round(ai)));
                offer.put("matchScore", matchScore);
                offer.put("matchLevel", toMatchLevel(matchScore));
                // include breakdown if stored
                offer.put("score_semantique", opt.get().getScoreSemantique());
                offer.put("score_structure", opt.get().getScoreStructure());
                offer.put("score_llm", opt.get().getScoreLlm());
                offer.put("aiReason", buildReason(job, candidate, cv, matchScore));
                return offer;
            }
        } catch (Exception ignored) {}

        int matchScore = computeMatchScore(job, candidate, cv, candidateTerms);
        offer.put("matchScore", matchScore);
        offer.put("matchLevel", toMatchLevel(matchScore));
        offer.put("aiReason", buildReason(job, candidate, cv, matchScore));

        return offer;
    }

    private List<Map<String, Object>> buildPublicTags(JobOffers job) {
        List<Map<String, Object>> tags = new ArrayList<>();
        tags.add(tag(job.getContractType() != null ? job.getContractType().name() : "CDI", false));
        tags.add(tag(job.getLocation() != null ? job.getLocation() : "Télétravail possible", true));
        return tags;
    }
}
