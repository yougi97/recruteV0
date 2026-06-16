package com.techlance.recrute.Util;

import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

// Shared manual-validation helpers, kept consistent with the codebase's existing
// ResponseStatusException-based checks (no Bean Validation layer is used here).
public class InputValidator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private InputValidator() {}

    public static void requireNonBlank(String value, String fieldLabel) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " est obligatoire");
        }
    }

    public static void requireMaxLength(String value, int max, String fieldLabel) {
        if (value != null && value.length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    fieldLabel + " ne peut pas dépasser " + max + " caractères");
        }
    }

    public static void requireEmail(String email) {
        requireNonBlank(email, "L'adresse email");
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adresse email invalide");
        }
        requireMaxLength(email, 255, "L'adresse email");
    }

    public static void requireRange(double value, double min, double max, String fieldLabel) {
        if (value < min || value > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    fieldLabel + " doit être compris entre " + min + " et " + max);
        }
    }

    public static void requireOneOf(String value, Set<String> allowed, String fieldLabel) {
        if (value == null || !allowed.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " invalide");
        }
    }
}
