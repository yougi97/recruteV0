package com.techlance.recrute.Controllers;

import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.CompanyReviews;
import com.techlance.recrute.Entities.SalaryReports;
import com.techlance.recrute.Entities.Users;
import com.techlance.recrute.Enum.ContratType;
import com.techlance.recrute.Repositories.CompanyProfilesRepository;
import com.techlance.recrute.Repositories.CompanyReviewsRepository;
import com.techlance.recrute.Repositories.SalaryReportsRepository;
import com.techlance.recrute.Repositories.UserRepository;
import com.techlance.recrute.Security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:4200", "https://localhost"})
@RestController
@RequestMapping("/api")
public class CompanyReviewsController {

    private final CompanyReviewsRepository reviewsRepo;
    private final SalaryReportsRepository salaryRepo;
    private final CompanyProfilesRepository companyProfilesRepo;
    private final UserRepository userRepo;

    public CompanyReviewsController(CompanyReviewsRepository reviewsRepo,
                                    SalaryReportsRepository salaryRepo,
                                    CompanyProfilesRepository companyProfilesRepo,
                                    UserRepository userRepo) {
        this.reviewsRepo = reviewsRepo;
        this.salaryRepo = salaryRepo;
        this.companyProfilesRepo = companyProfilesRepo;
        this.userRepo = userRepo;
    }

    // ── REVIEWS ──────────────────────────────────────────────────────────────

