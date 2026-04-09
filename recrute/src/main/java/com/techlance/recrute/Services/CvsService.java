package com.techlance.recrute.Services;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
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

    public Cvs createCv(MultipartFile file, Long id) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier CV manquant");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "cv.pdf";
        }
        if (!originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le CV doit être un fichier PDF");
        }
        if (!looksLikePdf(file)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier n'est pas un PDF valide");
        }

        CandidateProfiles candidate = candidateProfilesRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Candidate not found"));

        Cvs cv = findLatestCvByCandidateId(id);
        if (cv == null) {
            cv = new Cvs();
            cv.setCandidateProfiles(candidate);
        }

        String fileName = sanitizeFileName(originalFilename);
        try {
            cv.setFileData(file.getBytes());
            cv.setFileName(fileName);
            cv.setContentType(normalizeContentType(file.getContentType()));
            cv.setFile_url(String.format("db://candidate/%s/cv", id));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible d'enregistrer le CV en base", e);
        }

        cv.setIsActive(true);
        cv.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        cv.setRawText("");
        cv.setParsedJson("{}");
        cv.setEmbedding(null);
        return cvsRepository.save(cv);
    }

    public Cvs getCvByUserId(Long id) {
        Cvs cv = findLatestCvByCandidateId(id);
        return materializeLegacyCvIfNeeded(cv);
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

    public Resource getCvFileResource(Long candidateId) {
        Cvs cv = materializeLegacyCvIfNeeded(findLatestCvByCandidateId(candidateId));
        if (cv == null || cv.getFileData() == null || cv.getFileData().length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun CV disponible pour ce candidat");
        }

        return new ByteArrayResource(cv.getFileData());
    }

    public String getCvDownloadFileName(Long candidateId) {
        Cvs cv = materializeLegacyCvIfNeeded(findLatestCvByCandidateId(candidateId));
        if (cv == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun CV disponible pour ce candidat");
        }

        if (cv.getFileName() != null && !cv.getFileName().isBlank()) {
            return cv.getFileName();
        }

        if (cv.getFile_url() != null && !cv.getFile_url().isBlank()) {
            return extractFileName(cv.getFile_url());
        }

        return String.format("candidate-%s-cv.pdf", candidateId);
    }

    public String getCvContentType(Long candidateId) {
        Cvs cv = materializeLegacyCvIfNeeded(findLatestCvByCandidateId(candidateId));
        if (cv == null || cv.getContentType() == null || cv.getContentType().isBlank()) {
            return "application/pdf";
        }
        return cv.getContentType();
    }

    public Resource getCvFileResourceByCvId(Long cvId) {
        Cvs cv = getCvById(cvId);
        if (cv.getFileData() == null || cv.getFileData().length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun CV disponible pour ce CV");
        }
        return new ByteArrayResource(cv.getFileData());
    }

    public String getCvDownloadFileNameByCvId(Long cvId) {
        Cvs cv = getCvById(cvId);
        if (cv.getFileName() != null && !cv.getFileName().isBlank()) {
            return cv.getFileName();
        }
        if (cv.getFile_url() != null && !cv.getFile_url().isBlank()) {
            return extractFileName(cv.getFile_url());
        }
        return String.format("cv-%s.pdf", cvId);
    }

    public String getCvContentTypeByCvId(Long cvId) {
        Cvs cv = getCvById(cvId);
        if (cv.getContentType() == null || cv.getContentType().isBlank()) {
            return "application/pdf";
        }
        return cv.getContentType();
    }

    private boolean looksLikePdf(MultipartFile file) {
        if (file.getSize() < 20) {
            return false;
        }

        byte[] header = new byte[5];
        try (InputStream is = file.getInputStream()) {
            int bytesRead = is.read(header);
            if (bytesRead < 5) {
                return false;
            }
        } catch (IOException e) {
            return false;
        }

        return header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F' && header[4] == '-';
    }

    private String sanitizeFileName(String originalFilename) {
        String cleaned = Paths.get(originalFilename).getFileName().toString();
        if (cleaned.isBlank()) {
            return "cv.pdf";
        }
        return cleaned;
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/pdf";
        }
        return contentType;
    }

    private Cvs materializeLegacyCvIfNeeded(Cvs cv) {
        if (cv == null) {
            return null;
        }

        if (cv.getFileData() != null && cv.getFileData().length > 0) {
            return cv;
        }

        if (cv.getFile_url() == null || cv.getFile_url().isBlank()) {
            return cv;
        }

        Path resolvedPath = resolveLegacyCvPath(extractFileName(cv.getFile_url()));
        if (resolvedPath == null) {
            return cv;
        }

        try {
            byte[] fileBytes = Files.readAllBytes(resolvedPath);
            if (fileBytes.length == 0) {
                return cv;
            }

            cv.setFileData(fileBytes);
            if (cv.getFileName() == null || cv.getFileName().isBlank()) {
                cv.setFileName(resolvedPath.getFileName().toString());
            }
            if (cv.getContentType() == null || cv.getContentType().isBlank()) {
                cv.setContentType("application/pdf");
            }
            cvsRepository.save(cv);
        } catch (IOException e) {
            return cv;
        }

        return cv;
    }

    private Cvs findLatestCvByCandidateId(Long candidateId) {
        List<Cvs> cvs = cvsRepository.findAllByCandidateProfilesIdOrderByCreatedAtDesc(candidateId);
        if (cvs == null || cvs.isEmpty()) {
            return null;
        }

        return cvs.get(0);
    }

    private String extractFileName(String fileUrl) {
        String cleaned = fileUrl;
        int queryIndex = cleaned.indexOf('?');
        if (queryIndex >= 0) {
            cleaned = cleaned.substring(0, queryIndex);
        }
        int slashIndex = cleaned.lastIndexOf('/');
        if (slashIndex < 0 || slashIndex == cleaned.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de fichier CV invalide");
        }
        return cleaned.substring(slashIndex + 1);
    }

    private Path resolveLegacyCvPath(String fileName) {
        Path cwd = Paths.get(System.getProperty("user.dir"));
        List<Path> candidates = new ArrayList<>();
        candidates.add(cwd.resolve("uploads/cvs").resolve(fileName));
        candidates.add(cwd.resolve("recrute/uploads/cvs").resolve(fileName));
        candidates.add(cwd.resolve("../uploads/cvs").resolve(fileName).normalize());

        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
