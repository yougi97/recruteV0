package com.techlance.recrute.Security;

public record AuthenticatedUser(Long userId, String userType, String email) {}