    @GetMapping("/reviews/company/{companyUserId}")
    public Map<String, Object> getReviews(@PathVariable Long companyUserId,
                                          @RequestParam(required = false) Integer ratingFilter,
                                          @RequestParam(required = false) Long myUserId) {
        CompanyProfiles company = companyProfilesRepo.findByUserId(companyUserId);
        if (company == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);

        List<CompanyReviews> all = reviewsRepo.findByCompanyProfileIdOrderByCreatedAtDesc(company.getId());

        List<CompanyReviews> filtered = ratingFilter != null
                ? all.stream().filter(r -> r.getRating() == ratingFilter).collect(Collectors.toList())
                : all;

        Optional<CompanyReviews> myReviewOpt = myUserId != null
                ? reviewsRepo.findByCompanyProfileIdAndReviewerId(company.getId(), myUserId)
                : Optional.empty();
        boolean alreadyReviewed = myReviewOpt.isPresent();

        Double avg = reviewsRepo.avgRatingByCompanyProfileId(company.getId());
        Long count = reviewsRepo.countByCompanyProfileId(company.getId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("avg", avg != null ? Math.round(avg * 10.0) / 10.0 : null);
        result.put("count", count);
        result.put("alreadyReviewed", alreadyReviewed);
        result.put("reviews", filtered.stream().map(this::reviewToMap).collect(Collectors.toList()));
        if (myReviewOpt.isPresent()) {
            CompanyReviews mr = myReviewOpt.get();
            Map<String, Object> myReviewMap = new LinkedHashMap<>();
            myReviewMap.put("id", mr.getId());
            myReviewMap.put("rating", mr.getRating());
            myReviewMap.put("comment", mr.getComment());
            myReviewMap.put("anonymous", mr.isAnonymous());
            result.put("myReview", myReviewMap);
        }
        return result;
    }

    @PostMapping("/reviews/company/{companyUserId}")
    public Map<String, Object> submitReview(@PathVariable Long companyUserId,
                                            @RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal AuthenticatedUser authUser) {
        Long reviewerUserId = toLong(body.get("reviewerUserId"));
        Integer rating = toInt(body.get("rating"));
        String comment = (String) body.get("comment");
        boolean anonymous = Boolean.TRUE.equals(body.get("anonymous"));

        if (reviewerUserId == null || rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Champs invalides");
        }
        if (comment != null && comment.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le commentaire ne peut pas dépasser 2000 caractères");
        }
        if (!authUser.userId().equals(reviewerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non autorisé");
        }

        CompanyProfiles company = companyProfilesRepo.findByUserId(companyUserId);
        if (company == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable");

        Users reviewer = userRepo.findById(reviewerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (reviewsRepo.findByCompanyProfileIdAndReviewerId(company.getId(), reviewerUserId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Avis déjà soumis");
        }

        CompanyReviews review = new CompanyReviews();
        review.setCompanyProfile(company);
        review.setReviewer(reviewer);
        review.setAnonymous(anonymous);
        review.setRating(rating);
        review.setComment(comment != null ? comment.trim() : null);

        return reviewToMap(reviewsRepo.save(review));
    }

    @PutMapping("/reviews/{reviewId}")
    public Map<String, Object> updateReview(@PathVariable Long reviewId,
                                            @RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal AuthenticatedUser authUser) {
        Long reviewerUserId = toLong(body.get("reviewerUserId"));
        Integer rating = toInt(body.get("rating"));
        String comment = (String) body.get("comment");
        boolean anonymous = Boolean.TRUE.equals(body.get("anonymous"));

        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Champs invalides");
        }
        if (comment != null && comment.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le commentaire ne peut pas dépasser 2000 caractères");
        }

        CompanyReviews review = reviewsRepo.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis introuvable"));

        if (reviewerUserId == null || !review.getReviewer().getId().equals(reviewerUserId)
                || !authUser.userId().equals(reviewerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non autorisé");
        }

        review.setRating(rating);
        review.setComment(comment != null ? comment.trim() : null);
        review.setAnonymous(anonymous);

        return reviewToMap(reviewsRepo.save(review));
    }

    // ── SALARIES ─────────────────────────────────────────────────────────────

    @GetMapping("/salaries/company/{companyUserId}")
    public List<Map<String, Object>> getSalaries(@PathVariable Long companyUserId) {
        CompanyProfiles company = companyProfilesRepo.findByUserId(companyUserId);
        if (company == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);

        return salaryRepo.findByCompanyProfileIdOrderByCreatedAtDesc(company.getId())
                .stream().map(this::salaryToMap).collect(Collectors.toList());
    }

    @PostMapping("/salaries/company/{companyUserId}")
    public Map<String, Object> submitSalary(@PathVariable Long companyUserId,
                                            @RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal AuthenticatedUser authUser) {
        Long reporterUserId = toLong(body.get("reporterUserId"));
        String jobTitle = (String) body.get("jobTitle");
        Integer minSalary = toInt(body.get("minSalary"));
        Integer maxSalary = toInt(body.get("maxSalary"));
        String contractTypeStr = (String) body.get("contractType");

        if (reporterUserId == null || jobTitle == null || jobTitle.isBlank()
                || minSalary == null || maxSalary == null || minSalary < 0 || maxSalary < minSalary) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Champs invalides");
        }
        if (jobTitle.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le poste ne peut pas dépasser 255 caractères");
        }
        if (maxSalary > 10_000_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Salaire hors limites raisonnables");
        }
        if (!authUser.userId().equals(reporterUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non autorisé");
        }

        CompanyProfiles company = companyProfilesRepo.findByUserId(companyUserId);
        if (company == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable");

        Users reporter = userRepo.findById(reporterUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        SalaryReports report = new SalaryReports();
        report.setCompanyProfile(company);
        report.setReporter(reporter);
        report.setJobTitle(jobTitle.trim());
        report.setMinSalary(minSalary);
        report.setMaxSalary(maxSalary);
        if (contractTypeStr != null) {
            try { report.setContratType(ContratType.valueOf(contractTypeStr)); } catch (Exception ignored) {}
        }

        return salaryToMap(salaryRepo.save(report));
    }

    // ── SERIALIZERS ──────────────────────────────────────────────────────────

    private Map<String, Object> reviewToMap(CompanyReviews r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("rating", r.getRating());
        m.put("comment", r.getComment());
        m.put("anonymous", r.isAnonymous());
        if (!r.isAnonymous() && r.getReviewer() != null) {
            String name = (r.getReviewer().getFirstName() + " " + r.getReviewer().getLastName()).trim();
            m.put("reviewerName", name.isBlank() ? "Candidat" : name);
        } else {
            m.put("reviewerName", "Anonyme");
        }
        m.put("createdAt", r.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> salaryToMap(SalaryReports s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("jobTitle", s.getJobTitle());
        m.put("minSalary", s.getMinSalary());
        m.put("maxSalary", s.getMaxSalary());
        m.put("contractType", s.getContratType() != null ? s.getContratType().name() : null);
        m.put("createdAt", s.getCreatedAt().toString());
        return m;
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }

    private Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }
}
